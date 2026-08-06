import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CampusCast IoT Billboard network...');

  // 1. Seed Screens
  const initialScreens = [
    {
      slug: 'screen-1',
      name: 'Screen 1 — Main Entrance',
      location: 'Main Entrance Hall',
      building: 'Academic Block A',
      floor: 'Ground Floor',
      deviceSecretHash: 'sec_hash_01',
      status: 'ACTIVE',
      playlistVersion: 1,
      freeStorageMb: 4096,
    },
    {
      slug: 'screen-2',
      name: 'Screen 2 — Library',
      location: 'Central Library Foyer',
      building: 'Central Library',
      floor: '1st Floor',
      deviceSecretHash: 'sec_hash_02',
      status: 'ACTIVE',
      playlistVersion: 1,
      freeStorageMb: 3072,
    },
    {
      slug: 'screen-3',
      name: 'Screen 3 — Cafeteria',
      location: 'Student Cafeteria',
      building: 'Student Center',
      floor: 'Ground Floor',
      deviceSecretHash: 'sec_hash_03',
      status: 'ACTIVE',
      playlistVersion: 1,
      freeStorageMb: 2048,
    },
  ];

  for (const screen of initialScreens) {
    await prisma.screen.upsert({
      where: { slug: screen.slug },
      update: screen,
      create: screen,
    });
  }

  // 2. Seed Users
  const initialUsers = [
    {
      id: 'usr_101',
      email: 'gaurav@college.edu',
      name: 'Gaurav (Design Lead)',
      role: 'DESIGN_LEAD',
      clubId: 'technology-club',
    },
    {
      id: 'usr_102',
      email: 'president@college.edu',
      name: 'Alex Rivera (President)',
      role: 'PRESIDENT',
      clubId: 'technology-club',
    },
    {
      id: 'usr_103',
      email: 'hod@college.edu',
      name: 'Dr. Smith (HOD)',
      role: 'HOD',
      clubId: 'technology-club',
    },
    {
      id: 'usr_100',
      email: 'admin@college.edu',
      name: 'Campus Admin',
      role: 'SYSTEM_ADMIN',
      clubId: 'campus-wide',
    },
  ];

  for (const user of initialUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    });
  }

  // 3. Seed Sample Event & Poster
  const sampleEvent = await prisma.event.create({
    data: {
      name: 'Annual AI & Robotics Hackathon 2026',
      description: '24-hour campus hackathon with cash prizes, mentor guidance, and networking.',
      clubId: 'technology-club',
      venue: 'Main Auditorium & Innovation Lab',
      eventDate: new Date('2026-08-30T00:00:00.000Z'),
      startTime: '09:00 AM',
      endTime: '09:00 AM (Next Day)',
      contactInfo: 'techclub@college.edu • +91 98765 43210',
      registrationUrl: 'https://hackathon.college.edu',
      targetScreens: JSON.stringify(['screen-1', 'screen-2', 'screen-3']),
    },
  });

  const samplePoster = await prisma.poster.create({
    data: {
      eventId: sampleEvent.id,
      title: 'AI & Robotics Hackathon Poster',
      imagePath: '/uploads/sample_hackathon.jpg',
      originalFileName: 'hackathon_banner.jpg',
      mimeType: 'image/jpeg',
      checksum: 'af1d9038c29b71e80957',
      status: 'PENDING_PRESIDENT',
      activeFrom: new Date('2026-08-09T00:00:00.000Z'), // Event Date - 21 Days
      activeUntil: new Date('2026-08-30T23:59:59.000Z'),
      isPublic: false,
    },
  });

  console.log('Seeding complete! Initialized screens, users, sample event & pending poster.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
