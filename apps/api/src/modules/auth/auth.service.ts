import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto, LoginDto } from './auth.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('البريد مسجل مسبقاً');

    const hash = await bcrypt.hash(dto.password, 12);
    const userRole = (dto.role as Role) || Role.STUDENT;
    
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: hash,
        role: userRole,
      },
    });

    if (userRole === Role.STUDENT) {
      const firstNode = await this.prisma.conceptNode.findFirst({
        orderBy: { order: 'asc' },
      });
      if (firstNode) {
        await this.prisma.nodeProgress.create({
          data: { userId: user.id, nodeId: firstNode.id, status: 'IN_PROGRESS' },
        });
      }
    } else {
      const allNodes = await this.prisma.conceptNode.findMany();
      if (allNodes.length > 0) {
        await this.prisma.nodeProgress.createMany({
          data: allNodes.map((node) => ({
            userId: user.id,
            nodeId: node.id,
            status: 'IN_PROGRESS',
          })),
        });
      }
    }

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

    return this.generateTokens(user);
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, createdAt: true },
    });
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
      refreshToken,
    };
  }
}
