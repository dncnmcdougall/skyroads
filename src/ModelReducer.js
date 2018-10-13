const checkType = function(thing, type) {
    if ( type === 'array' ) {
        if ( Array.isArray(thing) !== true) {
            throw new Error('Expected parameter to be of type "array" but received "'+typeof(thing)+'".');
        }
    } else if ( type === 'object' && Array.isArray(thing) === true ) {
        throw new Error('Expected parameter to be of type "object" but received "array".');
    } else if ( typeof(thing) !== type ) {
        throw new Error('Expected parameter to be of type "'+type+'" but received "'+typeof(thing)+'".');
    }
};

const wrapResult = function(error, value) {
    if ( error ) {
        return {
            'error': error,
            'value': null
        };
    } else {
        return {
            'error': null,
            'value': value
        };
    }
};

const defaultValue = function(type, name) {
    switch(type) {
    case 'string':
        return '';
    case 'boolean':
        return false;
    case 'object':
        return {};
    case 'number':
        return 0.0;
    case 'array':
        return [];
    case null:
        return null;
    default:
        if ( name ) {
            throw new Error('Type ('+type+') of property '+name+' not recognised');
        } else {
            throw new Error('Type '+type+' not recognised');
        }
    }
};

const StateReducer = new function() {
    this.reduce = function(current, getActions, getChildren, 
        shouldExpandState, actionString, state, ...args) {
        const name = current.name;
        const actionParts = actionString.split('.');
        if ( actionParts.length == 2 ) {
            const actions = getActions(current);
            return actions[actionParts[1]](state, ...args);
        } else {
            const children = getChildren(current);
            const child = children[actionParts[1]];
            const childStateAndArgs = this.reduceState(state, child, ...args);
            const newActionString = actionParts.slice(1).join('.');
            const newChildState = this.reduce(child, getActions, getChildren,
                shouldExpandState, newActionString, 
                childStateAndArgs['State'], ...(childStateAndArgs['Args'])
            );

            if ( shouldExpandState ) {
                return this.expandState(state,newChildState,child);
            } else {
                return newChildState;
            }
        }
    };

    this.reduceState = function(state, child, ...args) {
        if ( child.formsACollection === false ) {
            return { 
                'State': state[child.propertyName],
                'Args': args
            };
        } else {
            const id = args[0];
            const expectMessage = 'The id given for the '+child.name+' was ';

            const childState = state[child.propertyName][id];
            return { 
                'State': childState,
                'Args': args.slice(1)
            };
        }
    };

    this.expandState = function(state, childState, child) {
        let merger = {};
        if ( child.formsACollection === false ) {
            if ( state[child.propertyName] === childState ) {
                return state;
            } 
            merger[child.propertyName] = childState;
        } else {
            const idField = child.collectionKey;
            if ( state[child.propertyName][childState[idField]] === childState) {
                return state;
            }
            merger[child.propertyName] = {};
            Object.assign(merger[child.propertyName], state[child.propertyName]);
            merger[child.propertyName][childState[idField]] = childState;
        }

        return Object.assign({}, state, merger); 
    };

    this.listActions = function(current, getActions, getChildren)
    {
        let actions = [];
        let returnedActions = getActions(current);
        if ( Array.isArray(returnedActions) ) {
            actions = returnedActions.map( (value) => {return value;} );
        } else {
            for( const actionName in returnedActions ) {
                actions.push(actionName);
            }
        }
        const children = getChildren(current);
        for( const childName in children ) {
            const child = children[childName];
            actions.push( ...this.listActions(child, getActions, getChildren));
        }

        return actions.map( (element) => { return current.name+'.'+element; });
    };

}

