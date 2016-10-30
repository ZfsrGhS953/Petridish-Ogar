function ClearOwned() { }

module.exports = ClearOwned;

ClearOwned.prototype.build = function (protocol) {
    var buffer = new Buffer(1);
    buffer.writeUInt8(20, 0);
    return buffer;
};