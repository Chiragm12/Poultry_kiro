import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Sunrise Poultry Farm',
      slug: 'sunrise-poultry',
      description: 'Premium egg production facility',
      email: 'info@sunrisepoultry.com',
      phone: '+1-555-0123',
      address: '123 Farm Road, Rural County, State 12345',
      website: 'https://sunrisepoultry.com'
    }
  })

  console.log('✅ Organization created')

  // Create job roles
  const ownerRole = await prisma.jobRole.create({
    data: {
      title: 'Farm Owner',
      description: 'Overall farm management and operations',
      salary: 0,
      salaryType: 'MONTHLY',
      organizationId: organization.id
    }
  })

  const managerRole = await prisma.jobRole.create({
    data: {
      title: 'Farm Manager',
      description: 'Daily operations and staff supervision',
      salary: 5000,
      salaryType: 'MONTHLY',
      organizationId: organization.id
    }
  })

  const workerRole = await prisma.jobRole.create({
    data: {
      title: 'Farm Worker',
      description: 'Daily farm tasks and maintenance',
      salary: 2500,
      salaryType: 'MONTHLY',
      organizationId: organization.id
    }
  })

  console.log('✅ Job roles created')

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const owner = await prisma.user.create({
    data: {
      name: 'John Smith',
      email: 'owner@sunrisepoultry.com',
      hashedPassword,
      role: 'OWNER',
      organizationId: organization.id,
      jobRoleId: ownerRole.id,
      phone: '+1-555-0101',
      address: '456 Owner Lane, Rural County, State 12345',
      sex: 'M'
    }
  })

  const manager = await prisma.user.create({
    data: {
      name: 'Sarah Johnson',
      email: 'manager@sunrisepoultry.com',
      hashedPassword,
      role: 'MANAGER',
      organizationId: organization.id,
      jobRoleId: managerRole.id,
      phone: '+1-555-0102',
      address: '789 Manager Street, Rural County, State 12345',
      sex: 'F',
      supervisorId: owner.id
    }
  })

  // Create workers
  const workers = []
  const workerNames = [
    { name: 'Mike Davis', sex: 'M', phone: '+1-555-0201' },
    { name: 'Lisa Wilson', sex: 'F', phone: '+1-555-0202' },
    { name: 'Tom Brown', sex: 'M', phone: '+1-555-0203' },
    { name: 'Anna Garcia', sex: 'F', phone: '+1-555-0204' },
    { name: 'David Miller', sex: 'M', phone: '+1-555-0205' },
    { name: 'Emma Taylor', sex: 'F', phone: '+1-555-0206' }
  ]

  for (const workerData of workerNames) {
    const worker = await prisma.user.create({
      data: {
        name: workerData.name,
        email: `${workerData.name.toLowerCase().replace(' ', '.')}@sunrisepoultry.com`,
        hashedPassword,
        role: 'WORKER',
        organizationId: organization.id,
        jobRoleId: workerRole.id,
        phone: workerData.phone,
        sex: workerData.sex,
        supervisorId: manager.id
      }
    })
    workers.push(worker)
  }

  console.log('✅ Users created')

  // Create farms
  const farm1 = await prisma.farm.create({
    data: {
      name: 'North Wing Farm',
      location: 'North Section, Plot A',
      description: 'Main production facility with modern equipment',
      organizationId: organization.id,
      managerId: manager.id,
      maleCount: 150,
      femaleCount: 1500
    }
  })

  const farm2 = await prisma.farm.create({
    data: {
      name: 'South Wing Farm',
      location: 'South Section, Plot B',
      description: 'Secondary production facility',
      organizationId: organization.id,
      managerId: manager.id,
      maleCount: 100,
      femaleCount: 1200
    }
  })

  console.log('✅ Farms created')

  // Create sheds
  await prisma.shed.createMany({
    data: [
      { name: 'Shed A1', capacity: 800, farmId: farm1.id, description: 'Main laying shed' },
      { name: 'Shed A2', capacity: 700, farmId: farm1.id, description: 'Secondary laying shed' },
      { name: 'Shed B1', capacity: 600, farmId: farm2.id, description: 'South wing main shed' },
      { name: 'Shed B2', capacity: 600, farmId: farm2.id, description: 'South wing secondary shed' }
    ]
  })

  console.log('✅ Sheds created')

  // Create production cycle
  const cycleStartDate = new Date('2024-01-15')
  await prisma.productionCycle.create({
    data: {
      name: 'Batch 2024-01',
      startDate: cycleStartDate,
      startWeek: 20,
      expectedEndWeek: 92,
      farmId: farm1.id,
      organizationId: organization.id,
      isActive: true
    }
  })

  console.log('✅ Production cycle created')

  // Create realistic production data for the last 30 days
  const today = new Date()
  const productionData = []
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Simulate realistic production with some variation
    const baseProduction = 1200 + Math.floor(Math.random() * 200) - 100 // 1100-1300 range
    const tableEggs = Math.floor(baseProduction * 0.7) + Math.floor(Math.random() * 50) - 25
    const hatchingEggs = Math.floor(baseProduction * 0.25) + Math.floor(Math.random() * 30) - 15
    const crackedEggs = Math.floor(Math.random() * 20) + 5
    const jumboEggs = Math.floor(Math.random() * 15) + 5
    const leakerEggs = Math.floor(Math.random() * 10) + 2
    const totalEggs = tableEggs + hatchingEggs + crackedEggs + jumboEggs + leakerEggs
    
    // Farm 1 production
    productionData.push({
      date,
      tableEggs,
      hatchingEggs,
      crackedEggs,
      jumboEggs,
      leakerEggs,
      totalEggs,
      inchargeEggs: totalEggs + Math.floor(Math.random() * 20),
      farmId: farm1.id,
      notes: i === 0 ? 'Latest production record' : null
    })

    // Farm 2 production (smaller)
    const farm2Production = Math.floor(baseProduction * 0.8)
    const farm2TableEggs = Math.floor(farm2Production * 0.7)
    const farm2HatchingEggs = Math.floor(farm2Production * 0.25)
    const farm2CrackedEggs = Math.floor(Math.random() * 15) + 3
    const farm2JumboEggs = Math.floor(Math.random() * 10) + 3
    const farm2LeakerEggs = Math.floor(Math.random() * 8) + 2
    const farm2TotalEggs = farm2TableEggs + farm2HatchingEggs + farm2CrackedEggs + farm2JumboEggs + farm2LeakerEggs

    productionData.push({
      date,
      tableEggs: farm2TableEggs,
      hatchingEggs: farm2HatchingEggs,
      crackedEggs: farm2CrackedEggs,
      jumboEggs: farm2JumboEggs,
      leakerEggs: farm2LeakerEggs,
      totalEggs: farm2TotalEggs,
      inchargeEggs: farm2TotalEggs + Math.floor(Math.random() * 15),
      farmId: farm2.id
    })
  }

  await prisma.production.createMany({
    data: productionData
  })

  console.log('✅ Production records created')

  // Create flock management data
  const flockData = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Calculate week and day
    const daysSinceStart = Math.floor((date.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const ageWeeks = 20 + Math.floor(daysSinceStart / 7)
    const ageDayOfWeek = (daysSinceStart % 7) + 1

    // Simulate gradual mortality
    const mortalityF = Math.floor(Math.random() * 3)
    const mortalityM = Math.floor(Math.random() * 2)
    
    flockData.push({
      date,
      ageWeeks,
      ageDayOfWeek,
      openingFemale: 1500 - (i * 2), // Gradual decrease
      openingMale: 150 - Math.floor(i * 0.3),
      mortalityF,
      mortalityM,
      closingFemale: 1500 - (i * 2) - mortalityF,
      closingMale: 150 - Math.floor(i * 0.3) - mortalityM,
      farmId: farm1.id
    })

    flockData.push({
      date,
      ageWeeks,
      ageDayOfWeek,
      openingFemale: 1200 - (i * 1.5),
      openingMale: 100 - Math.floor(i * 0.2),
      mortalityF: Math.floor(Math.random() * 2),
      mortalityM: Math.floor(Math.random() * 1),
      closingFemale: 1200 - (i * 1.5) - Math.floor(Math.random() * 2),
      closingMale: 100 - Math.floor(i * 0.2) - Math.floor(Math.random() * 1),
      farmId: farm2.id
    })
  }

  await prisma.flockManagement.createMany({
    data: flockData
  })

  console.log('✅ Flock management records created')

  // Create attendance records
  const attendanceData = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Skip weekends for attendance
    if (date.getDay() === 0 || date.getDay() === 6) continue

    for (const worker of workers) {
      // 90% attendance rate with some variation
      const isPresent = Math.random() > 0.1
      const isLate = isPresent && Math.random() < 0.15
      
      let status = 'ABSENT'
      if (isPresent) {
        status = isLate ? 'LATE' : 'PRESENT'
      }

      attendanceData.push({
        date,
        status,
        userId: worker.id,
        notes: status === 'LATE' ? 'Traffic delay' : status === 'ABSENT' ? 'Sick leave' : null
      })
    }

    // Manager and owner attendance (higher rate)
    for (const user of [manager, owner]) {
      const isPresent = Math.random() > 0.05 // 95% attendance
      attendanceData.push({
        date,
        status: isPresent ? 'PRESENT' : 'ABSENT',
        userId: user.id
      })
    }
  }

  await prisma.attendance.createMany({
    data: attendanceData
  })

  console.log('✅ Attendance records created')

  // Create some mortality records
  const mortalityData = []
  for (let i = 20; i >= 0; i -= 3) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    mortalityData.push({
      date,
      maleMortality: Math.floor(Math.random() * 2),
      femaleMortality: Math.floor(Math.random() * 3) + 1,
      farmId: farm1.id,
      notes: 'Natural mortality'
    })

    mortalityData.push({
      date,
      maleMortality: Math.floor(Math.random() * 1),
      femaleMortality: Math.floor(Math.random() * 2),
      farmId: farm2.id,
      notes: 'Natural mortality'
    })
  }

  await prisma.mortalityRecord.createMany({
    data: mortalityData
  })

  console.log('✅ Mortality records created')

  // Create dispatch records
  const dispatchData = []
  for (let i = 25; i >= 0; i -= 2) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Dispatch about 80% of production
    const tableEggs = Math.floor(Math.random() * 600) + 400
    const hatchingEggs = Math.floor(Math.random() * 200) + 150
    const crackedEggs = Math.floor(Math.random() * 10) + 5
    const totalDispatched = tableEggs + hatchingEggs + crackedEggs

    dispatchData.push({
      date,
      tableEggs,
      hatchingEggs,
      crackedEggs,
      jumboEggs: Math.floor(Math.random() * 20) + 10,
      leakerEggs: 0,
      totalDispatched,
      farmId: farm1.id,
      notes: 'Regular dispatch to market'
    })
  }

  await prisma.dispatchRecord.createMany({
    data: dispatchData
  })

  console.log('✅ Dispatch records created')

  // Create audit logs
  const auditLogs = [
    {
      action: 'CREATE',
      entityType: 'Production',
      entityId: 'latest',
      newValues: JSON.stringify({ eggs: 1250, type: 'daily' }),
      userId: manager.id,
      organizationId: organization.id,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    {
      action: 'UPDATE',
      entityType: 'Farm',
      entityId: farm1.id,
      oldValues: JSON.stringify({ femaleCount: 1502 }),
      newValues: JSON.stringify({ femaleCount: 1500 }),
      userId: manager.id,
      organizationId: organization.id,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
    },
    {
      action: 'CREATE',
      entityType: 'Attendance',
      entityId: 'batch',
      newValues: JSON.stringify({ workers: 6, present: 5 }),
      userId: manager.id,
      organizationId: organization.id,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
    }
  ]

  await prisma.auditLog.createMany({
    data: auditLogs
  })

  console.log('✅ Audit logs created')

  console.log('🎉 Database seeded successfully!')
  console.log(`
📊 Summary:
- Organization: ${organization.name}
- Users: ${workers.length + 2} (1 owner, 1 manager, ${workers.length} workers)
- Farms: 2 farms with 4 sheds
- Production: 60 records (30 days × 2 farms)
- Flock Management: 60 records
- Attendance: ${attendanceData.length} records
- Mortality: ${mortalityData.length} records
- Dispatch: ${dispatchData.length} records
- Production Cycle: 1 active cycle

🔐 Login Credentials:
Owner: owner@sunrisepoultry.com / password123
Manager: manager@sunrisepoultry.com / password123
Worker: mike.davis@sunrisepoultry.com / password123
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })