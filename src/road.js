const Road = function(width, topWidth, height, w, h){

    w = w || 120;
    h = h || 1000;

    // Height
    // Y = a*y*y + b*y +c;
    // Derivative
    // Y' = 2*a*y + b;
    //
    // Y(0):
    // 0 = a*0*0 + b*0 + c;
    // c = 0;
    //
    // Y'(0) = g0:
    // Y'(h) = gh:
    // gh/g0 = (topWidth/width)
    //
    // Y'(0):
    // g0 = 2*a*0 + b;
    // b = g0;
    //
    // gh/g0:
    // gh = (g0*topWidth/width)
    //
    // Y'(h):
    // gh = 2*a*h + b;
    // (gh - b )/(2*h)= a;
    // a = (gh - g0 )/(2*h);
    // a = (g0*(topWidth/width - 1))/(2*h);
    //
    // Solving:
    // height = a*h*h + b*h;
    // height = (g0*(topWidth/width - 1))/(2*h)*h*h + b*h;
    // height/h = g0*(topWidth/width - 1)/2 + g0;
    // height/h = g0*((topWidth/width - 1)/2 + 1);
    // 2*height/h = g0*(topWidth/width + 1);
    let g0 = (2*height/h)/(topWidth/width+1);
    let b = g0;
    let a = (g0*(topWidth/width - 1))/(2*h);


    this.transformPoint = function( normalisedPoint, centreX ) {
        let x = normalisedPoint.x;
        let y = normalisedPoint.y;

        let tH = (a*y*y + b*y);
        let tW = (width*(1 - tH/height) + topWidth*(tH/height));
        let tX = (x/w)*tW + centreX - (tW/2)
        let tY = height - (a*y*y + b*y);

        return Vector.toVec( tX, tY );
    };

}
