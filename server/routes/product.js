const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = {};
    if (category) where.category = category;

    let products = await prisma.product.findMany({
      where,
      include: { artisan: { select: { name: true, profile: true } } }
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
    if (error.code === 'P2025') return res.status(404).json({ error: 'المنتج غير موجود' });
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, category, price, stock, images, artisanId } = req.body;

    if (!artisanId) {
      return res.status(400).json({ error: "معرّف الحرفي (artisanId) مطلوب لربط المنتج بالحساب!" });
    }
    if (!images || images.length === 0) {
      return res.status(400).json({ error: "يجب إرفاق رابط صورة الرسمة المستلمة!" });
    }

    const product = await prisma.product.create({
      data: {
        name: name || "رسمة رقمية جديدة",
        description: description || "رسمة تم إنشاؤها عبر لوحة الرسم",
        category: category || "Digital Art",
        price: price ? parseFloat(price) : 0.0,
        stock: stock ? parseInt(stock) : 1,
        images: images,
        artisanId: artisanId 
      }
    });

    res.status(201).json({ message: "تم حفظ الرسمة كمنتج بنجاح", product });
  } catch (error) {
    console.error("Error creating product from canvas:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
