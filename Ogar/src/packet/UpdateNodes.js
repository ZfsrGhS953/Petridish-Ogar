// Import
var BinaryWriter = require("./BinaryWriter");
var sharedWriter = new BinaryWriter(131072);

function UpdateNodes(playerTracker, addNodes, updNodes, eatNodes, delNodes , leaderboard,border,x,y,scale,chat,chatowners,clearall) {
    this.playerTracker = playerTracker; 
    this.addNodes = addNodes;
    this.updNodes = updNodes;
    this.eatNodes = eatNodes;
    this.delNodes = delNodes;
	this.leaderboard=leaderboard;
	this.border=border;
	this.x=x;
	this.y=y;
	this.scale=scale;
	this.chat=chat;
	this.chatowners=chatowners;
	this.clearall=clearall;
}

module.exports = UpdateNodes;

UpdateNodes.prototype.build = function () {
    var writer = sharedWriter;
    writer.reset();                              // Packets          
	var packet1=1,packet2=2,packet3=4,packet4=8,packet5=16,packet6=32,packet7=64,packet8=128;
	if(this.clearall===null)packet1=0;
	if(this.addNodes.length==0&&this.updNodes.length==0)packet2=0;
	if(this.eatNodes.length==0)packet3=0;
	if(this.delNodes.length==0)packet4=0;
	if(this.leaderboard===null)packet5=0;
	if(this.border===null)packet6=0;
	if(this.scale===null)packet7=0;
	if(this.chat.length==0)packet8=0;
	writer.writeUInt8(packet1+packet2+packet3+packet4+packet5+packet6+packet7+packet8);
	var scrambleX = this.playerTracker.scrambleX;
    var scrambleY = this.playerTracker.scrambleY;
    var scrambleId = this.playerTracker.scrambleId;
	if(packet1!==0){
		
	}
	if(packet2!==0){
	for (var i = 0; i < this.updNodes.length; i++) {
        var node = this.updNodes[i];
        // Write update record
        writer.writeUInt32(node.nodeId ^ scrambleId);         // Cell ID
        writer.writeInt16(node.position.x + scrambleX);                // Coordinate X
        writer.writeInt16(node.position.y + scrambleY);                // Coordinate Y
        writer.writeUInt16(node._size);     // Cell Size (not to be confused with mass, because mass = size*size/100)
        writer.writeUInt8(0);                  // Flags
    }
    for (var i = 0; i < this.addNodes.length; i++) {
        var node = this.addNodes[i];
        var cellName = node.getName();
        
        // Write update record
        writer.writeUInt32(node.nodeId ^ scrambleId);         // Cell ID
        writer.writeInt16(node.position.x + scrambleX);                // Coordinate X
        writer.writeInt16(node.position.y + scrambleY);                // Coordinate Y
        writer.writeUInt16(node._size);     // Cell Size (not to be confused with mass, because mass = size*size/100)
        
        writer.writeUInt8(1+cellName.length);                  // Flags
		var color=node.color;
        writer.writeUInt16((color<1536 ? (color+this.playerTracker.scrambleColor)%1536 : color)+(node.owner==this.playerTracker?2048:0)); // Color ID, will be decoded into RGB on the client
        if (node.owner != null && cellName != null && cellName.length > 0)
            writer.writeStringUnicode(cellName);        // Name
    }
    writer.writeUInt32(0);                              // Cell Update record terminator
	}
	if(packet3!==0){
    writer.writeUInt16(this.eatNodes.length);            // EatRecordCount
    for (var i = 0; i < this.eatNodes.length; i++) {
        var node = this.eatNodes[i];
        var hunterId = 0;
        if (node.getKiller()) {
            hunterId = node.getKiller().nodeId;
        }
        writer.writeUInt32(hunterId ^ scrambleId);               // Hunter ID
        writer.writeUInt32(node.nodeId ^ scrambleId);            // Prey ID
    }
	}
	if(packet4!==0){
        writer.writeUInt32(this.delNodes.length);          // RemoveRecordCount
    for (var i = 0; i < this.delNodes.length; i++) {
        var node = this.delNodes[i];
        writer.writeUInt32(node.nodeId ^ scrambleId);                // Cell ID
    }
	}
	if(packet5!==0){
	if(this.playerTracker.gameServer.leaderboardType==49){
		var player = this.playerTracker;
    if (player.spectate && player.spectateTarget != null) {
        player = player.spectateTarget;
    }
		writer.writeUInt8(this.playerTracker.gameServer.leaderboard.length+this.playerTracker.gameServer.realStats.length);       // Number of elements
	for(var i=0;i<this.playerTracker.gameServer.realStats.length;i++){
        writer.writeUInt8(0);
            writer.writeStringZeroUnicode(this.playerTracker.gameServer.realStats[i]);
	}
    for (var i = 0; i < this.playerTracker.gameServer.leaderboard.length; i++) {
        var item = this.playerTracker.gameServer.leaderboard[i];
        if (item == null) return null;  // bad leaderboardm just don't send it

        var name = item.getFragName();
        name = name != "An unnamed cell" ? name : "";
        var id = item == player ? 1 : 0;

        writer.writeUInt8(id);                        // isMe flag/cell ID

        writer.writeStringZeroUnicode(name);

    }
	}
	if(this.playerTracker.gameServer.leaderboardType==50){
		writer.writeUInt8(255);       // Number of elements
    for (var i = 0; i < this.playerTracker.gameServer.leaderboard.length; i++) {
        var item = this.playerTracker.gameServer.leaderboard[i];
        if (item == null) return null;  // bad leaderboardm just don't send it
        
        var value = item;
        if (isNaN(value)) value = 0;
        value = value < 0 ? 0 : value;
        value = value > 1 ? 1 : value;
        
        writer.writeFloat(value);                // isMe flag (previously cell ID)
    }
	}
	}
	if(packet6!==0){
	writer.writeInt32(this.border.minx+scrambleX);
	writer.writeInt32(this.border.miny+scrambleY);
	writer.writeInt32(this.border.maxx+scrambleX);
	writer.writeInt32(this.border.maxy+scrambleY);
	}
	if(packet7!==0){
	writer.writeInt32(this.x);
	writer.writeInt32(this.y);
	writer.writeFloat(this.scale);
	}
	if(packet8!==0){
	writer.writeUInt16(this.chat.length);
	for(var i=0;i<this.chat.length;i++){ // For multiple messages during the same tick
	var text = this.chat[i];
	var sender=this.chatowners[i];
    if (text == null) text = "";
    var name = "SERVER";
    var color = 1691;
    if (this.chatowners[i] != null) {
        name = this.chatowners[i].name;
        if (this.chatowners[i].cells.length == 0){
			name = "Spectator";
		}else{
		color = this.chatowners[i].color;
		}
        }
	writer.writeUInt16(color);
	writer.writeUInt8(name.length);
	for(var j=0;j<name.length;j++)writer.writeUInt16(name.charCodeAt(j));
	writer.writeUInt8(text.length);
	for(var j=0;j<text.length;j++)writer.writeUInt16(text.charCodeAt(j));
	}
	}
    return writer.toBuffer();
};