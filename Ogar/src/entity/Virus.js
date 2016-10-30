var Cell = require('./Cell');
var Logger = require('../modules/Logger');

function Virus() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 2;
    this.isSpiked = true;
    this.fed = 0;
    this.isMotherCell = false; // Not to confuse bots
    this.color=1792;
}

module.exports = Virus;
Virus.prototype = new Cell();

// Main Functions

Virus.prototype.canEat = function (cell,gameServer) {
	if(gameServer.nodesVirus.length>=gameServer.config.virusMaxAmount)return false;
    return cell.cellType == 3 ||
	cell.cellType == 4;            // virus can eat ejected mass only
};

Virus.prototype.onEat = function (prey) {
    // Called to eat prey cell
    this.setSize(Math.sqrt(this.getSizeSquared() + prey.getSizeSquared()));

    if (this.getSize() >= this.gameServer.config.virusMaxSize||this._size==105.45141061171255) {
        this.setSize(this.gameServer.config.virusMinSize); // Reset mass
        if(this.gameServer.config.gamemodeDeathmatch==0)this.gameServer.shootVirus(this, prey.isMoving ? prey.getAngle() : this.getAngle());
    }
};

Virus.prototype.onEaten = function(consumer) {
    var client = consumer.owner;
    if (client == null) return;
    
    var maxSplit = this.gameServer.config.playerMaxCells - consumer.owner.cells.length;
    var masses = this.gameServer.splitMass(consumer.getMass(), maxSplit + 1);
    if (masses.length < 2) {
        return;
    }
    client.virusMult+=0.6;
    // Balance mass around center & skip first mass (==consumer mass)
    var massesMix = [];
    for (var i = 1; i < masses.length; i += 2)
        massesMix.push(masses[i]);
    for (var i = 2; i < masses.length; i += 2)
        massesMix.push(masses[i]);
    masses = massesMix;
    
    // Blow up the cell...
    var angle = 2 * Math.PI * Math.random();
    var step = 2 * Math.PI / masses.length;
    for (var i = 0; i < masses.length; i++) {
        if (!this.gameServer.splitPlayerCell(client, consumer, angle, masses[i])) {
            break;
        }
        angle += step;
        if (angle >= 2 * Math.PI) {
            angle -= 2 * Math.PI;
        }
    }
};

Virus.prototype.onAdd = function(gameServer) {
    gameServer.nodesVirus.push(this);
};

Virus.prototype.onRemove = function(gameServer) {
    var index = gameServer.nodesVirus.indexOf(this);
    if (index != -1) {
        gameServer.nodesVirus.splice(index, 1);
    } else {
        Logger.error("Virus.onRemove: Tried to remove a non existing virus!");
    }
};
