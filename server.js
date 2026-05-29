const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/monopoly.html');
});

const rooms = {};
const colors = ['#ef4444', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#f97316', '#ec4899', '#06b6d4', '#84cc16', '#64748b'];

const boardProperties = [
  { name: "DÉPART", price: 0, type: "special" },
  { name: "Boulevard de Belleville", price: 60, rents: [2, 4, 10, 30, 90, 160, 250], housePrice: 50, group: "brown" },
  { name: "Caisse de Communauté", price: 0, type: "special" },
  { name: "Rue de Lecourbe", price: 60, rents: [4, 8, 20, 60, 180, 320, 450], housePrice: 50, group: "brown" },
  { name: "Impôt sur le Revenu", price: 0, rent: 200, type: "tax" },
  { name: "Gare Montparnasse", price: 200, type: "station", group: "station" },
  { name: "Rue de Vaugirard", price: 100, rents: [6, 12, 30, 90, 270, 400, 550], housePrice: 50, group: "light-blue" },
  { name: "Chance", price: 0, type: "chance" },
  { name: "Rue de Courcelles", price: 100, rents: [6, 12, 30, 90, 270, 400, 550], housePrice: 50, group: "light-blue" },
  { name: "Avenue de la République", price: 120, rents: [8, 16, 40, 100, 300, 450, 600], housePrice: 50, group: "light-blue" },
  { name: "PRISON", price: 0, type: "special" },
  { name: "Boulevard de la Villette", price: 140, rents: [10, 20, 50, 150, 450, 625, 750], housePrice: 100, group: "pink" },
  { name: "Compagnie d'Électricité", price: 150, rents: [20, 50], type: "service", group: "service" },
  { name: "Avenue de Neuilly", price: 140, rents: [10, 20, 50, 150, 450, 625, 750], housePrice: 100, group: "pink" },
  { name: "Rue de Paradis", price: 160, rents: [12, 24, 60, 180, 500, 700, 900], housePrice: 100, group: "pink" },
  { name: "Gare de Lyon", price: 200, type: "station", group: "station" },
  { name: "Avenue Mozart", price: 180, rents: [14, 28, 70, 200, 550, 750, 950], housePrice: 100, group: "orange" },
  { name: "Caisse de Communauté", price: 0, type: "special" },
  { name: "Saint-Michel", price: 180, rents: [14, 28, 70, 200, 550, 750, 950], housePrice: 100, group: "orange" },
  { name: "Place Pigalle", price: 200, rents: [16, 32, 80, 220, 600, 800, 1000], housePrice: 100, group: "orange" },
  { name: "PARC GRATUIT", price: 0, type: "special" },
  { name: "Avenue Matignon", price: 220, rents: [18, 36, 90, 250, 700, 875, 1050], housePrice: 150, group: "red" },
  { name: "Chance", price: 0, type: "chance" },
  { name: "Avenue de l'Opéra", price: 220, rents: [18, 36, 90, 250, 700, 875, 1050], housePrice: 150, group: "red" },
  { name: "Rue de la Paix", price: 240, rents: [20, 40, 100, 300, 750, 925, 1100], housePrice: 150, group: "red" },
  { name: "Gare du Nord", price: 200, type: "station", group: "station" },
  { name: "Faubourg Saint-Honoré", price: 260, rents: [22, 44, 110, 330, 800, 975, 1150], housePrice: 150, group: "yellow" },
  { name: "Place de la Bourse", price: 260, rents: [22, 44, 110, 330, 800, 975, 1150], housePrice: 150, group: "yellow" },
  { name: "Compagnie des Eaux", price: 150, rents: [20, 50], type: "service", group: "service" },
  { name: "Rue La Lafayette", price: 280, rents: [24, 48, 120, 360, 850, 1025, 1200], housePrice: 150, group: "yellow" },
  { name: "ALLEZ EN PRISON", price: 0, type: "go-to-jail" },
  { name: "Avenue de Breteuil", price: 300, rents: [26, 52, 130, 390, 900, 1100, 1275], housePrice: 200, group: "green" },
  { name: "Avenue Foch", price: 300, rents: [26, 52, 130, 390, 900, 1100, 1275], housePrice: 200, group: "green" },
  { name: "Caisse de Communauté", price: 0, type: "special" },
  { name: "Capucines", price: 320, rents: [28, 56, 150, 450, 1000, 1200, 1400], housePrice: 200, group: "green" },
  { name: "Gare Saint-Lazare", price: 200, type: "station", group: "station" },
  { name: "Chance", price: 0, type: "chance" },
  { name: "Champs-Élysées", price: 350, rents: [35, 70, 175, 500, 1100, 1300, 1500], housePrice: 200, group: "dark-blue" },
  { name: "Taxe de Luxe", price: 0, rent: 100, type: "tax" },
  { name: "Rue de la Paix", price: 400, rents: [50, 100, 200, 600, 1400, 1700, 2000], housePrice: 200, group: "dark-blue" }
];

const chanceCards = [
  { text: "Erreur de la banque en votre faveur ! Recevez 150$ 💰", action: "money", value: 150 },
  { text: "Amende pour excès de vitesse. Payez 50$ 💸", action: "money", value: -50 },
  { text: "Avancez jusqu'à la case DÉPART (Recevez 200$) 🏃‍♂️", action: "move", value: 0 },
  { text: "Vous êtes libéré de prison ! Cette carte peut être conservée. 📜", action: "jail-card" },
  { text: "Changement de file ! Allez directement en PRISON sans passer par le départ 🚔", action: "jail" }
];

function hasMonopoly(room, playerID, group) {
  if (!group || group === 'station' || group === 'service') return false;
  const targetTiles = boardProperties.filter(p => p.group === group);
  return targetTiles.every(tile => {
    const tileIndex = boardProperties.indexOf(tile);
    return room.owners[tileIndex] === playerID;
  });
}

function countStationsOwned(room, playerID) {
  return boardProperties.filter((tile, idx) => tile.type === 'station' && room.owners[idx] === playerID).length;
}

function sendToJail(room, player, roomId) {
  player.position = 10;
  player.inJail = true;
  player.jailTurns = 0;
  room.doubleCount = 0;
  room.hasRolled = false;
  io.to(roomId).emit('log', `🚨 ${player.username} est envoyé en PRISON !`);
}

io.on('connection', socket => {
  socket.on('joinRoom', data => {
    const { username, roomId } = data;
    if (!username || !roomId) return;

    socket.join(roomId);
    socket.roomId = roomId;

    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        currentPlayer: 0,
        owners: {},
        buildings: {},
        doubleCount: 0,
        gameStarted: false,
        creatorId: socket.id,
        hasRolled: false,
        lastRollWasDouble: false,
        activeTrade: null // Stockera l'échange en cours
      };
    }

    const room = rooms[roomId];
    if (room.gameStarted || room.players.length >= 10) return;

    room.players.push({
      id: socket.id,
      username,
      position: 0,
      money: 1500,
      color: colors[room.players.length],
      inJail: false,
      jailTurns: 0,
      jailCards: 0
    });

    io.to(roomId).emit('gameState', room);
    io.to(roomId).emit('log', `${username} a rejoint le salon 🚪`);
  });

  socket.on('startGame', roomId => {
    const room = rooms[roomId];
    if (!room || room.gameStarted || room.players.length < 2) return;
    room.gameStarted = true;
    io.to(roomId).emit('gameState', room);
    io.to(roomId).emit('log', "🎮 La partie commence !");
  });

  socket.on('payJailFine', roomId => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players[room.currentPlayer];
    if (player.id !== socket.id || !player.inJail) return;

    if (player.money >= 50) {
      player.money -= 50;
      player.inJail = false;
      player.jailTurns = 0;
      io.to(roomId).emit('log', `💰 ${player.username} paye une amende de 50$ et sort de prison !`);
      io.to(roomId).emit('gameState', room);
    }
  });

  socket.on('useJailCard', roomId => {
    const room = rooms[roomId];
    if (!room) return;
    const player = room.players[room.currentPlayer];
    if (player.id !== socket.id || !player.inJail || player.jailCards <= 0) return;

    player.jailCards--;
    player.inJail = false;
    player.jailTurns = 0;
    io.to(roomId).emit('log', `📜 ${player.username} utilise sa carte Libéré de Prison et sort gratuitement !`);
    io.to(roomId).emit('gameState', room);
  });

  socket.on('rollDice', roomId => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const activePlayer = room.players[room.currentPlayer];
    if (activePlayer.id !== socket.id) return;
    if (room.hasRolled) return;

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const isDouble = (d1 === d2);
    const totalDice = d1 + d2;

    room.hasRolled = true;
    room.lastRollWasDouble = isDouble;

    io.to(roomId).emit('diceRolled', { d1, d2 });

    if (activePlayer.inJail) {
      activePlayer.jailTurns++;
      if (isDouble) {
        activePlayer.inJail = false;
        activePlayer.jailTurns = 0;
        room.lastRollWasDouble = false;
        io.to(roomId).emit('log', `🎲 DOUBLE ! ${activePlayer.username} fait un double ${d1} et s'évade de prison !`);
      } else {
        if (activePlayer.jailTurns >= 2) {
          activePlayer.money -= 50;
          activePlayer.inJail = false;
          activePlayer.jailTurns = 0;
          io.to(roomId).emit('log', `⏳ Prison terminée : Pas de double après 2 tours. ${activePlayer.username} paye 50$ d'amende.`);
        } else {
          io.to(roomId).emit('log', `🔒 ${activePlayer.username} fait (${d1}-${d2}). Reste en prison.`);
          io.to(roomId).emit('gameState', room);
          return;
        }
      }
    }

    if (isDouble && !activePlayer.inJail) {
      room.doubleCount++;
      io.to(roomId).emit('log', `🔥 Double n°${room.doubleCount} pour ${activePlayer.username} !`);
      if (room.doubleCount >= 3) {
        io.to(roomId).emit('log', `🚨 Excès de vitesse ! 3 doubles d'affilée.`);
        sendToJail(room, activePlayer, roomId);
        room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
        room.doubleCount = 0;
        room.hasRolled = false;
        io.to(roomId).emit('gameState', room);
        return;
      }
    } else {
      room.doubleCount = 0;
    }

    activePlayer.position += totalDice;
    if (activePlayer.position >= 40) {
      activePlayer.position -= 40;
      activePlayer.money += 200;
      io.to(roomId).emit('log', `${activePlayer.username} franchit la case DÉPART et perçoit 200$ 💰`);
    }

    let currentTile = boardProperties[activePlayer.position];
    io.to(roomId).emit('log', `${activePlayer.username} s'arrête sur : ${currentTile.name}`);

    if (currentTile.type === 'go-to-jail') {
      sendToJail(room, activePlayer, roomId);
      room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
      room.hasRolled = false;
    } else if (currentTile.type === 'tax') {
      activePlayer.money -= currentTile.rent || 100;
      io.to(roomId).emit('log', `${activePlayer.username} s'acquitte des taxes.`);
    } else if (currentTile.type === 'chance') {
      const randomCard = chanceCards[Math.floor(Math.random() * chanceCards.length)];
      io.to(roomId).emit('log', `❓ CHANCE : ${randomCard.text}`);

      if (randomCard.action === 'money') activePlayer.money += randomCard.value;
      if (randomCard.action === 'move') { activePlayer.position = randomCard.value; activePlayer.money += 200; }
      if (randomCard.action === 'jail') { sendToJail(room, activePlayer, roomId); room.currentPlayer = (room.currentPlayer + 1) % room.players.length; room.hasRolled = false; }
      if (randomCard.action === 'jail-card') activePlayer.jailCards++;
    } 
    else if (room.owners[activePlayer.position] && room.owners[activePlayer.position] !== activePlayer.id) {
      const tileIndex = activePlayer.position;
      
      const owner = room.players.find(p => p.id === room.owners[tileIndex]);
      let rentToPay = 0;

      if (currentTile.type === 'prop') {
        const buildLevel = room.buildings[tileIndex] || 0;
        if (buildLevel > 0) {
          rentToPay = currentTile.rents[buildLevel + 1];
        } else if (hasMonopoly(room, owner.id, currentTile.group)) {
          rentToPay = currentTile.rents[1];
        } else {
          rentToPay = currentTile.rents[0];
        }
      } 
      else if (currentTile.type === 'station') {
        const stationsCount = countStationsOwned(room, owner.id);
        const stationRents = [0, 25, 50, 100, 200];
        rentToPay = stationRents[stationsCount] || 25;
      } else if (currentTile.type === 'service') {
        rentToPay = currentTile.rents[0];
      }

      activePlayer.money -= rentToPay;
      owner.money += rentToPay;
      io.to(roomId).emit('log', `🏠 LOYER : ${activePlayer.username} verse ${rentToPay}$ à ${owner.username}.`);
    }

    io.to(roomId).emit('gameState', room);
  });

  socket.on('nextTurn', roomId => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;
    const activePlayer = room.players[room.currentPlayer];
    if (activePlayer.id !== socket.id) return;
    if (!room.hasRolled) return;

    if (!room.lastRollWasDouble) {
      room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
    } else {
      io.to(roomId).emit('log', `🎲 Grâce à son double, ${activePlayer.username} peut relancer !`);
    }

    room.hasRolled = false;
    io.to(roomId).emit('gameState', room);
  });

  socket.on('buyProperty', roomId => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    const tileIndex = player.position;
    const tile = boardProperties[tileIndex];

    if (tile.price === 0 || room.owners[tileIndex]) return;

    if (player.money >= tile.price) {
      player.money -= tile.price;
      room.owners[tileIndex] = player.id;
      room.buildings[tileIndex] = 0;
      io.to(roomId).emit('log', `🎉 ${player.username} a acheté ${tile.name} pour ${tile.price}$ !`);
      io.to(roomId).emit('gameState', room);
    }
  });

  socket.on('buildHouse', (data) => {
    const { roomId, tileIndex } = data;
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    const tile = boardProperties[tileIndex];

    if (room.owners[tileIndex] !== socket.id) return;
    if (!hasMonopoly(room, socket.id, tile.group)) return;

    const currentBuild = room.buildings[tileIndex] || 0;
    if (currentBuild >= 5) return;

    if (player.money >= tile.housePrice) {
      player.money -= tile.housePrice;
      room.buildings[tileIndex] = currentBuild + 1;
      io.to(roomId).emit('log', `🛠️ Maison construite sur ${tile.name}.`);
      io.to(roomId).emit('gameState', room);
    }
  });

  // MODIFIÉ : HYPOTHÈQUE = VENTE ET REMISE SUR LE MARCHÉ
  socket.on('toggleMortgage', (data) => {
    const { roomId, tileIndex } = data;
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    const tile = boardProperties[tileIndex];

    if (room.owners[tileIndex] !== socket.id) return;
    
    // Règle : On doit vendre les maisons avant de vendre le terrain
    if ((room.buildings[tileIndex] || 0) > 0) {
      io.to(socket.id).emit('log', "⚠️ Vendez d'abord les maisons de cette case !");
      return;
    }

    const sellPrice = Math.floor(tile.price / 2);
    player.money += sellPrice;

    io.to(roomId).emit('log', `🏦 ${player.username} a revendu ${tile.name} à la banque pour ${sellPrice}$ ! Elle est de nouveau achetable.`);
    
    // Suppression complète du propriétaire (Remise sur le marché)
    delete room.owners[tileIndex];
    delete room.buildings[tileIndex];

    io.to(roomId).emit('gameState', room);
  });

  // ---- SYSTÈME D'ÉCHANGE DE CARTES ----
  socket.on('initiateTrade', (data) => {
    const { roomId, targetPlayerId, offerMoney, demandMoney, offerProps, demandProps } = data;
    const room = rooms[roomId];
    if (!room) return;

    const sender = room.players.find(p => p.id === socket.id);
    const receiver = room.players.find(p => p.id === targetPlayerId);

    if (!sender || !receiver || sender.id === receiver.id) return;

    // Sauvegarde de l'échange dans la pièce
    room.activeTrade = {
      senderId: sender.id,
      senderName: sender.username,
      receiverId: receiver.id,
      receiverName: receiver.username,
      offerMoney: parseInt(offerMoney) || 0,
      demandMoney: parseInt(demandMoney) || 0,
      offerProps: offerProps || [], // Tableaux d'index de cases
      demandProps: demandProps || []
    };

    // Alerter toute la salle (pour l'affichage UI de la pop-up)
    io.to(roomId).emit('tradeProposed', room.activeTrade);
    io.to(roomId).emit('log', `🤝 ${sender.username} propose un échange à ${receiver.username}.`);
  });

  socket.on('acceptTrade', roomId => {
    const room = rooms[roomId];
    if (!room || !room.activeTrade) return;

    const trade = room.activeTrade;
    if (socket.id !== trade.receiverId) return; // Seul le destinataire peut accepter

    const sender = room.players.find(p => p.id === trade.senderId);
    const receiver = room.players.find(p => p.id === trade.receiverId);

    if (!sender || !receiver) return;

    // Vérification des fonds bancaires au moment de l'acceptation
    if (sender.money < trade.offerMoney || receiver.money < trade.demandMoney) {
      io.to(roomId).emit('log', "❌ Échange échoué : Fonds insuffisants.");
      room.activeTrade = null;
      io.to(roomId).emit('gameState', room);
      return;
    }

    // Échange de l'argent
    sender.money = sender.money - trade.offerMoney + trade.demandMoney;
    receiver.money = receiver.money - trade.demandMoney + trade.offerMoney;

    // Échange des propriétés envoyées par le Sender
    trade.offerProps.forEach(tileIndex => {
      if (room.owners[tileIndex] === sender.id) {
        room.owners[tileIndex] = receiver.id;
        room.buildings[tileIndex] = 0; // Les maisons sont perdues lors d'un échange
      }
    });

    // Échange des propriétés demandées au Receiver
    trade.demandProps.forEach(tileIndex => {
      if (room.owners[tileIndex] === receiver.id) {
        room.owners[tileIndex] = sender.id;
        room.buildings[tileIndex] = 0;
      }
    });

    io.to(roomId).emit('log', `✅ L'échange entre ${sender.username} et ${receiver.username} a été CONCLU !`);
    room.activeTrade = null;
    io.to(roomId).emit('gameState', room);
  });

  socket.on('rejectTrade', roomId => {
    const room = rooms[roomId];
    if (!room || !room.activeTrade) return;
    if (socket.id !== room.activeTrade.receiverId && socket.id !== room.activeTrade.senderId) return;

    io.to(roomId).emit('log', `❌ L'échange a été annulé ou refusé.`);
    room.activeTrade = null;
    io.to(roomId).emit('gameState', room);
  });

  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        const username = room.players[playerIndex].username;
        room.players.splice(playerIndex, 1);
        for (let key in room.owners) {
          if (room.owners[key] === socket.id) {
            delete room.owners[key]; delete room.buildings[key];
          }
        }
        if (room.activeTrade && (room.activeTrade.senderId === socket.id || room.activeTrade.receiverId === socket.id)) {
          room.activeTrade = null;
        }
        if (room.currentPlayer >= room.players.length) room.currentPlayer = 0;
        io.to(roomId).emit('log', `${username} a quitté.`);
        io.to(roomId).emit('gameState', room);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur prêt sur port ${PORT}`));
