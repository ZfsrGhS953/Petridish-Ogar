var Mode = require('./Mode');

function Teams() {
    Mode.apply(this, Array.prototype.slice.call(arguments));

    this.ID = 1;
    this.name = "Teams";
    this.decayMod = 1.5;
    this.haveTeams = true;
}

module.exports = Teams;
Teams.prototype = new Mode();

//Gamemode Specific Functions

// Override

Teams.prototype.onPlayerSpawn = function(gameServer, player) {
    // Random color based on team
    player.color=(player.team*512-16+Math.random()*32);
	if(player.color<0)player.color+=1536;
    // Spawn player
    gameServer.spawnPlayer(player);
};

Teams.prototype.onServerInit = function(gameServer) {
    // migrate current players to team mode
    for (var i = 0; i < gameServer.clients.length; i++) {
        var client = gameServer.clients[i].playerTracker;
        this.onPlayerInit(client);
        client.color=(client.team*512-16+Math.random()*32);
		if(client.color<0)client.color+=1536;
        for (var j = 0; j < client.cells.length; j++) {
            var cell = client.cells[j];
            cell.color=client.color;
        }
    }
};

Teams.prototype.onPlayerInit = function(player) {
    // Get random team
    player.team = Math.floor(Math.random() * 2.9999999999);
};

Teams.prototype.updateLB = function(gameServer) {
    gameServer.leaderboardType = 50;
    var teamMass=[0,0,0];
	var total=0;
	var max=0;
    // Loop through all clients
    for (var i = 0; i < gameServer.clients.length; i++) {
        var client = gameServer.clients[i];
        if (client == null) continue;

        var player = client.playerTracker;
        if (player.isRemoved)
            continue; // Don't add disconnected players to list
        
		if(player.mID||player.bp){
		player.score=0;
    for (var o = 0; o < player.cells.length; o++) {
        var node = player.cells[o];
        if (node == null) continue;
        player.score += node._mass;
    }
	}
		var score = player.getScore();
        teamMass[player.team] += score;
		total += score;
		if(score>max){
		this.rankOne=player;	
		max=score;
	}
	}
    for (var i = 0; i < 3; i++) {
        gameServer.leaderboard[i] = teamMass[i] / total;
    }
};
