// Library imports
var WebSocket = require('ws');
var http = require('http');
var fs = require("fs");
var ini = require('./modules/ini.js');
var os = require("os");
var QuadNode = require('./QuadNode.js');
var PlayerCommand = require('./modules/PlayerCommand');

// Project imports
var Packet = require('./packet');
var PlayerTracker = require('./PlayerTracker');
var PacketHandler = require('./PacketHandler');
var Entity = require('./entity');
var Gamemode = require('./gamemodes');
var BotLoader = require('./ai/BotLoader');
var Logger = require('./modules/Logger');

// GameServer implementation
function GameServer() {
    // Startup
	this.e=0;
	this.f=0;
	this.g=0;
	this.h=0;
	this.time=0;
	this.winner=0;
	this.hasWinner=0;
	this.raceNum=0;
	this.t=0;
	this.s=0;
	this.m=0;
	this.chat=[];
	this.chatowners=[];
	this.realStats=[];
    this.run = true;
    this.lastNodeId = 1;
    this.lastPlayerId = 1;
    this.clients = [];
    this.largestClient; // Required for spectators
    this.nodes = [];
    this.nodesVirus = [];   // Virus nodes
    this.nodesEjected = []; // Ejected mass nodes
	this.nodesFood = [];
	this.nodesInvader = [];
    this.quadTree = null;

    this.currentFood = 0;
    this.movingNodes = []; // For move engine
    this.leaderboard = [];
    this.leaderboardType = -1; // no type

    this.bots = new BotLoader(this);
    this.commands; // Command handler

    // Main loop tick
    this.startTime = +new Date;
    this.timeStamp = 0;
    this.updateTime = 0;
    this.updateTimeAvg = 0;
    this.timerLoopBind = null;
    this.mainLoopBind = null;
    
    this.tickCounter = 0;
    this.tickSpawn = 0; // Used with spawning food
    
    this.setBorder(10000, 10000);

    // Config
    this.config = {
        serverTimeout: 30,          // Seconds to keep connection alive for non-responding client
        serverMaxConnections: 64,   // Maximum number of connections to the server. (0 for no limit)
        serverIpLimit: 4,           // Maximum number of connections from the same IP (0 for no limit)
        serverPort: 443,            // Server port
        serverTracker: 0,           // Set to 1 if you want to show your server on the tracker http://ogar.mivabe.nl/master
        serverGamemode: 0,          // Gamemode, 0 = FFA, 1 = Teams
        serverBots: 0,              // Number of player bots to spawn
        serverViewBaseX: 1920,      // Base client screen resolution. Used to calculate view area. Warning: high values may cause lag
        serverViewBaseY: 1080,      // min value is 1920x1080
        serverSpectatorScale: 0.4,  // Scale (field of view) used for free roam spectators (low value leads to lags, vanilla=0.4, old vanilla=0.25)
        serverStatsPort: 88,        // Port for stats server. Having a negative number will disable the stats server.
        serverStatsUpdate: 60,      // Update interval of server stats in seconds
        serverLogLevel: 1,          // Logging level of the server. 0 = No logs, 1 = Logs the console, 2 = Logs console and ip connections
        serverTeamingAllowed : 1,
		serverScrambleCoords: 1,    // Toggles scrambling of coordinates. 0 = No scrambling, 1 = lightweight scrambling. 2 = full scrambling (also known as scramble minimap, a little slow, some clients may not support it)
        serverScrambleColors: 0,
		serverMaxLB: 10,            // Controls the maximum players displayed on the leaderboard.
        serverChat: 1,              // Set to 1 to allow chat; 0 to disable chat.
        serverName: '', // Server name
        serverWelcome1: '',      // First server welcome message
        serverWelcome2: '',         // Second server welcome message (for info, etc)
		
		gamemodeDeathmatch: 0,
		gamemodeSnakerDish: 0,
		gamemodeBlackHole: 0,
		gamemodeCrazy: 0,
		gamemodeSpaceInvaders: 0,
		gamemodeLeap: 0,
		gamemodeLeapMassLoss: 0.99,
		gamemodeEatForSpeed: 0,
		gamemodeSpeedMinMass: 19,
        gamemodeSpeedMassLoss: 5,
        gamemodeSpeedMass: 5,
		gamemodeInvadersMinAmount: 49,
		gamemodeInvadersMass: 514,
        gamemodeVirusWarsMinMass: 1e999,
        gamemodeVirusWarsMassLoss: 250,
		gamemodeBlackHoleAmount: 0,
        gamemodeBlackHoleSpeed: 1,
        gamemodeBlackHoleMass: 5000,
        
        borderWidth: 14142,         // Map border size (Vanilla value: 14142)
        borderHeight: 14142,        // Map border size (Vanilla value: 14142)
        
        foodMinSize: 10,            // Minimum food size (vanilla 10)
        foodMaxSize: 20,            // Maximum food size (vanilla 20)
        foodMinAmount: 1000,         // Minimum food cells on the map
        foodMaxAmount: 2000,        // Maximum food cells on the map
        foodSpawnAmount: 10,        // The number of food to spawn per interval
        foodMassGrow: 1,            // Enable food mass grow ?
		foodMaxGrow: 4,
		foodGrowTimeout: 4167,
		foodGrowAmount: 1,
        spawnInterval: 20,          // The interval between each food cell spawn in ticks (1 tick = 50 ms)
        
        virusMinSize: 100,          // Minimum virus size (vanilla 100)
        virusMaxSize: 140,          // Maximum virus size (vanilla 140)
        virusMinAmount: 10,         // Minimum number of viruses on the map.
        virusMaxAmount: 50,         // Maximum number of viruses on the map. If this number is reached, then ejected cells will pass through viruses.
		virusGrowMass: 1,
		spawnerMaxMass: 1e999,
        
        ejectSize: 38,              // Size of ejected cells (vanilla 38)
		ejectMassLoss: 16,
		ejectSpeed: 780,
        ejectCooldown: 3,           // min ticks between ejects
        ejectSpawnPlayer: 1,        // if 1 then player may be spawned from ejected mass
        
        playerMinSize: 32,          // Minimum size of the player cell (mass = 32*32/100 = 10.24)
        playerMaxSize: 1500,        // Maximum size of the player cell (mass = 1500*1500/100 = 22500)
        playerMinSplitSize: 60,     // Minimum player cell size allowed to split (mass = 60*60/100 = 36) 
		playerMinEjectMass: 32,
		playerBotGrowMass: 20,
		playerMassAbsorbed: 1,
        playerStartSize: 64,        // Start size of the player cell (mass = 64*64/100 = 41)
        playerMaxCells: 16,         // Max cells the player is allowed to have
        playerSpeed: 1,             // Player speed multiplier
        playerDecayRate: .002,      // Amount of player cell size lost per second
        playerRecombineTime: 30,    // Base time in seconds before a cell is allowed to recombine
		playerExtendedSplits: 0,
        playerMaxNickLength: 15,    // Maximum nick length
        playerDisconnectTime: 60,   // The time in seconds it takes for a player cell to be removed after disconnection (If set to -1, cells are never removed)
        
        tourneyMaxPlayers: 12,      // Maximum number of participants for tournament style game modes
        tourneyPrepTime: 10,        // Number of ticks to wait after all players are ready (1 tick = 1000 ms)
        tourneyEndTime: 30,         // Number of ticks to wait after a player wins (1 tick = 1000 ms)
        tourneyTimeLimit: 20,       // Time limit of the game, in minutes.
        tourneyAutoFill: 0,         // If set to a value higher than 0, the tournament match will automatically fill up with bots after this amount of seconds
        tourneyAutoFillPlayers: 1,  // The timer for filling the server with bots will not count down unless there is this amount of real players
    };
    
    this.ipBanList = [];
    
    // Parse config
    this.loadConfig();
    this.loadIpBanList();
	
    this.setBorder(this.config.borderWidth, this.config.borderHeight);
    this.quadTree = new QuadNode(this.border, 0, null);
    
    // Gamemodes
    this.gameMode = Gamemode.get(this.config.serverGamemode);
	this.config.playerDecayRate*=this.gameMode.decayMod;
}

