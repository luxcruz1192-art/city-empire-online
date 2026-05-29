socket.on('rollDice', roomId => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const activePlayer = room.players[room.currentPlayer];
    if (activePlayer.id !== socket.id) return;

    if (activePlayer.inJail) {
      activePlayer.inJail = false;
      io.to(roomId).emit('log', `🔒 ${activePlayer.username} passe son tour en Prison. Libéré au prochain tour !`);
      room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
      io.to(roomId).emit('gameState', room);
      return;
    }

    // Lancer des dés
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalDice = d1 + d2;

    // !!! AJOUT : Envoie la valeur des dés à tous les écrans pour déclencher l'animation !!!
    io.to(roomId).emit('diceRolled', { d1, d2 });

    activePlayer.position += totalDice;
    
    // ... reste du code identique (Départ, Taxes, Loyers, etc.)
