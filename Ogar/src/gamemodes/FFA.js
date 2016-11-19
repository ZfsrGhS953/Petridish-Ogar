var Mode = require('./Mode');

function FFA() {
    Mode.apply(this, Array.prototype.slice.call(arguments));

    this.ID = 0;
    this.name = "Free For All";
    this.specByLeaderboard = true;
}

module.exports = FFA;
FFA.prototype = new Mode();

// Gamemode Specific Functions

FFA.prototype.leaderboardAddSort = function(player, leaderboard) {
    // Adds the player and sorts the leaderboard
    var len = leaderboard.length - 1;
    var loop = true;
    while ((len >= 0) && (loop)) {
        // Start from the bottom of the leaderboard
        if (player.getScore() <= leaderboard[len].getScore()) {
            leaderboard.splice(len + 1, 0, player);
            loop = false; // End the loop if a spot is found
        }
        len--;
    }
    if (loop) {
        // Add to top of the list because no spots were found
        leaderboard.splice(0, 0, player);
    }
};

// Override

FFA.prototype.onPlayerSpawn = function(gameServer, player) {
    // Spawn player
	player.color=Math.random()*1535.9999999;
    gameServer.spawnPlayer(player);
};

FFA.prototype.updateLB = function(gameServer) {
    gameServer.leaderboardType = 49;
    var lb = gameServer.leaderboard;
    // Loop through all clients
    for (var i = 0; i < gameServer.clients.length; i++) {
        var client = gameServer.clients[i];
        if (client == null) continue;

        var player = client.playerTracker;
        if (player.isRemoved)
            continue; // Don't add disconnected players to list
        
        if (player.cells.length <= 0)
            continue;

		if(player.mID){
		player.score=0;
    for (var o = 0; o < player.cells.length; o++) {
        var node = player.cells[o];
        if (node == null) continue;
        player.score += node._mass;
    }
	}
		var playerScore = player.getScore();
		
        if (lb.length == 0) {
            // Initial player
            lb.push(player);
            continue;
        } else if (lb.length < gameServer.config.serverMaxLB) {
            this.leaderboardAddSort(player, lb);
        } else {
            // 10 in leaderboard already
            if (playerScore > lb[gameServer.config.serverMaxLB - 1].getScore()) {
                lb.pop();
                this.leaderboardAddSort(player, lb);
            }
        }
    }

    this.rankOne = lb[0];
}
