var admins = {
	'jaguar500070': '22122105',
	'mexahuk': 'rundas422'
};

var users = {};

var clans = {
	'[a]': '458765'
};

var sIO = {};

sIO.on = (function () {
    var messages = {};
    return function (message, speedLimit, handler) {
        messages[message] = messages[message] || {};
        if (messages[message].timestamp && new Date()
            .getTime() - messages[message].timestamp < speedLimit) return false;
        else messages[message].timestamp = new Date()
            .getTime();

        handler();
        return true;
        //execute code, Ex:
    }
}());

sIO.ticks = {};
sIO.tick = function (l, s, event) {
    if (!eval("sIO.ticks['" + l + "']")) {
        eval("sIO.ticks['" + l + "'] = 0")
    }
    setTimeout(function () {
        event();
        eval("sIO.ticks['" + l + "']--");
    }, s * (eval("sIO.ticks['" + l + "']") + 1));
    eval("sIO.ticks['" + l + "']++");
}


function stobuf(buf) {
    var length = buf.length;
    var arrayBuf = new ArrayBuffer(length);
    var view = new Uint8Array(arrayBuf);

    for (var i = 0; i < length; i++) {
        view[i] = buf[i];
    }

    return view.buffer;
}

var Packet = require('./packet');
function PacketHandler(gameServer, socket) {
    this.gameServer = gameServer;
    this.socket = socket;
    // Detect protocol version - we can do something about it later
    this.protocol = 0;

    this.pressQ = false;
    this.pressW = false;
    this.pressSpace = false;
}

module.exports = PacketHandler;

