import { prisma } from '@/lib/prisma';

export async function createAuditLog({
  actorId,
  action,
  resourceId,
  previousState,
  newState,
  requestId = `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
}: {
  actorId: string;
  action: string;
  resourceId: string;
  previousState?: string | null;
  newState?: string | null;
  requestId?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId,
        action,
        resourceId,
        previousState: previousState || null,
        newState: newState || null,
        requestId,
      },
    });
  } catch (err) {
    console.error('Audit log creation failed:', err);
  }
}
