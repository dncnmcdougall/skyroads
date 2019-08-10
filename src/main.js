/* eslint-env browser*/
/* global Vector, Blob*/

var maxPos = Vector.toVec( 500, 500);

var canvas = document.getElementById('canvas');
canvas.width = maxPos.x;
canvas.height = maxPos.y;
var ctx = canvas.getContext('2d');

window.onkeydown = (event) => {
    // console.log("event:", event.code)
    switch ( event.code ) {
        case "ArrowRight":
            shipState = ShipModel.reduce("Ship.MoveRight", shipState);
            break;
        case "ArrowLeft":
            shipState = ShipModel.reduce("Ship.MoveLeft", shipState);
            break;
        case "ArrowUp":
        case "Space":
            shipState = ShipModel.reduce("Ship.Jump", shipState, intervalCount);
            break;
    }
};

var interval = 50;
var intervalCount = 0;

var shipState = ShipModel.createEmpty();
var platformState = PlatformModel.createEmpty();

platformState = PlatformModel.reduce('PlatformModel.InitialiseRandom', platformState, 100);

console.log(platformState);

const w = 120;
const h = w*2;
const dH = w/3;

let road = new Road(maxPos.x, 10, maxPos.y, w, h);

let cX = maxPos.x/2;

function drawLine(ctx, x1, y1, x2, y2) {
    let p1 = road.transformPoint(Vector.toVec(x1,y1), cX);
    let p2 = road.transformPoint(Vector.toVec(x2,y2), cX);
    let l = Line( p1, p2, 1, '#000');
    l.draw(ctx);
};
var bottomLine = dH;

var timer = setInterval( () => {
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0,0, maxPos.x, maxPos.y);

    shipState = ShipModel.reduce("Ship.LandIfNessesary", shipState, intervalCount);
    ShipModel.request("Ship.Draw", shipState, ctx, maxPos, intervalCount);

    drawLine(ctx,     0,0,     0,h);
    drawLine(ctx,   w/3,0,   w/3,h);
    drawLine(ctx, 2*w/3,0, 2*w/3,h);
    drawLine(ctx,     w,0,     w,h);

    for ( let line = bottomLine; line < h; line += dH ) {
        drawLine(ctx, 0, line, w, line);
    }
    bottomLine-=2;
    if ( bottomLine <= 0 ) {
        bottomLine += dH;
    }

    intervalCount++;

}, interval);

