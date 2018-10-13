/* eslint-env browser*/
/* global Vector, Blob*/

var maxPos = Vector.toVec( 500, 500);

var canvas = document.getElementById('canvas');
canvas.width = maxPos.x;
canvas.height = maxPos.y;
var ctx = canvas.getContext('2d');

window.onkeypress = (event) => {
    switch ( event.code ) {
        case "ArrowRight":
            shipState = ShipModel.reduce("ShipModel.MoveRight", shipState);
            break;
        case "ArrowLeft":
            shipState = ShipModel.reduce("ShipModel.MoveLeft", shipState);
            break;
        case "Space":
            shipState = ShipModel.reduce("ShipModel.Jump", shipState, intervalCount);
            break;
    }
};

var interval = 50;
var intervalCount = 0;

var shipState = ShipModel.createEmpty();
var platformState = PlatformModel.createEmpty();

platformState = PlatformModel.reduce('PlatformModel.InitialiseRandom', platformState, 100);

console.log(platformState);


var timer = setInterval( () => {
    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0,0, maxPos.x, maxPos.y);

    shipState = ShipModel.reduce("ShipModel.LandIfNessesary", shipState, intervalCount);
    ShipModel.request("ShipModel.Draw", shipState, ctx, maxPos, intervalCount);


    intervalCount++;

}, interval);

