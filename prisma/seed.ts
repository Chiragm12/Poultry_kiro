import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-farm' },
    update: {},
    create: {
      name: 'Demo Poultry Farm',
      slug: 'demo-farm',
      description: 'A demonstration poultry farm for testing',
      email: 'admin@demofarm.com',
      phone: '+1 (555) 123-4567',
      address: '123 Farm Road, Rural County, State 12345',
      website: 'https://demofarm.com',
    },
  })

  console.log('✅ Created organization:', organization.name)

  // Create admin user
  const hashedPassword = await hashPassword('Admin123!')
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demofarm.com' },
    update: {},
    create: {
      email: 'admin@demofarm.com',
      name: 'Farm Administrator',
      hashedPassword,
      role: 'OWNER',
      phone: '+1 (555) 123-4567',
      organizationId: organization.id,
    },
  })

  console.log('✅ Created admin user:', adminUser.email)

  // Create manager user
  const managerPassword = await hashPassword('Manager123!')
  
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@demofarm.com' },
    update: {},
    create: {
      email: 'manager@demofarm.com',
      name: 'Farm Manager',
      hashedPassword: managerPassword,
      role: 'MANAGER',
      phone: '+1 (555) 123-4568',
      organizationId: organization.id,
    },
  })

  console.log('✅ Created manager user:', managerUser.email)

  // Create worker users
  const workerPassword = await hashPassword('Worker123!')
  
  const workers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'worker1@demofarm.com' },
      update: {},
      create: {
        email: 'worker1@demofarm.com',
        name: 'John Worker',
        hashedPassword: workerPassword,
        role: 'WORKER',
        phone: '+1 (555) 123-4569',
        organizationId: organization.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'worker2@demofarm.com' },
      update: {},
      create: {
        email: 'worker2@demofarm.com',
        name: 'Jane Worker',
        hashedPassword: workerPassword,
        role: 'WORKER',
        phone: '+1 (555) 123-4570',
        organizationId: organization.id,
      },
    }),
  ])

  console.log('✅ Created worker users:', workers.map(w => w.email).join(', '))

  // Create farms
  const farm1 = await prisma.farm.upsert({
    where: { id: 'demo-farm-1' },
    update: {},
    create: {
      id: 'demo-farm-1',
      name: 'Main Farm',
      location: 'North Field',
      description: 'Primary production facility',
      organizationId: organization.id,
      managerId: managerUser.id,
    },
  })

  const farm2 = await prisma.farm.upsert({
    where: { id: 'demo-farm-2' },
    update: {},
    create: {
      id: 'demo-farm-2',
      name: 'Secondary Farm',
      location: 'South Field',
      description: 'Secondary production facility',
      organizationId: organization.id,
      managerId: managerUser.id,
    },
  })

  console.log('✅ Created farms:', farm1.name, farm2.name)

  // Create sheds
  const sheds = await Promise.all([
    prisma.shed.upsert({
      where: { id: 'shed-1' },
      update: {},
      create: {
        id: 'shed-1',
        name: 'Shed A1',
        capacity: 1000,
        description: 'Main laying shed',
        farmId: farm1.id,
      },
    }),
    prisma.shed.upsert({
      where: { id: 'shed-2' },
      update: {},
      create: {
        id: 'shed-2',
        name: 'Shed A2',
        capacity: 800,
        description: 'Secondary laying shed',
        farmId: farm1.id,
      },
    }),
    prisma.shed.upsert({
      where: { id: 'shed-3' },
      update: {},
      create: {
        id: 'shed-3',
        name: 'Shed B1',
        capacity: 1200,
        description: 'Large laying shed',
        farmId: farm2.id,
      },
    }),
  ])

  console.log('✅ Created sheds:', sheds.map(s => s.name).join(', '))

  // Create user settings for admin
  await prisma.userSettings.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      emailNotifications: true,
      smsNotifications: true,
      productionAlerts: true,
      attendanceAlerts: true,
      lowProductionThreshold: 85,
      attendanceThreshold: 90,
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      language: 'en',
      theme: 'light',
    },
  })

  console.log('✅ Created user settings for admin')

  // Create some sample production data
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  await Promise.all([
    prisma.production.upsert({
      where: { 
        shedId_date: {
          shedId: 'shed-1',
          date: yesterday,
        }
      },
      update: {},
      create: {
        shedId: 'shed-1',
        date: yesterday,
        totalEggs: 850,
        brokenEggs: 15,
        damagedEggs: 10,
        sellableEggs: 825,
        notes: 'Good production day',
      },
    }),
    prisma.production.upsert({
      where: { 
        shedId_date: {
          shedId: 'shed-2',
          date: yesterday,
        }
      },
      update: {},
      create: {
        shedId: 'shed-2',
        date: yesterday,
        totalEggs: 720,
        brokenEggs: 12,
        damagedEggs: 8,
        sellableEggs: 700,
        notes: 'Normal production',
      },
    }),
  ])

  console.log('✅ Created sample production data')

  // Create attendance records
  await Promise.all([
    prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: workers[0].id,
          date: yesterday,
        }
      },
      update: {},
      create: {
        userId: workers[0].id,
        date: yesterday,
        status: 'PRESENT',
        notes: 'On time',
      },
    }),
    prisma.attendance.upsert({
      where: {
        userId_date: {
          userId: workers[1].id,
          date: yesterday,
        }
      },
      update: {},
      create: {
        userId: workers[1].id,
        date: yesterday,
        status: 'PRESENT',
        notes: 'On time',
      },
    }),
  ])

  console.log('✅ Created sample attendance data')

  console.log('🎉 Seeding completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('Admin: admin@demofarm.com / Admin123!')
  console.log('Manager: manager@demofarm.com / Manager123!')
  console.log('Worker: worker1@demofarm.com / Worker123!')
  console.log('Worker: worker2@demofarm.com / Worker123!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })