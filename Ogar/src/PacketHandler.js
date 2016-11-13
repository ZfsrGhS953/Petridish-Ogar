var Packet = require('./packet');
var BinaryReader = require('./packet/BinaryReader');

function PacketHandler(gameServer, socket) {
    this.gameServer = gameServer;
    this.socket = socket;
    // Detect protocol version - we can do something about it later
    this.protocol = 4;
    this.isHandshakePassed = false;
    this.lastChatTick = 0;

    this.pressQ = false;
    this.pressW = false;
    this.pressSpace = false;
	this.pressE = false;
	this.pressR = false;
}

module.exports = PacketHandler;

PacketHandler.prototype.handleMessage = function(message) {
    // Discard empty messages
    if (message.length == 0)
        return;
    if (message.length > 2048) {
        // anti-spamming
        this.socket.close(1009, "Spam");
        return;
    }
    var reader = new BinaryReader(message);
    
    // no handshake?
    /*if (!this.isHandshakePassed) { 
        if (packetId != 254 || message.length != 5)
            return; // wait handshake
        
        // Handshake request
        this.protocol = reader.readUInt32();
        if (this.protocol < 1 || this.protocol > 9) {
            this.socket.close(1002, "Not supported protocol");
            return;
        }
        // Send handshake response
        this.socket.sendPacket(new Packet.ClearAll());
        this.socket.sendPacket(new Packet.SetBorder(this.socket.playerTracker, this.gameServer.border, this.gameServer.config.serverGamemode, "MultiOgar"));
        // Send welcome message
        if (this.gameServer.config.serverWelcome1)
            this.gameServer.sendChatMessage(null, this.socket.playerTracker, this.gameServer.config.serverWelcome1);
        if (this.gameServer.config.serverWelcome2)
            this.gameServer.sendChatMessage(null, this.socket.playerTracker, this.gameServer.config.serverWelcome2);
        if (this.gameServer.config.serverChat == 0)
            this.gameServer.sendChatMessage(null, this.socket.playerTracker, "This server's chat is disabled.");
        if (this.protocol < 4)
            this.gameServer.sendChatMessage(null, this.socket.playerTracker, "WARNING: Protocol " + this.protocol + " assumed as 4!");
        this.isHandshakePassed = true;
        return;
    }*/
    this.socket.lastAliveTime = +new Date;
	try{
            // Set Target
            var client = this.socket.playerTracker;
                // protocol late 5, 6, 7
                client.mouse.x = reader.readInt32() - client.scrambleX;
                client.mouse.y = reader.readInt32() - client.scrambleY;
				if(client.flipX>0.5)client.mouse.x=-client.mouse.x;
				if(client.flipY>0.5)client.mouse.y=-client.mouse.y;
				var flags = reader.readUInt16();
				if(flags & 1){
				if(this.gameServer.config.gamemodeEatForSpeed==0||this.gameServer.time<1||this.gameServer.time>75){
            // Space Press - Split cell
            this.pressSpace=true;
				}
            }
			    if(flags & 2){
				// Q Key Pressed
            this.pressQ=true;
			if(this.gameServer.config.gamemodeSnakerDish==1)this.socket.playerTracker.a=1;
				}
				if(flags & 4){
				this.socket.playerTracker.a=0;
				}
				
				if(flags & 8){
				if(this.gameServer.config.gamemodeEatForSpeed==0||this.gameServer.time<1||this.gameServer.time>75){
            this.pressW=true;
				}
				}
				if(flags & 16){
					if(this.gameServer.config.gamemodeEatForSpeed==0||this.gameServer.time<1||this.gameServer.time>75){
					this.pressR=true;
					}
				}
				if(flags & 32){
					if(this.gameServer.config.gamemodeEatForSpeed==0||this.gameServer.time<1||this.gameServer.time>75){
					this.pressE=true;
					}
				}
				if(flags & 64){
					// Spectate mode
            if (this.socket.playerTracker.cells.length <= 0) {
                // Make sure client has no cells
                this.socket.playerTracker.spectate = true;
            }
				}
				if(flags & 128){
				var length=Math.min(reader.readUInt8(),this.gameServer.config.playerMaxNickLength);
				var str="";
				for(var i=0;i<length;i++){
					str+=String.fromCharCode(reader.readUInt16());
				}
            this.setNickname(str);
				}
				if((flags & 256)&&this.gameServer.config.serverChat){
            // Chat
            // chat anti-spam
            // Just ignore if the time between two messages is smaller than 2 seconds
            // The user should stop spamming for at least 2 seconds in order to send next chat message
            var tick = this.gameServer.getTick();
            var deltaTick = tick - this.lastChatTick;
            this.lastChatTick = tick;
            if (deltaTick>79){
            var length=reader.readUInt8();
				var str="";
				for(var i=0;i<length;i++){
					str+=String.fromCharCode(reader.readUInt16());
				}
            this.gameServer.chat.push(str);
			this.gameServer.chatowners.push(this.socket.playerTracker);
			}
				}
				if(flags & 512){
				if(this.gameServer.config.gamemodeEatForSpeed==0||this.gameServer.time<1||this.gameServer.time>75){
				this.pressT=true;
				}
				}
	}catch(e){};
}

PacketHandler.prototype.setNickname = function (text) {
    var name = "";
    var skin = null;
    if (text != null && text.length != 0) {
        var n = -1;
        /*if (text.charAt(0) == '<' && (n = text.indexOf('>', 1)) >= 0) {
            skin = "%" + text.slice(1, n);
            name = text.slice(n + 1);
            //} else if (text[0] == "|" && (n = text.indexOf("|", 1)) >= 0) {
            //    skin = ":http://i.imgur.com/" + text.slice(1, n) + ".png";
            //    name = text.slice(n + 1);
        } else {*/
            name = text;
        //}
    }
    this.socket.playerTracker.joinGame(name, skin);
};
