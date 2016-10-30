var FFA = require('./FFA'); // Base gamemode
var Entity = require('../entity');
var Logger = require('../modules/Logger');

function Experimental() {
    FFA.apply(this, Array.prototype.slice.call(arguments));

    this.ID = 2;
    this.name = "Experimental";
    this.specByLeaderboard = true;

    // Gamemode Specific Variables
    this.nodesMother = [];
    this.tickMotherSpawn = 0;
    this.tickMotherUpdate = 0;

    // Config
    this.motherSpawnInterval = 0;  // How many ticks it takes to spawn another mother cell (5 seconds)
    this.motherUpdateInterval = 0;     // How many ticks it takes to spawn mother food (1 second)
    this.motherMinAmount = 7;
}

module.exports = Experimental;
Experimental.prototype = new FFA();

// Gamemode Specific Functions

Experimental.prototype.spawnMotherCell = function (gameServer) {
    // Checks if there are enough mother cells on the map
    if (this.nodesMother.length >= this.motherMinAmount) {
        return;
    }
    // Spawns a mother cell
    var pos = gameServer.getRandomSpawn(150);
    if (pos == null) {
        // cannot find safe position => do not spawn
        return;
    }
    // Spawn if no cells are colliding
    var mother = new Entity.MotherCell(gameServer, null, pos, null);
    gameServer.addNode(mother);
	mother.setBoost(0,0);
};

// Override

Experimental.prototype.onServerInit = function(gameServer) {
    // Called when the server starts
    gameServer.run = true;

    var mapSize = Math.max(gameServer.border.width, gameServer.border.height);

    var self = this;
    // Override
    
    // Special virus mechanics
    Entity.Virus.prototype.onEat = function(prey) {
        // Pushes the virus
        var angle = prey.isMoving ? prey.getAngle() : this.getAngle();
        this.addBoost(100, angle,780);
    };
    Entity.MotherCell.prototype.onAdd = function () {
        self.nodesMother.push(this);
    };
    Entity.MotherCell.prototype.onRemove = function () {
        var index = self.nodesMother.indexOf(this);
        if (index != -1) {
            self.nodesMother.splice(index, 1);
        }
    };
    //gameServer.getRandomSpawn = gameServer.getRandomPosition;
};

Experimental.prototype.onChange = function (gameServer) {
    /* Remove all mother cells
    for (var i in this.nodesMother) {
        gameServer.removeNode(this.nodesMother[i]);
    }
    this.nodesMother = [];*/
    // Add back default functions
    Entity.Virus.prototype.onEat = require('../Entity/Virus').prototype.onEat;
    Entity.MotherCell.prototype.onAdd = require('../Entity/MotherCell').prototype.onAdd;
    Entity.MotherCell.prototype.onRemove = require('../Entity/MotherCell').prototype.onRemove;
    //gameServer.getRandomSpawn = require('../GameServer').prototype.getRandomSpawn;
};

Experimental.prototype.onTick = function(gameServer) {
    // Mother Cell Spawning
    if (this.tickMotherSpawn >= this.motherSpawnInterval) {
        this.tickMotherSpawn = 0;
        this.spawnMotherCell(gameServer);
    } else {
        this.tickMotherSpawn++;
    }
};

