// ---- SYSTÈME D'ÉCHANGE DE CARTES & CONTRE-PROPOSITION ----
  socket.on('initiateTrade', (data) => {
    const { roomId, targetPlayerId, offerMoney, demandMoney, offerProps, demandProps } = data;
    const room = rooms[roomId];
    if (!room) return;

    // RÈGLE : On ne peut proposer un échange (ou une contre-proposition) que si c'est notre tour !
    const activePlayer = room.players[room.currentPlayer];
    if (!activePlayer || activePlayer.id !== socket.id) return;

    const sender = room.players.find(p => p.id === socket.id);
    const receiver = room.players.find(p => p.id === targetPlayerId);

    if (!sender || !receiver || sender.id === receiver.id) return;

    room.activeTrade = {
      senderId: sender.id,
      senderName: sender.username,
      receiverId: receiver.id,
      receiverName: receiver.username,
      offerMoney: parseInt(offerMoney) || 0,
      demandMoney: parseInt(demandMoney) || 0,
      offerProps: offerProps || [],
      demandProps: demandProps || []
    };

    io.to(roomId).emit('tradeProposed', room.activeTrade);
    io.to(roomId).emit('log', `🤝 ${sender.username} propose un échange à ${receiver.username}.`);
  });

  socket.on('acceptTrade', roomId => {
    const room = rooms[roomId];
    if (!room || !room.activeTrade) return;

    const trade = room.activeTrade;
    if (socket.id !== trade.receiverId) return; 

    const sender = room.players.find(p => p.id === trade.senderId);
    const receiver = room.players.find(p => p.id === trade.receiverId);

    if (!sender || !receiver) return;

    if (sender.money < trade.offerMoney || receiver.money < trade.demandMoney) {
      io.to(roomId).emit('log', "❌ Échange échoué : Fonds insuffisants.");
      room.activeTrade = null;
      io.to(roomId).emit('tradeClosed');
      io.to(roomId).emit('gameState', room);
      return;
    }

    sender.money = sender.money - trade.offerMoney + trade.demandMoney;
    receiver.money = receiver.money - trade.demandMoney + trade.offerMoney;

    trade.offerProps.forEach(tileIndex => {
      if (room.owners[tileIndex] === sender.id) {
        room.owners[tileIndex] = receiver.id;
        room.buildings[tileIndex] = 0;
      }
    });

    trade.demandProps.forEach(tileIndex => {
      if (room.owners[tileIndex] === receiver.id) {
        room.owners[tileIndex] = sender.id;
        room.buildings[tileIndex] = 0;
      }
    });

    io.to(roomId).emit('log', `✅ L'échange entre ${sender.username} et ${receiver.username} a été CONCLU !`);
    room.activeTrade = null;
    io.to(roomId).emit('tradeClosed');
    io.to(roomId).emit('gameState', room);
  });

  socket.on('rejectTrade', roomId => {
    const room = rooms[roomId];
    if (!room || !room.activeTrade) return;
    if (socket.id !== room.activeTrade.receiverId && socket.id !== room.activeTrade.senderId) return;

    io.to(roomId).emit('log', `❌ L'échange a été refusé.`);
    room.activeTrade = null;
    io.to(roomId).emit('tradeClosed');
    io.to(roomId).emit('gameState', room);
  });

  // Gère la transition vers une contre-proposition
  socket.on('counterTrade', roomId => {
    const room = rooms[roomId];
    if (!room || !room.activeTrade) return;
    
    // On efface l'échange en cours sur le serveur pour libérer l'espace
    room.activeTrade = null;
    io.to(roomId).emit('tradeClosed');
    io.to(roomId).emit('gameState', room);
  });
