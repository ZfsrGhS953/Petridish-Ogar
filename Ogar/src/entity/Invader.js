var Cell = require('./Cell');

function Invader() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 5;
}

module.exports = Invader;
Invader.prototype = new Cell();

// Main Functions

Invader.prototype.canEat = function (cell) {
    return cell.cellType != 5; // cannot consume other holes/invaders
};

Invader.prototype.onEat = function (cell) {
    this.setSize(this.gameServer.config.gamemodeInvadersMass);
	if(cell.cellType==3){
	cell.cellOwner.e++;
	this.gameServer.removeNode(this);
	}
};

Invader.prototype.move = function (border) {
    this.position.y += this.gameServer.f;
}

Invader.prototype.checkBorder = function (border) {
    if (this.position.y>border.maxy - this._size / 2) {
	this.gameServer.e=this.gameServer.tickCounter+250;
        while(1){
		if(this.gameServer.nodesInvader.length==0)break;
		this.gameServer.removeNode(this.gameServer.nodesInvader[0]);
		}
    }
};

Invader.prototype.onAdd = function (gameServer) {
	gameServer.nodesInvader.push(this);
};

Invader.prototype.onRemove = function(gameServer) {
	var index = gameServer.nodesInvader.indexOf(this);
    if (index != -1) {
        gameServer.nodesInvader.splice(index, 1);
    }
};