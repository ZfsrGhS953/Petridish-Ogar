function ClearAll() { }

module.exports = ClearAll;

ClearAll.prototype.build = function (protocol) {
    var buffer = new Buffer(1);
    buffer.writeUInt8(18, 0);
    return buffer;
};