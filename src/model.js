
var MousePositionModelCreator = new ModelCreator("MousePosition");
MousePositionModelCreator.setFormsACollection(false);
MousePositionModelCreator.addProperty("pos", "object");
MousePositionModelCreator.addProperty("buttons", "number");

MousePositionModelCreator.addAction( "SetPosition", function(state, event) {
    return Object.assign({}, state, {
        "pos": Vector.multAdd(
            Vector.toVec(event.target.offsetLeft, event.target.offsetTop), -1,
            Vector.toVec( event.clientX, event.clientY ), 1),
        "buttons": event.buttons
    });
});

var MousePositionModel = MousePositionModelCreator.finaliseModel();


var ShipModelCreator = new ModelCreator("Ship");
ShipModelCreator.setFormsACollection(false);
ShipModelCreator.addProperty("pos", "number");
ShipModelCreator.addProperty("in_air", "boolean");
ShipModelCreator.addProperty("jump_date", "number");

ShipModelCreator.addAction( "MoveLeft", function(state) {
    if ( state.pos == 0 ) {
        return state;
    } else {
    return Object.assign({}, state, {
        "pos": state.pos -1
    });
    }
});

ShipModelCreator.addAction( "MoveRight", function(state) {
    if ( state.pos == 2 ) {
        return state;
    } else {
    return Object.assign({}, state, {
        "pos": state.pos +1
    });
    }
});

var jumpDuration = 15;

ShipModelCreator.addAction( "LandIfNessesary", function(state, date) {
    if ( !state.in_air ) {
        return state;
    } else if ( date - state.jump_date > jumpDuration) {
        return Object.assign({}, state, {
            "in_air": false,
            "jump_date": 0
        });
    } else {
        return state;
    }
});

ShipModelCreator.addAction( "Jump", function(state, date) {
    if ( state.in_air ) {
        return state;
    } else {
        return Object.assign({}, state, {
            "in_air": true,
            "jump_date": date
        });
    }
});
ShipModelCreator.addRequest( "Draw", function(state, ctx, maxSize, date) {
    ctx.fillStyle = "black";
    var y = maxSize.y/2 + maxSize.y/6;
    if ( state.in_air ) {
        y = y - (maxSize.y/6)*Math.sin(
            Math.PI*(date-state.jump_date)/jumpDuration
        );
    }
    var x = maxSize.x/6 + (maxSize.x/3)*state.pos;
    var r = Math.min( maxSize.x, maxSize.y)/8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();
});

PlatformModelCreator = new ModelCreator('PlatformModel');
PlatformModelCreator.addProperty('tiles', 'array');

PlatformModelCreator.addAction('InitialiseRandom', function(state, n) {
    const rows = [[], [], []];
    const generateRandomSeries = (row) => {
        for (x=0;x<n;x++) {
            row.push(+(Math.random() >= 0.5));
        }
        return row;
    };
    return Object.assign({}, state, {
        rows: rows.map(generateRandomSeries),
    });
});

PlatformModelCreator.addRequest('Draw', function(state, ctx, maxSize, date) {

});

var PlatformModel = PlatformModelCreator.finaliseModel();

var ShipModel = ShipModelCreator.finaliseModel();


