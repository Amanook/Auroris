var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var Promise = require("bluebird");

/* Ninja - ni# */
module.exports = function() {
	this.handleGetNinjaRank = async function(penguin, data) {
		let playerId = data[0];
		let playerExists = await penguin.database.engine.playerIdExists(playerId);

		if(!playerExists) return;

		let jitsuRank = await penguin.database.engine.getColumnById(playerId, 'NinjaBelt');

		penguin.send('gnr', penguin.room.internal_id, playerId, jitsuRank); //add ranks w/ fire & water
	}

	this.handleGetNinjaLevel = function(penguin, data) {
		penguin.send('gnl', penguin.room.internal_id, penguin.belt, penguin.ninja);
	}

	this.handleGetWaterLevel = function(penguin, data) {
		return network.removePenguin(penguin);
	}

	this.handleGetFireLevel = function(penguin, data) {
		return network.removePenguin(penguin);
	}

	this.handleGetCardData = function(penguin, data) {
		let uniqueCards = penguin.cards.filter((e, p) => penguin.cards.indexOf(e) == p);
		
		let cardDetails = uniqueCards.map(c => {
			let id = c.split('|')[1];
			let quantity = penguin.cards.filter(v => v == c).length;

			return [id, quantity].join(',');
		});

		penguin.send('gcd', penguin.room.internal_id, cardDetails.join('|'));
	}
}