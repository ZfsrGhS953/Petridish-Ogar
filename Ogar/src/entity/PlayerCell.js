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

PlayerCell.prototype.updateRemerge = function () {
    var age = this.getAge(this.gameServer.getTick());
    if (age < 14) {
        // do not remerge if cell age is smaller than 15 ticks
        this._canRemerge = false;
        return;
    }
    var baseTtr = this.gameServer.config.playerRecombineTime;        // default baseTtr = 30
    var ttr = baseTtr + this._mass * 0.5;   // ttr in seconds
	if (baseTtr == 0) {
        // instant merge
        ttr = 25;
    }
    this._canRemerge = age >= ttr;
}

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

// Movement

PlayerCell.prototype.moveUser = function (border) {
    if (this.owner == null || this.owner.socket.isConnected === false) {
        return;
    }
	if(this.gameServer.config.gamemodeEatForSpeed==1&&this.gameServer.time>-1&&this.gameServer.time<75){
	this.position.x=-1e999;
	this.setSize(this.gameServer.config.playerStartSize);
	}else{
    var x = this.owner.mouse.x;
    var y = this.owner.mouse.y;
    if (isNaN(x) || isNaN(y)) {
        return;
    }
    var dx = x - this.position.x;
    var dy = y - this.position.y;
    var squared = dx * dx + dy * dy;
    	if(this.owner.a==1&&this._mass>12.2){
		this.setSize(Math.sqrt(this._mass-3.2)*10);
		var cx = this.owner.mouse.x - this.position.x;
        var cy = this.owner.mouse.y - this.position.y;
        var dl = cx * cx + cy * cy;
        if (dl < 1) {
            cx = 0;
            cy = 1;
        } else {
            dl = Math.sqrt(dl);
            cx /= dl;
            cy /= dl;
        }
        // Get starting position
        var pos = {
            x: this.position.x - cx * this._size,
            y: this.position.y - cy * this._size
        };
        
        var angle = Math.atan2(cx, cy);
        if (isNaN(angle)) angle = 0;
        // Create cell
        var ejected = new Ejection(this.owner.gameServer, null, pos, 12.649110640673517328);
        ejected.setColor(this.getColor());
		this.gameServer.addNode(ejected);
        ejected.setBoost(this.owner.gameServer.config.ejectSpeed, angle-3.141592653589793);
	}
    if (squared == 0) return;
    
    // distance
    var d = Math.sqrt(squared);
    
    // normal
    var nx = dx / d;
    var ny = dy / d;
    
    var speed = this.getSpeed();
		if(this.owner.a==1&&this._mass>12.25){
		speed+=20;
	}
	if (speed <= 0) return;
    this.position.x += nx * Math.min(d,speed);
    this.position.y += ny * Math.min(d,speed);
	}
    this.checkBorder(border);
};

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
