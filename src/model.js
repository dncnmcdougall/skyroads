const ModelCreator = ModelReducer.ModelCreator;

// ----- MousePosition -----
var MousePositionModelCreator = new ModelCreator("MousePosition");
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

// ----- Ship -----
var ShipModelCreator = new ModelCreator("Ship");
ShipModelCreator.addProperty("pos", "number");
ShipModelCreator.addProperty("in_air", "boolean");
ShipModelCreator.addProperty("jump_date", "number");
ShipModelCreator.addProperty("moving_direction", "number");
ShipModelCreator.addProperty("move_date", "number");

ShipModelCreator.addAction( "MoveLeft", function(state, date) {
    if ( state.moving_direction === -1 ) {
        return state;
    } else if ( state.pos === 0 && state.moving_direction !== 1 ) {
        return state;
    } else if ( state.moving_direction === 1 ) {
        let moveSoFar = date - state.move_date;
        let moveLeft = moveDuration - moveSoFar;
        return Object.assign({}, state, {
            "moving_direction": -1,
            "move_date": date-moveLeft,
            "pos": state.pos+1
        });
    } else {
        return Object.assign({}, state, {
            "moving_direction": -1,
            "move_date": date,
        });
    }
});

ShipModelCreator.addAction( "MoveRight", function(state, date) {
    if ( state.moving_direction === 1 ) {
        return state;
    } else if ( state.pos === 2 && state.moving_direction !== -1 ) {
        return state;
    } else if ( state.moving_direction === -1 ) {
        let moveSoFar = date - state.move_date;
        let moveLeft = moveDuration - moveSoFar;
        return Object.assign({}, state, {
            "moving_direction": 1,
            "move_date": date-moveLeft,
            "pos": state.pos-1
        });
    } else {
        return Object.assign({}, state, {
            "moving_direction": 1,
            "move_date": date,
        });
    }
});

var jumpDuration = 15;
var moveDuration = 15;

ShipModelCreator.addAction( "LandIfNessesary", function(state, date) {
    var newState = state;
    if ( state.in_air && date - state.jump_date > jumpDuration) {
        newState =  Object.assign({}, newState, {
            "in_air": false,
            "jump_date": 0
        });
    } 

    if ( state.moving_direction !== 0 && date - state.move_date > moveDuration) {
        newState =  Object.assign({}, newState, {
            "moving_direction": 0,
            "move_date": 0,
            "pos": state.pos + state.moving_direction
        });
    }

    return newState;
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
ShipModelCreator.addRequest( "ComputePosition", function(state, date) {
    let moveInterpol = state.moving_direction*(date-state.move_date)/moveDuration;
    let y = 0;
    if ( state.in_air ) {
        y = Math.sin(Math.PI*(date-state.jump_date)/jumpDuration);
    }
    return Vector.toVec( state.pos + moveInterpol, y );

});

ShipModelCreator.addRequest( "Draw", function(state, ctx, maxSize, date) {
    ctx.fillStyle = "black";
    var pos = this.requests["ComputePosition"](state, date);
    var x = maxSize.x/6 + (maxSize.x/3)*pos.x;
    var y = maxSize.y - maxSize.y/6*(1+pos.y);
    var r = Math.min( maxSize.x, maxSize.y)/8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();
});

var ShipModel = ShipModelCreator.finaliseModel();

// ----- Platform -----
PlatformModelCreator = new ModelCreator('PlatformModel');
PlatformModelCreator.addProperty('tiles', 'array');

PlatformModelCreator.addAction('InitialiseRandom', function(state, n) {
    const rows = [[], [], []];
    const generateRandomSeries = (row) => {
        for (let x=0;x<n;x++) {
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



