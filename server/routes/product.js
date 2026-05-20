const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { category, search, artisanId } = req.query;
    const where = {};
    
    if (category) where.category = category;
    if (artisanId) where.artisanId = artisanId; 
    let products = await prisma.product.findMany({
      where,
      include: { artisan: { select: { name: true, profile: true } } },
      orderBy: { createdAt: 'desc' } 
    });

    if (search) {
      const lowerSearch = search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(lowerSearch) || 
        p.description.toLowerCase().includes(lowerSearch)
      );
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/artisan/:artisanId', async (req, res) => {
  try {
    const { artisanId } = req.params;
    const products = await prisma.product.findMany({
      where: { artisanId: artisanId },
      include: { artisan: { select: { name: true, profile: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { views: { increment: 1 } },
      include: { 
        artisan: { select: { name: true, email: true, profile: true } }, 
        reviews: { include: { user: { select: { name: true } } } } 
      }
    });
    res.json(product);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, category, price, stock, images, artisanId } = req.body;
    
    const finalImages = typeof images === 'string' ? images : JSON.stringify(images || []);

    const product = await prisma.product.create({
      data: {
        name,
        description,
        category,
        price: parseFloat(price),
        stock: parseInt(stock),
        images: finalImages,
        artisanId
      }
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