const StateActions = new function() {
    this.addCreateEmpty = function (constModel) {
        constModel.createEmpty = function() {
            let emptyState = {};
            for( let prop in this.properties ) {

                let value = defaultValue(this.properties[prop], prop);

                emptyState[prop] = value;
            }

            if ( this.formsACollection ) {
                emptyState[this.collectionKey] = null;
            }

            for( let childName in this.children ) {
                let child = this.children[childName];
                if ( child.formsACollection ) {
                    emptyState[child.propertyName] = {};
                } else {
                    emptyState[child.propertyName] = child.createEmpty();
                }
            }

            return emptyState;
        };
    };

    this.addStateRequest = function(constructor) {
        constructor.addRequest('State', function(state) {
            return state;
        }, true);
    };

    this.addSetPropertyActionFor = function(constructor, propertyName, actionName) {
        checkType(constructor, 'object');
        checkType(propertyName, 'string');
        if ( actionName ) {
            checkType(actionName, 'string');
        } else {
            actionName = 'Set'+propertyName;
        }


        constructor.addAction(actionName, function(state, value) {
            if ( this.properties.hasOwnProperty(propertyName) === false ) {
                throw new Error('The property "'+propertyName+'" was not defined on the model');
            }
            if ( this.properties[propertyName] ) {
                checkType(value, this.properties[propertyName] );
            }
            if ( state[propertyName] === value )
            {
                return state;
            }
            var merger = {};
            merger[propertyName] = value;
            return Object.assign({},state,merger);
        }, true);
    };


    this.addAddActionFor = function(constructor, child, actionName) {
        checkType(constructor, 'object');
        checkType(child, 'object');
        if ( !child.formsACollection ) {
            throw new Error('Add actions can only be created for children'+
                ' which form a collection');
        }
        if ( actionName ) {
            checkType(actionName, 'string');
        } else {
            actionName = 'Add'+child.name;
        }

        constructor.addAction(actionName, function(state, key) {
            var childObject = child.createEmpty();
            childObject[child.collectionKey] = key;

            var modName = child.propertyName;
            var merger = {};
            merger[modName] = {};
            Object.assign(merger[modName], state[modName]);
            merger[modName][key] = childObject;

            return Object.assign({},state,merger);
        }, true);
    };

    this.addAvailableKeyRequestFor = function(constructor, child, requestName) {
        checkType(constructor, 'object');
        checkType(child, 'object');
        if ( !child.formsACollection ) {
            throw new Error('AvailableKey requests can only be created for children'+
                ' which form a collection');
        }
        if ( requestName ) {
            checkType(requestName, 'string');
        } else {
            var key = child.collectionKey;
            key = key[0].toUpperCase() + key.slice(1);
            requestName = 'Available'+child.name+key;
        }

        constructor.addRequest(requestName, function(state) {
            var keys = Object.keys(state[child.propertyName]).map( (value) => {
                return parseInt(value, 10); 
            });
            keys.sort( (a,b) => { return a-b; });
            var key = keys.length-1;
            if ( key < 0 ) {
                return 0;
            }
            var delta = parseInt(keys.length/2, 10);
            if ( delta < 1 ) {
                delta = 1;
            }
            var dir = 0;

            while ( delta > 0 ) {
                if ( keys[key] === key ) {
                    if ( key === keys.length -1 ) {
                        return keys.length;
                    } else if ( keys[key+1] > (key+1) ) {
                        return (key + 1);
                    } else if ( keys[key+1] === (key+1) ) {
                        key += delta;
                        if ( dir < 0 ) {
                            delta = parseInt(delta /2, 10);
                        }
                        dir = 1;
                    } else {
                        throw 'This should not happen: ===, <';
                    }
                } else if ( keys[key] > key ) {
                    if ( key === 0 ) {
                        return 0;
                    } else if ( keys[key-1] === (key-1) ) {
                        return key;
                    } else if ( keys[key-1] > (key-1) ) {
                        key -= delta;
                        if ( dir > 0 ) {
                            delta = parseInt(delta /2, 10);
                        }
                        dir = -1;
                    } else {
                        throw 'This should not happen: >, <';
                    }
                } else {
                    throw 'This should not happen: <';
                }
                if ( delta < 1 ) {
                    delta = 1;
                }
                if ( key < 0 ) {
                    key = 0;
                } else if ( key >= keys.length ) {
                    throw 'This should not happen: Out of bounds';
                }
            }
            throw 'This should not happen: delta === 0';
        }, true);
    };
}