module.exports = GameServer;

GameServer.prototype.start = function() {
    this.timerLoopBind = this.timerLoop.bind(this);
    this.mainLoopBind = this.mainLoop.bind(this);
    
    // Gamemode configurations
    this.gameMode.onServerInit(this);
    
    var options = {
        port: this.config.serverPort,
        perMessageDeflate: false
    };

    // Start the server
    this.socketServer = new WebSocket.Server(options, this.onServerSocketOpen.bind(this));
    this.socketServer.on('error', this.onServerSocketError.bind(this));
    this.socketServer.on('connection', this.onClientSocketOpen.bind(this));

    this.startStatsServer(this.config.serverStatsPort);
};

GameServer.prototype.onServerSocketError = function (error) {
    switch (error.code) {
        case "EADDRINUSE":
            Logger.error("Server could not bind to port " + this.config.serverPort + "! Please close out of Skype or change 'serverPort' in gameserver.ini to a different number.");
            break;
        case "EACCES":
            Logger.error("Please make sure you are running Ogar with root privileges.");
            break;
        default:
            Logger.error(error.code + ": " + error.message);
            break;
    }
    process.exit(1); // Exits the program
};

GameServer.prototype.onServerSocketOpen = function () {
    // Spawn starting food
    this.startingFood();
    
    // Start Main Loop
    setTimeout(this.timerLoopBind, 1);
    
    // Done
    Logger.info("Listening on port " + this.config.serverPort);
    Logger.info("Current game mode is " + this.gameMode.name);
    
    // Player bots (Experimental)
    if (this.config.serverBots > 0) {
        for (var i = 0; i < this.config.serverBots; i++) {
            this.bots.addBot();
        }
        Logger.info("Added " + this.config.serverBots + " player bots");
    }
};

GameServer.prototype.onClientSocketOpen = function (ws) {
ws.on('error',function(a){});
    // Check blacklist first (if enabled).
    if (this.ipBanList && this.ipBanList.length > 0 && this.ipBanList.indexOf(ws._socket.remoteAddress) >= 0) {
        // IP banned
        ws.close(1000, "IP banned");
        return;
    }
    var totalConnections = 0;
    var ipConnections = 0;
    for (var i = 0; i < this.clients.length; i++) {
        var socket = this.clients[i];
        if (socket == null || socket.isConnected == null)
            continue;
        totalConnections++;
        if (socket.isConnected && socket.remoteAddress == ws._socket.remoteAddress)
            ipConnections++;
    }
    if (this.config.serverMaxConnections > 0 && totalConnections >= this.config.serverMaxConnections) {
        // Server full
        ws.close(1000, "No slots");
        return;
    }
    if (this.config.serverIpLimit > 0 && ipConnections >= this.config.serverIpLimit) {
        // IP limit reached
        ws.close(1000, "IP limit reached");
        return;
    }
    ws.isConnected = true;
    ws.remoteAddress = ws._socket.remoteAddress;
    ws.remotePort = ws._socket.remotePort;
    ws.lastAliveTime = +new Date;
    Logger.write("CONNECTED " + ws.remoteAddress + ":" + ws.remotePort + ", origin: \"" + ws.upgradeReq.headers.origin + "\"");
    
    ws.playerTracker = new PlayerTracker(this, ws);
    ws.packetHandler = new PacketHandler(this, ws);
    ws.playerCommand = new PlayerCommand(this, ws.playerTracker);
    
    var gameServer = this;
    var onMessage = function (message) {
        gameServer.onClientSocketMessage(ws, message);
    };
    var onError = function (error) {
        gameServer.onClientSocketError(ws, error);
    };
    var onClose = function (reason) {
        gameServer.onClientSocketClose(ws, reason);
    };
    ws.on('message', onMessage);
    ws.on('error', onError);
    ws.on('close', onClose);
    this.clients.push(ws);
};

GameServer.prototype.onClientSocketClose = function (ws, code) {
    ws.isConnected = false;
    ws.sendPacket = function (data) { };
    ws.closeReason = { code: ws._closeCode, message: ws._closeMessage };
    ws.closeTime = +new Date;
    Logger.write("DISCONNECTED " + ws.remoteAddress + ":" + ws.remotePort + ", code: " + ws._closeCode + ", reason: \"" + ws._closeMessage + "\", name: \""+ws.playerTracker.getName()+"\"");
    /*var color = Math.min(255, (rgb.r * 0.2125 + rgb.g * 0.7154 + rgb.b * 0.0721))+1536;
    ws.playerTracker.color=color;
    ws.playerTracker.setSkin("");
    // disconnected effect
    ws.playerTracker.cells.forEach(function (cell) {
        cell.color=color;
    }, this);*/
};

GameServer.prototype.onClientSocketError = function (ws, error) {
    ws.sendPacket = function (data) { };
};

GameServer.prototype.onClientSocketMessage = function (ws, message) {
    ws.packetHandler.handleMessage(message);
};

GameServer.prototype.setBorder = function(width, height) {
    var hw = width / 2;
    var hh = height / 2;
    this.border = {
        minx: -hw,
        miny: -hh,
        maxx: hw,
        maxy: hh,
        width: width,
        height: height,
        centerx: 0,
        centery: 0
    };
};

GameServer.prototype.getTick = function () {
    return this.tickCounter;
};

GameServer.prototype.getMode = function () {
    return this.gameMode;
};

GameServer.prototype.getNextNodeId = function() {
    // Resets integer
    if (this.lastNodeId > 2147483647) {
        this.lastNodeId = 1;
    }
    return this.lastNodeId++;
};

GameServer.prototype.getNewPlayerID = function() {
    // Resets integer
    if (this.lastPlayerId > 2147483647) {
        this.lastPlayerId = 1;
    }
    return this.lastPlayerId++;
};

GameServer.prototype.getRandomPosition = function() {
    return {
        x: this.border.minx + this.border.width * Math.random(),
        y: this.border.miny + this.border.height * Math.random()
    };
};

GameServer.prototype.getRandomSpawn = function(size) {
    // Random and secure spawns for players and viruses
    var pos = this.getRandomPosition();
    var unsafe = this.willCollide(pos, size);
    if (!unsafe) return pos;
    return null;
};

GameServer.prototype.getRandomPlayerSpawn = function(size) {
    if(this.config.gamemodeSpaceInvaders==1){
    return {
        x: this.border.minx + this.border.width * Math.random(),
        y: this.border.maxy
    };
	}
	if(this.config.gamemodeEatForSpeed==1){
	return {
	x: this.border.minx,
    y: this.border.miny + this.border.width * Math.random()
	};
	}
	// Random and secure spawns for players and viruses
    var pos = this.getRandomPosition();
    var unsafe = this.willCollide(pos, size);
    if (!unsafe) return pos;
};

GameServer.prototype.updateNodeQuad = function (node) {
    var quadItem = node.quadItem;
    if (quadItem == null) {
        return;
    }
    // check for change
    if (node.position.x == quadItem.x &&
        node.position.y == quadItem.y &&
        node._size == quadItem.size) {
        // no change
        return;
    }
    // update quadTree
    quadItem.x = node.position.x;
    quadItem.y = node.position.y;
    quadItem.size = node._size;
    quadItem.bound = {
        minx: node.quadItem.x - node.quadItem.size,
        miny: node.quadItem.y - node.quadItem.size,
        maxx: node.quadItem.x + node.quadItem.size,
        maxy: node.quadItem.y + node.quadItem.size
    };
    this.quadTree.update(quadItem);
};


