"use strict";


window.drawlib = () => {
};

window.drawlib.prototype.clear = (ctx, x, y, w, h) => {
    ctx.clearRect(x, y, w, h);
};

window.drawlib.prototype.rect = (ctx, x, y, w, h, col) => {
    ctx.save();
    ctx.fillStyle = col;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
};

window.drawlib.prototype.line = (ctx, x1, y1, x2, y2, thickness, color) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
};

window.drawlib.prototype.circle = (ctx, x, y, radius, color, filled, lineWidth) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x,y, radius, 0, 2 * Math.PI, false);
    if(filled){
        ctx.fillStyle = color;
        ctx.fill(); 
    } else{
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    ctx.restore();
};

//draws a ship pointing to the right (zero degrees)
window.drawlib.prototype.ship = (ctx, x, y, angle, color) => {
  ctx.save();
  
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.moveTo(20, 0);
  ctx.lineTo(-15, -15);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-15, 15);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  
  //rotate
  //translate
  
  ctx.restore();
};