var throwIfFinalised = function( finalised ) {
    if ( finalised ) {
        throw new Error('The versioning was already finalised, cannot modify it further.');
    }
};

function createDefaultVersion() {
    return {
        'additions':[],
        'renames':[],
        'removals':[]
    };
}

function Version(version) {
    this.add = function(name, value) {
        version.additions.push( { 
            'name': name,
            'value': value
        });
    };
    this.rename = function(name, newName) {
        version.renames.push( { 
            'name': name,
            'newName': newName
        });
    };
    this.remove = function(name, value) {
        version.removals.push( { 
            'name': name
        });
    };
}

function VersioningCreator(){
    var finalised = false;
    var versioning = {
        'versions': {}
    };

    this.lastVersionNumber = function() {
        return Object.keys(versioning.versions).reduce( (result, value) => {
            return Math.max(result, Number.parseInt(value, 10));
        }, 0);
    };

    this.addVersion = function(versionNumber) {
        throwIfFinalised(finalised);

        var intVersionNumber = Number.parseInt( versionNumber, 10 );
        if ( versionNumber != intVersionNumber )
        {
            throw new Error('Expected the version number to be an integer');
        } else {
            versionNumber = intVersionNumber;
        }

        if ( ! versioning.versions.hasOwnProperty(versionNumber) ) {
            versioning.versions[versionNumber] = createDefaultVersion();
        }
        return new Version( versioning.versions[versionNumber] );
    };

    versioning.update = function(oldState) {
        let newState = Object.assign({}, oldState );

        if ( !newState.hasOwnProperty('version') ) {
            newState.version = 0;
        }

        let error = null;

        Object.keys(versioning.versions).sort().forEach( (versionNumber) => {
            if ( error != null || ! versioning.versions.hasOwnProperty(versionNumber) ) {
                return;
            }
            if ( versionNumber <= newState.version ) {
                return;
            }
            newState.version = Number.parseInt( versionNumber, 10 );

            let currentVersion = versioning.versions[versionNumber];

            currentVersion.removals.forEach( (removal) => {
                if ( error != null ) {
                    return;
                }
                if ( ! newState.hasOwnProperty( removal.name ) ) {
                    error = 'Expected to find property "'+removal.name+
                        '" to remove in version '+versionNumber+
                        ', but did not.';
                } else {
                    delete newState[removal.name];
                }
            });
            if ( error != null ) {
                return;
            }

            currentVersion.renames.forEach( (rename) => {
                if ( error != null ) {
                    return;
                }
                if ( ! newState.hasOwnProperty( rename.name ) ) {
                    error = 'Expected to find property "'+rename.name+
                        '" to rename to "'+rename.newName+
                        '" in version '+versionNumber+', but did not.';
                } else if ( newState.hasOwnProperty( rename.newName) ) {
                    error = 'Could not rename "'+rename.name+
                        '" to "'+rename.newName+
                        '" because it aleardy exists, in version 1.';
                } else {
                    newState[rename.newName] = newState[rename.name];
                    delete newState[rename.name];
                }
            });
            if ( error != null ) {
                return;
            }
            currentVersion.additions.forEach( (addition) => {
                if ( error != null ) {
                    return;
                }
                if ( newState.hasOwnProperty( addition.name) ) {
                    error = 'Could not add "'+addition.name+
                        '" because it aleardy exists, in version 1.';
                } else {
                    newState[addition.name] = addition.value;
                }
            });
        });

        return wrapResult( error, newState);
    };

    this.finalise= function() {
        throwIfFinalised(finalised);
        finalised = true;

        return versioning;
    };
}

