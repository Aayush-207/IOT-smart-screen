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

  console.log('Seeding complete! 3 screens initialized.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
