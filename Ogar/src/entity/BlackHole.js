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
    var x = this.position.x;
    var y = this.position.y;
    x = Math.max(x, border.minx + r);
    y = Math.max(y, border.miny + r);
    x = Math.min(x, border.maxx - r);
    y = Math.min(y, border.maxy - r);
    if (x != this.position.x || y != this.position.y) {
        this.setPosition({ x: x, y: y });this.setBoost(this.gameServer.config.gamemodeBlackHoleSpeed,Math.random()*6.283185307179586);
    }
};
