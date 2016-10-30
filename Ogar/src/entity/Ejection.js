var Cell = require('./Cell');

function Ejection() {
    Cell.apply(this, Array.prototype.slice.call(arguments));

    this.cellType = 4;
}

module.exports = Ejection;
Ejection.prototype = new Cell();