GameServer.prototype.addNode = function(node) {
    node.quadItem = {
        cell: node,
        x: node.position.x,
        y: node.position.y,
        size: node._size
    };
    node.quadItem.bound = {
        minx: node.quadItem.x - node.quadItem.size,
        miny: node.quadItem.y - node.quadItem.size,
        maxx: node.quadItem.x + node.quadItem.size,
        maxy: node.quadItem.y + node.quadItem.size
    };
    this.quadTree.insert(node.quadItem);
    
    this.nodes.push(node);

    // Adds to the owning player's screen
    if (node.owner) {
        node.color=node.owner.color;
        node.owner.cells.push(node);
    }

    // Special on-add actions
    node.onAdd(this);
};

GameServer.prototype.removeNode = function(node) {
    if (node.quadItem == null) {
        return;
    }
    node.isRemoved = true;
    node.quadItem._quadNode.remove(node.quadItem);
    node.quadItem = null;
    
    // Remove from main nodes list
    var index = this.nodes.indexOf(node);
    if (index != -1) {
        this.nodes.splice(index, 1);
    }

    // Remove from moving cells list
    index = this.movingNodes.indexOf(node);
    if (index != -1) {
        this.movingNodes.splice(index, 1);
    }

    // Special on-remove actions
    node.onRemove(this);
};

GameServer.prototype.onChatMessage = function (from, to, message) {
    if (message == null) return;
    message = message.trim();
    if (message == "") return;
    if (from && message.length > 0 && message[0] == '/') {
        // player command
        message = message.slice(1, message.length);
        from.socket.playerCommand.executeCommandLine(message);
        return;
    }
    if (message.length > 128) message = message.slice(0, 128);
    //Logger.debug("[CHAT] " + (from!=null && from.getName().length>0 ? from.getName() : "Spectator") + ": " + message);
    this.sendChatMessage(from, to, message);
};

GameServer.prototype.sendChatMessage = function (from, to, message) {
    for (var i = 0; i < this.clients.length; i++) {
        var client = this.clients[i];
        if (client == null) continue;
        if (to == null || to == client.playerTracker)
            client.sendPacket(new Packet.ChatMessage(from, message));
    }
}; 

GameServer.prototype.timerLoop = function () {
    var timeStep = this.updateTimeAvg >> 0;
    timeStep += 5;
    timeStep = Math.max(timeStep, 40);
    
    var ts = new Date().getTime();
    var dt = ts - this.timeStamp;
    if (dt < timeStep - 5) {
        setTimeout(this.timerLoopBind, ((timeStep-5) - dt) >> 0);
        return;
    }
    if (dt < timeStep - 1) {
        setTimeout(this.timerLoopBind, 0);
        return;
    }
    if (dt < timeStep) {
        //process.nextTick(this.timerLoopBind);
        setTimeout(this.timerLoopBind, 0);
        return;
    }
    // update average
    this.updateTimeAvg += 0.5 * (this.updateTime - this.updateTimeAvg);
    // calculate next
    if (this.timeStamp == 0)
        this.timeStamp = ts;
    this.timeStamp += timeStep;
    //process.nextTick(this.mainLoopBind);
    //process.nextTick(this.timerLoopBind);
    setTimeout(this.mainLoopBind, 0);
    setTimeout(this.timerLoopBind, 0);
};

