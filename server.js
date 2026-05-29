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

// Base de données complète des propriétés avec loyers, prix des maisons et groupes
const boardProperties = [
  { name: "DÉPART", price: 0, type: "special" },
  { name: "Boulevard de Belleville", price: 60, rents: [2, 4, 10, 30, 90, 160, 250], housePrice: 50, group: "brown" },
  { name: "Caisse de Communauté", price: 0, type: "special" },
  { name: "Rue de Lecourbe", price: 60, rents: [4, 8, 20, 60, 180, 320, 450], housePrice: 50, group: "brown" },
  { name: "Impôt sur le Revenu", price: 0, rent: 200, type: "tax" },
  { name: "Gare Montparnasse", price: 200, rents: [25, 50, 100, 200], type: "station", group: "station" },
  { name: "Rue de Vaugirard", price: 100, rents: [6, 12, 30, 90, 270, 400, 550], housePrice: 50, group: "light-blue" },
  { name: "Chance", price: 0, type: "chance" },
  { name: "Rue de Courcelles", price: 100, rents: [6, 12, 30, 90, 270, 400, 550], housePrice: 50, group: "light-blue" },
  { name: "Avenue de la République", price: 120, rents: [8, 16, 40, 100, 300, 450, 600], housePrice: 50, group: "light-blue" },
  { name: "PRISON", price: 0, type: "special" },
  { name: "Boulevard de la Villette", price: 140, rents: [10, 20, 50, 150, 450, 625, 750], housePrice: 100, group: "pink" },
  { name: "Compagnie d'Électricité", price: 150, rents: [20, 50], type: "service", group: "service" },
  { name: "Avenue de Neuilly", price: 140, rents: [10, 20, 50, 150, 450, 625, 750], housePrice: 100, group: "pink" },
  { name: "Rue de Paradis", price: 160, rents: [12, 24, 60, 180, 500, 700, 900], housePrice: 100, group: "pink" },
  { name: "Gare de Lyon", price: 200, rents: [25, 50, 100, 200], type: "station", group: "station" },
  { name: "Avenue Mozart", price: 180, rents: [14, 28, 70, 200, 550, 750, 950], housePrice: 100, group: "orange" },
  { name: "Caisse de Communauté", price: 0, type: "special" },
  { name: "Saint-Michel", price: 180, rents: [14, 28, 70, 200, 550, 750, 950], housePrice: 100, group: "orange" },
  { name: "Place Pigalle", price: 200, rents: [16, 32, 80, 220, 600, 800, 1000], housePrice: 100, group: "orange" },
  { name: "PARC GRATUIT", price: 0, type: "special" },
  { name: "Avenue Matignon", price: 220, rents: [18, 36, 90, 250, 700, 875, 1050], housePrice: 150, group: "red" },
  { name: "Chance", price: 0, type: "chance" },
  { name: "Avenue de l'Opéra", price: 220, rents: [18, 36, 90, 250, 700, 875, 1050], housePrice: 150, group: "red" },
  { name: "Rue de la Paix", price: 240, rents: [20, 40, 100, 300, 750, 925, 1100], housePrice: 150, group: "red" },
  { name: "Gare du Nord", price: 200, rents: [25, 50, 100, 200], type: "station", group: "station" },
  { name: "Faubourg Saint-Honoré", price: 260, rents: [22, 44, 110, 330, 800, 975, 1150], housePrice: 150, group: "yellow" },
  { name: "Place de la Bourse", price: 260, rents: [22, 44, 110, 330, 800, 975, 1150], housePrice: 150, group: "yellow" },
  { name: "Compagnie des Eaux", price: 150, rents: [20, 50], type: "service", group: "service" },
  { name: "Rue La Fayette", price: 280, rents: [24, 48, 120, 360, 850, 1025, 1200], housePrice: 150, group: "yellow" },
  { name: "ALLEZ EN PRISON", price: 0, type: "go-to-jail" },
  { name: "Avenue de Breteuil", price: 300, rents: [26, 52, 130, 390, 900, 1100, 1275], housePrice: 200, group: "green" },
  { name: "Avenue Foch", price: 300, rents: [26, 52, 130, 390, 900, 1100, 1275], housePrice: 200, group: "green" },
  { name: "Caisse de Communauté", price: 0, type: "special" },
  { name: "Capucines", price: 320, rents: [28, 56, 150, 450, 1000, 1200, 1400], housePrice: 200, group: "green" },
  { name: "Gare Saint-Lazare", price: 200, rents: [25, 50, 100, 200], type: "station", group: "station" },
  { name: "Chance", price: 0, type: "chance" },
  { name: "Champs-Élysées", price: 350, rents: [35, 70, 175, 500, 1100, 1300, 1500], housePrice: 200, group: "dark-blue" },
  { name: "Taxe de Luxe", price: 0, rent: 100, type: "tax" },
  { name: "Rue de la Paix", price: 400, rents: [50, 100, 200, 600, 1400, 1700, 2000], housePrice: 200, group: "dark-blue" }
];

