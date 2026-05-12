import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async getUnit() {
    return this.prisma.unit.findFirst({
      include: {
        conceptNodes: {
          orderBy: { order: 'asc' },
          include: {
            subConcepts: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
  }

  async getNodes() {
    return this.prisma.conceptNode.findMany({
      orderBy: { order: 'asc' },
      include: {
        subConcepts: { orderBy: { order: 'asc' } },
        _count: { select: { questions: true, contentChunks: true } },
      },
    });
  }

  async getNode(id: string) {
    return this.prisma.conceptNode.findUnique({
      where: { id },
      include: {
        parent: true,
        subConcepts: { orderBy: { order: 'asc' } },
        contentChunks: { orderBy: { order: 'asc' } },
        formulas: true,
        figures: true,
        tables: true,
        examples: true,
        remediationCards: true,
        hints: true,
      },
    });
  }

  async getNodeContent(nodeId: string) {
    return this.prisma.contentChunk.findMany({
      where: { nodeId },
      orderBy: { order: 'asc' },
    });
  }

  async getFormulas(nodeId: string) {
    return this.prisma.formula.findMany({ where: { nodeId } });
  }

  async getTables(nodeId: string) {
    return this.prisma.tableReference.findMany({ where: { nodeId } });
  }

  async getExamples(nodeId: string) {
    return this.prisma.workedExample.findMany({ where: { nodeId } });
  }

  async getMiniGames() {
    return this.prisma.miniGameDefinition.findMany({
      include: {
        node: { select: { titleAr: true } }
      }
    });
  }
}
