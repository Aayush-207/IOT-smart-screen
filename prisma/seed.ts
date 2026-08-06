import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial smart billboard screens...');

  const initialScreens = [
    {
      slug: 'screen-1',
      name: 'Screen 1 — Main Entrance',
      location: 'Main Entrance Hall',
    },
    {
      slug: 'screen-2',
      name: 'Screen 2 — Library',
      location: 'Central Library Foyer',
    },
    {
      slug: 'screen-3',
      name: 'Screen 3 — Cafeteria',
      location: 'Student Cafeteria',
    },
  ];

  for (const screen of initialScreens) {
    await prisma.screen.upsert({
      where: { slug: screen.slug },
      update: {
        name: screen.name,
        location: screen.location,
      },
      create: screen,
    });
  }

  const initialUsers = [
    {
      id: 'usr_101',
      email: 'gaurav@college.edu',
      name: 'Gaurav',
      role: 'DESIGN_LEAD',
      clubId: 'technology-club',
    },
    {
      id: 'usr_102',
      email: 'alex@college.edu',
      name: 'Alex Rivera',
      role: 'PRESIDENT',
      clubId: 'robotics-club',
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
      update: {
        id: user.id,
        name: user.name,
        role: user.role,
        clubId: user.clubId,
      },
      create: user,
    });
  }

  console.log('Seeding complete! 3 screens and 3 users initialized.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
