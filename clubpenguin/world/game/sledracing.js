var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var range = require("range").range;

/* Sled Racing Instance */
module.exports = function() {
	this.waddlesById[230] = {};
	this.waddlesById[230][100] = ['', '', '', ''];
	this.waddlesById[230][101] = ['', '', ''];
	this.waddlesById[230][102] = ['', ''];
	this.waddlesById[230][103] = ['', ''];
	
	this.waddleConnections[230] = {};
	this.waddleConnections[230][100] = [false, false, false, false];
	this.waddleConnections[230][101] = [false, false, false];
	this.waddleConnections[230][102] = [false, false];
	this.waddleConnections[230][103] = [false, false];

	this.waddlePlayers[230] = {};

	this.waddlePlayerStrings[230] = {};

	this.roomByWaddle[230] = {};
	
	this.roomByWaddle[230][100] = 999;
	this.roomByWaddle[230][101] = 999;
	this.roomByWaddle[230][102] = 999;
	this.roomByWaddle[230][103] = 999;
	
	WaddleEvent.on('StartWaddle-999', (externalId, waddleId, waddleRoomId) => {
		logger.log('Starting Sled Race [' + waddleId + ']', 'green');
		
		var roomId = roomByWaddle[waddleRoomId][waddleId];
		var seatCount = waddlePlayers[waddleRoomId][waddleId].length;
				
		for(var index in waddlePlayers[waddleRoomId][waddleId]) {
			var player = waddlePlayers[waddleRoomId][waddleId][index];
			
			player.waddleId = waddleId;
			player.waddleRoom = externalId;
			player.playerSeat = index;
			player.send('sw', player.room.internal_id, roomId, externalId, seatCount);
		}

		for(var index in waddlesById[waddleRoomId][waddleId]) {
			waddlesById[waddleRoomId][waddleId][index] = '';
		}

		waddlePlayers[waddleRoomId][waddleId] = [];
	});
	
	WaddleEvent.on('Join-999', (penguin) => {
		logger.log(penguin.name() + ' is joining a Sled Race', 'green');
		
		var playerString = [penguin.name(), penguin.colour, penguin.hand, penguin.name()];
		
		waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId].push(playerString.join('|'));
		waddleConnections[penguin.waddleRoomId][penguin.waddleId][penguin.playerSeat] = true;
		
		if(waddleConnections[penguin.waddleRoomId][penguin.waddleId].indexOf(false) == -1) {
			let waddleLength = waddleConnections[penguin.waddleRoomId][penguin.waddleId].length;

			logger.log('connection length: {0}'.format(waddleLength), 'cyan');

			penguin.room.send(penguin, 'uz', penguin.room.internal_id, waddleLength, waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId].join('%'));
			
			waddlePlayerStrings[penguin.waddleRoomId][penguin.waddleId] = [];
			waddleConnections[penguin.waddleRoomId][penguin.waddleId] = range(waddleLength).map(w => false); //reset connections
		}
	});
	
	WaddleEvent.on('Movement-999', (penguin, data) => {
		penguin.room.send(penguin, 'zm', penguin.room.internal_id, data.join('%'));
	});
}