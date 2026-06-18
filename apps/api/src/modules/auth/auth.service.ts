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
    
    // Use transaction to ensure user and initial progress are created atomically
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash: hash,
          role: userRole,
        },
      });

      if (userRole === Role.STUDENT) {
        const firstNode = await tx.conceptNode.findFirst({
          orderBy: { order: 'asc' },
        });
        if (firstNode) {
          await tx.nodeProgress.create({
            data: { userId: newUser.id, nodeId: firstNode.id, status: 'IN_PROGRESS' },
          });
        }
      } else {
        const allNodes = await tx.conceptNode.findMany();
        if (allNodes.length > 0) {
          await tx.nodeProgress.createMany({
            data: allNodes.map((node) => ({
              userId: newUser.id,
              nodeId: node.id,
              status: 'IN_PROGRESS',
            })),
          });
        }
      }
      return newUser;
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    
    // هجوم التوقيت: تشغيل مقارنة وهمية عند عدم العثور على المستخدم للحفاظ على نفس زمن الاستجابة
    const dummyHash = '$2b$12$LvyZ5c.SgL8wY7485PZ4EuqO7a8m5yF.kYvB5fF22eN/yVjV6L2qG';
    const passwordHash = user ? user.passwordHash : dummyHash;
    const valid = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !valid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');

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
