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

const colors = [
  'red',
  'blue',
  'green',
  'yellow',
  'purple',
  'orange',
  'pink',
  'cyan',
  'lime',
  'white'
];

io.on('connection', socket => {

  console.log('Joueur connecté');

  socket.on('joinRoom', data => {

    const { username, roomId } = data;

    socket.join(roomId);

    if(!rooms[roomId]) {

      rooms[roomId] = {
        players: [],
        currentPlayer: 0
      };
    }

    const room = rooms[roomId];

    if(room.players.length >= 10) {
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

    io.to(roomId).emit(
      'log',
      username + ' a rejoint la partie'
    );
  });

  socket.on('rollDice', roomId => {

    const room = rooms[roomId];

    if(!room) return;

    const player = room.players[room.currentPlayer];

    const dice =
      Math.floor(Math.random() * 6) + 1 +
      Math.floor(Math.random() * 6) + 1;

    player.position += dice;

    if(player.position >= 40) {

      player.position -= 40;
      player.money += 200;
    }

    io.to(roomId).emit(
      'log',
      player.username + ' a fait ' + dice
    );

    room.currentPlayer++;

    if(room.currentPlayer >= room.players.length) {
      room.currentPlayer = 0;
    }

    io.to(roomId).emit('gameState', room);
  });

  socket.on('buyProperty', roomId => {

    io.to(roomId).emit(
      'log',
      'Achat de propriété'
    );
  });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('Serveur lancé');
});