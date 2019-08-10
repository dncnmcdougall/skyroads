const Line = function(p1, p2, width, colour) {
    return {
        'P1': p1,
        'P2': p2,
        'Width': width,
        'Colour': colour,
        'draw': function( ctx ) {
            ctx.strokeStyle = colour;
            ctx.strokeWidth = width;
            ctx.lineWidth = width;
            // ctx.fillStyle = colour;
            ctx.beginPath();
            ctx.moveTo(p1.x,p1.y);
            ctx.lineTo(p2.x,p2.y);
            ctx.stroke();
        }
    };

};
