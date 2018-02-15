var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');

/* Mancala Instance */
module.exports = function() {
	this.tablesById[100] = [];
	this.tablesById[101] = [];
	this.tablesById[102] = [];
	this.tablesById[103] = [];
	this.tablesById[104] = [];
	
	this.roomByTable[100] = 111;
	this.roomByTable[101] = 111;
	this.roomByTable[102] = 111;
	this.roomByTable[103] = 111;
	this.roomByTable[104] = 111;
	
	this.gameByTable[100] = 'Mancala';
	this.gameByTable[101] = 'Mancala';
	this.gameByTable[102] = 'Mancala';
	this.gameByTable[103] = 'Mancala';
	this.gameByTable[104] = 'Mancala';
}