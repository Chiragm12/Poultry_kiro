const { PrismaClient } = require('@prisma/client')

async function checkShedsAndFarms() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== FARMS ===')
    const farms = await prisma.farm.findMany({
      include: {
        _count: {
          select: {
            sheds: true
          }
        }
      }
    })
    
    farms.forEach(farm => {
      console.log(`Farm: ${farm.name} (${farm.location}) - ${farm._count.sheds} sheds`)
    })

    console.log('\n=== SHEDS ===')
    const sheds = await prisma.shed.findMany({
      include: {
        farm: {
          select: {
            name: true,
            location: true
          }
        }
      }
    })
    
    sheds.forEach(shed => {
      console.log(`Shed: ${shed.name} - Farm: ${shed.farm.name} (${shed.farm.location})`)
    })

    console.log(`\nTotal Farms: ${farms.length}`)
    console.log(`Total Sheds: ${sheds.length}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkShedsAndFarms()