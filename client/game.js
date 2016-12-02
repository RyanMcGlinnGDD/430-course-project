"use strict";
let socket;

//self variables
let id;
let dataStatic;
let dataDynamic;

//input variables
let keyW;
let keyA;
let keyS;
let keyD;

//graphics variables
let canvas;
let ctx;

const init = () => {
  //initialize values
  id = undefined;
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  
  //initialize sockets
  setupSocket();
  
  //initialize input
  setupInput();
  
  //connect join event to the signin button
  document.getElementById("nameSubmit").addEventListener('click', () => {
    if(document.getElementById("name").value.length > 2){
      //hide element and fire signin event
      document.getElementById("signin").style.display = "none";
      //!!!position will ideally eventually be random
      socket.emit('join', { time: new Date().getTime(), name: document.getElementById("name").value.toUpperCase(), position: {x: 0, y: 0} });
    }
  });
  
  loop();
}

//initializes and sets up socket.on calls
const setupSocket = () => {
  socket = io.connect();
  
  //receives an ID
  socket.on('serveInitialState', (data) => {
    id = data.id;
    dataStatic = data.static;
    dataDynamic = data.dynamic;
    console.log(`this client is ${dataStatic[id].name} ${id}`);
  });
  socket.on('serveAssignNewHost', (data) => {
    console.log(`new host assignment in progress`);
    if(data.id === id){
      dataStatic.host = true;
      console.log(`this client is the new host`);
    }
  });
  //debugging handler, prints a string sent from server to the console
  socket.on('serveStatus', (data) => {
    console.log(data);
  });
  socket.on('serveUpdateClientData', (data) => {
    dataDynamic = data;
  });
  socket.on('serveNewUser', (data) => {
    if(data.id != id){
      dataStatic[data.id] = data.static;
      dataDynamic[data.id] = data.dynamic;
      console.log(`${dataStatic[data.id].name} has joined`);
    }
    
  });
}

const setupInput = () => {
  //set initial values
  keyW = false;
  keyA = false;
  keyS = false;
  keyD = false;
  
  document.addEventListener('keydown', (e) => {
    if(e.keyCode === 87){ //w
      keyW = true;
    }
    if(e.keyCode === 65){ //a
      keyA = true;
    }
    if(e.keyCode === 83){ //s
      keyS = true;
    }
    if(e.keyCode === 68){ //d
      keyD = true;
    }
  });
  document.addEventListener('keyup', (e) => {
    if(e.keyCode === 87){ //w
      keyW = false;
    }
    if(e.keyCode === 65){ //a
      keyA = false;
    }
    if(e.keyCode === 83){ //s
      keyS = false;
    }
    if(e.keyCode === 68){ //d
      keyD = false;
    }
  });
};

const loop = () => {
  window.requestAnimationFrame(loop.bind(this));
  
  if(id !== undefined){
    //if the client is the host
    if(dataStatic[id].host === true){
      //do host stuff
      //socket.emit('requestCollisions', { time: new Date().getTime() });
    }
    
    //make changes based on input
    handleInput();
    
    updateServer();
    
    //draw stuff
    draw();
  }
  
};

const handleInput = () => {
  //!!!figure out a consistent means of speed/movement/velocity/whatever
  if(keyW === true){
    dataDynamic[id].position.y -= 3;
  }
  if(keyA === true){
    dataDynamic[id].position.x -= 3;
  }
  if(keyS === true){
    dataDynamic[id].position.y += 3;
  }
  if(keyD === true){
    dataDynamic[id].position.x += 3;
  }
};

const draw = () => {
  //scoreboard
  ctx.save();
  ctx.fillStyle = "gray";
  ctx.fillRect(0, 0, 320, 720);
  ctx.restore();
  
  //field
  ctx.save();
  ctx.fillStyle = "lightgray";
  ctx.fillRect(320, 0, 960, 720);
  ctx.restore();
  
  //lines
  //line1
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(800, 0);
  ctx.lineTo(800, 720);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "blue";
  ctx.stroke();
  ctx.restore();
  //line2
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(320, 360);
  ctx.lineTo(1280, 360);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "blue";
  ctx.stroke();
  ctx.restore();
  
  //ships  
  //iterate through every dataStatic
  const keys = Object.keys(dataStatic);
  // if keys indicate more than a single user, make the first other user host
  for (let i = 0; i < keys.length; i++) {
    //!!!this probably needs to be === but this will work for now
    //if id matches key draw self
    if(keys[i] == id){
      ctx.save();
      ctx.beginPath();
      ctx.arc(800,360, 10, 0, 2 * Math.PI, false);
      ctx.fillStyle = "green";
      ctx.fill();
      ctx.restore();
    } else{ //else draw others in reference to self position
      ctx.save();
      ctx.beginPath();
      ctx.arc((800 + dataDynamic[keys[i]].position.x - dataDynamic[id].position.x), (360 + dataDynamic[keys[i]].position.y - dataDynamic[id].position.y), 10, 0, 2 * Math.PI, false);
      ctx.font = "20px Arial";
      ctx.fillText(`${dataStatic[keys[i]].name}` , (800 + dataDynamic[keys[i]].position.x - dataDynamic[id].position.x), (375 + dataDynamic[keys[i]].position.y - dataDynamic[id].position.y));
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.restore();
    }
  }
    
  //diagnostics hud
  ctx.save();
  ctx.font = "30px Arial";
  ctx.fillText(`x: ${dataDynamic[id].position.x}, y: ${dataDynamic[id].position.y}`,10,40);
  ctx.restore();
  
};

const updateServer = () => {
  //emit this client's dataDynamic to server
  socket.emit('requestUpdateClientData', { time: new Date().getTime(), clientData: dataDynamic[id] });
};

//have jquery load when ready
$(document).ready(function() {
    init();
});