const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Delete all cart items first
  const deletedItems = await prisma.cartItem.deleteMany({})
  console.log(`Deleted ${deletedItems.count} cart items`)
  
  // Delete all carts
  const deletedCarts = await prisma.cart.deleteMany({})
  console.log(`Deleted ${deletedCarts.count} carts`)
  
  console.log('All cart data cleared successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
