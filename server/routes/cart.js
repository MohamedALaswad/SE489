const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/:userId', async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.params.userId },
      include: { items: { include: { product: true } } }
    });
    
    if (!cart) {
      const newCart = await prisma.cart.create({
        data: { userId: req.params.userId },
        include: { items: { include: { product: true } } }
      });
      return res.json(newCart);
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId/add', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const reqQty = quantity || 1;
    
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let cart = await prisma.cart.findUnique({ where: { userId: req.params.userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.params.userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } }
    });

    const currentQtyInCart = existingItem ? existingItem.quantity : 0;

    if (product.stock < (currentQtyInCart + reqQty)) {
      return res.status(400).json({ error: `عذراً، المخزون المتوفر لا يكفي. المتبقي: ${product.stock}` });
    }

    const updatedItem = await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: reqQty } },
      create: { cartId: cart.id, productId, quantity: reqQty }
    });

    res.status(200).json({ message: 'Added/Increased successfully', item: updatedItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId/decrease', async (req, res) => {
  try {
    const { productId } = req.body;

    const cart = await prisma.cart.findUnique({ where: { userId: req.params.userId } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    const cartItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } }
    });

    if (!cartItem) return res.status(404).json({ error: 'Item not found in cart' });

    if (cartItem.quantity <= 1) {
      await prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } }
      });
      return res.status(200).json({ message: 'Item removed from cart entirely' });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity: { decrement: 1 } }
    });

    res.status(200).json({ message: 'Quantity decreased successfully', item: updatedItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:userId/remove/:productId', async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.params.userId } });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    await prisma.cartItem.delete({
      where: { cartId_productId: { cartId: cart.id, productId: req.params.productId } }
    });

    res.status(200).json({ message: 'Removed from cart' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