function ModelCreatorVersion(version, modelCreator){
    this.addProperty = function(name, type) {
        modelCreator.addProperty(name, type);
        if ( !type ) {
            type = null;
        }
        version.add(name, defaultValue(type));
    };

    this.removeProperty = function(name) {
        modelCreator.removeProperty(name);
        version.remove(name);
    };

    this.renameProperty = function(name, newName) {
        modelCreator.addProperty(newName, modelCreator.getPropertyType(name));
        modelCreator.removeProperty(name);
        version.rename(name, newName);
    };

    this.addChildModel = function(childModel) {
        modelCreator.addChildModel(childModel);
        version.add(childModel.name, childModel.createEmpty() );
    };

    this.removeChildModel = function(childModel) {
        modelCreator.removeChildModel(childModel);
        version.remove(childModel.name);
    };
}

var throwIfFinalised = function( finalised ) {
    if ( finalised ) {
        throw new Error('The model was already finalised, cannot modify it further.');
    }
};

function ModelCreator(modelName){
    var versioningCreator = new VersioningCreator();
    var finalised = false;
    var constModel = {};

    constModel.name = modelName;

    constModel.formsACollection = false;
    constModel.collectionName = modelName+'s';
    constModel.collectionKey = 'Key';

    constModel.propertyName = modelName;
    constModel.properties = {};
    constModel.actions = {};
    constModel.requests = {};
    constModel.children = {};

    constModel.customActions = [];
    constModel.customRequests = [];

    constModel.reduce = function(actionString, state, ...args) {
        return StateReducer.reduce(constModel, 
            (child) => {return child.actions;}, 
            (child) => {return child.children;}, 
            true, actionString, state, ...args);
    };

    constModel.request = function(requestString, state, ...args) {
        return StateReducer.reduce(constModel, 
            (child) => {return child.requests;}, 
            (child) => {return child.children;}, 
            false, requestString, state, ...args);
    };

    constModel.listActions = function() {
        return StateReducer.listActions(constModel, 
            (child) => {return child.actions;}, 
            (child) => {return child.children;});
    };

    constModel.listCustomActions = function() {
        return StateReducer.listActions(constModel, 
            (child) => {return child.customActions;}, 
            (child) => {return child.children;});
    };

    constModel.listRequests = function() {
        return StateReducer.listActions(constModel, 
            (child) => {return child.requests;}, 
            (child) => {return child.children;});
    };

    constModel.listCustomRequests = function() {
        return StateReducer.listActions(constModel, 
            (child) => {return child.customRequests;}, 
            (child) => {return child.children;});
    };

    StateActions.addCreateEmpty( constModel );

    this.copyFrom = function(otherModel) {
        throwIfFinalised(finalised);

        constModel.properties = Object.assign({}, 
            constModel.properties, 
            otherModel.properties);
        constModel.actions = Object.assign({}, 
            constModel.actions, 
            otherModel.actions);
        constModel.requests = Object.assign({}, 
            constModel.requests, 
            otherModel.requests);
        constModel.children = Object.assign({}, 
            constModel.children, 
            otherModel.children);
    };

    this.setFormsACollection = function(formsACollection) {
        checkType(formsACollection, 'boolean');
        throwIfFinalised(finalised);

        constModel.formsACollection = formsACollection;
    };

    this.setCollectionName = function(collectionName) {
        checkType(collectionName, 'string');
        throwIfFinalised(finalised);

        constModel.collectionName = collectionName;
    };

    this.setCollectionKey = function(keyField) {
        checkType(keyField, 'string');
        throwIfFinalised(finalised);

        constModel.collectionKey = keyField;
    };

    this.addVersion = function() {
        var maxVersionNumber = versioningCreator.lastVersionNumber();

        var newVersion = versioningCreator.addVersion( maxVersionNumber + 1 );
        return new ModelCreatorVersion(newVersion, this);
    };
    this.getPropertyType = function(name) {
        return constModel.properties[name];
    };

    this.addProperty = function(name, type) {
        checkType(name, 'string');
        if ( type ) {
            checkType(type, 'string');
        } else {
            type = null;
        }
        throwIfFinalised(finalised);

        constModel.properties[name] = type;
    };

    this.removeProperty = function(name) {
        checkType(name, 'string');
        throwIfFinalised(finalised);

        if ( !constModel.properties.hasOwnProperty(name) ) {
            throw 'The property "'+name+'" could not be removed because it is not contained.';
        }
        delete constModel.properties[name];
    };

    this.addChildModel = function(childModel) {
        checkType(childModel, 'object');
        throwIfFinalised(finalised);

        if ( constModel.children.hasOwnProperty(childModel.name) ) {
            throw 'The child named "'+childModel.name+'" already exists in this model.'+
                ' Do you have two models with the same name?';
        }

        constModel.children[childModel.name] = childModel;
    };

    this.removeChildModel = function(childModel) {
        checkType(childModel, 'object');
        throwIfFinalised(finalised);

        if ( !constModel.children.hasOwnProperty(childModel.name) ) {
            throw 'The child named "'+childModel.name+'" could not be removed because it is not contained.';
        }
        delete constModel.children[childModel.name];
    };

    this.addAction = function(name, func, isNotCustom) {
        checkType(name, 'string');
        checkType(func, 'function');
        throwIfFinalised(finalised);

        constModel.actions[name] = func.bind(constModel);
        if ( !isNotCustom  && !( name in constModel.customActions) ){
            constModel.customActions.push(name);
        }
    };

    this.removeAction = function(name) {
        checkType(name, 'string');
        throwIfFinalised(finalised);

        if ( !constModel.actions.hasOwnProperty(name) ) {
            throw 'The action "'+name+'"+ could not be removed because it is not contained.';
        }
        delete constModel.actions[name];
        var index = constModel.customActions.indexOf(name);
        if ( index >= 0 ) {
            constModel.customActions.splice(index, 1);
        }
    };

    this.addRequest = function(name, func, isNotCustom) {
        checkType(name, 'string');
        checkType(func, 'function');
        throwIfFinalised(finalised);

        constModel.requests[name] = func.bind(constModel);
        if ( !isNotCustom && !(name in constModel.customRequests) ) {
            constModel.customRequests.push(name);
        }
    };
    this.removeRequest = function(name) {
        checkType(name, 'string');
        throwIfFinalised(finalised);

        if ( !constModel.requests.hasOwnProperty(name) ) {
            throw 'The request "'+name+'" could not be removed because it is not contained.';
        }
        delete constModel.requests[name];
        var index = constModel.customRequests.indexOf(name);
        if ( index >= 0 ) {
            constModel.customRequests.splice(index, 1);
        }
    };

    this.addStateRequest = function() {
        StateActions.addStateRequest(this);
    };

    this.addSetPropertyActionFor = function(propertyName, actionName) {
        StateActions.addSetPropertyActionFor( this, propertyName, actionName);
    };

    this.addAddActionFor = function(child, actionName) {
        StateActions.addAddActionFor( this, child, actionName);
    };

    this.addAvailableKeyRequestFor = function(child, actionName) {
        StateActions.addAvailableKeyRequestFor( this, child, actionName);
    };

    this.finaliseModel = function() {
        throwIfFinalised(finalised);
        if ( constModel.formsACollection ) {
            constModel.propertyName = constModel.collectionName;

            if ( constModel.properties.hasOwnProperty( constModel.collectionKey ) )
            {
                throw 'The property "'+constModel.collectionKey+'" shadows the collection key.';
            }
        } else {
            constModel.propertyName = constModel.name;
            delete constModel.collectionKey;
        }
        delete constModel.collectionName;

        constModel.versioning = versioningCreator.finalise();

        finalised = true;

        return constModel;
    };
}

