var Packet = require('./packet');
var GameServer = require('./GameServer');

function PlayerTracker(gameServer, socket) {
    this.a=0;
	this.b=0;
	this.c=0;
	this.d=0;
	this.e=0;
    this.gameServer = gameServer;
    this.socket = socket;
    this.pID = -1;
    this.isRemoved = false;
    this.isCloseRequested = false;
    this.name = "";
    this.skin = "";
    this.color = 0;
    this.visibleNodes = [];
    this.cells = [];
    this.mergeOverride = false; // Triggered by console command
    this.score = 0; // Needed for leaderboard
    this.scale = 1;
    this.borderCounter = 0;
	this.Wmult = 0;
	this.virusMult = 0;
	this.splittingMult = 0;
	this.massDecayMult = 1;
	this._border=null;
	this._x=null;
	this._y=null;
	this._scale=null;
	this._leaderboard=null;
	this._clearall=null;

    this.mouse = {
        x: 0,
        y: 0
    };
    this.tickLeaderboard = 0;

    this.team = 0;
    this.spectate = false;
    this.freeRoam = false;      // Free-roam mode enables player to move in spectate mode
    this.spectateTarget = null; // Spectate target, null for largest player
    this.lastSpectateSwitchTick = 0;

    this.centerPos = {
        x: 0,
        y: 0
    };
    this.viewBox = {
        minx: 0,
        miny: 0,
        maxx: 0,
        maxy: 0,
        width: 0,
        height: 0,
        halfWidth: 0,
        halfHeight: 0
    };

    // Scramble the coordinate system for anti-raga
    this.scrambleX = 0;
    this.scrambleY = 0;
    this.scrambleId = 0;
	this.scrambleColor=0;

    // Gamemode function
    if (gameServer) {
		this.decay=1-this.gameServer.config.playerDecayRate;
        this.centerPos.x = gameServer.border.centerx;
        this.centerPos.y = gameServer.border.centery;
        // Player id
        this.pID = gameServer.getNewPlayerID();
        // Gamemode function
        gameServer.gameMode.onPlayerInit(this);
    }
}

module.exports = PlayerTracker;

// Setters/Getters

PlayerTracker.prototype.getFriendlyName = function () {
    var name = this.getName();
    if (!name) name = "";
    name = name.trim();
    if (name.length == 0)
        name = "An unnamed cell";
    return name;
};

PlayerTracker.prototype.setName = function(name) {
    this.name = name;
};

PlayerTracker.prototype.getName = function() {
    return this.name;
};

PlayerTracker.prototype.getFragName = function() {
	var name=this.name;
	if(!name)name="An unnamed cell";
	if(this.gameServer.config.gamemodeEatForSpeed==1||this.gameServer.config.gamemodeSpaceInvaders==1||this.gameServer.config.gamemodeDeathmatch==1||this.gameServer.config.gamemodeSnakerDish==1||this.gameServer.config.gamemodeBlackHoleAmount!=0)name=name+": "+this.getScore();
	if(this.gameServer.config.gamemodeEatForSpeed==1)name+="%";
    return name;
};

PlayerTracker.prototype.setSkin = function (skin) {
    this.skin = skin;
};

PlayerTracker.prototype.getSkin = function () {
    if (this.gameServer.gameMode.haveTeams) {
        return "";
    }
    return this.skin;
};

PlayerTracker.prototype.getColor = function (color) {
    return this.color;
};

PlayerTracker.prototype.getTeam = function () {
    return this.team;
};

PlayerTracker.prototype.getScore = function () {
    if(this.gameServer.config.gamemodeEatForSpeed==1&&this.cells[0])return Math.floor(100*(0.5+this.centerPos.x/this.gameServer.border.width));
    if(this.gameServer.config.gamemodeDeathmatch==1)return this.b;
	if(this.gameServer.config.gamemodeBlackHoleAmount!=0)return Math.floor(this.d);
	if(this.gameServer.config.gamemodeSpaceInvaders==1)return this.e;
	if(this.gameServer.config.gamemodeSnakerDish==1)return Math.floor(this.c);
    return this.score;
};

// Functions

