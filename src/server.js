const socketio = require('socket.io');

let io;

// object to hold connected user data (name, id, etc)
const usersStatic = {};
// contains dynamic game data (position, angle, health, etc)
const usersDynamic = {};
// the user that currently is leading physics requests
let host;

// handles join requests
const onJoined = (sock) => {
  const socket = sock;
  // set to undefined to flush data
  socket.id = undefined;
  //! !!prevent multiple instances of the same name

  // stuff that happens when a user joins
  socket.on('join', (data) => {
    // enter the room
    socket.join('room1');

    // create objects to store the user variables
    let userObjectStatic;
    let userObjectDynamic;

    // start a conditional loop
    let flagID = true;
    while (flagID) {
      // pick a random number between 1 and 10,000 to serve as a unique id for the user
      const userID = Math.floor(Math.random() * 10000) + 1;
      // check whether that number is already in use as an id
      if (usersStatic[userID] === undefined) {
        // populate the userObject with values passed from the client
        userObjectStatic = {
          name: data.name,
          id: userID,
          joined: data.time,
          host: false,
        };
        userObjectDynamic = {
          position: data.position,
          angle: 0,
          charge: 0,
          health: 100,
          score: 0,
        };
        // save userObjects to arrays
        usersStatic[userID] = userObjectStatic;
        usersDynamic[userID] = userObjectDynamic;
        // set this socket's id property to the id so it can be properly deleted on disconnect
        socket.id = userID;
        // break the loop
        flagID = false;
      }
    }

    // determine whether the game already has a designated host
    if (host === undefined) {
      // if not, this newly created userObject gets to be the host
      userObjectStatic.host = true;
      host = userObjectStatic;
    }

    // notify the console that the user has joined
    console.log(`${usersStatic[socket.id].name} (${socket.id}) has joined`);

    // serve the userObject to the client
    socket.emit('serveInitialState', { static: usersStatic, dynamic: usersDynamic, id: socket.id });
    io.sockets.emit('serveNewUser', { id: socket.id, static: usersStatic[socket.id], dynamic: usersDynamic[socket.id]});
  });
};

// handles general requests
const onRequest = (sock) => {
  const socket = sock;
  // prints string sent from client
  socket.on('requestStatus', (data) => {
    console.log(data);
  });
  //updates the locally stored client data and serves the entire array back
  socket.on('requestUpdateClientData', (data) => {
    usersDynamic[socket.id] = data.clientData;
    //!!!will probably need to ensure that this emission syncs properly with new users joining, otherwise use a client based function that neatly integrates data
    io.sockets.emit('serveUpdateClientData', usersDynamic);
  });
};

// handles disconnect events
const onDisconnect = (sock) => {
  const socket = sock;
  // stuff that happens when a user disconnects
  socket.on('disconnect', () => {
    // ensure that the disconnector actually joined a room
    if (socket.id !== undefined) {
      // notify the console that the user is disconnecting
      console.log(`${usersStatic[socket.id].name} (${socket.id}) has disconnected`);

      // assign new host if disconnected user was hosting
      if (usersStatic[socket.id].host === true) {
        console.log(`${usersStatic[socket.id].name} (${socket.id}) was the active host; migration in progress`);

        // get user keys
        const keys = Object.keys(usersStatic);
        // if keys indicate more than a single user, make the first other user host
        if (keys.length > 1) {
          // ensure that the first index is not the disconnecting user and assign the new host
          if (keys[0] == socket.id) {
            host = usersStatic[keys[1]];
            host.host = true;
          } else {
            host = usersStatic[keys[0]];
            host.host = true;
          }
          //! !! what if the old and new host disconnect at the same time?
          // give the hosting to the first available user
          console.log(`hosting is being passed to ${host.name} (${host.id})`);
          //! !! same issue here with room specific emissions not working
          io.sockets.emit('serveAssignNewHost', { id: host.id });

          // console.log(io.sockets);
        } else { // otherwise there is no one left, so perform reset operation
          host = undefined;
          console.log('All clients have left the room');
        }
      }

      // nullify the users !!!from what I can undertstand, delete is bad but the internet says this is the optimal way to delete keys
      delete usersStatic[socket.id];
      delete usersDynamic[socket.id];

      // leave the room
      socket.leave('room1');
    }
  });
};

const server = (app) => {
  // pass http server into socketio
  io = socketio(app);

  io.sockets.on('connection', (socket) => {
    console.log('connecting');

    onJoined(socket);
    onRequest(socket);
    onDisconnect(socket);
  });

  console.log('Websocket server started');
};

module.exports = server;

