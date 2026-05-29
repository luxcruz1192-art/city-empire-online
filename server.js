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

// Base de données simplifiée des propriétés pour gérer les prix et loyers
const boardProperties = [
  { name: "DÉPART", price: 0, rent: 0, type: "special" },
  { name: "Boulevard de Belleville", price: 60, rent: 2, type: "prop" },
  { name: "Caisse de Communauté", price: 0, rent: 0, type: "special" },
  { name: "Rue de Lecourbe", price: 60, rent: 4, type: "prop" },
  { name: "Impôt sur le Revenu", price: 0, rent: 200, type: "tax" }, // Taxe directe
  { name: "Gare Montparnasse", price: 200, rent: 25, type: "station" },
  { name: "Rue de Vaugirard", price: 100, rent: 6, type: "prop" },
  { name: "Chance", price: 0, rent: 0, type: "special" },
  { name: "Rue de Courcelles", price: 100, rent: 6, type: "prop" },
  { name: "Avenue de la République", price: 120, rent: 8, type: "prop" },
  { name: "PRISON", price: 0, rent: 0, type: "special" },
  { name: "Boulevard de la Villette", price: 140, rent: 10, type: "prop" },
  { name: "Compagnie d'Électricité", price: 150, rent: 10, type: "service" },
  { name: "Avenue de Neuilly", price: 140, rent: 10, type: "prop" },
  { name: "Rue de Paradis", price: 160, rent: 12, type: "prop" },
  { name: "Gare de Lyon", price: 200, rent: 25, type: "station" },
  { name: "Avenue Mozart", price: 180, rent: 14, type: "prop" },
  { name: "Caisse de Communauté", price: 0, rent: 0, type: "special" },
  { name: "Saint-Michel", price: 180, rent: 14, type: "prop" },
  { name: "Place Pigalle", price: 200, rent: 16, type: "prop" },
  { name: "PARC GRATUIT", price: 0, rent: 0, type: "special" },
  { name: "Avenue Matignon", price: 220, rent: 18, type: "prop" },
  { name: "Chance", price: 0, rent: 0, type: "special" },
  { name: "Avenue de l'Opéra", price: 220, rent: 18, type: "prop" },
  { name: "Rue de la Paix", price: 240, rent: 20, type: "prop" },
  { name: "Gare du Nord", price: 200, rent: 25, type: "station" },
  { name: "Faubourg Saint-Honoré", price: 260, rent: 22, type: "prop" },
  { name: "Place de la Bourse", price: 260, rent: 22, type: "prop" },
  { name: "Compagnie des Eaux", price: 150, rent: 10, type: "service" },
  { name: "Rue La Fayette", price: 280, rent: 24, type: "prop" },
  { name: "ALLEZ EN PRISON", price: 0, rent: 0, type: "special" },
  { name: "Avenue de Breteuil", price: 300, rent: 26, type: "prop" },
  { name: "Avenue Foch", price: 300, rent: 26, type: "prop" },
  { name: "Caisse de Communauté", price: 0, rent: 0, type: "special" },
  { name: "Capucines", price: 320, rent: 28, type: "prop" },
  { name: "Gare Saint-Lazare", price: 200, rent: 25, type: "station" },
  { name: "Chance", price: 0, rent: 0, type: "special" },
  { name: "Champs-Élysées", price: 350, rent: 35, type: "prop" },
  { name: "Taxe de Luxe", price: 0, rent: 100, type: "tax" },
  { name: "Rue de la Paix", price: 400, rent: 50, type: "prop" }
];

