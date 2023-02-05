
const express = require('express');
const axios = require('axios');
const socket = require('socket.io');
const cors = require('cors');

const app = express();
const port = 8080;

const users = [];
app.use(cors());
// Set up socket.io
const io = socket(app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
}), {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Handle incoming connections
io.on('connection', (socket) => {
  socket.on('add user', (user) => {
    users.push({
      id: socket.id,
      name: user,
    });
    console.log(users);
    io.emit('update users', users);
  });

  socket.on('start game', (opponentId) => {
    io.sockets.connected[opponentId].emit('start game', {
      opponentId: socket.id,
      opponentName: users.find((user) => user.id === socket.id).name,
    });
  });

  socket.on('send move', (move) => {
    io.sockets.connected[move.opponentId].emit('receive move', move);
  });

  socket.on('disconnect', () => {
    users.splice(users.findIndex((user) => user.id === socket.id), 1);
    io.emit('update users', users);
  });
});
