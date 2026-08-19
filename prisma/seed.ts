import { prisma } from "../src/lib/prisma";
import { Role, Status } from "../src/lib/enums";

async function main() {
  console.log("🌱 Starting CampusCast Database Seeding...");

  // Clean existing data
  await prisma.jobRun.deleteMany();
  await prisma.deviceLog.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.approvalStep.deleteMany();
  await prisma.contentVersion.deleteMany();
  await prisma.contentItem.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.club.deleteMany();
  await prisma.device.deleteMany();

  console.log("🧹 Cleaned old database records.");

  // 1. Create Users (4 Roles)
  const hodUser = await prisma.user.create({
    data: {
      name: "Dr. Sarah Jenkins (Engineering HOD)",
      email: "sarah.hod@campus.edu",
      role: Role.club_hod,
      departmentId: "dept_engineering",
    },
  });

  const presidentUser = await prisma.user.create({
    data: {
      name: "Alex Rivera (Robotics Pres)",
      email: "alex@campus.edu",
      role: Role.club_president,
      departmentId: "dept_engineering",
    },
  });

  const culturalPresUser = await prisma.user.create({
    data: {
      name: "Maya Lin (Arts Pres)",
      email: "maya@campus.edu",
      role: Role.club_president,
      departmentId: "dept_humanities",
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "Chief Admin Marcus Vance",
      email: "admin@campus.edu",
      role: Role.admin,
    },
  });

  await prisma.user.create({
    data: {
      name: "Public Kiosk Viewer",
      email: "viewer@campus.edu",
      role: Role.viewer,
    },
  });

  console.log("👥 Created 5 seed users covering all 4 roles.");

  // 2. Create Clubs (One WITH HOD, One WITHOUT HOD)
  const roboticsClub = await prisma.club.create({
    data: {
      name: "Robotics & AI Society",
      departmentId: "dept_engineering",
      hodUserId: hodUser.id, // Has HOD
    },
  });

  const artsClub = await prisma.club.create({
    data: {
      name: "Arts & Fine Cultural Club",
      departmentId: "dept_humanities",
      hodUserId: null, // SKIPS HOD approval path
    },
  });

  // Link presidents to their respective clubs
  await prisma.user.update({
    where: { id: presidentUser.id },
    data: { clubId: roboticsClub.id },
  });

  await prisma.user.update({
    where: { id: culturalPresUser.id },
    data: { clubId: artsClub.id },
  });

  console.log("🏛️ Created 2 seed clubs (Robotics with HOD, Arts without HOD).");

  // 3. Create Devices
  const device1 = await prisma.device.create({
    data: {
      locationTag: "Main Library Foyer",
      zone: "Zone-North",
      status: "online",
      lastHeartbeat: new Date(),
      firmwareVersion: "v2.1.0-esp32",
    },
  });

  const device2 = await prisma.device.create({
    data: {
      locationTag: "Engineering Block Atrium",
      zone: "Zone-East",
      status: "online",
      lastHeartbeat: new Date(),
      firmwareVersion: "v2.1.0-esp32",
    },
  });

  console.log("📺 Created 2 billboard display devices.");

  // 4. Create Sample Events & Content Items covering EVERY Status in Section 5.1
  const now = new Date();

  // 1) awaiting_poster
  await prisma.event.create({
    data: {
      clubId: roboticsClub.id,
      title: "Annual Hackathon 2026",
      venue: "Auditorium A",
      eventDate: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000), // 18 days out
      contentItems: {
        create: {
          mediaUrl: "",
          selfCertified: false,
          status: Status.awaiting_poster,
          submittedById: presidentUser.id,
          approvalSteps: {
            create: {
              approverUserId: presidentUser.id,
              approverRole: Role.club_president,
              decision: "event_created",
              comment: "Event created. Waiting for poster upload.",
            },
          },
        },
      },
    },
  });

  // 2) pending_hod_approval
  await prisma.event.create({
    data: {
      clubId: roboticsClub.id,
      title: "Autonomous Drone Race Showcase",
      venue: "Campus Sports Field",
      eventDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      contentItems: {
        create: {
          mediaUrl: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&auto=format&fit=crop&q=80",
          selfCertified: true,
          status: Status.pending_hod_approval,
          submittedById: presidentUser.id,
          approvalSteps: {
            createMany: {
              data: [
                {
                  approverUserId: presidentUser.id,
                  approverRole: Role.club_president,
                  decision: "upload_poster",
                  comment: "Poster submitted for Stage 1 HOD review.",
                },
              ],
            },
          },
        },
      },
    },
  });

  // 3) pending_admin_approval (Submitted by Arts Club which has no HOD)
  await prisma.event.create({
    data: {
      clubId: artsClub.id,
      title: "Spring Symphony & Gallery Night",
      venue: "Arts Pavilion",
      eventDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      contentItems: {
        create: {
          mediaUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=80",
          selfCertified: true,
          status: Status.pending_admin_approval,
          submittedById: culturalPresUser.id,
          approvalSteps: {
            create: {
              approverUserId: culturalPresUser.id,
              approverRole: Role.club_president,
              decision: "upload_poster",
              comment: "Poster uploaded (Direct to Admin - No HOD).",
            },
          },
        },
      },
    },
  });

  // 4) approved
  await prisma.event.create({
    data: {
      clubId: roboticsClub.id,
      title: "AI Ethics & Robotics Workshop",
      venue: "Lecture Hall 4B",
      eventDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      contentItems: {
        create: {
          mediaUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
          selfCertified: true,
          status: Status.approved,
          submittedById: presidentUser.id,
          approvedById: adminUser.id,
          approvalSteps: {
            createMany: {
              data: [
                {
                  approverUserId: presidentUser.id,
                  approverRole: Role.club_president,
                  decision: "upload_poster",
                  comment: "Submitted poster.",
                },
                {
                  approverUserId: hodUser.id,
                  approverRole: Role.club_hod,
                  decision: "approve",
                  comment: "Department HOD approved technical content.",
                },
                {
                  approverUserId: adminUser.id,
                  approverRole: Role.admin,
                  decision: "approve",
                  comment: "Final Admin approval granted. Ready for broadcasting.",
                },
              ],
            },
          },
        },
      },
    },
  });

  // 5) rejected
  await prisma.event.create({
    data: {
      clubId: roboticsClub.id,
      title: "Late Night Gaming Tournament",
      venue: "Student Lounge",
      eventDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      contentItems: {
        create: {
          mediaUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
          selfCertified: true,
          status: Status.rejected,
          submittedById: presidentUser.id,
          approvalSteps: {
            createMany: {
              data: [
                {
                  approverUserId: presidentUser.id,
                  approverRole: Role.club_president,
                  decision: "upload_poster",
                  comment: "Initial poster upload.",
                },
                {
                  approverUserId: hodUser.id,
                  approverRole: Role.club_hod,
                  decision: "reject",
                  comment: "Font size too small on sponsor logos. Please revise branding compliance.",
                },
              ],
            },
          },
          versions: {
            create: {
              mediaUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
            },
          },
        },
      },
    },
  });

  // 6) ineligible
  await prisma.event.create({
    data: {
      clubId: artsClub.id,
      title: "Flash Photography Workshop",
      venue: "Arts Studio 2",
      eventDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // Only 5 days out (< 7-day rule)
      contentItems: {
        create: {
          mediaUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=80",
          selfCertified: true,
          status: Status.ineligible,
          submittedById: culturalPresUser.id,
          approvalSteps: {
            createMany: {
              data: [
                {
                  approverUserId: culturalPresUser.id,
                  approverRole: Role.club_president,
                  decision: "upload_poster",
                  comment: "Late submission upload.",
                },
                {
                  approverUserId: null,
                  approverRole: Role.admin,
                  decision: "system_ineligible",
                  comment: "7-day submission deadline breached. Event is scheduled in 5 days.",
                },
              ],
            },
          },
        },
      },
    },
  });

  // 7) live
  await prisma.contentItem.create({
    data: {
      mediaUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80",
      selfCertified: true,
      status: Status.live,
      submittedById: presidentUser.id,
      approvedById: adminUser.id,
      event: {
        create: {
          clubId: roboticsClub.id,
          title: "Campus Smart Kiosk Unveiling",
          venue: "Main Square",
          eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
      },
      approvalSteps: {
        createMany: {
          data: [
            {
              approverUserId: presidentUser.id,
              approverRole: Role.club_president,
              decision: "upload_poster",
              comment: "Uploaded final poster.",
            },
            {
              approverUserId: hodUser.id,
              approverRole: Role.club_hod,
              decision: "approve",
              comment: "Approved.",
            },
            {
              approverUserId: adminUser.id,
              approverRole: Role.admin,
              decision: "approve",
              comment: "Approved.",
            },
            {
              approverUserId: null,
              approverRole: Role.admin,
              decision: "system_broadcast_live",
              comment: "21-day window broadcast active across screen fleet.",
            },
          ],
        },
      },
      schedules: {
        createMany: {
          data: [
            {
              deviceId: device1.id,
              startAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
              endAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            },
            {
              deviceId: device2.id,
              startAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
              endAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
            },
          ],
        },
      },
    },
  });

  // 8) archived
  await prisma.event.create({
    data: {
      clubId: artsClub.id,
      title: "Freshers Welcome Concert 2026",
      venue: "Main Auditorium",
      eventDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days in the past
      contentItems: {
        create: {
          mediaUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
          selfCertified: true,
          status: Status.archived,
          submittedById: culturalPresUser.id,
          approvedById: adminUser.id,
          approvalSteps: {
            createMany: {
              data: [
                {
                  approverUserId: culturalPresUser.id,
                  approverRole: Role.club_president,
                  decision: "upload_poster",
                  comment: "Submitted.",
                },
                {
                  approverUserId: adminUser.id,
                  approverRole: Role.admin,
                  decision: "approve",
                  comment: "Approved.",
                },
                {
                  approverUserId: null,
                  approverRole: Role.admin,
                  decision: "system_archived",
                  comment: "Event date passed. Automatically archived.",
                },
              ],
            },
          },
        },
      },
    },
  });

  console.log("🎉 Created 8 sample events covering ALL statuses: awaiting_poster, pending_hod_approval, pending_admin_approval, approved, rejected, ineligible, live, archived.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