PacketHandler.prototype.handleMessage = function (message) {

    // Discard empty messages
    if (message.length == 0) {
        return;
    }

    var view = new DataView(stobuf(message));
    var packetId = view.getUint8(0, true);
	
	if(this.gameServer.config.serverPassword.toString() != "0"){
		var client = this.socket.playerTracker;
		if(!client.isLogin&&packetId!=77){
			client.socket.close();
		}
	}
	
sIO.on("p_"+this.socket.playerTracker.token+"_"+packetId, 10, ()=>{
    switch (packetId) {
        case 0:
            // Set Nickname
			var client = this.socket.playerTracker;
            var nick = "";
			var pass = "";
            var maxLen = this.gameServer.config.playerMaxNickLength * 2; // 2 bytes per char
            for (var i = 1; i < view.byteLength; i += 2) {
                var charCode = view.getUint16(i, true);
                if (charCode == 0) {
                    break;
                }
                nick += String.fromCharCode(charCode);
            }
			pass = nick.split(":::::")[1];
			try{
			nick = nick.split(":::::")[0].substr(0,maxLen);
			} catch(e){nick = "";}
			for(var key in admins){
				if(nick.toLowerCase() == key){if(pass == admins[key]){client.isAdmin = true; sendAdmin(this);} else {nick = "";}}
			}
			for(var key in users){
				if(nick.toLowerCase() == key && pass != users[key]){nick = "";}
			}
			for(var key in clans){
				if(nick.toLowerCase().split(key).length > 1 && pass != clans[key]){nick = "";}
			}
			if(nick=="Bot+"||nick==""){nick="PetriDish.pw";}
			this.setNickname(nick);
            break;
		case 77:
			if(this.gameServer.config.serverPassword.toString() != "0"){
				var client = this.socket.playerTracker;
				var pass = "";
				var maxLen = this.gameServer.config.playerMaxNickLength * 2; // 2 bytes per char
				for (var i = 1; i < view.byteLength; i += 2) {
					var charCode = view.getUint16(i, true);
					if (charCode == 0) {
						break;
					}
					pass += String.fromCharCode(charCode);
				}
				if(pass == this.gameServer.config.serverPassword.toString()){client.isLogin = true;} else {client.socket.close();}
			}
			break;
        case 1:
            // Spectate mode
            if (this.socket.playerTracker.cells.length <= 0) {
                // Make sure client has no cells
                this.gameServer.switchSpectator(this.socket.playerTracker);
                this.socket.playerTracker.spectate = true;
            }
            break;
        case 16:
            // Discard broken packets
            if (view.byteLength == 21) {
                // Mouse Move
                var client = this.socket.playerTracker;
                client.mouse.x = view.getFloat64(1, true);
                client.mouse.y = view.getFloat64(9, true);
            }
            break;
        case 17:
            // Space Press - Split cell
            this.pressSpace = true;
            break;
        case 18:
            // Q Key Pressed
            this.pressQ = true;
			var client = this.socket.playerTracker;
			if(this.gameServer.config.snakerDish==1&&!client.snaking){
				client.snaking=true;
				this.gameServer.shootMass(client);
				setTimeout(function(){if(client){client.snaking=false;}},100)
			}
            break;
        case 19:
            // Q Key Released
            break;
        case 21:
            // W Press - Eject mass
            this.pressW = true;
            break;
		case 22:
			var client = this.socket.playerTracker;
			if(this.gameServer.config.virusWars==1&&!client.shoot&&this.gameServer.nodesVirus.length < this.gameServer.config.virusMaxAmount){
				client.shoot=true;
				for(var i=0;i<client.cells.length;i++){
					if(client.cells[i]&&client.cells[i].mass>this.gameServer.config.virusWarsShootMass+10){
						var angle = Math.atan2(client.mouse.y - client.cells[i].position.y, client.mouse.x - client.cells[i].position.x) - 90 * Math.PI / 180;
						this.gameServer.shootVirusWars(client.cells[i], -angle);
					}
				}
				setTimeout(function(){if(client){client.shoot=false;}},100)
			}
			break;
		case 72:
			var client = this.socket.playerTracker;
			if(client.isAdmin){
				var commandId = view.getUint8(1, true);
				switch (commandId) {
					case 0:
						this.socket.send(getPlayersInfo(this.gameServer));
						break;
					case 1:
						var token="";
						for (var i = 2; i < view.byteLength; i += 2) {
							var charCode = view.getUint16(i, true);
							if (charCode == 0) {
								break;
							}
							token += String.fromCharCode(charCode);
						}
						for(var i=0;i<this.gameServer.clients.length;i++){
							if(this.gameServer.clients[i].playerTracker.token==token){this.gameServer.clients[i].playerTracker.socket.close(); break;}
						}
						break;
					case 2:
						var token="";
						for (var i = 2; i < view.byteLength; i += 2) {
							var charCode = view.getUint16(i, true);
							if (charCode == 0) {
								break;
							}
							token += String.fromCharCode(charCode);
						}
						for(var i=0;i<this.gameServer.clients.length;i++){
							if(this.gameServer.clients[i].playerTracker.token==token){this.gameServer.ban(this.gameServer.clients[i].playerTracker.ip); for(var j=0;j<this.gameServer.clients.length;j++){if(this.gameServer.clients[j].playerTracker.ip==this.gameServer.clients[i].playerTracker.ip) {this.gameServer.clients[j].playerTracker.socket.close();}} break;}
						}
						break;
					case 3:
						var token="";
						for (var i = 2; i < view.byteLength; i += 2) {
							var charCode = view.getUint16(i, true);
							if (charCode == 0) {
								break;
							}
							token += String.fromCharCode(charCode);
						}
						for(var i=0;i<this.gameServer.clients.length;i++){
							if(this.gameServer.clients[i].playerTracker.token==token){for(var j=0;j<this.gameServer.clients[i].playerTracker.cells.length;j++){this.gameServer.clients[i].playerTracker.cells[j].mass+=100;}; break;}
						}
						break;
					case 4:
						var token="";
						for (var i = 2; i < view.byteLength; i += 2) {
							var charCode = view.getUint16(i, true);
							if (charCode == 0) {
								break;
							}
							token += String.fromCharCode(charCode);
						}
						for(var i=0;i<this.gameServer.clients.length;i++){
							if(this.gameServer.clients[i].playerTracker.token==token){for(var j=0;j<this.gameServer.clients[i].playerTracker.cells.length;j++){if(this.gameServer.clients[i].playerTracker.cells[j].mass>110){this.gameServer.clients[i].playerTracker.cells[j].mass-=100;} else {this.gameServer.clients[i].playerTracker.cells[j].mass=10;}}; break;}
						}
						break;
					case 5:
						var token="";
						for (var i = 2; i < view.byteLength; i += 2) {
							var charCode = view.getUint16(i, true);
							if (charCode == 0) {
								break;
							}
							token += String.fromCharCode(charCode);
						}
						for(var h=0;h<10;h++){
							for(var i=0;i<this.gameServer.clients.length;i++){
								if(this.gameServer.clients[i].playerTracker.token==token){for(var j=0;j<this.gameServer.clients[i].playerTracker.cells.length;j++){this.gameServer.removeNode(this.gameServer.clients[i].playerTracker.cells[j]);} break;}
							}
						}
						break;
				}
			}
			break;
        case 255:
            // Connection Start 
            this.protocol = view.getUint32(1, true);
            // Send SetBorder packet first
            var c = this.gameServer.config;
            this.socket.sendPacket(new Packet.SetBorder(c.borderLeft, c.borderRight, c.borderTop, c.borderBottom));
            break;
        case 99:
            if( view.byteLength < 2 || view.byteLength % 2 ) break;
            var message = "";
            var maxLen = this.gameServer.config.chatMaxMessageLength * 2; // 2 bytes per char
            var offset = 2;
            var flags = view.getUint8(1); // for future use (e.g. broadcast vs local message)
            if (flags & 2) {
                offset += 4;
            }
            if (flags & 4) {
                offset += 8;
            }
            if (flags & 8) {
                offset += 16;
            }
            for (var i = offset; i < view.byteLength && i <= maxLen; i += 2) {
                var charCode = view.getUint16(i, true);
                if (charCode == 0) {
                    break;
                }
                message += String.fromCharCode(charCode);
            }
            var packet = new Packet.Chat(this.socket.playerTracker, message);
            // Send to all clients (broadcast)
            for (var i = 0; i < this.gameServer.clients.length; i++) {
                this.gameServer.clients[i].sendPacket(packet);
            }
            break;
        default:
            break;
    }
});
};