GameServer.prototype.mainLoop = function() {
    var tStart = new Date().getTime();
    
    // Loop main functions
    if (this.run) {
    var tick = this.getTick();
	
	// Move moving cells
    for (var i = 0; i < this.movingNodes.length; ) {
        var cell1 = this.movingNodes[i];
        if (cell1.isRemoved)
            continue;
        cell1.move(this.border);
        this.updateNodeQuad(cell1);
        if (!cell1.isMoving)
            this.movingNodes.splice(i, 1);
        else
            i++;
    }
    
    // === check for collisions ===
    
    // Scan for player cells collisions
    var self = this;
    var rigidCollisions = [];
    var eatCollisions = [];
    for (var i in this.clients) {
        var client = this.clients[i].playerTracker;
        for (var j = 0; j < client.cells.length; j++) {
            var cell1 = client.cells[j];
            if (cell1 == null) continue;
            this.quadTree.find(cell1.quadItem.bound, function (item) {
                var cell2 = item.cell;
                if (cell2 == cell1) return;
                var manifold = self.checkCellCollision2(cell1, cell2);
                if (self.checkRigidCollision(manifold))
                    rigidCollisions.push({ cell1: cell1, cell2: cell2 });
                else
                    eatCollisions.push({ cell1: cell1, cell2: cell2 });
            });
        }
    }
    
    // resolve rigid body collisions
    for (var z = 0; z < 20; z++) { // loop for better rigid body resolution quality (slow)
        for (var k = 0; k < rigidCollisions.length; k++) {
            var c = rigidCollisions[k];
            var manifold = this.checkCellCollision(c.cell1, c.cell2);
            if (manifold == null) continue;
            this.resolveRigidCollision(manifold);
        }
    }

    rigidCollisions = null;
    
    // resolve eat collisions
    for (var k = 0; k < eatCollisions.length; k++) {
        var c = eatCollisions[k];
        var manifold = this.checkCellCollision(c.cell1, c.cell2);
        if (manifold == null) continue;
        this.resolveCollision(manifold);
    }
    eatCollisions = null;
    
    //this.gameMode.onCellMove(cell1, this);
    
    // Scan for ejected cell collisions (scan for ejected or virus only)
    rigidCollisions = [];
    eatCollisions = [];
    var self = this;
    for (var i = 0; i < this.movingNodes.length; i++) {
        var cell1 = this.movingNodes[i];
        if (cell1.isRemoved) continue;
        this.quadTree.find(cell1.quadItem.bound, function (item) {
            var cell2 = item.cell;
            if (cell2 == cell1)
                return;
            var manifold = self.checkCellCollision(cell1, cell2);
            if (manifold == null) return;
            if (cell1.cellType == 3 && cell2.cellType == 3) {
                // ejected/ejected
                rigidCollisions.push({ cell1: cell1, cell2: cell2 });
                // add to moving nodes if needed
                if (!cell1.isMoving) {
                    cell1.isMoving = true
                    self.movingNodes.push(cell1);
                }
                if (!cell2.isMoving) {
                    cell2.isMoving = true
                    self.movingNodes.push(cell2);
                }
            }
            else {
                eatCollisions.push({ cell1: cell1, cell2: cell2 });
            }
        });
    }
        for(var z=0;z<5;z++){
    // resolve rigid body collisions
    for (var k = 0; k < rigidCollisions.length; k++) {
        var c = rigidCollisions[k];
        var manifold = this.checkCellCollision(c.cell1, c.cell2);
        if (manifold == null) continue;
        this.resolveRigidCollision2(manifold);
        // position changed! don't forgot to update quad-tree
    }
		}
	// Update quad tree
    /*for (var k = 0; k < rigidCollisions.length; k++) {
        var c = rigidCollisions[k];
        this.updateNodeQuad(c.cell1);
        this.updateNodeQuad(c.cell2);
    }
	*/
    rigidCollisions = null;
    
    // resolve eat collisions
    for (var k = 0; k < eatCollisions.length; k++) {
        var c = eatCollisions[k];
        var manifold = this.checkCellCollision(c.cell1, c.cell2);
        if (manifold == null) continue;
        this.resolveCollision(manifold);
    }
	
	 // Move player cells
    for (var i in this.clients) {
        var client = this.clients[i].playerTracker;
        var checkSize = !client.mergeOverride || client.cells.length == 1;
        for (var j = 0; j < client.cells.length; j++) {
            var cell1 = client.cells[j];
            if (cell1.isRemoved)
                continue;
            cell1.updateRemerge(this);
            cell1.moveUser(this.border);
            cell1.move(this.border);
    
	// Mass decay
            if(cell1._size>this.config.playerMinSize)cell1.setSize(cell1._size*client.decay);
            // check size limit
            if (checkSize && cell1._size > this.config.playerMaxSize) {
                if (client.cells.length >= this.config.playerMaxCells) {
                    // cannot split => just limit
                    cell1.setSize(this.config.playerMaxSize);
                } else this.splitPlayerCell(client, cell1, Math.random() * 6.283185307179586);
            }
            this.updateNodeQuad(cell1);
        }
    }
	// Clip cells into border
	for(var k = 0; k < this.movingNodes.length; k++)this.movingNodes[k].checkBorder(this.border);
        if(this.config.gamemodeEatForSpeed==1){
	if(this.hasWinner==1&&this.time<0){
	this.t=-this.time;
	this.s=Math.floor(this.t/25);
	this.m=this.t%25*4;
	this.time=450;
	}
	this.time--;
	if(this.time>324){
	this.realStats=[
	"Winner:",
	this.winner+"",
	"Race time:",
	this.s+" sec "+this.m+"0ms",
	]
	}else{
	if(this.time>74){
	if(this.time==100)this.raceNum++;
	this.realStats=[
	"Race is over!",
	"___________________",
	"New race in:",
	(~~(this.time/25-3))+""
	]
	}else{
	if(this.time>-1){
	this.hasWinner=0;
	this.realStats=[
	"GET READY!!!",
	(~~(this.time/25+1))+"",
	]
	}else{
	if(this.time>-26){
	this.realStats=[
	"GET READY!!!",
	"Go!",
	]
	}else{
	var t=-this.time;
	var x=""+(~~(t/1500));
	var y=""+(~~((t/25)%60));
	if(x.length==1)x="0"+x;
	if(y.length==1)y="0"+y;
	this.realStats=[
	"Race #"+this.raceNum,
	"RaceTime: "+x+":"+y,
	"___________________",
	]
	}
	}
	}
	}
	}
    // Update invader
	if(this.config.gamemodeSpaceInvaders==1){
	if(this.e==this.tickCounter){
	for(var l in this.clients){
	for(var m=0;m<this.clients[l].playerTracker.cells.length;m++){
	this.clients[l].playerTracker.cells[m].setSize(this.config.playerStartSize);
	}
	}
	}
	this.g=Math.floor((this.tickCounter-this.e)/750)+1;
	this.f=2.88+this.g*0.32;
	this.h=this.border.height;
	for(var v=0;v<this.nodesInvader.length;v++){
	if(this.border.maxy-this.nodesInvader[v].position.y<this.h)this.h=this.border.maxy-this.nodesInvader[v].position.y;
	}
	if(this.tickCounter<=this.e){
	this.realStats=[
	"Game Over!",
	"Humans Lost!",
	"NEXT GAME STARTS IN:",
	""+~~((this.e-this.tickCounter)/25),
	"___________________",
	]
	}else{
	var x=""+(~~((this.tickCounter-this.e)/1500));
	var y=""+(~~(((this.tickCounter-this.e)/25)%60));
	if(x.length==1)x="0"+x;
	if(y.length==1)y="0"+y;
	this.realStats=[
	"GameTime: "+x+":"+y,
	"Distance: "+Math.floor(this.h)+" km.",
	"Invaders: "+this.nodesInvader.length+"/"+(this.config.gamemodeInvadersMinAmount+this.g),
	"Speed: "+this.g+" level",
	"___________________",
	]
	}
	if(this.nodesInvader.length<this.config.gamemodeInvadersMinAmount+this.g && this.e<this.tickCounter && (this.tickCounter % 3) == 0){
	var i = new Entity.Invader(this, null, {x: Math.floor(500 + this.border.minx + (this.border.width - 1000) * Math.random()),y: Math.floor(this.border.miny + this.border.height * Math.random() / 3.33333333333333333333)}, this.config.gamemodeInvadersMass);
	this.addNode(i);
	i.setBoost(0,0);
	}
	}
	// Food grow loop
	if(this.config.foodMassGrow){
	for(var i = 0; i < this.nodesFood.length ; i++){
		if(this.nodesFood[i].getAge(this.tickCounter+1)%this.config.foodGrowTimeout==0&&this.nodesFood[i]._mass<this.config.foodMaxGrow){
			this.nodesFood[i].setSize(Math.sqrt(this.nodesFood[i]._mass+this.config.foodGrowAmount)*10); // Grow food
			this.nodesFood[i].isMoving=true; // Don't forget to update!
		}else{
			//Don't update
			if(this.nodesFood[i].boostDirection.x==0&&this.nodesFood[i].boostDirection.y==0)this.nodesFood[i].isMoving=false;
		}
	}
	}
    this.tickSpawn++;
    if (this.tickSpawn >= this.config.spawnInterval) {
        this.tickSpawn = 0; // Reset
    var maxCount = this.config.foodMinAmount - this.currentFood;
    var spawnCount = Math.min(maxCount, this.config.foodSpawnAmount);
    for (var i = 0; i < spawnCount; i++) {
        this.spawnFood();
    }
	if(this.nodesVirus.length<this.config.virusMinAmount){
		var pos = this.getRandomSpawn(this.config.virusMinSize);
    if (pos != null) {
    var v = new Entity.Virus(this, null, pos, this.config.virusMinSize);
    this.addNode(v);
	}
	}
	}
        this.gameMode.onTick(this);
    }
    for (var i = 0; i < this.clients.length; i++) {
        var socket = this.clients[i];
        socket.playerTracker.update();
    }
    // remove dead clients
    for (var i = 0; i < this.clients.length; ) {
        var socket = this.clients[i];
        if (socket.playerTracker.isRemoved) {
            this.clients.splice(i, 1);
        } else {
            i++;
        }
    }
    if ((this.tickCounter % 25) == 0) {
        this.leaderboard = [];
        this.leaderboardType = -1;
        this.gameMode.updateLB(this);

        this.largestClient = this.gameMode.rankOne;
    }
	
	this.chat=[];
	this.chatowners=[];
    
    // ping server tracker
    if (this.config.serverTracker && (this.getTick() % (30000/40)) == 0) {
        this.pingServerTracker();
    }
    
    //this.tt = 0;
    //this.tc = 0;
    //var t = process.hrtime();
    //this.updateMoveEngine();
    //this.t1 = toTime(process.hrtime(t));
    //t = process.hrtime();
    //this.updateSpawn();
    //this.t2 = toTime(process.hrtime(t));
    //t = process.hrtime();
    //this.gameMode.onTick(this);
    //this.t3 = toTime(process.hrtime(t));
    //t = process.hrtime();
    //this.updateMassDecay();
    //this.t4 = toTime(process.hrtime(t));
    //t = process.hrtime();
    //this.updateClients();
    //this.t5 = toTime(process.hrtime(t));
    //t = process.hrtime();
    //this.updateLeaderboard();
    //this.t6 = toTime(process.hrtime(t));
    //function toTime(tscTicks) {
    //    return tscTicks[0] * 1000 + tscTicks[1] / 1000000;
    //}
    
    if (this.run) {
        this.tickCounter++;
    }
    var tEnd = new Date().getTime();
    this.updateTime = tEnd - tStart;
};

GameServer.prototype.startingFood = function() {
    // Spawns the starting amount of food cells
    for (var i = 0; i < this.config.foodMinAmount; i++) {
        this.spawnFood();
    }
	// Starting black holes
	for (var i = 0; i < this.config.gamemodeBlackHoleAmount; i++) {
        var b = new Entity.BlackHole(this, null, {x:0,y:0}, this.config.gamemodeBlackHoleMass);
		this.addNode(b);
		b.setBoost(this.config.gamemodeBlackHoleSpeed,0);
    }
};

GameServer.prototype.spawnFood = function() {
	var pos = this.getRandomPosition();
    var unsafe = this.willCollide(pos,0);
    if (!unsafe){
    var cell = new Entity.Food(this, null, pos, this.config.foodMinSize);
        var size = cell._mass;
        var maxGrow = this.config.foodMaxSize*this.config.foodMaxSize/100 - size;
        size += maxGrow * Math.random();
        cell.setSize(Math.sqrt(size)*10);
    cell.color=Math.random()*1535.9999999;
    this.addNode(cell);
	}
};

