const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const auctionState = {};

function handleWebSocketConnection(wss) {
  wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'SUBSCRIBE') {
          ws.auctionId = data.auctionId;
          const currentAuction = await prisma.auction.findUnique({
            where: { id: data.auctionId }
          });
          if (currentAuction) {
            ws.send(JSON.stringify({
              type: 'UPDATE',
              auctionId: currentAuction.id,
              currentBid: currentAuction.currentBid,
              status: currentAuction.status
            }));
          }
        }

        if (data.type === 'PLACE_BID') {
  const { auctionId, userId, amount } = data;
  
  try {
    await prisma.$transaction(async (tx) => {
      
      const freshAuction = await tx.auction.findUnique({ 
        where: { id: auctionId } 
      });

      if (!freshAuction || freshAuction.status !== 'ACTIVE') {
        throw new Error('Auction not active');
      }

      if (freshAuction.artisanId === userId) {
        throw new Error('Shill bidding is not allowed');
      }

      if (amount <= freshAuction.currentBid) {
        throw new Error('Bid must be higher than current bid');
      }

      await tx.auction.update({
        where: { id: auctionId },
        data: { currentBid: amount }
      });

      await tx.bid.create({
        data: { 
          amount, 
          auctionId, 
          userId 
        }
      });
    });

    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'UPDATE',
          auctionId,
          currentBid: amount
        }));
      }
    });

  } catch (err) {
    console.error("WebSocket Bid Error:", err.message);
    ws.send(JSON.stringify({ type: 'ERROR', message: err.message }));
  }
}

          await prisma.$transaction(async (tx) => {
            const currentAuction = await tx.auction.findUnique({ where: { id: auctionId } });
            if (amount <= currentAuction.currentBid) throw new Error("Bid too low");

            await tx.auction.update({
              where: { id: auctionId },
              data: { currentBid: amount }
            });
            await tx.bid.create({
              data: { amount, auctionId, userId }
            });
          });

          wss.clients.forEach(client => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'UPDATE',
                auctionId,
                currentBid: amount
              }));
            }
          });
        }
      } catch (err) {
        console.error("WebSocket Error:", err.message);
        ws.send(JSON.stringify({ type: 'ERROR', message: err.message }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });


  setInterval(async () => {
    const activeClients = Array.from(wss.clients).filter(c => c.readyState === 1);
    if (activeClients.length === 0) return;

    const activeAuctions = await prisma.auction.findMany({
      where: { status: 'ACTIVE' }
    });

    activeClients.forEach(client => {
      activeAuctions.forEach(auction => {
        client.send(JSON.stringify({
          type: 'UPDATE',
          auctionId: auction.id,
          currentBid: auction.currentBid,
          status: auction.status
        }));
      });
    });
  }, 5000); // 500ms is too aggressive, use 5 seconds for periodic sync
}

module.exports = { handleWebSocketConnection };
