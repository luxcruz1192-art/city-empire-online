const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/monopoly.html");
});

const rooms = {};

const colors = [
  "red","blue","green","yellow","purple",
  "orange","pink","cyan","lime","white"
];

// 40 cases
function getRoom(id){
  if(!rooms[id]){
    rooms[id] = {
      players: [],
      turn: 0,
      owner: Array(40).fill(null)
    };
  }
  return rooms[id];
}

io.on("connection", (socket) => {

  socket.on("joinRoom", ({username, roomId}) => {

    const room = getRoom(roomId);

    if(room.players.length >= 10) return;

    room.players.push({
      id: socket.id,
      name: username,
      pos: 0,
      money: 1500,
      jail: false,
      color: colors[room.players.length]
    });

    socket.join(roomId);

    io.to(roomId).emit("gameState", room);
    io.to(roomId).emit("log", username + " rejoint la partie");
  });

  socket.on("rollDice", (roomId) => {

    const room = getRoom(roomId);
    const p = room.players[room.turn];
    if(!p) return;

    const d1 = Math.floor(Math.random()*6)+1;
    const d2 = Math.floor(Math.random()*6)+1;
    const total = d1 + d2;

    io.to(roomId).emit("log", `${p.name} fait ${total}`);

    if(p.jail){
      p.jail = false;
      io.to(roomId).emit("log", `${p.name} sort de prison`);
    } else {

      p.pos += total;

      if(p.pos >= 40){
        p.pos -= 40;
        p.money += 200;
        io.to(roomId).emit("log", `${p.name} reçoit 200€ (départ)`);
      }

      // PRISON CASE
      if(p.pos === 30){
        p.jail = true;
        p.pos = 10;
        io.to(roomId).emit("log", `${p.name} va en prison`);
      }

      // CASE PROPRIÉTÉ
      const owner = room.owner[p.pos];

      if(owner && owner !== p.id){
        const rent = 100;
        const o = room.players.find(x => x.id === owner);
        if(o){
          p.money -= rent;
          o.money += rent;
          io.to(roomId).emit("log", `${p.name} paye ${rent}€ à ${o.name}`);
        }
      }
    }

    room.turn++;
    if(room.turn >= room.players.length) room.turn = 0;

    io.to(roomId).emit("gameState", room);
  });

  socket.on("buy", (roomId) => {

    const room = getRoom(roomId);
    const p = room.players[room.turn];

    if(!p) return;

    const pos = p.pos;

    if(!room.owner[pos]){
      const price = 200;

      if(p.money >= price){
        p.money -= price;
        room.owner[pos] = p.id;
        io.to(roomId).emit("log", `${p.name} achète la case ${pos}`);
      }
    }

    io.to(roomId).emit("gameState", room);
  });

});

server.listen(process.env.PORT || 3000, () => {
  console.log("Monopoly V4 lancé");
});