PlayerTracker.prototype.joinGame = function (name, skin) {
    if (this.cells.length > 0) return;
	this.b=0;this.c=0;this.d=0;this.e=0;
    if (name == null) name = "";
    this.setName(name);
    if (skin != null)    
        this.setSkin(skin);
	this.gameServer.gameMode.onPlayerSpawn(this.gameServer, this);
	if(this.cells.length==0)return;
    this.spectate = false;
    this.freeRoam = false;
    this.spectateTarget = null;

    this._clearall=true;
    this.visibleNodes = [];
    if(this.gameServer.config.serverScrambleColors)this.scrambleColor=Math.random()*1536;
    if (!this.gameServer.config.serverScrambleCoords) {
        this.scrambleId = 0;
        this.scrambleX = 0;
        this.scrambleY = 0;
    } else {
        this.scrambleId = (Math.random() * 0xFFFFFFFF) >>> 0;
        this.scrambleX = -this.cells[0].position.x;
        this.scrambleY = -this.cells[0].position.y;
    }
    if (this.gameServer.config.serverScrambleCoords < 2) {
        // no scramble / lightweight scramble
        this._border=this.gameServer.border;
    }
    if (this.gameServer.config.serverScrambleCoords == 3) {
        // Scramble level 3 (no border)
        // Unsupported on some clients! (include vanilla)
        // ogar.mivabe.nl works ok
        // Ruins most known minimaps
        this._border={minx:-1234567,miny:-1234567,maxx:1234567,maxy:1234567};
    }
    this.borderCounter = 0;
};

PlayerTracker.prototype.update = function () {
    if (this.isRemoved) return;
    // Handles disconnection
    var time = +new Date;
    if (!this.socket.isConnected) {
        // wait for playerDisconnectTime
        var dt = (time - this.socket.closeTime) / 1000;
        if (this.cells.length == 0 || dt >= this.gameServer.config.playerDisconnectTime) {
            // Remove all client cells
            var cells = this.cells;
            this.cells = [];
            for (var i = 0; i < cells.length; i++) {
                this.gameServer.removeNode(cells[i]);
            }
            // Mark to remove
            this.isRemoved = true;
        }
        // update visible nodes/mouse (for spectators, if any)
        var nodes = this.getVisibleNodes();
        nodes.sort(function (a, b) { return a.nodeId - b.nodeId; });
        this.visibleNodes = nodes;
        this.mouse.x = this.centerPos.x;
        this.mouse.y = this.centerPos.y;
        this.socket.packetHandler.pressSpace = false;
        this.socket.packetHandler.pressW = false;
        this.socket.packetHandler.pressQ = false;
        return;
    }
    // Check timeout
    if (!this.isCloseRequested && this.gameServer.config.serverTimeout) {
        var dt = (time - this.socket.lastAliveTime) / 1000;
        if (dt >= this.gameServer.config.serverTimeout) {
            this.socket.close(1000, "Connection timeout");
            this.isCloseRequested = true;
        }
    }

    // if initialization is not complete yet then do not send update
    if (!this.socket.packetHandler.protocol)
        return;
    
    // Actions buffer (So that people cant spam packets)
    if (this.socket.packetHandler.pressSpace) { // Split cell
        this.pressSpace();
        this.socket.packetHandler.pressSpace = false;
    }
    
    if (this.socket.packetHandler.pressW) { // Eject mass
        this.pressW();
        this.socket.packetHandler.pressW = false;
    }
    
    if (this.socket.packetHandler.pressQ) { // Q Press
        this.pressQ();
        this.socket.packetHandler.pressQ = false;
    }
	
	if (this.socket.packetHandler.pressE) { // Split mass bots
        for(var i in this.gameServer.clients)if(this.pID==this.gameServer.clients[i].playerTracker.mID)this.gameServer.clients[i].playerTracker.pressSpace();
        this.socket.packetHandler.pressE = false;
    }
	
	if (this.socket.packetHandler.pressR) { // Eject mass bots
        for(var i in this.gameServer.clients)if(this.pID==this.gameServer.clients[i].playerTracker.mID)this.gameServer.clients[i].playerTracker.pressW();
        this.socket.packetHandler.pressR = false;
    }
	this.score=0;
	if(this.cells.length!=0){
    var totalSize = 0;
    for (var i = 0; i < this.cells.length; i++) {
        var node = this.cells[i];
        if (node == null) continue;
        totalSize += node._size;
        this.score += node._mass;
    }
	this.scale = Math.pow(Math.min(64 / totalSize, 1), 0.4);
	}
    var newVisible = this.getVisibleNodes();
    newVisible.sort(function (a, b) { return a.nodeId - b.nodeId; });
    var delNodes = [];
    var eatNodes = [];
    var addNodes = [];
    var updNodes = [];
    var newIndex = 0;
    var oldIndex = 0;
    for (; newIndex < newVisible.length && oldIndex < this.visibleNodes.length;) {
        if (newVisible[newIndex].nodeId < this.visibleNodes[oldIndex].nodeId) {
            addNodes.push(newVisible[newIndex]);
            newIndex++;
            continue;
        }
        if (newVisible[newIndex].nodeId > this.visibleNodes[oldIndex].nodeId) {
            var node = this.visibleNodes[oldIndex];
            if (node.isRemoved && node.getKiller() != null && node.owner != node.getKiller().owner)
                eatNodes.push(node);
            else
                delNodes.push(node);
            oldIndex++;
            continue;
        }
        var node = newVisible[newIndex];
        // skip food & eject if no moving
        if (node.isMoving || (node.cellType != 1 && node.cellType != 3))
            updNodes.push(node);
        newIndex++;
        oldIndex++;
    }
    for (; newIndex < newVisible.length; ) {
        var node = newVisible[newIndex];
        addNodes.push(newVisible[newIndex]);
        newIndex++;
    }
    for (; oldIndex < this.visibleNodes.length; ) {
        var node = this.visibleNodes[oldIndex];
        if (node.isRemoved && node.getKiller() != null && node.owner != node.getKiller().owner)
            eatNodes.push(node);
        else
            delNodes.push(node);
        oldIndex++;
    }
    this.visibleNodes = newVisible;
    
    if (this.gameServer.config.serverScrambleCoords == 2) {
        // moving border scramble
        if (this.borderCounter == 0) {
            this._border = {
                minx: Math.max(this.gameServer.border.minx, this.viewBox.minx - this.viewBox.halfWidth),
                miny: Math.max(this.gameServer.border.miny, this.viewBox.miny - this.viewBox.halfHeight),
                maxx: Math.min(this.gameServer.border.maxx, this.viewBox.maxx + this.viewBox.halfWidth),
                maxy: Math.min(this.gameServer.border.maxy, this.viewBox.maxy + this.viewBox.halfHeight)
            };
        }
        this.borderCounter++;
        if (this.borderCounter >= 20)
            this.borderCounter = 0;
    }
	if(this.gameServer.config.serverTeamingAllowed==0){
    this.massDecayMult = 1;
	var effectSum = this.Wmult + this.virusMult + this.splittingMult;
    this.Wmult *= 0.99944;
    this.virusMult *= 0.9984;
    this.splittingMult *= 0.9968;
    // Apply anti-teaming if required
    if (effectSum > 2.5)this.decay=1-effectSum*this.gameServer.config.playerDecayRate;
	}
    // Update leaderboard
	if (++this.tickLeaderboard > 25) {
        // 1 / 0.040 = 25 (once per second)
        this.tickLeaderboard = 0;
        if (this.gameServer.leaderboardType >= 0)this._leaderboard=true;
	}
	// Send packet
    this.socket.sendPacket(new Packet.UpdateNodes(
        this,
        addNodes,
        updNodes,
        eatNodes,
        delNodes,this._leaderboard,this._border,this._x,this._y,this._scale,this.gameServer.chat,this.gameServer.chatowners,this._clearall));
	this._leaderboard=this._border=this._x=this._y=this._scale=this._clearall=null;
};

