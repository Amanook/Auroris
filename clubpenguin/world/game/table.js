var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var room = require('../../room.js');
var EventEmitter = require('events');
var Promise = require("bluebird");

/* Tables */
module.exports = function() {
	this.tablesById = {};
	this.tablePlayers = {};
	this.gameByTableId = {};
	this.roomByTable = {};
	this.gameByTable = {};
	
	TableEvent = new EventEmitter();
	
	require('./findfour.js')();
	require('./mancala.js')();
	
	this.handleGetTables = function(penguin, data) {
		let tableIds = data;
		let tablePopulation = tableIds.map(tid => [tid, tablesById[tid].length].join('|')).join('%');

		penguin.send('gt', penguin.room.internal_id, tablePopulation);
	}
	
	this.handleJoinTable = function(penguin, data) {
		if(isNaN(data[0])) return;
		if(penguin.inWaddle) return;
		
		leaveWaddle(penguin);
		leaveTable(penguin);
		
		let tableId = Number(data[0]);
		let seatId = tablesById[Number(tableId)].length;
		let game = gameByTable[tableId];
		
		if(game == undefined) return;
		
		let eventEmit = 'JoinTable-' + String(game);
		TableEvent.emit(eventEmit, penguin, tableId, seatId);
	}
	
	this.handleLeaveTable = function(penguin, data) {
		leaveTable(penguin);
	}
	
	this.leaveTable = function(penguin) {
		if(penguin.tableId == null) return;

		let game = gameByTable[penguin.tableId];

		if(penguin.playerSeat > 1) {
			tablePlayers[tableId].splice(penguin.playerSeat);
			game.spectators.splice(game.spectators.indexOf(penguin));
			return;
		}
		
		let opponentSeatId = penguin.playerSeat == 0 ? 1 : 0;
		
		if(tablePlayers[penguin.tableId][opponentSeatId] !== undefined) {
			tablePlayers[penguin.tableId][opponentSeatId].addCoins(10);
		}
		
		penguin.room.send(penguin, 'ut', penguin.room.internal_id, penguin.tableId, penguin.playerSeat);

		if(tablesById[penguin.tableId].length >= 2) {
			Promise.each(tablePlayers[penguin.tableId], (p) => p.send('cz', p.room.internal_id, penguin.name()));
		}
		
		tablesById[penguin.tableId] = [];
		tablePlayers[penguin.tableId] = [];

		delete gameByTableId[penguin.tableId];
		
		penguin.tableId = null;
	}
}