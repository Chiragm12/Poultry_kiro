const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testMortalityUpdate() {
  try {
    console.log('Testing mortality update functionality...')
    
    // Get a farm
    const farm = await prisma.farm.findFirst()
    if (!farm) {
      console.log('No farm found')
      return
    }
    
    console.log(`\nBefore mortality - ${farm.name}:`)
    console.log(`Male: ${farm.maleCount}, Female: ${farm.femaleCount}`)
    
    // Simulate mortality recording (like the API would do)
    const maleMortality = 5
    const femaleMortality = 3
    
    const result = await prisma.$transaction(async (tx) => {
      // Create the mortality record
      const mortalityRecord = await tx.mortalityRecord.create({
        data: {
          date: new Date(),
          maleMortality,
          femaleMortality,
          notes: 'Test mortality record',
          farmId: farm.id,
        },
      })

      // Update farm counts by subtracting mortality
      const updatedFarm = await tx.farm.update({
        where: { id: farm.id },
        data: {
          maleCount: Math.max(0, (farm.maleCount || 0) - maleMortality),
          femaleCount: Math.max(0, (farm.femaleCount || 0) - femaleMortality),
        },
      })

      return { mortalityRecord, updatedFarm }
    })
    
    console.log(`\nAfter mortality - ${result.updatedFarm.name}:`)
    console.log(`Male: ${result.updatedFarm.maleCount} (reduced by ${maleMortality})`)
    console.log(`Female: ${result.updatedFarm.femaleCount} (reduced by ${femaleMortality})`)
    
    console.log(`\nMortality record created: ID ${result.mortalityRecord.id}`)
    
    // Clean up - delete the test mortality record and restore counts
    await prisma.mortalityRecord.delete({
      where: { id: result.mortalityRecord.id }
    })
    
    await prisma.farm.update({
      where: { id: farm.id },
      data: {
        maleCount: farm.maleCount,
        femaleCount: farm.femaleCount,
      },
    })
    
    console.log('\n✅ Test completed and cleaned up!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMortalityUpdate()