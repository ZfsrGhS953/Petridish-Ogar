var Cell = require('./Cell');
var Ejection = require('./Ejection');

function PlayerCell() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    
    this.cellType = 0;
    this._canRemerge = false;
}

module.exports = PlayerCell;
PlayerCell.prototype = new Cell();

// Main Functions

PlayerCell.prototype.getName = function () {
    return this.owner.name;
};

PlayerCell.prototype.getSkin = function () {
    return this.owner.skin;
};

PlayerCell.prototype.canRemerge = function () {
    return this._canRemerge;
};

PlayerCell.prototype.canEat = function (cell) {
	if(this.gameServer.config.gamemodeDeathmatch==1){
    return cell.cellType == 1 ||
	(cell.cellType==0&&cell.owner==this.owner) ||
	cell.cellType == 3;
	}
    // player cell can eat anyone
    return true;
};

PlayerCell.prototype.onEat = function (prey,gameServer) {
    // Called to eat prey cell
	if(prey.cellType==3&&gameServer.config.gamemodeCrazy==1){
	if(prey.isMoving){
	if(prey.cellOwner!=this.owner||gameServer.config.gamemodeDeathmatch==0){
    this.setSize(Math.sqrt(this.getSizeSquared() - prey.getSizeSquared()));
	if(this._size<gameServer.config.playerMinEjectMass){gameServer.removeNode(this);prey.cellOwner.b++}
	}
	}else{
	this.setSize(Math.sqrt(this.getSizeSquared() + gameServer.config.ejectMassLoss*gameServer.config.ejectMassLoss));
	}
	}else{
	var f=1;
	if(prey.cellType==0){
	if(this.owner!=prey.owner){
		f = gameServer.config.playerMassAbsorbed;
		if(prey._mass<gameServer.config.playerBotGrowMass&&this._mass>625)f=0;
		if(gameServer.config.gamemodeSnakerDish==1)this.owner.c+=Math.sqrt(prey._size)*10*f;
	}
	}
	if(prey.cellType==2)f=this.gameServer.config.virusGrowMass;
	this.setSize(Math.sqrt(this.getSizeSquared() + f*prey.getSizeSquared()));
	}
};

PlayerCell.prototype.getSplitSize = function () {
    return this.getSize() * splitMultiplier;
};

var splitMultiplier = 1 / Math.sqrt(2);

PlayerCell.prototype.checkBorder = function (border) {
    var r = this.getSize() / 2;
    var x = this.position.x;
    var y = this.position.y;
	if(this.gameServer.config.gamemodeEatForSpeed==1&&x>border.maxx-r&&this.gameServer.hasWinner==0){
	this.gameServer.winner=this.owner.name;
	this.gameServer.hasWinner=1;
	}
    x = Math.max(x, border.minx + r);
    y = Math.max(y, border.miny + r);
    x = Math.min(x, border.maxx - r);
    y = Math.min(y, border.maxy - r);
    if (x != this.position.x || y != this.position.y) {
        this.setPosition({ x: x, y: y });
    }
};

// Override

PlayerCell.prototype.onAdd = function(gameServer) {
    // Gamemode actions
    gameServer.gameMode.onCellAdd(this);
};

PlayerCell.prototype.onRemove = function(gameServer) {
    var index;
    // Remove from player cell list
    index = this.owner.cells.indexOf(this);
    if (index != -1) {
        this.owner.cells.splice(index, 1);
    }
    // Gamemode actions
    gameServer.gameMode.onCellRemove(this);
};