const chanceCards = [
  { text: "Erreur de la banque en votre faveur ! Recevez 150$ 💰", action: "money", value: 150 },
  { text: "Amende pour excès de vitesse. Payez 50$ 💸", action: "money", value: -50 },
  { text: "Avancez jusqu'à la case DÉPART (Recevez 200$) 🏃‍♂️", action: "move", value: 0 },
  { text: "Mauvaise conduite ! Allez directement en PRISON sans passer par le départ 🚔", action: "jail", value: 10 }
];

// Fonction utilitaire pour vérifier si un joueur possède TOUT un groupe de couleur
function hasMonopoly(room, playerID, group) {
  if (!group || group === 'station' || group === 'service') return false;
  const targetTiles = boardProperties.filter(p => p.group === group);
  return targetTiles.every((tile, index) => {
    const tileIndex = boardProperties.indexOf(tile);
    return room.owners[tileIndex] === playerID && !room.mortgaged[tileIndex];
  });
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
        owners: {},     // IndexDeLaCase: PlayerID
        buildings: {},  // IndexDeLaCase: Nombre (1 à 4 = Maisons, 5 = Hôtel)
        mortgaged: {},  // IndexDeLaCase: true/false
        gameStarted: false,
        creatorId: socket.id
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
      inJail: false
    });

    io.to(roomId).emit('gameState', room);
    io.to(roomId).emit('log', `${username} a rejoint le salon 🚪`);
  });

  socket.on('startGame', roomId => {
    const room = rooms[roomId];
    if (!room || room.creatorId !== socket.id || room.players.length < 2) return;
    room.gameStarted = true;
    io.to(roomId).emit('gameState', room);
    io.to(roomId).emit('log', "🎮 La partie commence !");
  });

  socket.on('rollDice', roomId => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const activePlayer = room.players[room.currentPlayer];
    if (activePlayer.id !== socket.id) return;

    if (activePlayer.inJail) {
      activePlayer.inJail = false;
      io.to(roomId).emit('log', `🔒 ${activePlayer.username} passe son tour en Prison.`);
      room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
      io.to(roomId).emit('gameState', room);
      return;
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalDice = d1 + d2;

    io.to(roomId).emit('diceRolled', { d1, d2 });

    activePlayer.position += totalDice;
    if (activePlayer.position >= 40) {
      activePlayer.position -= 40;
      activePlayer.money += 200;
      io.to(roomId).emit('log', `${activePlayer.username} passe par la case DÉPART (+200$) 💰`);
    }

    let currentTile = boardProperties[activePlayer.position];
    io.to(roomId).emit('log', `${activePlayer.username} fait ${totalDice} et s'arrête sur : ${currentTile.name}`);

    // LOGIQUE LOGISTIQUE DES CASES
    if (currentTile.type === 'go-to-jail') {
      activePlayer.position = 10;
      activePlayer.inJail = true;
      io.to(roomId).emit('log', `🚨 ${activePlayer.username} va en PRISON !`);
    } else if (currentTile.type === 'tax') {
      activePlayer.money -= currentTile.rent;
      io.to(roomId).emit('log', `${activePlayer.username} paye ${currentTile.rent}$ de taxes.`);
    } else if (currentTile.type === 'chance') {
      const randomCard = chanceCards[Math.floor(Math.random() * chanceCards.length)];
      io.to(roomId).emit('log', `❓ CHANCE [${activePlayer.username}] : ${randomCard.text}`);
      if (randomCard.action === 'money') activePlayer.money += randomCard.value;
      if (randomCard.action === 'move') { activePlayer.position = randomCard.value; activePlayer.money += 200; }
      if (randomCard.action === 'jail') { activePlayer.position = 10; activePlayer.inJail = true; }
    } 
    // LOYER DYNAMIQUE AVEC MAISONS ET MONOPOLE
    else if (room.owners[activePlayer.position] && room.owners[activePlayer.position] !== activePlayer.id) {
      const tileIndex = activePlayer.position;
      
      // S'il n'est pas hypothéqué
      if (!room.mortgaged[tileIndex]) {
        const owner = room.players.find(p => p.id === room.owners[tileIndex]);
        let rentToPay = 0;

        if (currentTile.type === 'prop') {
          const buildLevel = room.buildings[tileIndex] || 0;
          if (buildLevel > 0) {
            rentToPay = currentTile.rents[buildLevel + 1]; // [TerrainNu, Monopole, M1, M2, M3, M4, Hotel]
          } else if (hasMonopoly(room, owner.id, currentTile.group)) {
            rentToPay = currentTile.rents[1]; // Loyer double monopole
          } else {
            rentToPay = currentTile.rents[0]; // Loyer de base
          }
        } else if (currentTile.type === 'station' || currentTile.type === 'service') {
          rentToPay = currentTile.rents[0];
        }

        activePlayer.money -= rentToPay;
        owner.money += rentToPay;
        io.to(roomId).emit('log', `🏠 LOYER : ${activePlayer.username} paye ${rentToPay}$ à ${owner.username}!`);
      } else {
        io.to(roomId).emit('log', `ℹ️ La propriété ${currentTile.name} est hypothéquée. Aucun loyer perçu.`);
      }
    }

    room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
    io.to(roomId).emit('gameState', room);
  });

  socket.on('buyProperty', roomId => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    let lastPlayerIndex = room.currentPlayer - 1;
    if (lastPlayerIndex < 0) lastPlayerIndex = room.players.length - 1;
    const player = room.players[lastPlayerIndex];

    if (player.id !== socket.id) return;

    const tileIndex = player.position;
    const tile = boardProperties[tileIndex];

    if (tile.price === 0 || room.owners[tileIndex]) return;

    if (player.money >= tile.price) {
      player.money -= tile.price;
      room.owners[tileIndex] = player.id;
      room.buildings[tileIndex] = 0;
      room.mortgaged[tileIndex] = false;
      io.to(roomId).emit('log', `🎉 ${player.username} a acheté ${tile.name} !`);
      io.to(roomId).emit('gameState', room);
    }
  });

  // NOUVEAU : CONSTRUIRE UNE MAISON SOUX LE FILTRE MONOPOLE
  socket.on('buildHouse', (data) => {
    const { roomId, tileIndex } = data;
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    const tile = boardProperties[tileIndex];

    if (room.owners[tileIndex] !== socket.id || room.mortgaged[tileIndex]) return;
    if (!hasMonopoly(room, socket.id, tile.group)) return;

    const currentBuild = room.buildings[tileIndex] || 0;
    if (currentBuild >= 5) return; // Déjà un hôtel

    if (player.money >= tile.housePrice) {
      player.money -= tile.housePrice;
      room.buildings[tileIndex] = currentBuild + 1;
      const typeLabel = room.buildings[tileIndex] === 5 ? "un HÔTEL" : "une maison";
      io.to(roomId).emit('log', `🛠️ ${player.username} construit ${typeLabel} sur ${tile.name} !`);
      io.to(roomId).emit('gameState', room);
    }
  });

  // NOUVEAU : GESTION DES HYPOTHÈQUES (Vendre / Racheter)
  socket.on('toggleMortgage', (data) => {
    const { roomId, tileIndex } = data;
    const room = rooms[roomId];
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    const tile = boardProperties[tileIndex];

    if (room.owners[tileIndex] !== socket.id) return;
    if ((room.buildings[tileIndex] || 0) > 0) return; // Impossible d'hypothéquer s'il y a des maisons

    const halfPrice = Math.floor(tile.price / 2);

    if (!room.mortgaged[tileIndex]) {
      // Activer l'hypothèque (Emprunter de l'argent)
      room.mortgaged[tileIndex] = true;
      player.money += halfPrice;
      io.to(roomId).emit('log', `🏦 ${player.username} a hypothéqué ${tile.name} pour +${halfPrice}$`);
    } else {
      // Lever l'hypothèque (Rembourser avec 10% de frais réglementaires)
      const costToLift = Math.floor(halfPrice * 1.1);
      if (player.money >= costToLift) {
        player.money -= costToLift;
        room.mortgaged[tileIndex] = false;
        io.to(roomId).emit('log', `🔓 ${player.username} a levé l'hypothèque de ${tile.name} pour ${costToLift}$`);
      }
    }
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
            delete room.owners[key];
            delete room.buildings[key];
            delete room.mortgaged[key];
          }
        }
        if (room.currentPlayer >= room.players.length) room.currentPlayer = 0;
        io.to(roomId).emit('log', `${username} a quitté.`);
        io.to(roomId).emit('gameState', room);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur sur port ${PORT}`));
