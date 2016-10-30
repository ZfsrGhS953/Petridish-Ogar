function Cell(gameServer, owner, position, size) {
    this.gameServer = gameServer;
    this.owner = owner;     // playerTracker that owns this cell
    
    this.tickOfBirth = 0;
    this.color = 1536; // 0-1535 - chrominance (0=red, 512=green, 1024=blue), 1536-1791 - luminance(1536=black, 1664=grey, 1791=white), 1792 - virus color, 1793 - spawner color.
    this.position = { x: 0, y: 0 };
    this._size = 0;
    this._mass = 0;
    this._sizeSquared = 0;
    this.cellType = -1;     // 0 = Player Cell, 1 = Food, 2 = Virus, 3 = Ejected Mass
    this.isSpiked = false;  // If true, then this cell has spikes around it
    this.isAgitated = false;// If true, then this cell has waves on it's outline
    this.killedBy = null;   // Cell that ate this cell
    this.isMoving = false;  // Indicate that cell is in boosted mode

    this.boostDistance = 0;
    this.boostDirection = { x: 0, y: 0};
    this.ejector = null;
    
    if (this.gameServer != null) {
        this.nodeId = this.gameServer.getNextNodeId();
        this.tickOfBirth = this.gameServer.getTick();
        if (size != null) {
            this.setSize(size);
        }
        if (position != null) {
            this.setPosition(position);
        }
    }
}

module.exports = Cell;


// Fields not defined by the constructor are considered private and need a getter/setter to access from a different class

Cell.prototype.getName = function() {
    return "";
};

Cell.prototype.getSkin = function () {
    return "";
};

Cell.prototype.setColor = function(color) {
    this.color.r = color.r;
    this.color.g = color.g;
    this.color.b = color.b;
};

Cell.prototype.getColor = function() {
    return this.color;
};

Cell.prototype.getType = function() {
    return this.cellType;
};

Cell.prototype.setSize = function (size) {
    this._size = size;
    this._sizeSquared = size * size;
    this._mass = this._sizeSquared / 100;
};

Cell.prototype.getSize = function() {
    return this._size;
};

Cell.prototype.getMass = function () {
    return this._mass;
};

Cell.prototype.getSizeSquared = function () {
    return this._sizeSquared;
};

Cell.prototype.getSpeed = function() {
    return this.gameServer.config.playerSpeed / Math.pow(this._size, 0.449);
};

Cell.prototype.setAngle = function(angle,distance) {
    this.boostDirection = {
        x: Math.sin(angle)*distance,
        y: Math.cos(angle)*distance
    };
};

Cell.prototype.getAngle = function() {
    return Math.atan2(this.boostDirection.x,this.boostDirection.y);
};

// Returns cell age in ticks for specified game tick
Cell.prototype.getAge = function (tick) {
    if (this.tickOfBirth == null) return 0;
    return Math.max(0, tick - this.tickOfBirth);
}

Cell.prototype.setKiller = function (cell) {
    this.killedBy = cell;
};

Cell.prototype.getKiller = function () {
    return this.killedBy;
};

Cell.prototype.setPosition = function (pos) {
    this.position.x = pos.x;
    this.position.y = pos.y;
};

// Virtual

Cell.prototype.canEat = function (cell) {
    // by default cell cannot eat anyone
    return false;
};

Cell.prototype.onEat = function (prey,gameServer) {
    // Called to eat prey cell
    this.setSize(Math.sqrt(this.getSizeSquared() + prey.getSizeSquared()));
}

Cell.prototype.onEaten = function (hunter) {
};

Cell.prototype.onAdd = function (gameServer) {
    // Called when this cell is added to the world
};

Cell.prototype.onRemove = function (gameServer) {
    // Called when this cell is removed
};

// Functions

Cell.prototype.setBoost = function (distance, angle) {
    if (isNaN(angle)) angle = 0;
    
	this.boostDirection = {
        x: Math.sin(angle)*distance,
        y: Math.cos(angle)*distance
    };
	
    this.isMoving = true;
    if (!this.owner) {
        var index = this.gameServer.movingNodes.indexOf(this);
        if (index < 0)
            this.gameServer.movingNodes.push(this);
    }
};

Cell.prototype.addBoost = function (distance, angle,maxDistance) {
    if (isNaN(angle)) angle = 0;
    
    this.boostDirection = {
        x: this.boostDirection.x+Math.sin(angle)*distance,
        y: this.boostDirection.y+Math.cos(angle)*distance
    };
	var dist=this.boostDirection.x*this.boostDirection.x+this.boostDirection.y*this.boostDirection.y;
	if(dist>maxDistance*maxDistance){
	this.boostDirection.x/=Math.sqrt(dist/(maxDistance*maxDistance));
	this.boostDirection.y/=Math.sqrt(dist/(maxDistance*maxDistance));
	}
    this.isMoving = true;
    if (!this.owner) {
        var index = this.gameServer.movingNodes.indexOf(this);
        if (index < 0)
            this.gameServer.movingNodes.push(this);
    }
};

Cell.prototype.move = function (border) {
    if (this.isMoving && this.boostDirection.x < 1 && this.boostDirection.y < 1 && this.boostDirection.x > -1 && this.boostDirection.y > -1) {
        this.boostDirection.x=0;
		this.boostDirection.y=0;
        this.isMoving = false;
        return;
    }

    this.position.x += this.boostDirection.x * 0.1;
    this.position.y += this.boostDirection.y * 0.1;
	this.boostDirection.x*=0.9;
	this.boostDirection.y*=0.9;
	var r = this._size / 2;
	if(this.position.x<border.minx+r||this.position.x>border.maxx-r)this.boostDirection.x=-this.boostDirection.x;
	if(this.position.y<border.miny+r||this.position.y>border.maxy-r)this.boostDirection.y=-this.boostDirection.y;
}

Cell.prototype.checkBorder = function (border) {
    var r = this._size / 2;
    var x = this.position.x;
    var y = this.position.y;
    x = Math.max(x, border.minx + r);
    y = Math.max(y, border.miny + r);
    x = Math.min(x, border.maxx - r);
    y = Math.min(y, border.maxy - r);
    if (x != this.position.x || y != this.position.y) {
        this.setPosition({ x: x, y: y });
    }
};