PlayerTracker.prototype.applyTeaming = function(x, type) {
    // Called when player does an action which increases anti-teaming
    var effectSum = this.Wmult + this.virusMult + this.splittingMult;

    // Applied anti-teaming is 1.5x smaller if over the threshold
    var n = effectSum > 1.5 ? x : x / 1.5;

    switch (type) {
        case 0: // Ejected cell
            this.Wmult += n;
            break;
        case 1: // Virus explosion
            this.virusMult += n;
            break;
        case 2: // Splitting
            this.splittingMult += n;
            break;
    }
};

// Viewing box

PlayerTracker.prototype.updateCenterInGame = function() { // Get center of cells
    var len = this.cells.length;
    if (len <= 0) return;
    var cx = 0;
    var cy = 0;
    var count = 0;
    for (var i = 0; i < len; i++) {
        var node = this.cells[i];
        if (node == null) continue;
        cx += node.position.x;
        cy += node.position.y;
        count++;
    }
    if (count == 0) return;
    this.centerPos.x=cx / count;
	this.centerPos.y=cy / count;
};

PlayerTracker.prototype.updateCenterFreeRoam = function () {
    var dx = this.mouse.x - this.centerPos.x;
    var dy = this.mouse.y - this.centerPos.y;
    var squared = dx * dx + dy * dy;
    if (squared < 1) return;     // stop threshold
    
    // distance
    var d = Math.sqrt(squared);
    
    var nx = dx / d;
    var ny = dy / d;
    
    var speed = Math.min(d, 16);
    if (speed <= 0) return;
    
    this.centerPos.x += nx * speed;
    this.centerPos.y += ny * speed;
};