function StateValidator()
{
    this.validateStateCollection = (model, collection, shouldUpdate, hasCopied) => {
        var error = null;
        if ( !model.collectionKey ) {
            error = model.propertyName+' should not be placed in a collection as it is not marked as forming a collection.';
        }

        if ( shouldUpdate && !hasCopied ) {
            collection = Object.assign({}, collection);
            hasCopied = true;
        }

        Object.keys(collection).forEach( (id) => {
            if ( !error ) {
                var internalId = collection[id][model.collectionKey];
                if ( internalId != id ) {
                    error = 'Expected '+model.propertyName+'['+id+'] to have "'+
                        model.collectionKey+'" of '+id+' but found '+internalId+'.';
                } else {
                    let result = this.validateState(model, collection[id], shouldUpdate, hasCopied);
                    if ( result.error ) {
                        error = result.error;
                    } else if ( shouldUpdate ) {
                        collection[id] = result.value;
                    }
                }
            }
        });

        return wrapResult( error, collection);
    };

    this.validateState = (model, state, shouldUpdate, hasCopied) => {
        var children = model.children;
        var properties = model.properties;

        var childCount = {};
        var collectionCount = {};
        var propertyCount = {};

        Object.keys(children).forEach( (childName) => { 
            var child = children[childName];
            if ( child.formsACollection ) {
                collectionCount[child.propertyName] = {
                    'found': false,
                    'name': childName
                }; 
            } else {
                childCount[child.propertyName] = {
                    'found': false,
                    'name': childName
                };
            }
        });

        Object.keys(properties).forEach( (prop) => { 
            propertyCount[prop] = {
                'found': false,
                'type': properties[prop]
            };
        });

        if ( model.formsACollection ) {
            propertyCount[model.collectionKey] = {
                'found': false,
                'type': null
            }; 
        }

        if ( shouldUpdate ) {
            var result = model.versioning.update( state );
            if ( result.error ) {
                return result;
            } else {
                hasCopied = true;
                state = result.value;
            }
        }

        var error = null;

        var modelName = model.propertyName;
        if ( model.formsACollection ) {
            let id = state[ model.collectionKey];
            modelName = modelName+'['+id+']';
        } 

        Object.keys(state).forEach( (key) => {
            var name;
            if (error) {
                return;
            } else if ( key == 'version' ) {
                return;
            } else if ( propertyCount.hasOwnProperty(key) ) {
                var type = propertyCount[key].type;
                if ( type != null ) {
                    try {
                        checkType( state[key], type );
                        propertyCount[key].found = true;
                    } catch (err)  {
                        error = 'Expected property '+modelName+'.'+key+' to have type "'+
                            type+'", but found type "'+typeof( state[key] )+'".';
                    }
                } else {
                    propertyCount[key].found = true;
                }
            } else if ( childCount.hasOwnProperty(key) ) {
                name = childCount[key].name;
                var newChild = this.validateState(children[name], state[key], shouldUpdate); 
                if ( !newChild.error ) {
                    childCount[key].found = true;
                    if ( shouldUpdate ) {
                        state[key] = newChild.value;
                    }
                } else {
                    error =  newChild.error;
                }
            } else if ( collectionCount.hasOwnProperty(key) ) {
                name = collectionCount[key].name;
                var newCollection = this.validateStateCollection( children[name], state[key], shouldUpdate );
                if ( newCollection.error ) {
                    error = newCollection.error;
                } else {
                    if ( shouldUpdate ) {
                        state[key] = newCollection.value;
                    }
                    collectionCount[key].found = true;
                }
            } else {
                error= 'Did not expecte to find a property named '+modelName+'.'+key+', but did.';
            }
        }
        );
        Object.keys(collectionCount).forEach( (key) => {
            if ( !error && !collectionCount[key].found ) {
                error = 'Expected to find a collection named '+modelName+'.'+key+', but did not.';
            }
        });

        Object.keys(childCount).forEach( (key) => {
            if ( !error && !childCount[key].found ) {
                error = 'Expected to find a child named '+modelName+'.'+key+', but did not.';
            }
        });

        Object.keys(propertyCount).forEach( (key) => {
            if ( !error && !propertyCount[key].found ) {
                error = 'Expected to find a property named '+modelName+'.'+key+', but did not.';
            }
        });

        return wrapResult( error, state);
    };
}
