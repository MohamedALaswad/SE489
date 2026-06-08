const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { userId, productId } = req.body;
    
    const count = await prisma.wishlist.count({ where: { userId } });
    if (count >= 50) return res.status(400).json({ error: 'Wishlist limit reached (50 items)' });

    const item = await prisma.wishlist.create({
      data: { userId, productId }
    });
    res.status(201).json(item);
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'Item already in wishlist' });
    res.status(500).json({ error: error.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.params.userId },
      include: { product: true }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:userId/:productId', async (req, res) => {
  try {
    await prisma.wishlist.deleteMany({
      where: { 
        userId: req.params.userId,
        productId: req.params.productId
      }
    });
    res.status(200).json({ message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
