"use strict";

let socket;
let painter;

//self variables
let id;
let dataStatic;
let dataDynamic;
let lastUpdate;
let defeatedBy;
let scores;
let highScore;

//input variables
let keyW;
let keyA;
let keyS;
let keyD;
let mouseDown;
let mousePosition;

//graphics variables
let canvas;
let ctx;

const init = () => {
  //setup imports
  painter = new window.drawlib();
  
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
      socket.emit('join', { time: new Date().getTime(), name: `${document.getElementById("name").value.toUpperCase()}`, position: {x: rander(-800, 800), y: rander(-800, 800)} });
    }
  });
  
  loop();
};

//initializes and sets up socket.on calls
const setupSocket = () => {
  socket = io.connect();
  
  // receives an ID
  // data = {static: static user array, dynamic: dynamic user array, id: user id, time: time of request}
  socket.on('serveInitialState', (data) => {
    id = data.id;
    dataStatic = data.static;
    dataDynamic = data.dynamic;
    lastUpdate = data.time;
    scores = data.scores;
    highScore = data.highScore;
    console.log(`this client is ${dataStatic[id].name} ${id}`);
  });
  // sets one of the users to be the new host
  // data = { id: user id of new host }
  socket.on('serveAssignNewHost', (data) => {
    console.log(`new host assignment in progress`);
    if(data.id === id){
      dataStatic.host = true;
      console.log(`this client is the new host`);
    }
  });
  // debugging handler, prints a string sent from server to the console
  // data = { status: status string }
  socket.on('serveStatus', (data) => {
    console.log(data.status);
  });
  //receives data from the server every tick
  // data = { dynamic: dynamic user array, time: time of request }
  socket.on('serveUpdateClientData', (data) => {
    //ensures that the update is fresh and that array length matches
    if(data.time >= lastUpdate && data.dynamic.length === dataDynamic.length){
      // store self, apply the new data, and overwrite client data with self to keep data fresh
      let self = dataDynamic[id];
      lastUpdate = data.time;
      dataDynamic = data.dynamic;
      dataDynamic[id] = self;
    } else if(data.time >= lastUpdate && data.dynamic.length < dataDynamic.length){
      //same operation as previous loop
      let self = dataDynamic[id];
      lastUpdate = data.time;
      dataDynamic = data.dynamic;
      dataDynamic[id] = self;
      // this time remove the dataStatic object that is no longer needed, parse and look for odd one out
      // loop through every static data key
      const keys = Object.keys(dataStatic);
      for (let i = 0; i < keys.length; i++) {
        //if id matches key draw self
        if(dataDynamic[keys[i]] === undefined){
          //this is the one to delete
          console();
          delete dataStatic[keys[i]];
          break;
        }
      }
    }
    
    //increment bullet data as necessary
    if(dataDynamic[id].charge > 100){
      //reset the charge
      dataDynamic[id].charge = 0;
    } else if(dataDynamic[id].charge > 0){
      dataDynamic[id].charge += .75;
      // compound position with self and angle values
      dataDynamic[id].bulletPos = { x: dataDynamic[id].bulletPos.x + 3*dataDynamic[id].bulletAng.x, y: dataDynamic[id].bulletPos.y + 3*dataDynamic[id].bulletAng.y,};
    }
    
  });
  // when a new user joins, sets the new data arrays
  // data = { id: new user's id, static: new user static data, dynamic: new user dynamic data, time: time of join request }
  socket.on('serveNewUser', (data) => {
    if(data.id !== id){
      dataStatic[data.id] = data.static;
      dataDynamic[data.id] = data.dynamic;
      lastUpdate = data.time;
      console.log(`${dataStatic[data.id].name} has joined`);
      scores = data.scores;
      console.dir(data.scores);
    }
    
  });
  // notification that specified user is dead
  socket.on('deleteUser', (data) => {
    
  });
  socket.on('serveUpdateScore', (data) => {
    highScore = data.highScore;
    scores = data.scores;
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
  
  mousePosition = { x: 1, y: 0 };
  
  //mouseinput handling via canvas, all relative to center of play area
  canvas.addEventListener('mousemove', (e) => {
    var bounds = canvas.getBoundingClientRect();
    mousePosition = { x: e.clientX - bounds.left - 800, y: e.clientY - bounds.top - 360 };
  });
  
  mouseDown = false;
  canvas.addEventListener("mousedown", (e) => {
    mouseDown = true;
  });
  canvas.addEventListener("mouseup", (e) => {
    mouseDown = false;
  });
};

//tied to animation frame
const loop = () => {
  window.requestAnimationFrame(loop.bind(this));
  
  if(id !== undefined){
    if(dataDynamic[id].alive){
      handleCollisions();
    
      //make changes based on input
      handleInput();
    }
    updateServer();
    //draw stuff
    draw();
    
    //things to draw when not alive
    if(!dataDynamic[id].alive){
      ctx.save();
      ctx.font = "30px Arial";
      ctx.fillText(`You were defeated` , 400, 400);
      ctx.fillText(`You scored ${scores[id]} points` , 400, 440);
      ctx.fillText(`Press W to respawn` , 400, 480);
      
      //reset and return to life
      if(keyW){
        dataDynamic[id].alive = true;
        //new location
        dataDynamic[id].position = {x: rander(-800, 800), y: rander(-800, 800)};
        // push score update
        socket.emit('requestUpdateScore', { id: id, score: 0, highScore: highScore});
        
      }
      ctx.restore();
    }
  }
  
};

const handleCollisions = () => {
  // iterate through each bullet
  let keys = Object.keys(dataStatic);
  for (let i = 0; i < keys.length; i++) {
    if(dataDynamic[keys[i]] !== undefined){
      //if charge not equal to zero
      if(dataDynamic[keys[i]].charge > 0){
        let a = dataDynamic[keys[i]].bulletPos.x - dataDynamic[id].position.x;
        let b = dataDynamic[keys[i]].bulletPos.y - dataDynamic[id].position.y;
        //match up against self
        if(keys[i] != id && (a*a + b*b) < (dataDynamic[keys[i]].charge + 12)*(dataDynamic[keys[i]].charge + 12)){
          //change alive status
          dataDynamic[id].alive = false;
          //highScore calculations
          if((scores[keys[i]] + 1) > highScore){
            highScore = (scores[keys[i]] + 1);
          }
          
          // request score update
          socket.emit('requestUpdateScore', { id: keys[i], score: (scores[keys[i]] + 1), highScore: highScore});
        }
      }
    }
  }
};

let bound = 1000;
const handleInput = () => {
  //!!!figure out a consistent means of speed/movement/velocity/whatever
  if(keyW === true){
    dataDynamic[id].position.y -= 3;
    if(dataDynamic[id].position.y < -bound){
      dataDynamic[id].position.y = -bound;
    }
  }
  if(keyA === true){
    dataDynamic[id].position.x -= 3;
    if(dataDynamic[id].position.x < -bound){
      dataDynamic[id].position.x = -bound;
    }
  }
  if(keyS === true){
    dataDynamic[id].position.y += 3;
    if(dataDynamic[id].position.y > bound){
      dataDynamic[id].position.y = bound;
    }
  }
  if(keyD === true){
    dataDynamic[id].position.x += 3;
    if(dataDynamic[id].position.x > bound){
      dataDynamic[id].position.x = bound;
    }
  }
  
  // mouse position trigonometry to calculate angle
  // if at 90 or 270
  if(mousePosition.x === '0'){
    if(mousePosition.y >= 0){
      dataDynamic[id].angle = Math.PI/2;
    } else{
      dataDynamic[id].angle = 3 * Math.PI/2;
    }
  } else if(mousePosition.x < 0){
    dataDynamic[id].angle = Math.atan(mousePosition.y / mousePosition.x) + Math.PI;
  } else{
    dataDynamic[id].angle = Math.atan(mousePosition.y / mousePosition.x);
  }
  
  //handle bullet
  if(mouseDown){
    if(dataDynamic[id].charge === 0){
      //set bullet variables
      dataDynamic[id].bulletPos = { x: dataDynamic[id].position.x, y: dataDynamic[id].position.y, };
      dataDynamic[id].bulletAng = { x: Math.cos(dataDynamic[id].angle), y: Math.sin(dataDynamic[id].angle), };
      dataDynamic[id].charge = .001;
    }
  }
};

const draw = () => {
  //field
  painter.rect(ctx, 320, 0, 960, 720, "lightgray");
  
  //grid
  for(let i = 0; i < 10; i++){
    let referencePoint = -((dataDynamic[id].position.x % 100 + 100) % 100) + (i * 100) + 420;
    painter.line(ctx, referencePoint, 0, referencePoint, 720, 2, "#BFBFBF");
  }
  for(let i = 0; i < 8; i++){
    let referencePoint = -((dataDynamic[id].position.y % 100 + 100) % 100) + (i * 100) + 100;
    painter.line(ctx, 320, referencePoint, 1280, referencePoint, 2, "#BFBFBF");
  }
  
  //bounds
  //left
  if(dataDynamic[id].position.x - 480 < (-bound + 5)){
    let referencePoint = 800 - bound - dataDynamic[id].position.x - 10;
    painter.line(ctx, referencePoint, 0, referencePoint, 720, 20, "Chartreuse");
  }
  //right
  if(dataDynamic[id].position.x + 480 > (bound - 5)){
    let referencePoint = 800 + bound - dataDynamic[id].position.x + 10;
    painter.line(ctx, referencePoint, 0, referencePoint, 720, 20, "Chartreuse");
  }
  //top
  if(dataDynamic[id].position.y - 360 < (-bound + 5)){
    let referencePoint = 360 - bound - dataDynamic[id].position.y - 10;
    painter.line(ctx, 320, referencePoint, 1280, referencePoint, 20, "Chartreuse");
  }
  //bottom
  if(dataDynamic[id].position.y + 360 > (bound - 5)){
    let referencePoint = 360 + bound - dataDynamic[id].position.y + 10;
    painter.line(ctx, 320, referencePoint, 1280, referencePoint, 20, "Chartreuse");
  }
  
  //ships  
  //iterate through every dataStatic
  let keys = Object.keys(dataStatic);
  // iterate through each
  for (let i = 0; i < keys.length; i++) {
    //if id matches key draw self
    if(keys[i] === `${id}`){
      if(dataDynamic[id].alive){
        painter.ship(ctx, 800, 360, dataDynamic[id].angle, "blue");
      } else{
        painter.ship(ctx, 800, 360, dataDynamic[id].angle, "#BFBFBF");
      }
    } else{ //else draw others in reference to self position
      if(dataDynamic[keys[i]] !== undefined){
        ctx.save();
        if(dataDynamic[keys[i]].alive){
          painter.ship(ctx, (800 + dataDynamic[keys[i]].position.x - dataDynamic[id].position.x), (360 + dataDynamic[keys[i]].position.y - dataDynamic[id].position.y), dataDynamic[keys[i]].angle, "red");
          ctx.font = "20px Arial";
          ctx.fillText(`${dataStatic[keys[i]].name}` , (800 + dataDynamic[keys[i]].position.x - dataDynamic[id].position.x) - ctx.measureText(dataStatic[keys[i]].name).width/2, (375 + dataDynamic[keys[i]].position.y - dataDynamic[id].position.y) + 25);
          ctx.restore();
        } else{
          painter.ship(ctx, (800 + dataDynamic[keys[i]].position.x - dataDynamic[id].position.x), (360 + dataDynamic[keys[i]].position.y - dataDynamic[id].position.y), dataDynamic[keys[i]].angle, "#BFBFBF");
        }
      }
    }
  }
  
  //bullets
  for (let i = 0; i < keys.length; i++) {
    //if id matches key draw self
    if(keys[i] === `${id}`){
      if(dataDynamic[id].charge > 0){
        painter.circle(ctx, 800 + dataDynamic[id].bulletPos.x - dataDynamic[id].position.x, 360 + dataDynamic[id].bulletPos.y - dataDynamic[id].position.y, dataDynamic[id].charge, "blue", true, 0);
      }
    } else { //else draw others in reference to self position
      if(dataDynamic[keys[i]] !== undefined){
        if(dataDynamic[keys[i]].charge > 0){
          painter.circle(ctx, 800 + dataDynamic[keys[i]].bulletPos.x - dataDynamic[id].position.x, 360 + dataDynamic[keys[i]].bulletPos.y - dataDynamic[id].position.y, dataDynamic[keys[i]].charge, "red", true, 0);
        }
      }
    }
  }
  
  
  //scoreboard
  painter.rect(ctx, 0, 0, 320, 720, "gray");
  ctx.save();
  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  if(dataDynamic[id] !== undefined){
    ctx.fillText(`${dataStatic[id].name}`, 10, 40);
    ctx.fillText(`Score: ${scores[id]}`, 10, 80);
    ctx.fillText(`High Score: ${highScore}`, 10, 120);
  }
  ctx.restore();
  
  //minimap
  painter.rect(ctx, 10, 410, 300, 300, "lightgray");
  for (let i = 0; i < keys.length; i++) {
    //if id matches key draw self
    if(keys[i] === `${id}`){
      if(dataDynamic[keys[i]].alive){
          painter.circle(ctx, 160 + mapValue(dataDynamic[keys[i]].position.x, -1000, 1000, -145, 145), 560 + mapValue(dataDynamic[keys[i]].position.y, -1000, 1000, -145, 145), 5, "blue", true, 0);
      }
    } else{ //else draw others in reference to self position
      if(dataDynamic[keys[i]] !== undefined){
        if(dataDynamic[keys[i]].alive){
          painter.circle(ctx, 160 + mapValue(dataDynamic[keys[i]].position.x, -1000, 1000, -145, 145), 560 + mapValue(dataDynamic[keys[i]].position.y, -1000, 1000, -145, 145), 5, "red", true, 0);
        }
      }
    }
  }
};

const updateServer = () => {
  //emit this client's dataDynamic to server
  socket.emit('requestUpdateClientData', { time: new Date().getTime(), clientData: dataDynamic[id] });
};

//have jquery load when ready
$(document).ready(function() {
    init();
});

//entry range, output range
const mapValue = (value, min1, max1, min2, max2) => {
    return min2 + (max2 - min2) * ((value - min1) / (max1 - min1));
};

const rander = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};