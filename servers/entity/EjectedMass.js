var Cell = require('./Cell');

function EjectedMass() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 3;
    this.size = Math.ceil(Math.sqrt(100 * this.mass));
	this.isSnakingMass = false;
}

module.exports = EjectedMass;
EjectedMass.prototype = new Cell();

EjectedMass.prototype.getSize = function() {
    return this.size;
};

EjectedMass.prototype.calcMove = null; // Only for player controlled movement

// Main Functions

EjectedMass.prototype.sendUpdate = function() {
    // Whether or not to include this cell in the update packet
    if (this.moveEngineTicks == 0) {
        return false;
    }
    return true;
}

EjectedMass.prototype.onRemove = function(gameServer) { 
    // Remove from list of ejected mass
    var index = gameServer.nodesEjected.indexOf(this);
    if (index != -1) {
        gameServer.nodesEjected.splice(index,1);
    }
};

EjectedMass.prototype.onConsume = function(consumer,gameServer) {
    // Adds mass to consumer
	if(this.isSnakingMass) {
		consumer.addMass(this.mass);
		return;
	}
	if(gameServer.config.CrazyFFA==0){
		consumer.addMass(this.mass);
	} else {
		if(this.client!=consumer.owner){
			consumer.addMass(-this.mass);
		} else {
			consumer.addMass(gameServer.config.ejectMassLoss);
		}
	}
};

EjectedMass.prototype.onAutoMove = function(gameServer) {

    if (gameServer.nodesVirus.length < gameServer.config.virusMaxAmount) {
        // Check for viruses
        var v = gameServer.getNearestVirus(this);
        if (v) { // Feeds the virus if it exists
			if(this.isSnakingMass == true){return;}
				if(gameServer.config.virusSpliting==1){
					feed(this,gameServer,v);
				} else {
					v.feed(this,gameServer);
				}
				return true;
        }
    } else {
		var v = gameServer.getNearestVirus(this);
        if (v) {
			gameServer.removeNode(this);
		}
	}
};

function feed(feeder,gameServer,v){
    v.setAngle(feeder.getAngle()); // Set direction if the virus explodes
    v.mass += feeder.mass;
    v.fed++; // Increase feed count
    gameServer.removeNode(feeder);

    // Check if the virus is going to explode
    if (v.fed >= gameServer.config.virusFeedAmount) {
        v.mass = gameServer.config.virusStartMass; // Reset mass
        v.fed = 0;
        gameServer.shootVirus(v);
    }
}
EjectedMass.prototype.moveDone = function(gameServer) {
    if (!this.onAutoMove(gameServer)) {
        gameServer.nodesEjected.push(this);
    }
};