GameServer.prototype.spawnPlayer = function(player, pos, size) {
    // Check if can spawn from ejected mass
    if (!pos && this.nodesEjected.length > 0) {
        if (Math.random() <= this.config.ejectSpawnPlayer) {
            // Spawn from ejected mass
            var index = (this.nodesEjected.length - 1) * Math.random() >>> 0;
            var eject = this.nodesEjected[index];
			player.color=eject.color;
            if (!eject.isRemoved) {
                this.removeNode(eject);
                pos = {
                    x: eject.position.x,
                    y: eject.position.y
                };
                if (!size) {
                    size = Math.max(eject._size, this.config.playerStartSize);
                }
            }
        }
    }
    if (pos == null) {
        // Get random pos
        pos = this.getRandomPlayerSpawn(this.config.playerStartSize);
        if (pos == null) return;
    }
    if (size == null) {
        // Get starting mass
        size = this.config.playerStartSize;
    }

    // Spawn player and add to world
    var cell = new Entity.PlayerCell(this, player, pos, size);
    this.addNode(cell);

    // Set initial mouse coords
    player.mouse = {
        x: pos.x,
        y: pos.y
    };
};

GameServer.prototype.willCollide = function (pos, size) {
    // Look if there will be any collision with the current nodes
    var bound = {
        minx: pos.x - size,
        miny: pos.y - size,
        maxx: pos.x + size,
        maxy: pos.y + size
    };
    if(this.config.gamemodeDeathmatch==1){
	return this.quadTree.any(
        bound, 
        function (item) {
            return item.cell.cellType != 1 && item.cell.cellType != 2;
        });
		}
		return this.quadTree.any(
        bound, 
        function (item) {
            return item.cell.cellType != 1;
        });
};

GameServer.prototype.getDist = function (x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - x1;
    return Math.sqrt(dx * dx + dy * dy);
};

GameServer.prototype.abs = function (x) {
    return x < 0 ? -x : x;
};

// Checks cells for collision.
// Returns collision manifold or null if there is no collision
GameServer.prototype.checkCellCollision = function(cell, check) {
    var r = cell._size + check._size;
    var dx = check.position.x - cell.position.x;
    var dy = check.position.y - cell.position.y;
    var squared = dx * dx + dy * dy;         // squared distance from cell to check
    if (squared > r * r) {
        // no collision
        return null;
    }
    // create collision manifold
    return {
        cell1: cell,
        cell2: check,
        r: r,               // radius sum
        dx: dx,             // delta x from cell1 to cell2
        dy: dy,             // delta y from cell1 to cell2
        squared: squared    // squared distance from cell1 to cell2
    };
};
GameServer.prototype.checkCellCollision2 = function(cell, check) {
    var r = cell._size + check._size;
    var dx = check.position.x - cell.position.x;
    var dy = check.position.y - cell.position.y;
    var squared = dx * dx + dy * dy;         // squared distance from cell to check
    // create collision manifold
    return {
        cell1: cell,
        cell2: check,
        r: r,               // radius sum
        dx: dx,             // delta x from cell1 to cell2
        dy: dy,             // delta y from cell1 to cell2
        squared: squared    // squared distance from cell1 to cell2
    };
};
// Resolves rigid body collision
GameServer.prototype.resolveRigidCollision = function (manifold) {
    // distance from cell1 to cell2
    var d = Math.sqrt(manifold.squared);
    if (d <= 0) return;
	
    // body penetration distance
    var penetration = (manifold.r - d)/d;
    
    // penetration vector = penetration * normal
    var px = penetration * manifold.dx;
    var py = penetration * manifold.dy;
    
    // body impulse
    var totalMass = manifold.cell1._mass + manifold.cell2._mass;
    var impulse1 = manifold.cell2._mass / totalMass;
    var impulse2 = manifold.cell1._mass / totalMass;
    
    // apply extrusion force
    manifold.cell1.position.x -= px * impulse1;
    manifold.cell1.position.y -= py * impulse1;
    manifold.cell2.position.x += px * impulse2;
    manifold.cell2.position.y += py * impulse2;
};

GameServer.prototype.resolveRigidCollision2 = function (manifold) {
    // distance from cell1 to cell2
    var d = Math.sqrt(manifold.squared);
    if (d <= 0) return;
	
    // body penetration distance
    var penetration = (manifold.r - d)/d*0.5;
    
    // penetration vector = penetration * normal
    var px = penetration * manifold.dx;
    var py = penetration * manifold.dy;
    
    // apply extrusion force
    manifold.cell1.position.x -= px;
    manifold.cell1.position.y -= py;
    manifold.cell2.position.x += px;
    manifold.cell2.position.y += py;
};

// Checks if collision is rigid body collision
GameServer.prototype.checkRigidCollision = function (manifold) {
    if (!manifold.cell1.owner || !manifold.cell2.owner)
        return false;
    if (manifold.cell1.owner != manifold.cell2.owner) {
        // Different owners
        return this.gameMode.haveTeams && 
            manifold.cell1.owner.getTeam() == manifold.cell2.owner.getTeam();
    }
    // The same owner
    if (manifold.cell1.owner.mergeOverride)
        return false;
    var tick = this.getTick();
    if (manifold.cell1.getAge(tick) < 15 || manifold.cell2.getAge(tick) < 15) {
        // just splited => ignore
        return false;
    }
    return !manifold.cell1.canRemerge() || !manifold.cell2.canRemerge();
};

// Resolves non-rigid body collision
GameServer.prototype.resolveCollision = function (manifold) {
    var minCell = manifold.cell1;
    var maxCell = manifold.cell2;
    // check if any cell already eaten
    if (minCell.isRemoved || maxCell.isRemoved)
        return;
    if (minCell._size > maxCell._size || maxCell.cellType==1) {
        minCell = manifold.cell2;
        maxCell = manifold.cell1;
    }
	if (!maxCell.canEat(minCell,this)) {
        // maxCell don't want to eat
        return;
    }
	var size1=maxCell._size;
	var size2=minCell._size;
	if(minCell.cellType==1)size2=0;
    // check distance
    var eatDistance = size1 - size2 / 3;
    if (manifold.squared >= eatDistance * eatDistance) {
        // too far => can't eat
        return;
    }
    
    if (minCell.owner && minCell.owner == maxCell.owner) {
        // collision owned/owned => ignore or resolve or remerge
        
        var tick = this.getTick();
        if (minCell.getAge(tick) < 15 || maxCell.getAge(tick) < 15) {
            // just splited => ignore
            return;
        }
        if (!minCell.owner.mergeOverride) {
            // not force remerge => check if can remerge
            if (!minCell.canRemerge() || !maxCell.canRemerge()) {
                // cannot remerge
                return;
            }
        }
    } else {
        // collision owned/enemy => check if can eat
        
        // Team check
        if (this.gameMode.haveTeams && minCell.owner && maxCell.owner) {
            if (minCell.owner.getTeam() == maxCell.owner.getTeam()) {
                // cannot eat team member
                return;
            }
        }
        // Size check
        if (size1 <= size2 * 1.154700538379251529 && maxCell.cellType!=5&&minCell.cellType!=5) {
            // too large => can't eat
            return;
        }
    }
	if(minCell.cellType==5){ // black hole is always the biggest 
	if(minCell == manifold.cell1){
	minCell = manifold.cell2;
	maxCell = manifold.cell1;
	}else{
	minCell = manifold.cell1;
	maxCell = manifold.cell2;
	}
	}
    // Now maxCell can eat minCell
    minCell.isRemoved = true;
    
    // Disable mergeOverride on the last merging cell
    // We need to disable it before onCosume to prevent merging loop
    // (onConsume may cause split for big mass)
    if (minCell.owner && minCell.owner.cells.length <= 2) {
        minCell.owner.mergeOverride = false;
    }
    
    // Consume effect
    maxCell.onEat(minCell,this);
    minCell.onEaten(maxCell);
    
    // update bounds
    this.updateNodeQuad(maxCell);

    // Remove cell
    minCell.setKiller(maxCell);
    this.removeNode(minCell);
};