io.on('connection', socket => {
  console.log(`Joueur connecté : ${socket.id}`);

  socket.on('joinRoom', data => {
    const { username, roomId } = data;
    if (!username || !roomId) return;

    socket.join(roomId);
    socket.roomId = roomId; // On stocke la room dans le socket pour la déconnexion

    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        currentPlayer: 0,
        owners: {} // Stocke qui possède quelle case: { "caseIndex": "socketId" }
      };
    }

    const room = rooms[roomId];

    if (room.players.length >= 10) {
      socket.emit('log', 'La salle est pleine (max 10 joueurs).');
      return;
    }

    room.players.push({
      id: socket.id,
      username,
      position: 0,
      money: 1500,
      color: colors[room.players.length]
    });

    io.to(roomId).emit('gameState', room);
    io.to(roomId).emit('log', `${username} a rejoint la partie 🚪`);
  });

  socket.on('rollDice', roomId => {
    const room = rooms[roomId];
    if (!room || room.players.length === 0) return;

    const activePlayer = room.players[room.currentPlayer];

    // SÉCURITÉ : On vérifie si c'est bien ce joueur qui a cliqué
    if (activePlayer.id !== socket.id) {
      socket.emit('log', "Ce n'est pas ton tour ! ⏳");
      return;
    }

    // Lancer de 2 dés
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalDice = d1 + d2;

    activePlayer.position += totalDice;

    // Passage par la case départ
    if (activePlayer.position >= 40) {
      activePlayer.position -= 40;
      activePlayer.money += 200;
      io.to(roomId).emit('log', `${activePlayer.username} passe par la case DÉPART et reçoit 200$ 💰`);
    }

    const currentTileIndex = activePlayer.position;
    const currentTile = boardProperties[currentTileIndex];

    io.to(roomId).emit('log', `${activePlayer.username} fait un ${totalDice} (${d1}+${d2}) et arrive sur : ${currentTile.name}`);

    // --- LOGIQUE DES TAXES ET LOYERS ---
    if (currentTile.type === 'tax') {
      // C'est une case taxe
      activePlayer.money -= currentTile.rent;
      io.to(roomId).emit('log', `${activePlayer.username} paye ${currentTile.rent}$ de taxes. 💸`);
    } else if (room.owners[currentTileIndex] && room.owners[currentTileIndex] !== activePlayer.id) {
      // La case appartient à quelqu'un d'autre -> Loyer automatique
      const ownerId = room.owners[currentTileIndex];
      const owner = room.players.find(p => p.id === ownerId);

      if (owner) {
        activePlayer.money -= currentTile.rent;
        owner.money += currentTile.rent;
        io.to(roomId).emit('log', `${activePlayer.username} paye ${currentTile.rent}$ de loyer à ${owner.username}! 🏠`);
      }
    }

    // Passer au joueur suivant
    room.currentPlayer = (room.currentPlayer + 1) % room.players.length;

    io.to(roomId).emit('gameState', room);
  });

  socket.on('buyProperty', roomId => {
    const room = rooms[roomId];
    if (!room) return;

    // Trouver le joueur dont c'était le tour juste AVANT le changement (celui qui vient de se déplacer)
    // Comme le compteur a déjà avancé dans rollDice, le joueur qui vient de jouer est (currentPlayer - 1)
    let lastPlayerIndex = room.currentPlayer - 1;
    if (lastPlayerIndex < 0) lastPlayerIndex = room.players.length - 1;

    const player = room.players[lastPlayerIndex];

    // Vérification de sécurité
    if (player.id !== socket.id) {
      socket.emit('log', "Tu ne peux acheter qu'immédiatement après ton lancer de dés !");
      return;
    }

    const tileIndex = player.position;
    const tile = boardProperties[tileIndex];

    // Vérifier si la propriété est achetable
    if (tile.type === 'special' || tile.type === 'tax') {
      socket.emit('log', "Cette case ne peut pas être achetée.");
      return;
    }

    // Vérifier si elle est déjà possédée
    if (room.owners[tileIndex]) {
      socket.emit('log', "Cette propriété a déjà un propriétaire.");
      return;
    }

    // Vérifier l'argent disponible
    if (player.money >= tile.price) {
      player.money -= tile.price;
      room.owners[tileIndex] = player.id; // Enregistrement du propriétaire

      io.to(roomId).emit('log', `🎉 ${player.username} a acheté ${tile.name} pour ${tile.price}$ !`);
      io.to(roomId).emit('gameState', room);
    } else {
      socket.emit('log', "Pas assez d'argent pour acheter cette propriété ! 🛑");
    }
  });

  // Gérer la déconnexion d'un joueur en cours de partie
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const username = room.players[playerIndex].username;
        room.players.splice(playerIndex, 1);
        
        // Nettoyer ses propriétés possédées
        for (let key in room.owners) {
          if (room.owners[key] === socket.id) {
            delete room.owners[key];
          }
        }

        // Ajuster l'index du tour actuel
        if (room.currentPlayer >= room.players.length) {
          room.currentPlayer = 0;
        }

        io.to(roomId).emit('log', `${username} a quitté la partie.`);
        io.to(roomId).emit('gameState', room);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
