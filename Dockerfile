# ─── Base Node & PNPM ───
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# ─── Build Stage ───
FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma Client
RUN pnpm --filter api exec prisma generate

# Build apps
RUN pnpm --filter api build
RUN pnpm --filter web build

# ─── API Production Runtime ───
FROM base AS api-runner
WORKDIR /app

# Ensure openssl is installed for prisma
RUN apk add --no-cache openssl

# Copy package manifests
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Copy prisma schema BEFORE install so postinstall can find it
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client in the production runtime
RUN cd apps/api && npx prisma generate

# Copy compiled API code
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Expose API port
EXPOSE 3001

# Start API (migrate + start, skip seed in production)
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && cd /app && node apps/api/dist/src/main.js"]

# ─── Web Production Runtime ───
FROM nginx:alpine AS web-runner
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
# Copy custom nginx config to support React push-state routing
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