// Returns masses in descending order
GameServer.prototype.splitMass = function (mass, count) {
    // min throw size (vanilla 44)
    var throwSize = this.config.playerMinSize + 14;
    var throwMass = throwSize * throwSize / 100;
    
    // check maxCount
    var maxCount = count;
    var curMass = mass;
    while (maxCount > 1 && curMass / (maxCount-1) < throwMass) {
        maxCount = maxCount / 2 >>> 0;
    }
    if (maxCount < 2) {
        return [mass];
    }
    
    // calculate mass
    var minMass = this.config.playerMinSize * this.config.playerMinSize / 100;
    var splitMass = curMass / maxCount;
    if (splitMass < minMass) {
        return [mass];
    }
    var masses = [];
    if (maxCount < 3 || maxCount < count || curMass / throwMass <= 30) {
        // Monotone blow up
        for (var i = 0; i < maxCount; i++) {
            masses.push(splitMass);
        }
    } else {
        // Diverse blow up
        var restCount = maxCount;
        while (restCount > 2) {
            var splitMass = curMass / 2;
            if (splitMass <= throwMass) {
                break;
            }
            var max = curMass - throwMass * (restCount - 1);
            if (max <= throwMass || splitMass >= max) {
                break;
            }
            masses.push(splitMass);
            curMass -= splitMass;
            restCount--;
        }
        var splitMass = curMass / 4;
        if (splitMass > throwMass) {
            while (restCount > 2) {
                var max = curMass - throwMass * (restCount - 1);
                if (max <= throwMass || splitMass >= max) {
                    break;
                }
                masses.push(splitMass);
                curMass -= splitMass;
                restCount--;
            }
        }
        var splitMass = curMass / 8;
        if (splitMass > throwMass) {
            while (restCount > 2) {
                var max = curMass - throwMass * (restCount - 1);
                if (max <= throwMass || splitMass >= max) {
                    break;
                }
                masses.push(splitMass);
                curMass -= splitMass;
                restCount--;
            }
        }
        if (restCount > 1) {
            splitMass = curMass - throwMass * (restCount - 1);
            if (splitMass > throwMass) {
                masses.push(splitMass);
                curMass -= splitMass;
                restCount--;
            }
        }
        if (restCount > 0) {
            splitMass = curMass / restCount;
            while (restCount > 0) {
                masses.push(splitMass);
                restCount--;
            }
        }
    }
    //Logger.debug("===GameServer.splitMass===");
    //Logger.debug("mass = " + mass.toFixed(3) + "  |  " + Math.sqrt(mass * 100).toFixed(3));
    //var sum = 0;
    //for (var i = 0; i < masses.length; i++) {
    //    Logger.debug("mass[" + i + "] = " + masses[i].toFixed(3) + "  |  " + Math.sqrt(masses[i] * 100).toFixed(3));
    //    sum += masses[i]
    //}
    //Logger.debug("sum  = " + sum.toFixed(3) + "  |  " + Math.sqrt(sum * 100).toFixed(3));
    return masses;
};

GameServer.prototype.splitCells = function(client) {
    if(client.cells.length!=1&&this.config.gamemodeSnakerDish==1)return;
    // it seems that vanilla uses order by cell age
    var cellToSplit = [];
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];
        if (cell._size < this.config.playerMinSplitSize) {
            continue;
        }
		if(this.config.gamemodeLeap==0){
		cellToSplit.push(cell);
        if (cellToSplit.length + client.cells.length >= this.config.playerMaxCells)
            break;
		}else{
		var dx = client.mouse.x - cell.position.x;
        var dy = client.mouse.y - cell.position.y;
		var angle = Math.atan2(dx, dy);
		cell.addBoost(780,angle,1e999);
		cell.setSize(cell._size*this.config.gamemodeLeapMassLoss);
		}
    }
    var splitCells = 0; // How many cells have been split
    for (var i = 0; i < cellToSplit.length; i++) {
        var cell = cellToSplit[i];
        var dx = client.mouse.x - cell.position.x;
        var dy = client.mouse.y - cell.position.y;
        var dl = dx * dx + dy * dy;
        if (dl < 1) {
            dx = 1;
            dy = 0;
        }
        var angle = Math.atan2(dx, dy);
        if (isNaN(angle)) angle = Math.PI / 2;
        if (this.splitPlayerCell(client, cell, angle, null)) {
            splitCells++;
        }
    }
	if(splitCells>0)client.splittingMult+=0.3;
};

// TODO: replace mass with size (Virus)
GameServer.prototype.splitPlayerCell = function (client, parent, angle, mass) {
    // Returns boolean whether a cell has been split or not. You can use this in the future.

    if (client.cells.length >= this.config.playerMaxCells) {
        // Player cell limit
        return false;
    }

    var size1 = 0;
    var size2 = 0;
    if (mass == null) {
        size1 = parent.getSplitSize();
        size2 = size1;
    } else {
        size2 = Math.sqrt(mass * 100);
        size1 = Math.sqrt(parent._size * parent._size - size2 * size2);
    }
    
    // Remove mass from parent cell first
    parent.setSize(size1);
    
    // make a small shift to the cell position to prevent extrusion in wrong direction
    var pos = {
        x: parent.position.x + 40 * Math.sin(angle),
        y: parent.position.y + 40 * Math.cos(angle)
    };
    
    // Create cell
    var newCell = new Entity.PlayerCell(this, client, pos, size2);
	if(this.config.playerExtendedSplits==0){
    newCell.setBoost(780, angle);
	}else{
	newCell.setBoost(Math.max(780,size2*2), angle);
	}
    
    // Add to node list
    this.addNode(newCell);
    return true;
};

GameServer.prototype.canEjectMass = function(client) {
    var tick = this.getTick();
    if (client.lastEject == null) {
        // first eject
        client.lastEject = tick;
        return true;
    }
    var dt = tick - client.lastEject;
    if (dt < this.config.ejectCooldown) {
        // reject (cooldown)
        return false;
    }
    client.lastEject = tick;
    return true;
};

GameServer.prototype.ejectMass = function(client) {
    if (!this.canEjectMass(client))
        return;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];

        if (!cell) {
            continue;
        }

        if (cell._size < this.config.playerMinEjectMass) {
            continue;
        }
        var size2 = this.config.ejectMassLoss;
        var sizeSquared = cell.getSizeSquared() - size2 * size2;
        var size1 = Math.sqrt(sizeSquared);

        var dx = client.mouse.x - cell.position.x;
        var dy = client.mouse.y - cell.position.y;
        var dl = dx * dx + dy * dy;
        if (dl < 1) {
            dx = 1;
            dy = 0;
        } else {
            dl = Math.sqrt(dl);
            dx /= dl;
            dy /= dl;
        }
        
        // Remove mass from parent cell first
        cell.setSize(size1);

        // Get starting position
        var pos = {
            x: cell.position.x + dx * cell._size,
            y: cell.position.y + dy * cell._size
        };
        
        var angle = Math.atan2(dx, dy);
        if (isNaN(angle)) angle = Math.PI / 2;
        
        // Randomize angle
        angle += (Math.random() * 0.6) - 0.3;

        // Create cell
        var ejected = new Entity.EjectedMass(this, null, pos, this.config.ejectSize);
        ejected.ejector = cell;
        ejected.color=cell.color;
        ejected.setBoost(this.config.ejectSpeed, angle);
        ejected.cellOwner=client;
        this.addNode(ejected);
    }
};

