const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting optimized database seeding with strict constraint handling...');

  await prisma.review.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.bid.deleteMany({});
  await prisma.auction.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleared successfully!');

  const passwordHash = await bcrypt.hash('password123', 10);
  const categories = ['painting', 'jewellery', 'pottery', 'textiles'];
  const artImages = ['/art/art1.png', '/art/art2.png', '/art/art3.png', '/art/art4.png'];

  const admins = await Promise.all(Array.from({ length: 3 }, (_, i) => prisma.user.create({ data: { email: `admin${i+1}@coop.com`, passwordHash, role: 'ADMIN', name: `Admin ${i+1}` } })));
  const artisans = await Promise.all(Array.from({ length: 50 }, (_, i) => prisma.user.create({
    data: { email: `artisan${i+1}@coop.com`, passwordHash, role: 'ARTISAN', name: `Artisan ${i+1}`, profile: { create: { shopName: `Shop ${i+1}`, bio: `Handmade crafts bio for artisan ${i+1}`, avatarUrl: `/avatars/artisan${i+1}.png` } } }
  })));
  const customers = await Promise.all(Array.from({ length: 50 }, (_, i) => prisma.user.create({ data: { email: `customer${i+1}@coop.com`, passwordHash, role: 'CUSTOMER', name: `Customer ${i+1}` } })));

  const products = await Promise.all(Array.from({ length: 100 }, (_, i) => prisma.product.create({
    data: { name: `Handmade Craft #${i+1}`, description: `Premium handcrafted item #${i+1}`, price: parseFloat((10 + Math.random() * 90).toFixed(2)), stock: Math.floor(Math.random() * 10) + 1, category: categories[i % 4], images: JSON.stringify([artImages[i % 4]]), artisanId: artisans[i % 50].id }
  })));

  const auctions = await Promise.all(Array.from({ length: 15 }, (_, i) => {
    const isUpcoming = i === 12 || i === 13;
    const startPrice = parseFloat((50 + Math.random() * 150).toFixed(2));
    return prisma.auction.create({
      data: {
        title: `Masterpiece Artwork Auction #${i+1}`, description: `Exclusive bidding for rare piece #${i+1}`, category: categories[i % 4], startingPrice: startPrice, currentBid: startPrice,
        status: isUpcoming ? 'UPCOMING' : 'ACTIVE', startTime: new Date(Date.now() + (isUpcoming ? 24 : -1) * 3600000), endTime: new Date(Date.now() + (isUpcoming ? 48 : 4) * 3600000), artisanId: artisans[(i + 5) % 50].id, images: JSON.stringify([artImages[(i + 2) % 4]])
      }
    });
  }));

  for (let i = 0; i < 30; i++) {
    const auction = auctions[i % 15];
    if (auction.status === 'ACTIVE') {
      await prisma.bid.create({ data: { amount: auction.currentBid + (i + 1) * 5, auctionId: auction.id, userId: customers[i % 50].id } });
      await prisma.auction.update({ where: { id: auction.id }, data: { currentBid: auction.currentBid + (i + 1) * 5 } });
    }
  }

  for (let i = 1; i <= 50; i++) {
    const p = products[i % 100];
    await prisma.order.create({
      data: { id: `COOP-2024-${Math.floor(10000 + Math.random() * 90000)}`, total: p.price, status: ['PENDING', 'SHIPPED', 'DELIVERED'][i % 3], userId: customers[i % 50].id, items: { create: { productId: p.id, quantity: 1, priceAtBuy: p.price } } }
    });
  }

  for (let i = 1; i <= 60; i++) {
    await prisma.review.create({ data: { rating: Math.floor(Math.random() * 2) + 4, comment: `Amazing quality and detail on item #${i}`, productId: products[i % 100].id, userId: customers[i % 50].id } });
  }

  console.log('Database seeding completed successfully and safely!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
