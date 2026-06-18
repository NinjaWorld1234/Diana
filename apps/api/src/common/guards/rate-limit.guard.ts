import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private requestCounts = new Map<string, { count: number; expiresAt: number }>();

  // Limits
  private readonly WINDOW_MS = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS = 60; // default 60 requests per minute

  constructor() {
    // Run cleanup in background to avoid blocking the Event Loop during requests
    setInterval(() => {
      const now = Date.now();
      for (const [k, v] of this.requestCounts.entries()) {
        if (v.expiresAt < now) this.requestCounts.delete(k);
      }
    }, this.WINDOW_MS);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const rawIp = request.headers['x-forwarded-for'] || request.ip || request.connection?.remoteAddress || 'unknown';
    const ip = Array.isArray(rawIp) ? rawIp[0] : (typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : rawIp);
    
    const path = request.route?.path || request.path;

    // We can define stricter limits for specific routes using RegEx to avoid path-injection evasion
    let maxLimit = this.MAX_REQUESTS;
    if (path.match(/\/auth\/login\b/i)) maxLimit = 5; // 5 login attempts per minute
    if (path.match(/\/auth\/register\b/i)) maxLimit = 3; // 3 registers per minute
    if (path.match(/\/ai-teacher\/chat\b/i)) maxLimit = 10; // 10 AI queries per minute

    const key = `${ip}-${path}`;
    const now = Date.now();

    let record = this.requestCounts.get(key);

    if (!record || record.expiresAt < now) {
      // Reset or new record
      record = { count: 1, expiresAt: now + this.WINDOW_MS };
    } else {
      record.count++;
      if (record.count > maxLimit) {
        throw new HttpException('تم تجاوز الحد المسموح به من الطلبات. يرجى الانتظار والمحاولة لاحقاً.', HttpStatus.TOO_MANY_REQUESTS);
      }
    }

    this.requestCounts.set(key, record);

    return true;
  }
}