GameServer.prototype.ejectBack = function(client) {
    if (!this.canEjectMass(client))
        return;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];

        if (!cell) {
            continue;
        }

        if (cell._size < this.config.gamemodeSpeedMinMass) {
            continue;
        }
        var size2 = this.config.gamemodeSpeedMassLoss;
        var sizeSquared = cell.getSizeSquared() - size2 * size2;
        var size1 = Math.sqrt(sizeSquared);

        var dx = - ( client.mouse.x - cell.position.x ) ;
        var dy = - ( client.mouse.y - cell.position.y ) ;
        var dl = dx * dx + dy * dy;
        if (dl < 1) {
            dx = 1;
            dy = 0;
        } else {
            dl = Math.sqrt(dl);
            dx /= dl;
            dy /= dl;
        }
        
        // Remove mass from parent cell first
        cell.setSize(size1);

        // Get starting position
        var pos = {
            x: cell.position.x + dx * cell._size,
            y: cell.position.y + dy * cell._size
        };
        
        var angle = Math.atan2(dx, dy);
        if (isNaN(angle)) angle = Math.PI / 2;
        
        // Randomize angle
        angle += (Math.random() * 0.6) - 0.3;

        // Create cell
        var ejected = new Entity.Food(this, null, pos, this.config.gamemodeSpeedMass);
        ejected.color=cell.color;
        ejected.setBoost(this.config.ejectSpeed, angle);
        this.addNode(ejected);
    }
};

GameServer.prototype.ejectVirus = function(client) {
    if (!this.canEjectMass(client))
        return;
    for (var i = 0; i < client.cells.length; i++) {
        var cell = client.cells[i];

        if (!cell) {
            continue;
        }

        if (cell._size < this.config.gamemodeVirusWarsMinMass) {
            continue;
        }
        var size2 = this.config.gamemodeVirusWarsMassLoss;
        var sizeSquared = cell.getSizeSquared() - size2 * size2;
        var size1 = Math.sqrt(sizeSquared);

        var dx = client.mouse.x - cell.position.x;
        var dy = client.mouse.y - cell.position.y;
        var dl = dx * dx + dy * dy;
        if (dl < 1) {
            dx = 1;
            dy = 0;
        } else {
            dl = Math.sqrt(dl);
            dx /= dl;
            dy /= dl;
        }
        
        // Remove mass from parent cell first
        cell.setSize(size1);

        // Get starting position
        var pos = {
            x: cell.position.x + dx * cell._size,
            y: cell.position.y + dy * cell._size
        };
        
        var angle = Math.atan2(dx, dy);
        if (isNaN(angle)) angle = Math.PI / 2;
        
        // Randomize angle
        angle += (Math.random() * 0.6) - 0.3;

        // Create cell
        var ejected = new Entity.Virus(this, null, pos, this.config.virusMinSize);
        ejected.setBoost(this.config.ejectSpeed, angle);

        this.addNode(ejected);
    }
};

GameServer.prototype.shootVirus = function(parent, angle) {
    var parentPos = {
        x: parent.position.x,
        y: parent.position.y,
    };

    var newVirus = new Entity.Virus(this, null, parentPos, this.config.virusMinSize);
    newVirus.setBoost(780, angle);

    // Add to moving cells list
    this.addNode(newVirus);
};

var configFileName = './gameserver.ini';

GameServer.prototype.loadConfig = function () {
    try {
        if (!fs.existsSync(configFileName)) {
            // No config
            Logger.warn("Config not found... Generating new config");
            // Create a new config
            fs.writeFileSync(configFileName, ini.stringify(this.config), 'utf-8');
        } else {
            // Load the contents of the config file
            var load = ini.parse(fs.readFileSync(configFileName, 'utf-8'));
            // Replace all the default config's values with the loaded config's values
            for (var key in load) {
                if (this.config.hasOwnProperty(key)) {
                    this.config[key] = load[key];
                } else {
                    Logger.error("Unknown gameserver.ini value: " + key);
                }
            }
        }
    } catch (err) {
        Logger.error(err.stack);
        Logger.error("Failed to load " + configFileName + ": " + err.message);
    }
	// Convert mass to size
	this.config.foodMinSize=Math.sqrt(this.config.foodMinSize)*10;
	this.config.foodMaxSize=Math.sqrt(this.config.foodMaxSize)*10;
	this.config.virusMinSize=Math.sqrt(this.config.virusMinSize)*10;
	this.config.virusMaxSize=Math.sqrt(this.config.virusMaxSize)*10;
	this.config.ejectSize=Math.sqrt(this.config.ejectSize)*10;
	this.config.playerMinSize=Math.sqrt(this.config.playerMinSize)*10;
	this.config.playerMaxSize=Math.sqrt(this.config.playerMaxSize)*10;
	this.config.playerMinSplitSize=Math.sqrt(this.config.playerMinSplitSize)*10;
	this.config.playerStartSize=Math.sqrt(this.config.playerStartSize)*10;
	this.config.playerMinEjectMass=Math.sqrt(this.config.playerMinEjectMass)*10;
	this.config.spawnerMaxMass=Math.sqrt(this.config.spawnerMaxMass)*10;
	this.config.ejectMassLoss=Math.sqrt(this.config.ejectMassLoss)*10;
	this.config.gamemodeVirusWarsMassLoss=Math.sqrt(this.config.gamemodeVirusWarsMassLoss)*10;
	this.config.gamemodeVirusWarsMinMass=Math.sqrt(this.config.gamemodeVirusWarsMinMass)*10;
	this.config.playerRecombineTime=this.config.playerRecombineTime*25;
	this.config.gamemodeBlackHoleMass=Math.sqrt(this.config.gamemodeBlackHoleMass)*10;
	this.config.gamemodeInvadersMass=Math.sqrt(this.config.gamemodeInvadersMass)*10;
	this.config.gamemodeSpeedMinMass=Math.sqrt(this.config.gamemodeSpeedMinMass)*10;
	this.config.gamemodeSpeedMassLoss=Math.sqrt(this.config.gamemodeSpeedMassLoss)*10;
	this.config.gamemodeSpeedMass=Math.sqrt(this.config.gamemodeSpeedMass)*10;
	this.config.playerSpeed=this.config.playerSpeed*84.424;
	this.config.foodMaxGrow-=this.config.foodGrowAmount/2;
};

GameServer.prototype.loadIpBanList = function () {
    var fileName = "./ipbanlist.txt";
    try {
        if (fs.existsSync(fileName)) {
            // Load and input the contents of the ipbanlist file
            this.ipBanList = fs.readFileSync(fileName, "utf8").split(/[\r\n]+/).filter(function (x) {
                return x != ''; // filter empty lines
            });
            Logger.info(this.ipBanList.length + " IP ban records loaded.");
        } else {
            Logger.warn(fileName + " is missing.");
        }
    } catch (err) {
        Logger.error(err.stack);
        Logger.error("Failed to load " + fileName + ": " + err.message);
    }
};

GameServer.prototype.saveIpBanList = function () {
    var fileName = "./ipbanlist.txt";
    try {
        var blFile = fs.createWriteStream(fileName);
        // Sort the blacklist and write.
        this.ipBanList.sort().forEach(function (v) {
            blFile.write(v + '\n');
        });
        blFile.end();
        Logger.info(this.ipBanList.length + " IP ban records saved.");
    } catch (err) {
        Logger.error(err.stack);
        Logger.error("Failed to save " + fileName + ": " + err.message);
    }
};

GameServer.prototype.banIp = function (ip) {
    if (this.ipBanList.indexOf(ip) >= 0) {
        Logger.warn(ip + " is already in the ban list!");
        return;
    }
    this.ipBanList.push(ip);
    Logger.info("The IP " + ip + " has been banned");
    this.clients.forEach(function (socket) {
        // If already disconnected or the ip does not match
        if (socket == null || !socket.isConnected || socket.remoteAddress != ip)
            return;
        
        // remove player cells
        socket.playerTracker.cells.forEach(function (cell) {
            this.removeNode(cell);
        }, this);
        
        // disconnect
        socket.close(1000, "Banned from server");
        var name = socket.playerTracker.getFriendlyName();
        Logger.info("Banned: \"" + name + "\" with Player ID " + socket.playerTracker.pID); // Redacted "with IP #.#.#.#" since it'll already be logged above
        this.sendChatMessage(null, null, "Banned \"" + name + "\""); // notify to don't confuse with server bug
    }, this);
    this.saveIpBanList();
};

