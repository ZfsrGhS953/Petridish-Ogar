// Imports
var GameMode = require('../gamemodes');
var Entity = require('../entity');
var ini = require('./ini.js');
var Logger = require('./Logger');

function Commands() {
    this.list = {}; // Empty
}

module.exports = Commands;

// Utils
var fillChar = function(data, char, fieldLength, rTL) {
    var result = data.toString();
    if (rTL === true) {
        for (var i = result.length; i < fieldLength; i++)
            result = char.concat(result);
    } else {
        for (var i = result.length; i < fieldLength; i++)
            result = result.concat(char);
    }
    return result;
};

// Commands

Commands.list = {
    help: function(gameServer, split) {
        console.log("======================== HELP ======================");
        console.log("addbot [number]              : add bot to the server");
        console.log("kickbot [number]             : kick a number of bots");
        console.log("ban [PlayerID | IP]          : bans a(n) (player's) IP");
        console.log("banlist                      : get list of banned IPs.");
        console.log("board [string] [string] ...  : set scoreboard text");
        console.log("boardreset                   : reset scoreboard text");
        console.log("change [setting] [value]     : change specified settings");
        console.log("clear                        : clear console output");
        console.log("color [PlayerID] [R] [G] [B] : set cell(s) color by client ID");
        console.log("exit                         : stop the server");
        console.log("food [X] [Y] [mass]          : spawn food at specified Location");
        console.log("gamemode [id]                : change server gamemode");
        console.log("kick [PlayerID]              : kick player or bot by client ID");
        console.log("kickall                      : kick all players and bots");
        console.log("kill [PlayerID]              : kill cell(s) by client ID");
        console.log("killall                      : kill everyone");
        console.log("mass [PlayerID] [mass]       : set cell(s) mass by client ID");
        console.log("merge [PlayerID]             : merge all client's cells once");
		console.log("minion [PlayerID] [number]   : add minions to a player");
        console.log("name [PlayerID] [name]       : change cell(s) name by client ID");
        console.log("playerlist                   : get list of players and bots");
        console.log("pause                        : pause game , freeze all cells");
        console.log("reload                       : reload config");
        console.log("status                       : get server status");
        console.log("tp [PlayerID] [X] [Y]        : teleport player to specified location");
        console.log("unban [IP]                   : unban an IP");
        console.log("virus [X] [Y] [mass]         : spawn virus at a specified Location");
        console.log("pl                           : alias for playerlist");
        console.log("st                           : alias for status");
        console.log("====================================================");
    },
    debug: function(gameServer, split) {
        // Used for checking node lengths (for now)
        
        // Count client cells
        var clientCells = 0;
        for (var i in gameServer.clients) {
            clientCells += gameServer.clients[i].playerTracker.cells.length;
        }
        // Output node information
        console.log("Clients:        " + fillChar(gameServer.clients.length, " ", 4, true)      + " / " + gameServer.config.serverMaxConnections + " + bots");
        console.log("Total nodes:" + fillChar(gameServer.nodes.length, " ", 8, true));
        console.log("- Client cells: " + fillChar(clientCells, " ", 4, true)                    + " / " + (gameServer.clients.length * gameServer.config.playerMaxCells));
        console.log("- Ejected cells:" + fillChar(gameServer.nodesEjected.length, " ", 4, true));
        console.log("- Foods:        " + fillChar(gameServer.currentFood, " ", 4, true)         + " / " + gameServer.config.foodMaxAmount);
        console.log("- Viruses:      " + fillChar(gameServer.nodesVirus.length, " ", 4, true)   + " / " + gameServer.config.virusMaxAmount);
        console.log("Moving nodes:   " + fillChar(gameServer.movingNodes.length, " ", 4, true));
        console.log("Quad nodes:     " + fillChar(gameServer.quadTree.scanNodeCount(), " ", 4, true));
        console.log("Quad items:     " + fillChar(gameServer.quadTree.scanItemCount(), " ", 4, true));
    },
    addbot: function(gameServer, split) {
        var add = parseInt(split[1]);
        if (isNaN(add)) {
            add = 1; // Adds 1 bot if user doesnt specify a number
        }

        for (var i = 0; i < add; i++) {
            gameServer.bots.addBot();
        }
        console.log("Added " + add + " player bots");
    },
    ban: function (gameServer, split) {
        // Error message
        var logInvalid = "Please specify a valid player ID or IP address!";
        
        if (split[1] == null) {
            // If no input is given; added to avoid error
            Logger.warn(logInvalid);
            return;
        }

        if (split[1].indexOf(".") >= 0) {
            // If input is an IP address
            var ip = split[1];
            var ipParts = ip.split(".");
            
            // Check for invalid decimal numbers of the IP address
            for (var i in ipParts) {
                // If not numerical or if it's not between 0 and 255
                // TODO: Catch string "e" as it means "10^".
                if (isNaN(ipParts[i]) || ipParts[i] < 0 || ipParts[i] >= 256) {
                    Logger.warn(logInvalid);
                    return;
                }
            }
            
            if (ipParts.length != 4) {
                // an IP without 3 decimals
                Logger.warn(logInvalid);
                return;
            }
            
            gameServer.banIp(ip);
            return;
        }
        // if input is a Player ID
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            // If not numerical
            Logger.warn(logInvalid);
            return;
        }
        var ip = null;
        for (var i in gameServer.clients) {
            var client = gameServer.clients[i];
            if (client == null || !client.isConnected)
                continue;
            if (client.playerTracker.pID == id) {
                ip = client._socket.remoteAddress;
                break;
            }
        }
        if (ip)
            gameServer.banIp(ip);
        else
            Logger.warn("Player ID " + id + " not found!");
    },
    banlist: function(gameServer, split) {
        Logger.info("Showing " + gameServer.ipBanList.length + " banned IPs: ");
        console.log(" IP              | IP ");
        console.log("-----------------------------------");
        for (var i = 0; i < gameServer.ipBanList.length; i += 2) {
            console.log(" " + fillChar(gameServer.ipBanList[i], " ", 15) + " | " 
                    + (gameServer.ipBanList.length === i+1 ? "" : gameServer.ipBanList[i+1] )
            );
        }
    },
    kickbot: function(gameServer, split) {
        var toRemove = parseInt(split[1]);
        if (isNaN(toRemove)) {
            toRemove = -1; // Kick all bots if user doesnt specify a number
        }

        var removed = 0;
        var i = 0;
        while (i < gameServer.clients.length && removed != toRemove) {
            if (typeof gameServer.clients[i].remoteAddress == 'undefined') { // if client i is a bot kick him
                var client = gameServer.clients[i].playerTracker;
                var len = client.cells.length;
                for (var j = 0; j < len; j++) {
                    gameServer.removeNode(client.cells[0]);
                }
                client.socket.close();
                removed++;
            } else
                i++;
        }
        if (toRemove == -1)
            console.log("Kicked all bots (" + removed + ")");
        else if (toRemove == removed)
            console.log("Kicked " + toRemove + " bots");
        else
            console.log("Only " + removed + " bots could be kicked");
    },
    board: function(gameServer, split) {
        var newLB = [];
        for (var i = 1; i < split.length; i++) {
            if (split[i]) {
                newLB[i - 1] = split[i];
            } else {
                newLB[i - 1] = " ";
            }
        }

        // Clears the update leaderboard function and replaces it with our own
        gameServer.gameMode.packetLB = 48;
        gameServer.gameMode.specByLeaderboard = false;
        gameServer.gameMode.updateLB = function(gameServer) {
            gameServer.leaderboard = newLB;
            gameServer.leaderboardType = 48;
        };
        console.log("Successfully changed leaderboard values");
    },
    boardreset: function(gameServer) {
        // Gets the current gamemode
        var gm = GameMode.get(gameServer.gameMode.ID);

        // Replace functions
        gameServer.gameMode.packetLB = gm.packetLB;
        gameServer.gameMode.updateLB = gm.updateLB;
        console.log("Successfully reset leaderboard");
    },
    change: function(gameServer, split) {
        var key = split[1];
        var value = split[2];

        // Check if int/float
        if (value.indexOf('.') != -1) {
            value = parseFloat(value);
        } else {
            value = parseInt(value);
        }

        if (typeof gameServer.config[key] != 'undefined') {
            gameServer.config[key] = value;
            console.log("Set " + key + " to " + value);
        } else {
            console.log("Invalid config value");
        }
    },
    clear: function() {
        process.stdout.write("\u001b[2J\u001b[0;0H");
    },
    color: function(gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }

        var color = {
            r: 0,
            g: 0,
            b: 0
        };
        color.r = Math.max(Math.min(parseInt(split[2]), 255), 0);
        color.g = Math.max(Math.min(parseInt(split[3]), 255), 0);
        color.b = Math.max(Math.min(parseInt(split[4]), 255), 0);

        // Sets color to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                client.setColor(color); // Set color
                for (var j in client.cells) {
                    client.cells[j].setColor(color);
                }
                break;
            }
        }
    },
    exit: function(gameServer, split) {
        Logger.warn("Closing server...");
        gameServer.socketServer.close();
        process.exit(1);
    },
    food: function(gameServer, split) {
        var pos = {
            x: parseInt(split[1]),
            y: parseInt(split[2])
        };
        var mass = parseInt(split[3]);

        // Make sure the input values are numbers
        if (isNaN(pos.x) || isNaN(pos.y)) {
            Logger.warn("Invalid coordinates");
            return;
        }

        var size = gameServer.config.foodMinMass;
        if (!isNaN(mass)) {
            size = Math.sqrt(mass * 100);
        }

        // Spawn
        var cell = new Entity.Food(gameServer, null, pos, size);
        cell.setColor(gameServer.getRandomColor());
        gameServer.addNode(cell);
        console.log("Spawned 1 food cell at (" + pos.x + " , " + pos.y + ")");
    },
    gamemode: function(gameServer, split) {
        try {
            var n = parseInt(split[1]);
            var gm = GameMode.get(n); // If there is an invalid gamemode, the function will exit
            gameServer.gameMode.onChange(gameServer); // Reverts the changes of the old gamemode
            gameServer.gameMode = gm; // Apply new gamemode
            gameServer.gameMode.onServerInit(gameServer); // Resets the server
            console.log("Changed game mode to " + gameServer.gameMode.name);
        } catch (err) {
            Logger.error(err.stack);
            Logger.error("Invalid game mode selected");
        }
    },
    kick: function(gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
        gameServer.kickId(id);
    },
    kickall: function (gameServer, split) {
        gameServer.kickId(0);
    },
    kill: function(gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }

        var count = 0;
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                var len = client.cells.length;
                for (var j = 0; j < len; j++) {
                    gameServer.removeNode(client.cells[0]);
                    count++;
                }

                console.log("Removed " + count + " cells");
                break;
            }
        }
    },
    killall: function(gameServer, split) {
        var count = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            var playerTracker = gameServer.clients[i].playerTracker;
            while (playerTracker.cells.length > 0) {
                gameServer.removeNode(playerTracker.cells[0]);
                count++;
            }
        }
        console.log("Removed " + count + " cells");
    },
    mass: function(gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }

        var amount = Math.max(parseInt(split[2]), 9);
        if (isNaN(amount)) {
            Logger.warn("Please specify a valid number");
            return;
        }
        var size = Math.sqrt(amount * 100);

        // Sets mass to the specified amount
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                for (var j in client.cells) {
                    client.cells[j].setSize(size);
                }

                console.log("Set mass of " + client.name + " to " + (size*size/100).toFixed(3));
                break;
            }
        }
    },
    merge: function(gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        var set = split[2];
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }

        // Find client with same ID as player entered
        var client;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if (id == gameServer.clients[i].playerTracker.pID) {
                client = gameServer.clients[i].playerTracker;
                break;
            }
        }

        if (!client) {
            Logger.warn("Client is nonexistent!");
            return;
        }

        if (client.cells.length == 1) {
            Logger.warn("Client already has one cell!");
            return;
        }

        // Set client's merge override
        var state;
        if (set == "true") {
            client.mergeOverride = true;
            client.mergeOverrideDuration = 100;
            state = true;
        } else if (set == "false") {
            client.mergeOverride = false;
            client.mergeOverrideDuration = 0;
            state = false;
        } else {
            if (client.mergeOverride) {
                client.mergeOverride = false;
                client.mergeOverrideDuration = 0;
            } else {
                client.mergeOverride = true;
                client.mergeOverrideDuration = 100;
            }

            state = client.mergeOverride;
        }

        // Log
        if (state) console.log("Player " + id + " is now force merging");
        else console.log("Player " + id + " isn't force merging anymore");
    },
	minion: function(gameServer,split){
	
	var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }
		
	var add = parseInt(split[2]);
        if (isNaN(add)) {
            add = 1; // Adds 1 bot if user doesnt specify a number
        }
		
	var name = split.slice(3, split.length).join(' ');


            for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
				for (var i = 0; i < add; i++) {
                gameServer.bots.minionBot(client,name);
				}
                break;
            }
        }
        console.log("Added " + add + " player bots");
		},
    name: function(gameServer, split) {
        // Validation checks
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }

        var name = split.slice(2, split.length).join(' ');
        if (typeof name == 'undefined') {
            Logger.warn("Please type a valid name");
            return;
        }

        // Change name
        for (var i = 0; i < gameServer.clients.length; i++) {
            var client = gameServer.clients[i].playerTracker;

            if (client.pID == id) {
                console.log("Changing " + client.name + " to " + name);
                client.name = name;
                return;
            }
        }

        // Error
        Logger.warn("Player " + id + " was not found");
    },
    unban: function(gameServer, split) {
        if (split.length < 2 || split[1] == null || split[1].trim().length < 1) {
            Logger.warn("Please specify a valid IP!");
            return;
        }
        gameServer.unbanIp(split[1].trim());
    },
    playerlist: function(gameServer, split) {
        Logger.info("Showing " + gameServer.clients.length + " players: ");
        console.log(" ID     | IP              | P | " + fillChar('NICK', ' ', gameServer.config.playerMaxNickLength) + " | CELLS | SCORE  | POSITION    "); // Fill space
        console.log(fillChar('', '-', ' ID     | IP              |   |  | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength));
        for (var i = 0; i < gameServer.clients.length; i++) {
            var socket = gameServer.clients[i];
            var client = socket.playerTracker;

            // ID with 3 digits length
            var id = fillChar((client.pID), ' ', 6, true);

            // Get ip (15 digits length)
            var ip = "[BOT]";
            if (socket.isConnected != null) {
                ip = socket.remoteAddress;
            }
            ip = fillChar(ip, ' ', 15);
            var protocol = gameServer.clients[i].packetHandler.protocol;
            if (protocol == null)
                protocol = "?"
            // Get name and data
            var nick = '',
                cells = '',
                score = '',
                position = '',
                data = '';
            if (socket.closeReason != null) {
                // Disconnected
                var reason = "[DISCONNECTED] ";
                if (socket.closeReason.code)
                    reason += "[" + socket.closeReason.code + "] ";
                if (socket.closeReason.message)
                    reason += socket.closeReason.message;
                console.log(" " + id + " | " + ip + " | " + protocol + " | " + reason);
            } else if (!socket.packetHandler.protocol && socket.isConnected) {
                console.log(" " + id + " | " + ip + " | " + protocol + " | " + "[CONNECTING]");
            }else if (client.spectate) {
                try {
                    nick = gameServer.largestClient.getFriendlyName();
                } catch (err) {
                    Logger.error(err.stack);
                    // Specating in free-roam mode
                    nick = "in free-roam";
                }
                data = fillChar("SPECTATING: " + nick, '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength, true);
                console.log(" " + id + " | " + ip + " | " + protocol + " | " + data);
            } else if (client.cells.length > 0) {
                nick = fillChar(client.getFriendlyName(), ' ', gameServer.config.playerMaxNickLength);
                cells = fillChar(client.cells.length, ' ', 5, true);
                score = fillChar(client.getScore() >> 0, ' ', 6, true);
                position = fillChar(client.centerPos.x >> 0, ' ', 5, true) + ', ' + fillChar(client.centerPos.y >> 0, ' ', 5, true);
                console.log(" " + id + " | " + ip + " | " + protocol + " | " + nick + " | " + cells + " | " + score + " | " + position);
            } else {
                // No cells = dead player or in-menu
                data = fillChar('DEAD OR NOT PLAYING', '-', ' | CELLS | SCORE  | POSITION    '.length + gameServer.config.playerMaxNickLength, true);
                console.log(" " + id + " | " + ip + " | " + protocol + " | " + data);
            }
        }
    },
    pause: function(gameServer, split) {
        gameServer.run = !gameServer.run; // Switches the pause state
        var s = gameServer.run ? "Unpaused" : "Paused";
        console.log(s + " the game.");
    },
    reload: function(gameServer) {
        gameServer.loadConfig();
        gameServer.loadIpBanList();
        console.log("Reloaded the config file successfully");
    },
    status: function(gameServer, split) {
        // Get amount of humans/bots
        var humans = 0,
            bots = 0;
        for (var i = 0; i < gameServer.clients.length; i++) {
            if ('_socket' in gameServer.clients[i]) {
                humans++;
            } else {
                bots++;
            }
        }
        
        console.log("Connected players: " + gameServer.clients.length + "/" + gameServer.config.serverMaxConnections);
        console.log("Players: " + humans + " - Bots: " + bots);
        console.log("Server has been running for " + Math.floor(process.uptime()/60) + " minutes");
        console.log("Current memory usage: " + Math.round(process.memoryUsage().heapUsed / 1048576 * 10)/10 + "/" + Math.round(process.memoryUsage().heapTotal / 1048576 * 10)/10 + " mb");
        console.log("Current game mode: " + gameServer.gameMode.name);
        console.log("Current update time: " + gameServer.updateTimeAvg.toFixed(3) + " [ms]  (" + ini.getLagMessage(gameServer.updateTimeAvg) + ")");
    },
    tp: function(gameServer, split) {
        var id = parseInt(split[1]);
        if (isNaN(id)) {
            Logger.warn("Please specify a valid player ID!");
            return;
        }

        // Make sure the input values are numbers
        var pos = {
            x: parseInt(split[2]),
            y: parseInt(split[3])
        };
        if (isNaN(pos.x) || isNaN(pos.y)) {
            Logger.warn("Invalid coordinates");
            return;
        }

        // Spawn
        for (var i in gameServer.clients) {
            if (gameServer.clients[i].playerTracker.pID == id) {
                var client = gameServer.clients[i].playerTracker;
                for (var j in client.cells) {
                    client.cells[j].setPosition(pos);
                    gameServer.updateNodeQuad(client.cells[j]);
                }

                console.log("Teleported " + client.name + " to (" + pos.x + " , " + pos.y + ")");
                break;
            }
        }
    },
    virus: function(gameServer, split) {
        var pos = {
            x: parseInt(split[1]),
            y: parseInt(split[2])
        };
        var mass = parseInt(split[3]);

        // Make sure the input values are numbers
        if (isNaN(pos.x) || isNaN(pos.y)) {
            Logger.warn("Invalid coordinates");
            return;
        }
        var size = gameServer.config.virusMinSize;
        if (!isNaN(mass)) {
            size = Math.sqrt(mass * 100);
        }

        // Spawn
        var v = new Entity.Virus(gameServer, null, pos, size);
        gameServer.addNode(v);
        console.log("Spawned 1 virus at (" + pos.x + " , " + pos.y + ")");
    },
    //Aliases
    st: function (gameServer, split) {
        Commands.list.status(gameServer, split);
    },
    pl: function(gameServer, split){
        Commands.list.playerlist(gameServer, split);
    }
};