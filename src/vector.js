/* eslint-env browser*/

const Vector = {
    'random': function( length ) {
        var vec = Vector.toVec( Math.random()-0.5, Math.random()-0.5);
        return this.mult( vec, length );
    },
    'toVec': function(x, y) {
        return {
            'x': x,
            'y': y
        };
    },
    'toString': function( vec) {
        return'< '+vec.x+', '+vec.y+' >';
    },
    'equal': function( vec1, vec2) {
        return (vec1.x == vec2.x) &&
            (vec1.y == vec2.y );
    },
    'tolerantEqual': function( vec1, vec2, tol) {
        return (Math.abs(vec1.x - vec2.x) < tol) &&
            ( Math.abs(vec1.y - vec2.y) < tol );
    },
    'length': function(vec) {
        return Math.sqrt( Math.pow(vec.x,2) + Math.pow(vec.y,2) );
    },
    'distance': function(vec1, vec2) {
        return this.length( this.toVec( vec1.x - vec2.x, vec1.y - vec2.y));
    },
    'norm': function(vec) {
        let len = this.length(vec);
        if ( len < 1e-6 ) {
            return {
                'x': 0,
                'y': 0
            };
        }
        return {
            'x': vec.x/len,
            'y': vec.y/len
        };
    },
    'dot': function( vec1, vec2) {
        return vec1.x*vec2.x + vec1.y*vec2.y;
    },
    'mult': function(vec, m) {
        return {
            'x': vec.x*m,
            'y': vec.y*m
        };
    },
    'add': function(vec1, vec2) {
        return {
            'x': vec1.x + vec2.x,
            'y': vec1.y + vec2.y
        };
    },
    'multAdd': function(vec1, m1, vec2, m2) {
        return {
            'x': vec1.x*m1 + vec2.x*m2,
            'y': vec1.y*m1 + vec2.y*m2
        };
    },
    'weightedAdd': function(vec1, w1, vec2, w2) {
        let wT = w1 + w2;
        return {
            'x': vec1.x*(w1/wT) + vec2.x*(w2/wT),
            'y': vec1.y*(w1/wT) + vec2.y*(w2/wT)
        };
    }
};
