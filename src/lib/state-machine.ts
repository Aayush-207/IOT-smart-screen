import { PrismaClient, Prisma } from "@prisma/client";
import { Role, Status } from "./enums";

export type TransitionAction =
  | "upload_poster"
  | "hod_approve"
  | "hod_reject"
  | "admin_approve"
  | "admin_reject"
  | "admin_override"
  | "broadcast_live"
  | "mark_ineligible"
  | "auto_archive";

export interface StateTransitionParams {
  contentItemId: string;
  action: TransitionAction;
  actorUserId?: string;
  actorRole?: Role;
  mediaUrl?: string;
  comment?: string;
  selfCertified?: boolean;
}

export async function transitionContentState(
  params: StateTransitionParams,
  dbClient: PrismaClient | Prisma.TransactionClient
) {
  const { contentItemId, action, actorUserId, actorRole, mediaUrl, comment, selfCertified } = params;

  // Fetch content item with event & club details
  const item = await dbClient.contentItem.findUnique({
    where: { id: contentItemId },
    include: {
      event: {
        include: {
          club: true,
        },
      },
    },
  });

  if (!item) {
    throw new Error(`ContentItem not found: ${contentItemId}`);
  }

  const currentStatus = item.status;
  const club = item.event.club;

  let nextStatus: Status;
  let decision: string;
  const stepComment: string | undefined = comment?.trim();

  switch (action) {
    case "upload_poster": {
      if (currentStatus !== Status.awaiting_poster && currentStatus !== Status.rejected) {
        throw new Error(`Cannot upload poster when item is in status: ${currentStatus}`);
      }
      if (!mediaUrl) {
        throw new Error("Upload requires a valid mediaUrl");
      }
      if (selfCertified !== true) {
        throw new Error("Upload requires selfCertification check");
      }

      // Route based on whether club has assigned HOD
      if (club.hodUserId) {
        nextStatus = Status.pending_hod_approval;
      } else {
        nextStatus = Status.pending_admin_approval;
      }

      decision = currentStatus === Status.rejected ? "reupload_poster" : "upload_poster";

      // Save previous version if poster is replaced/re-uploaded
      if (item.mediaUrl && item.mediaUrl.length > 0 && item.mediaUrl !== mediaUrl) {
        await dbClient.contentVersion.create({
          data: {
            contentItemId: item.id,
            mediaUrl: item.mediaUrl,
          },
        });
      }

      await dbClient.contentItem.update({
        where: { id: item.id },
        data: {
          mediaUrl,
          selfCertified: true,
          status: nextStatus,
          submittedById: actorUserId || item.submittedById,
        },
      });

      break;
    }

    case "hod_approve": {
      if (currentStatus !== Status.pending_hod_approval) {
        throw new Error(`Cannot HOD approve item in status: ${currentStatus}`);
      }
      if (!actorUserId || !actorRole) {
        throw new Error("HOD approval requires actor context");
      }
      if (item.submittedById === actorUserId) {
        throw new Error("Users cannot approve or reject their own submission");
      }
      if (actorRole === Role.club_hod) {
        // Enforce department scope
        const approver = await dbClient.user.findUnique({ where: { id: actorUserId } });
        if (!approver || approver.departmentId !== club.departmentId) {
          throw new Error("HOD is not authorized for content in a different department");
        }
      } else if (actorRole !== Role.admin) {
        throw new Error("Only HOD or Admin can perform HOD approval");
      }

      nextStatus = Status.pending_admin_approval;
      decision = "approve";
      break;
    }

    case "hod_reject": {
      if (currentStatus !== Status.pending_hod_approval) {
        throw new Error(`Cannot HOD reject item in status: ${currentStatus}`);
      }
      if (!actorUserId || !actorRole) {
        throw new Error("HOD rejection requires actor context");
      }
      if (item.submittedById === actorUserId) {
        throw new Error("Users cannot approve or reject their own submission");
      }
      if (!stepComment) {
        throw new Error("Rejection requires a non-empty comment");
      }
      if (actorRole === Role.club_hod) {
        const approver = await dbClient.user.findUnique({ where: { id: actorUserId } });
        if (!approver || approver.departmentId !== club.departmentId) {
          throw new Error("HOD is not authorized for content in a different department");
        }
      } else if (actorRole !== Role.admin) {
        throw new Error("Only HOD or Admin can perform HOD rejection");
      }

      nextStatus = Status.awaiting_poster;
      decision = "reject";
      break;
    }

    case "admin_approve": {
      if (currentStatus !== Status.pending_admin_approval) {
        throw new Error(`Cannot Admin approve item in status: ${currentStatus}`);
      }
      if (!actorUserId || actorRole !== Role.admin) {
        throw new Error("Admin approval requires admin role");
      }
      if (item.submittedById === actorUserId) {
        throw new Error("Users cannot approve or reject their own submission");
      }

      nextStatus = Status.approved;
      decision = "approve";

      await dbClient.contentItem.update({
        where: { id: item.id },
        data: {
          approvedById: actorUserId,
          status: nextStatus,
        },
      });
      break;
    }

    case "admin_reject": {
      if (currentStatus !== Status.pending_admin_approval) {
        throw new Error(`Cannot Admin reject item in status: ${currentStatus}`);
      }
      if (!actorUserId || actorRole !== Role.admin) {
        throw new Error("Admin rejection requires admin role");
      }
      if (item.submittedById === actorUserId) {
        throw new Error("Users cannot approve or reject their own submission");
      }
      if (!stepComment) {
        throw new Error("Rejection requires a non-empty comment");
      }

      nextStatus = Status.awaiting_poster;
      decision = "reject";
      break;
    }

    case "admin_override": {
      if (currentStatus !== Status.ineligible) {
        throw new Error(`Cannot override item in status: ${currentStatus}`);
      }
      if (!actorUserId || actorRole !== Role.admin) {
        throw new Error("Override requires admin role");
      }
      if (!stepComment) {
        throw new Error("Override requires a non-empty reason comment");
      }

      nextStatus = Status.pending_admin_approval;
      decision = "override";
      break;
    }

    case "broadcast_live": {
      if (currentStatus !== Status.approved) {
        throw new Error(`Cannot broadcast live item in status: ${currentStatus}`);
      }
      nextStatus = Status.live;
      decision = "system_broadcast_live";
      break;
    }

    case "mark_ineligible": {
      if (currentStatus === Status.approved || currentStatus === Status.live || currentStatus === Status.archived) {
        throw new Error(`Cannot mark item in status '${currentStatus}' as ineligible`);
      }
      nextStatus = Status.ineligible;
      decision = "system_ineligible";
      break;
    }

    case "auto_archive": {
      if (currentStatus !== Status.live) {
        throw new Error(`Cannot archive item in status: ${currentStatus}`);
      }
      nextStatus = Status.archived;
      decision = "system_archived";
      break;
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }

  // Update status if not already updated in action block
  if (action !== "upload_poster" && action !== "admin_approve") {
    await dbClient.contentItem.update({
      where: { id: item.id },
      data: { status: nextStatus },
    });
  }

  // Record audit step
  const step = await dbClient.approvalStep.create({
    data: {
      contentItemId: item.id,
      approverUserId: actorUserId || null,
      approverRole: actorRole || Role.admin,
      decision,
      comment: stepComment || null,
    },
  });

  return {
    contentItemId: item.id,
    previousStatus: currentStatus,
    newStatus: nextStatus,
    approvalStep: step,
  };
}

/**
 * Executes state transition inside a database transaction to ensure atomicity.
 */
export async function executeStateTransition(
  params: StateTransitionParams,
  prismaClient: PrismaClient
) {
  return await prismaClient.$transaction(async (tx) => {
    return await transitionContentState(params, tx);
  });
}
