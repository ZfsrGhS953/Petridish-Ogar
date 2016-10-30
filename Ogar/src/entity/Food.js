var Cell = require('./Cell');

function Food() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 1;
}

module.exports = Food;
Food.prototype = new Cell();

// Main Functions

Food.prototype.onAdd = function (gameServer) {
    gameServer.currentFood++;
	gameServer.nodesFood.push(this);
};

Food.prototype.onRemove = function(gameServer) {
    gameServer.currentFood--;
	var index = gameServer.nodesFood.indexOf(this);
    if (index != -1) {
        gameServer.nodesFood.splice(index, 1);
    }
};