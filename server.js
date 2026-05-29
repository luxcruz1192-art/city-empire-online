const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Sert les fichiers statiques (comme monopoly.html) situés dans le même dossier
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/monopoly.html');
});

// Stockage global des parties en cours
const rooms = {};

// Liste de couleurs distinctes attribuées aux joueurs selon leur ordre d'arrivée
const colors = [
  '#ef4444', '#3b82f6', '#10b981', '#eab308', '#a855f7', 
  '#f97316', '#ec4899', '#06b6d4', '#84cc16', '#64748b'
];

// Configuration officielle des 40 cases du plateau
const boardProperties = [
  { name: "DÉPART", price: 0, rent: 0, type: "special" },
  { name: "Boulevard de Belleville", price: 60, rent: 2, type: "prop" },
  { name: "Caisse de Communauté", price: 0, rent: 0, type: "special" },
  { name: "Rue de Lecourbe", price: 60, rent: 4, type: "prop" },
  { name: "Impôt sur le Revenu", price: 0, rent: 200, type: "tax" },
  { name: "Gare Montparnasse", price: 200, rent: 25, type: "station" },
  { name: "Rue de Vaugirard", price: 100, rent: 6, type: "prop" },
  { name: "Chance", price: 0, rent: 0, type: "chance" },
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
  { name: "Chance", price: 0, rent: 0, type: "chance" },
  { name: "Avenue de l'Opéra", price: 220, rent: 18, type: "prop" },
  { name: "Rue de la Paix", price: 240, rent: 20, type: "prop" },
  { name: "Gare du Nord", price: 200, rent: 25, type: "station" },
  { name: "Faubourg Saint-Honoré", price: 260, rent: 22, type: "prop" },
  { name: "Place de la Bourse", price: 260, rent: 22, type: "prop" },
  { name: "Compagnie des Eaux", price: 150, rent: 10, type: "service" },
  { name: "Rue La Fayette", price: 280, rent: 24, type: "prop" },
  { name: "ALLEZ EN PRISON", price: 0, rent: 0, type: "go-to-jail" },
  { name: "Avenue de Breteuil", price: 300, rent: 26, type: "prop" },
  { name: "Avenue Foch", price: 300, rent: 26, type: "prop" },
  { name: "Caisse de Communauté", price: 0, rent: 0, type: "special" },
  { name: "Capucines", price: 320, rent: 28, type: "prop" },
  { name: "Gare Saint-Lazare", price: 200, rent: 25, type: "station" },
  { name: "Chance", price: 0, rent: 0, type: "chance" },
  { name: "Champs-Élysées", price: 350, rent: 35, type: "prop" },
  { name: "Taxe de Luxe", price: 0, rent: 100, type: "tax" },
  { name: "Rue de la Paix", price: 400, rent: 50, type: "prop" }
];

// Cartes Chance avec effets réels scriptés
const chanceCards = [
  { text: "Erreur de la banque en votre faveur ! Recevez 150$ 💰", action: "money", value: 150 },
  { text: "Amende pour excès de vitesse. Payez 50$ 💸", action: "money", value: -50 },
  { text: "Avancez jusqu'à la case DÉPART (Recevez 200$) 🏃‍♂️", action: "move", value: 0 },
  { text: "Mauvaise conduite ! Allez directement en PRISON sans passer par le départ 🚔", action: "jail", value: 10 }
];