PlayerTracker.prototype.updateViewBox = function () {
    var scale = this.scale;
    var width = (this.gameServer.config.serverViewBaseX) / scale;
    var height = (this.gameServer.config.serverViewBaseY) / scale;
    var halfWidth = width / 2;
    var halfHeight = height / 2;
    this.viewBox = {
        minx: this.centerPos.x - halfWidth,
        miny: this.centerPos.y - halfHeight,
        maxx: this.centerPos.x + halfWidth,
        maxy: this.centerPos.y + halfHeight,
        width: width,
        height: height,
        halfWidth: halfWidth,
        halfHeight: halfHeight
    };
};

PlayerTracker.prototype.pressQ = function () {
	if (this.gameServer.run) {
        this.gameServer.ejectVirus(this);
    }
    if (this.spectate) {
        // Check for spam first (to prevent too many add/del updates)
        var tick = this.gameServer.getTick();
        if (tick - this.lastSpectateSwitchTick < 1)
            return;
        this.lastSpectateSwitchTick = tick;

        if (this.spectateTarget == null) {
            this.freeRoam = !this.freeRoam;
        }
        this.spectateTarget = null;
    }
};

PlayerTracker.prototype.pressW = function () {
    if (this.spectate) {
        return;
    }
    else if (this.gameServer.run) {
        this.gameServer.ejectMass(this);
    }
};

PlayerTracker.prototype.pressSpace = function () {
    /*if (this.spectate) {
        // Check for spam first (to prevent too many add/del updates)
        var tick = this.gameServer.getTick();
        if (tick - this.lastSpectateSwitchTick < 40)
            return;
        this.lastSpectateSwitchTick = tick;

        // Space doesn't work for freeRoam mode
        if (this.freeRoam || this.gameServer.largestClient==null)
            return;
        this.nextSpectateTarget();
    } else */if (this.gameServer.run) {
	    if(this.gameServer.config.gamemodeEatForSpeed==1)this.gameServer.ejectBack(this);
        if (this.mergeOverride)
            return;
        this.gameServer.splitCells(this);
    }
};

PlayerTracker.prototype.nextSpectateTarget = function () {
    if (this.spectateTarget == null) {
        this.spectateTarget = this.gameServer.largestClient;
        return;
    }
    // lookup for next spectate target
    var index = this.gameServer.clients.indexOf(this.spectateTarget.socket);
    if (index < 0) {
        this.spectateTarget = this.gameServer.largestClient;
        return;
    }
    // find next
    for (var i = index + 1; i < this.gameServer.clients.length; i++) {
        var player = this.gameServer.clients[i].playerTracker;
        if (player.cells.length > 0) {
            this.spectateTarget = player;
            return;
        }
    }
    for (var i = 0; i <= index; i++) {
        var player = this.gameServer.clients[i].playerTracker;
        if (player.cells.length > 0) {
            this.spectateTarget = player;
            return;
        }
    }
    // no alive players
    this.spectateTarget = null;
};

PlayerTracker.prototype.getSpectateTarget = function () {
    if (this.spectateTarget == null || this.spectateTarget.isRemoved || this.spectateTarget.cells.length < 1) {
        this.spectateTarget = null;
        return this.gameServer.largestClient;
    }
    return this.spectateTarget;
};

PlayerTracker.prototype.getVisibleNodes = function () {
    if (this.spectate) {
        if (!this.freeRoam) {
            var player = this.getSpectateTarget();
            if (player != null) {
				if(player.mID)player.updateCenterInGame(); // Center pos calculation was omitted for performance reasons. Let's calculate it!
				this.centerPos.x = player.centerPos.x;
                this.centerPos.y = player.centerPos.y;
                this.scale = player.scale;
                this._x=this.centerPos.x;
				this._y=this.centerPos.y;
				this._scale=this.scale;
                this.updateViewBox();
                // return player.visibleNodes.slice(0);
            }
        }else{
        // free roam spectate
        this.updateCenterFreeRoam();
        this.scale = this.gameServer.config.serverSpectatorScale;//0.25;
        this._x=this.centerPos.x;
		this._y=this.centerPos.y;
		this._scale=this.scale;
		}
    } else {
        // in game
        this.updateCenterInGame();
        // scale will be calculated on first call to this.getScale() inside updateViewBox()
    }
    this.updateViewBox();
    return this.calcVisibleNodes();
}

PlayerTracker.prototype.calcVisibleNodes = function() {
    var newVisible = [];
	var dis=this;
    this.gameServer.quadTree.find(this.viewBox, function (quadItem) {
        if (quadItem.cell.owner != dis)
            newVisible.push(quadItem.cell);
    });
    return newVisible.concat(this.cells);
};
