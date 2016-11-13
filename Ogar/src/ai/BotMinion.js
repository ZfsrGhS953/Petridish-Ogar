
// Petridish Ogar Minions module.

var PlayerTracker = require('../PlayerTracker');
var gameServer = require('../GameServer');

function BotMinion() {
    PlayerTracker.apply(this, Array.prototype.slice.call(arguments));
    //this.setColor(gameServer.getRandomColor());
	this.owner=null;
	this.mID=1;
	this.startSize=Math.sqrt(Math.random()*(this.gameServer.config.minionMaxStart-this.gameServer.config.minionMinStart)+this.gameServer.config.minionMinStart)*10;
	this.speed=this.gameServer.config.minionSpeed;
}

module.exports = BotMinion;
BotMinion.prototype = new PlayerTracker();

// Functions

BotMinion.prototype.update = function () { // Overrides the update function from player tracker
	if(this.gameServer.config.serverTeamingAllowed==0){
    this.massDecayMult = 1;
	var effectSum = this.Wmult + this.virusMult + this.splittingMult;
    this.Wmult *= 0.99944;
    this.virusMult *= 0.9984;
    this.splittingMult *= 0.9968;
    // Apply anti-teaming if required
    if (effectSum > 2.5)this.decay=1-effectSum*this.gameServer.config.playerDecayRate;
	}
	
    // Respawn if bot is dead
    if (this.cells.length <= 0) this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
    this.mouse.x=this.owner.mouse.x;
	this.mouse.y=this.owner.mouse.y;
};