io.on('connection', socket => {
  
  // --- REJOINDRE UNE SALLE ---
  socket.on('joinRoom', data => {
    const { username, roomId } = data;
    if (!username || !roomId) return;

    socket.join(roomId);
    socket.roomId = roomId;

    // Initialisation du salon si inexistant
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        currentPlayer: 0,
        owners: {},
        gameStarted: false,
        creatorId: socket.id // Le premier joueur devient le gérant du salon
      };
    }

    const room = rooms[roomId];
    if (room.gameStarted || room.players.length >= 10) return;

    // Création du profil joueur
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

  // --- LANCEMENT DE LA PARTIE ---
  socket.on('startGame', roomId => {
    const room = rooms[roomId];
    if (!room || room.creatorId !== socket.id || room.players.length < 2) return;

    room.gameStarted = true;
    io.to(roomId).emit('gameState', room);
    io.to(roomId).emit('log', "🎮 La partie commence ! Que le meilleur gagne !");
  });

  // --- LOGIQUE DU LANCER DE DÉS ET DU TOUR DE JEU ---
  socket.on('rollDice', roomId => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    const activePlayer = room.players[room.currentPlayer];
    if (activePlayer.id !== socket.id) return;

    // Gestion de l'état de prison
    if (activePlayer.inJail) {
      activePlayer.inJail = false; 
      io.to(roomId).emit('log', `🔒 ${activePlayer.username} purge sa peine en Prison. Passage de tour forcé.`);
      
      room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
      io.to(roomId).emit('gameState', room);
      return;
    }

    // Calcul des dés
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const totalDice = d1 + d2;

    // Envoi immédiat des dés à tout le monde pour l'animation
    io.to(roomId).emit('diceRolled', { d1, d2 });

    // Déplacement
    activePlayer.position += totalDice;

    // Passage par la case départ
    if (activePlayer.position >= 40) {
      activePlayer.position -= 40;
      activePlayer.money += 200;
      io.to(roomId).emit('log', `${activePlayer.username} franchit la ligne de DÉPART et récolte 200$ 💰`);
    }

    let currentTile = boardProperties[activePlayer.position];
    io.to(roomId).emit('log', `${activePlayer.username} a fait ${totalDice} et s'arrête sur : ${currentTile.name}`);

    // ÉVALUATION DE LA CASE DE DESTINATION
    
    // 1. Case Allez en Prison
    if (currentTile.type === 'go-to-jail') {
      activePlayer.position = 10; 
      activePlayer.inJail = true;
      io.to(roomId).emit('log', `🚨 ${activePlayer.username} est envoyé directement au poste de Police ! (En prison)`);
    } 
    // 2. Case de Taxe
    else if (currentTile.type === 'tax') {
      activePlayer.money -= currentTile.rent;
      io.to(roomId).emit('log', `${activePlayer.username} s'acquitte de ${currentTile.rent}$ de taxes professionnelles. 💸`);
    } 
    // 3. Case Chance
    else if (currentTile.type === 'chance') {
      const randomCard = chanceCards[Math.floor(Math.random() * chanceCards.length)];
      io.to(roomId).emit('log', `❓ CHANCE [${activePlayer.username}] : ${randomCard.text}`);

      if (randomCard.action === 'money') {
        activePlayer.money += randomCard.value;
      } else if (randomCard.action === 'move') {
        activePlayer.position = randomCard.value;
        activePlayer.money += 200; 
      } else if (randomCard.action === 'jail') {
        activePlayer.position = 10;
        activePlayer.inJail = true;
      }
    } 
    // 4. Loyer automatique
    else if (room.owners[activePlayer.position] && room.owners[activePlayer.position] !== activePlayer.id) {
      const owner = room.players.find(p => p.id === room.owners[activePlayer.position]);
      if (owner) {
        activePlayer.money -= currentTile.rent;
        owner.money += currentTile.rent;
        io.to(roomId).emit('log', `🏠 LOYER : ${activePlayer.username} verse un loyer de ${currentTile.rent}$ à ${owner.username}.`);
      }
    }

    // Passage au joueur suivant
    room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
    io.to(roomId).emit('gameState', room);
  });

  // --- LOGIQUE D'ACHAT DE PROPRIÉTÉ ---
  socket.on('buyProperty', roomId => {
    const room = rooms[roomId];
    if (!room || !room.gameStarted) return;

    // Détermination de l'index du joueur qui vient de finir son déplacement physique
    let lastPlayerIndex = room.currentPlayer - 1;
    if (lastPlayerIndex < 0) lastPlayerIndex = room.players.length - 1;
    const player = room.players[lastPlayerIndex];

    if (player.id !== socket.id) return;

    const tileIndex = player.position;
    const tile = boardProperties[tileIndex];

    // Vérifications de validité de la propriété
    if (tile.type === 'special' || tile.type === 'tax' || tile.type === 'chance' || tile.type === 'go-to-jail' || room.owners[tileIndex]) return;

    if (player.money >= tile.price) {
      player.money -= tile.price;
      room.owners[tileIndex] = player.id;
      io.to(roomId).emit('log', `🎉 Hypothèque validée : ${player.username} acquiert ${tile.name} !`);
      io.to(roomId).emit('gameState', room);
    }
  });

  // --- GESTION DES DÉCONNEXIONS ---
  socket.on('disconnect', () => {
    const roomId = socket.roomId;
    if (roomId && rooms[roomId]) {
      const room = rooms[roomId];
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      
      if (playerIndex !== -1) {
        const username = room.players[playerIndex].username;
        room.players.splice(playerIndex, 1);
        
        // Dissolution de ses anciens titres de propriétés
        for (let key in room.owners) {
          if (room.owners[key] === socket.id) delete room.owners[key];
        }
        
        // Transmission des droits de créateur si l'hôte s'en va
        if (room.creatorId === socket.id && room.players.length > 0) {
          room.creatorId = room.players[0].id;
        }

        if (room.currentPlayer >= room.players.length) room.currentPlayer = 0;

        io.to(roomId).emit('log', `${username} a déserté la partie. 👋`);
        io.to(roomId).emit('gameState', room);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur actif sur http://localhost:${PORT}`));