GameServer.prototype.unbanIp = function (ip) {
    var index = this.ipBanList.indexOf(ip);
    if (index < 0) {
        Logger.warn("IP " + ip + " is not in the ban list!");
        return;
    }
    this.ipBanList.splice(index, 1);
    Logger.info("Unbanned IP: " + ip);
    this.saveIpBanList();
};

// Kick player by ID. Use ID = 0 to kick all players
GameServer.prototype.kickId = function (id) {
    var count = 0;
    this.clients.forEach(function (socket) {
        if (socket.isConnected == false)
            return;
        if (id != 0 && socket.playerTracker.pID != id)
            return;
        // remove player cells
        socket.playerTracker.cells.forEach(function (cell) {
            this.removeNode(cell);
        }, this);
        // disconnect
        socket.close(1000, "Kicked from server");
        var name = socket.playerTracker.getFriendlyName();
        Logger.info("Kicked \"" + name + "\"");
        this.sendChatMessage(null, null, "Kicked \"" + name + "\""); // notify to don't confuse with server bug
        count++;
    }, this);
    if (count > 0)
        return;
    if (id == 0)
        Logger.warn("No players to kick!");
    else
        Logger.warn("Player with ID "+id+" not found!");
};

// Stats server

GameServer.prototype.startStatsServer = function(port) {
    // Do not start the server if the port is negative
    if (port < 1) {
        return;
    }

    // Create stats
    this.stats = "Test";
    this.getStats();

    // Show stats
    this.httpServer = http.createServer(function(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.writeHead(200);
        res.end(this.stats);
    }.bind(this));

    var getStatsBind = this.getStats.bind(this);
    // TODO: This causes error if something else already uses this port.  Catch the error.
    this.httpServer.listen(port, function () {
        // Stats server
        Logger.info("Started stats server on port " + port);
        setInterval(getStatsBind, this.config.serverStatsUpdate * 1000);
    }.bind(this));
};

GameServer.prototype.getStats = function() {
    // Get server statistics
    var totalPlayers = 0;
    var alivePlayers = 0;
    var spectatePlayers = 0;
    for (var i = 0; i < this.clients.length; i++) {
        var socket = this.clients[i];
        if (socket == null || !socket.isConnected)
            continue;
        totalPlayers++;
        if (socket.playerTracker.cells.length > 0)
            alivePlayers++;
        else
            spectatePlayers++;
    }
    var s = {
        'server_name': this.config.serverName,
        'server_chat': this.config.serverChat ? "true" : "false",
        'border_width': this.border.width,
        'border_height': this.border.height,
        'gamemode': this.gameMode.name,
        'max_players': this.config.serverMaxConnections,
        'current_players': totalPlayers,
        'alive': alivePlayers,
        'spectators': spectatePlayers,
        'update_time': this.updateTimeAvg.toFixed(3),
        'uptime': Math.round((new Date().getTime() - this.startTime)/1000/60),
        'start_time': this.startTime
    };
    this.stats = JSON.stringify(s);
};

// Custom prototype functions
WebSocket.prototype.sendPacket = function(packet) {
    if (packet == null) return;

    //if (this.readyState == WebSocket.OPEN && (this._socket.bufferSize == 0) && packet.build) {
    if (this.readyState == WebSocket.OPEN) {
        var buffer = packet.build(this.playerTracker.socket.packetHandler.protocol);
        if (buffer != null) {
            this.send(buffer, { binary: true });
        }
    } else {
        this.readyState = WebSocket.CLOSED;
        this.emit('close');
    }
};

// Ping the server tracker.
// To list us on the server tracker located at http://ogar.mivabe.nl/master
// Should be called every 30 seconds
GameServer.prototype.pingServerTracker = function () {
    // Get server statistics
    var totalPlayers = 0;
    var alivePlayers = 0;
    var spectatePlayers = 0;
    var robotPlayers = 0;
    for (var i = 0; i < this.clients.length; i++) {
        var socket = this.clients[i];
        if (socket == null || socket.isConnected === false)
            continue;
        if (socket.isConnected == null) {
            robotPlayers++;
        }
        else {
            totalPlayers++;
            if (socket.playerTracker.cells.length > 0)
                alivePlayers++;
            else
                spectatePlayers++;
        }
    }
    
    // Send Ping...
    
    // ogar-tracker.tk
    var obj = {
        port: this.config.serverPort,               // [mandatory] web socket port which listens for game client connections
        name: this.config.serverName,               // [mandatory] server name
        mode: this.gameMode.name,                   // [mandatory] game mode
        total: totalPlayers,                        // [mandatory] total online players (server bots is not included!)
        alive: alivePlayers,                        // [mandatory] alive players (server bots is not included!)
        spect: spectatePlayers,                     // [mandatory] spectate players (server bots is not included!)
        robot: robotPlayers,                        // [mandatory] server bots
        limit: this.config.serverMaxConnections,    // [mandatory] maximum allowed connection count
        protocol: '',                              // [mandatory] I don't know what to type here, because ogar-tracker.tk doesn't support petridish client
        uptime: process.uptime() >>> 0,             // [mandatory] server uptime [seconds]
        w: this.border.width >>> 0,                 // [mandatory] map border width [integer]
        h: this.border.height >>> 0,                // [mandatory] map border height [integer]
        version: 'Petridish Ogar 1.2.56',      // [optional]  server version
        stpavg: this.updateTimeAvg >>> 0,           // [optional]  average server loop time
        chat: this.config.serverChat ? 1 : 0,       // [optional]  0 - chat disabled, 1 - chat enabled
        os: os.platform()                           // [optional]  operating system
    };
    trackerRequest({
        host: 'ogar-tracker.tk',
        port: 80,
        path: '/api/ping',
        method: 'PUT'
    }, 'application/json', JSON.stringify(obj));
    

    // mivabe.nl
    // Why don't just to use JSON?
    var data = 'current_players=' + totalPlayers +
               '&alive=' + alivePlayers +
               '&spectators=' + spectatePlayers +
               '&max_players=' + this.config.serverMaxConnections +
               '&sport=' + this.config.serverPort +
               '&gamemode=[*] ' + this.gameMode.name +  // we add [*] to indicate that this is multi-server
               '&agario=true' +                         // protocol version
               '&name=Unnamed Server' +                 // we cannot use it, because other value will be used as dns name
               '&opp=' + os.platform() + ' ' + os.arch() + // "win32 x64"
               '&uptime=' + process.uptime() +          // Number of seconds server has been running
               '&version=MultiOgar 1.2.56' +
               '&start_time=' + this.startTime;
    trackerRequest({
        host: 'ogar.mivabe.nl',
        port: 80,
        path: '/master',
        method: 'POST'
    }, 'application/x-www-form-urlencoded', data);
    
    // c0nsume.me
    trackerRequest({
        host: 'c0nsume.me',
        port: 80,
        path: '/tracker.php',
        method: 'POST'
    }, 'application/x-www-form-urlencoded', data);
};

function trackerRequest(options, type, body) {
    if (options.headers == null)
        options.headers = {};
    options.headers['user-agent'] = 'MultiOgar 1.2.56';
    options.headers['content-type'] = type;
    options.headers['content-length'] = body == null ? 0 : Buffer.byteLength(body, 'utf8');
    var req = http.request(options, function (res) {
        if (res.statusCode != 200) {
            Logger.writeError("[Tracker][" + options.host + "]: statusCode = " + res.statusCode);
            return;
        }
        res.setEncoding('utf8');
    });
    req.on('error', function (err) {
        Logger.writeError("[Tracker][" + options.host + "]: " + err);
    });
    req.write(body);
    req.end()
};