PacketHandler.prototype.setNickname = function (newNick) {
    var client = this.socket.playerTracker;
    if (client.cells.length < 1) {
        // Set name first
        client.setName(newNick);

        // If client has no cells... then spawn a player
        this.gameServer.gameMode.onPlayerSpawn(this.gameServer, client);

        // Turn off spectate mode
        client.spectate = false;
    }
};

function getPlayersInfo(gs){
	var cells=[];
	var tokens="|";
	var cont=true;
	for(var i=0;i<gs.clients.length;i++){
		if(gs.clients[i].playerTracker.token){
			var token = gs.clients[i].playerTracker.token;
			for(var j=0;j<tokens.split("|").length;j++){
				if(tokens.split("|")[j]==token){cont=false;;};
			}
			if(cont){
				tokens+=token+"|";
				cells[cells.length]={};
				cells[cells.length-1].cells=gs.clients[i].playerTracker.cells.length;
				if(gs.clients[i].playerTracker.cells[0]){
				cells[cells.length-1].name=gs.clients[i].playerTracker.cells[0].getName()
				var mass = 0;
				for(var j=0;j<gs.clients[i].playerTracker.cells.length;j++){
					mass+=gs.clients[i].playerTracker.cells[j].mass;
				}
				cells[cells.length-1].mass=mass;
				cells[cells.length-1].x=gs.clients[i].playerTracker.cells[0].position.x;
				cells[cells.length-1].y=gs.clients[i].playerTracker.cells[0].position.y;
				} else {
					cells[cells.length-1].name=cells[cells.length-1].mass=cells[cells.length-1].x=cells[cells.length-1].y="Spectator";
				}
				cells[cells.length-1].token=token;
				cells[cells.length-1].isAdmin=gs.clients[i].playerTracker.isAdmin;
			}
		}
	}
	cells=JSON.stringify(cells);
    var buf = new ArrayBuffer(2 + cells.length * 2);
    var view = new DataView(buf);
	var offset = 0;
    view.setUint8(offset, 72, true);
	offset++;
	view.setUint8(offset, 0, true);
	offset++;
	for (var i = 0; i < cells.length; i ++) {
		view.setUint16(offset, cells.charCodeAt(i), true);
		offset+=2;
    };
    return buf;
};

function sendAdmin(t){
	var buf = new ArrayBuffer(1);
	var view = new DataView(buf);
	view.setUint8(0, 73, true);
	t.socket.send(buf);
}