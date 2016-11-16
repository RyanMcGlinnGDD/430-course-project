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
let gameState = 0;

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
      //pick a random number 1-10,000
      userId = `user${Math.floor(Math.random() * 10000) + 1}`;
      //if the index is nonexistant, break the loop
      if (players[userId] !== null) {
        flag = false;
      }
    }
    // give a value denoting participation status
    players[userId] = 0;

    socket.emit('serveUserId', userId);
    socket.broadcast.to('room1').emit('serveAnotherJoined', userId);
    // save userId to socket so disconnect can be handled
    socket.userId = userId;
  });
};

// handles requests
const onTargetRequest = (sock) => {
  const socket = sock;
  socket.on('requestDiagnostic', (data) => {
    console.log(`${data}`);
  });
};


// disconnect logic, removes users from room1
const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    console.log(`${socket.userId} disconnecting from server...`);

    socket.broadcast.to('room1').emit('serveAnotherLeaving', socket.userId);
    
    delete players[socket.userId];

    // leave the room
    socket.leave('room1');
  });
};


// attaches events
io.sockets.on('connection', (socket) => {
  console.log('connecting');

  onJoined(socket);
  onTargetRequest(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
