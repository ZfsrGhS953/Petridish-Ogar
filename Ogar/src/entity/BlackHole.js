var Cell = require('./Cell');

function BlackHole() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 5;
}

module.exports = BlackHole;
BlackHole.prototype = new Cell();

// Main Functions

BlackHole.prototype.canEat = function (cell) {
    return cell.cellType != 5; // cannot consume other holes
};

BlackHole.prototype.onEat = function (cell) {
    if(cell.owner)cell.owner.d+=cell._mass;
    if(cell.cellOwner)cell.cellOwner.d+=cell._mass;
    this.setSize(this.gameServer.config.gamemodeBlackHoleMass);
};

BlackHole.prototype.move = function (border) {
    this.position.x += this.boostDirection.x;
    this.position.y += this.boostDirection.y;
}

BlackHole.prototype.checkBorder = function (border) {
    var r = this.getSize() / 2;
	if(this.position.x>border.maxx){
	this.position.x=border.maxx;
	this.setBoost(this.gameServer.config.gamemodeBlackHoleSpeed,Math.random()*6.283185307179586);
	}
	if(this.position.x<border.minx){
	this.position.x=border.minx;
	this.setBoost(this.gameServer.config.gamemodeBlackHoleSpeed,Math.random()*6.283185307179586);
	}
	if(this.position.y>border.maxy){
	this.position.y=border.maxy;
	this.setBoost(this.gameServer.config.gamemodeBlackHoleSpeed,Math.random()*6.283185307179586);
	}
	if(this.position.y<border.miny){
	this.position.y=border.miny;
	this.setBoost(this.gameServer.config.gamemodeBlackHoleSpeed,Math.random()*6.283185307179586);
	}
};
