'use strict';
/*
* Fast and easy Quad-Tree implementation written by Barbosik.
* Useful for quick object search in the area specified with bounds.
*
* Copyright (c) 2016 Barbosik https://github.com/Barbosik
* License: Apache License, Version 2.0
*
*/
function QuadNode(bound, level, parent) {
    var width = bound.maxx - bound.minx;
    var height = bound.maxy - bound.miny;
    
    this.level = level;
    this.parent = parent;
    this.bound = {
        minx: bound.minx, 
        miny: bound.miny,
        maxx: bound.maxx,
        maxy: bound.maxy,
        width: width,
        height: height,
        cx: bound.minx + width / 2,
        cy: bound.miny + height / 2
    };
    this.childNodes = [];
    this.items = [];
}

module.exports = QuadNode;

QuadNode.prototype.insert = function (item) {
    if (this.childNodes.length != 0) {
        var quad = this.getQuad(item.bound);
        if (quad != -1) {
            this.childNodes[quad].insert(item);
            return;
        }
    }
    this.items.push(item);
    item._quadNode = this;  // attached field, used for quick search quad node by item
    
    // check if rebalance needed
    if (this.childNodes.length != 0 || this.level >= 54 || this.items.length < 50)
        return;
    // split and rebalance current node
        // split
        this.childNodes.push(new QuadNode({ minx: this.bound.cx, miny: this.bound.miny, maxx: this.bound.maxx, maxy: this.bound.cy }, this.level + 1, this));
        this.childNodes.push(new QuadNode({ minx: this.bound.minx, miny: this.bound.miny, maxx: this.bound.cx, maxy: this.bound.cy }, this.level + 1, this));
        this.childNodes.push(new QuadNode({ minx: this.bound.minx, miny: this.bound.cy, maxx: this.bound.cx, maxy: this.bound.maxy }, this.level + 1, this));
        this.childNodes.push(new QuadNode({ minx: this.bound.cx, miny: this.bound.cy, maxx: this.bound.maxx, maxy: this.bound.maxy }, this.level + 1, this));
    // rebalance
    for (var i = 0; i < this.items.length; ) {
        var qitem = this.items[i];
        var quad = this.getQuad(qitem.bound);
        if (quad != -1) {
            this.items.splice(i, 1);
            qitem._quadNode = null;
            this.childNodes[quad].insert(qitem);
        }
        else i++;
    }
};

QuadNode.prototype.remove = function (item) {
    var index = this.items.indexOf(item);
    this.items.splice(index, 1);
    item._quadNode = null;
    cleanup(this);
};

function cleanup (node) {
    if (node.parent==null || node.items.length > 0) return;
    for (var i = 0; i < node.childNodes.length; i++) {
        var child = node.childNodes[i];
        if (child.childNodes.length > 0 || child.items.length > 0)
            return;
    }
    node.childNodes = [];
    cleanup(node.parent);
};

QuadNode.prototype.update = function (item) {
    item._quadNode.remove(item);
    this.insert(item);
};

QuadNode.prototype.clear = function () {
    for (var i = 0; i < this.items.length; i++)
        this.items[i]._quadNode = null;
    this.items = [];
    for (var i = 0; i < this.childNodes.length; i++)
        this.childNodes[i].clear();
    this.childNodes = [];
};

QuadNode.prototype.contains = function (item) {
    if (item._quadNode == null)
        return false;
    if (item._quadNode != this) {
        return item._quadNode.contains(item);
    }
    return this.items.indexOf(item) >= 0;
};

QuadNode.prototype.find = function (bound, callback) {
    if (this.childNodes.length != 0) {
        var quad = this.getQuad(bound);
        if (quad != -1) {
            this.childNodes[quad].find(bound, callback);
        } else {
            for (var i = 0; i < this.childNodes.length; i++) {
                var node = this.childNodes[i];
                if (checkBoundIntersection(node.bound, bound))
                    node.find(bound, callback);
            }
        }
    }
    for (var i = 0; i < this.items.length; i++) {
        var item = this.items[i];
        if (checkBoundIntersection(item.bound, bound))
            callback(item);
    }
};

QuadNode.prototype.any = function (bound, predicate) {
    if (this.childNodes.length != 0) {
        var quad = this.getQuad(bound);
        if (quad != -1) {
            if (this.childNodes[quad].any(bound, predicate))
                return true;
        } else {
            for (var i = 0; i < this.childNodes.length; i++) {
                var node = this.childNodes[i];
                if (checkBoundIntersection(node.bound, bound))
                    if (node.any(bound, predicate))
                        return true;
            }
        }
    }
    for (var i = 0; i < this.items.length; i++) {
        var item = this.items[i];
        if (checkBoundIntersection(item.bound, bound)) {
            if (predicate == null || predicate(item))
                return true;
        }
    }
    return false;
};

QuadNode.prototype.scanNodeCount = function () {
    var count = 0;
    for (var i = 0; i < this.childNodes.length; i++) {
        count += this.childNodes[i].scanNodeCount();
    }
    return 1 + count;
};

QuadNode.prototype.scanItemCount = function () {
    var count = 0;
    for (var i = 0; i < this.childNodes.length; i++) {
        count += this.childNodes[i].scanItemCount();
    }
    return this.items.length + count;
};

// Returns quadrant for the bound.
// Returns -1 if bound cannot completely fit within a child node
QuadNode.prototype.getQuad = function (bound) {
    var isTop = bound.miny < this.bound.cy && bound.maxy < this.bound.cy;
    var isLeft = bound.minx < this.bound.cx && bound.maxx < this.bound.cx;
    if (isLeft) {
        if (isTop) return 1;
        else if (bound.miny > this.bound.cy) return 2; // isBottom
    }
    else if (bound.minx > this.bound.cx) // isRight
    {
        if (isTop) return 0;
        else if (bound.miny > this.bound.cy) return 3; // isBottom
    }
    return -1;  // cannot fit (too large size)
};

function checkBoundIntersection(bound1, bound2) {
    var notIntersect = 
        bound2.minx >= bound1.maxx ||
        bound2.maxx <= bound1.minx ||
        bound2.miny >= bound1.maxy ||
        bound2.maxy <= bound1.miny;
    return !notIntersect;
};
