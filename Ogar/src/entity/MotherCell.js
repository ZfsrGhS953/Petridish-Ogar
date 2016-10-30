var Cell = require('./Cell');
var Food = require('./Food');
var Virus = require('./Virus');

function MotherCell() {
    Cell.apply(this, Array.prototype.slice.call(arguments));
    
    this.cellType = 2;
    this.isSpiked = true;
    this.isMotherCell = true;       // Not to confuse bots
    this.color=1793;
    this.motherCellMinSize = 150;   // vanilla 150 (mass = 150*150/100 = 225)
    this.motherCellSpawnAmount = 1;
    if (this.getSize() == 0) {
        this.setSize(this.motherCellMinSize);
    }
}

module.exports = MotherCell;
MotherCell.prototype = new Cell();

// Main Functions

MotherCell.prototype.canEat = function (cell) {
    return cell.cellType != 1;
};

MotherCell.prototype.onEaten = Virus.prototype.onEaten; // Copies the virus prototype function

//This is neccesary to consume viruses that are not moving
MotherCell.prototype.move = function (border) {
    var maxFood = this.gameServer.config.foodMaxAmount;
    if (this.gameServer.currentFood >= maxFood) {
        return;
    }
    var size1 = this.getSize();
    var size2 = this.gameServer.config.foodMinSize;
	var maxMass = this.gameServer.config.foodMaxSize*this.gameServer.config.foodMaxSize/100;
	if(Math.random()<0.04){
		// Spawn food with size2
        var angle = Math.random() * 2 * Math.PI;
        var r = this.getSize();
        var pos = {
            x: this.position.x + r * Math.sin(angle),
            y: this.position.y + r * Math.cos(angle)
        };
        
        // Spawn food
        var food = new Food(this.gameServer, null, pos, size2);
		var size = food._mass;
        var maxGrow = maxMass - size;
        size += maxGrow * Math.random();
        food.setSize(Math.sqrt(size)*10);
        food.color=Math.random()*1535.9999999;
        this.gameServer.addNode(food);
        
        // Eject to random distance
        food.setBoost(32 + 32 * Math.random(), angle);
	}
    for (var i = 0; i < this.motherCellSpawnAmount; i++) {
        size1 = Math.sqrt(size1 * size1 - size2 * size2);
        size1 = Math.max(size1, this.motherCellMinSize);
		if (this.gameServer.currentFood >= maxFood || size1 <= this.motherCellMinSize) {
            break;
        }
        this.setSize(size1);
        
        // Spawn food with size2
        var angle = Math.random() * 2 * Math.PI;
        var r = this.getSize();
        var pos = {
            x: this.position.x + r * Math.sin(angle),
            y: this.position.y + r * Math.cos(angle)
        };
        
        // Spawn food
        var food = new Food(this.gameServer, null, pos, size2);
		var size = food._mass;
        var maxGrow = maxMass - size;
        size += maxGrow * Math.random();
        food.setSize(Math.sqrt(size)*10);
        food.color=Math.random()*1535.9999999;
        this.gameServer.addNode(food);
        
        // Eject to random distance
        food.setBoost(32 + 32 * Math.random(), angle);
        
    }
}

MotherCell.prototype.onEat = function (prey,gameServer) {
    // Called to eat prey cell
    if(prey.cellType==2){
	this.setSize(Math.sqrt(this.getSizeSquared() + this.gameServer.config.virusGrowMass*prey.getSizeSquared()));
	}else{
		this.setSize(Math.sqrt(this.getSizeSquared() + prey.getSizeSquared()));
	}
}

MotherCell.prototype.setBoost = function (distance, angle) {
    this.isMoving = true;
        var index = this.gameServer.movingNodes.indexOf(this);
        if (index < 0)
            this.gameServer.movingNodes.push(this);
};

MotherCell.prototype.checkBorder = function (border) {
if(this._size>this.gameServer.config.spawnerMaxMass)this.setSize(this.gameServer.config.spawnerMaxMass);
};

MotherCell.prototype.onAdd = function () {
};

MotherCell.prototype.onRemove = function () {
};