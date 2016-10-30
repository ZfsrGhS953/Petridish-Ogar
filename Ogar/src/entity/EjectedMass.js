var Cell = require('./Cell');

function EjectedMass() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    this.cellOwner = 0;
    this.cellType = 3;
}

module.exports = EjectedMass;
EjectedMass.prototype = new Cell();

// Main Functions

EjectedMass.prototype.onAdd = function (gameServer) {
    // Add to list of ejected mass
    gameServer.nodesEjected.push(this);
};

EjectedMass.prototype.onRemove = function(gameServer) {
    // Remove from list of ejected mass
    var index = gameServer.nodesEjected.indexOf(this);
    if (index != -1) {
        gameServer.nodesEjected.splice(index, 1);
    }
};
EjectedMass.prototype.onEaten = function (hunter) {
      try {
            if (hunter.owner.gameServer.gameMode.teamAmount > 0) {
                // Apply teaming EXCEPT when exchanging mass to same team member
                if (this.cellOwner.team != hunter.owner.team) {
                    this.cellOwner.Wmult+=0.02;
                };
            } else {
				if(this.cellOwner != hunter.owner){
                // Always apply anti-teaming if there are no teams
                this.cellOwner.Wmult+=0.02;
				}
            };
        } catch(ex) { } // Dont do anything whatever the error is
};

EjectedMass.prototype.move = function (border) {
    if (this.isMoving && this.boostDirection.x < 1 && this.boostDirection.y < 1 && this.boostDirection.x > -1 && this.boostDirection.y > -1) {
	if(this.gameServer.config.gamemodeDeathmatch==1){
		this.gameServer.removeNode(this);
		}else{
        this.boostDirection.x=0;
		this.boostDirection.y=0;
        this.isMoving = false;
        return;
		}
    }

    this.position.x += this.boostDirection.x * 0.1;
    this.position.y += this.boostDirection.y * 0.1;
	this.boostDirection.x*=0.9;
	this.boostDirection.y*=0.9;
	var r = this._size / 2;
	if(this.position.x<border.minx+r||this.position.x>border.maxx-r)this.boostDirection.x=-this.boostDirection.x;
	if(this.position.y<border.miny+r||this.position.y>border.maxy-r)this.boostDirection.y=-this.boostDirection.y;
}