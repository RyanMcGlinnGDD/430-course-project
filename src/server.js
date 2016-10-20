const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

// determine active port
const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read client html into memory
const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`listening on 127.0.0.1: ${port}`);

// pass http server into socketio
const io = socketio(app);

const players = {};

// join logic, adds users to room1
const onJoined = (sock) => {
  const socket = sock;

  // catches join requests that fire when users initialize
  socket.on('join', () => {
    socket.join('room1');

    // assign a player ID
    let userId;
    let flag = true;
    while (flag) {
      userId = `user${Math.floor(Math.random() * 10000) + 1}`;
      if (players[userId] !== null) {
        flag = false;
      }
    }
    // give a value denoting participation status
    players[userId] = { };

    socket.emit('serveUserId', userId);
    // save userId to socket so disconnect can be handled
    socket.userId = userId;
  });
};

// disconnect logic, removes users from room1
const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    console.log(`${socket.userId} disconnecting from server...`);

    delete players[socket.userId];

    // leave the room
    socket.leave('room1');
  });
};


// attaches events
io.sockets.on('connection', (socket) => {
  console.log('connecting');

  onJoined(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
