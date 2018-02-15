var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var commandsService = require('../events/commands.js');
var Promise = require("bluebird");

require('./moderation.js')();

setInterval(function() {
	global.mainDatabase.getFilterVersion(function(version) {			
		if(Number(version) !== Number(this.filterVersion)) {
			getFilter(global.mainDatabase);
		}
	});
}.bind(this), 600000);

/* Messaging - m# */
module.exports = function() {
	this.filterVersion = null;
	this.filterCategories = {};
	
	commandsService.setupCommandModules();
	
	this.getFilter = function(database, callback) {
		if(database == undefined) {
			return;
		}
		
		database.getSocialFilter(function(results) {
			if(results == undefined || results == null) {
				logger.log('Social Filter Not Loaded', 'red');
			}
			
			this.filterCategories['ban'] = results['ban'].split(',');
			this.filterCategories['kick'] = results['kick'].split(',');
			this.filterCategories['mute'] = results['mute'].split(',');
			this.filterCategories['whitelist'] = results['whitelist'].split(',');
			this.filterCategories['blacklist'] = results['blacklist'].split(',');
			this.filterCategories['strpos'] = results['strpos'].split(',');
			
			this.filterVersion = Number(results['version']);
			
			if(typeof(callback) == 'function') {
				return callback();
			}
		});
		
		logger.log('Social Filter Loaded', 'green');
	}
	
	this.sendMessageRequest = function(penguin, data) {
		var playerId = data[0];
		var message = data[1];
		
		if(Number(playerId) !== Number(penguin.id)) {
			return network.removePenguin(penguin);
		}

		if(penguin.muted) {
			return;
		}
		
		if(message.length > 48) {
			return;
		}
		
		var commandCheck = commandsService.isValidCommand(message.toLowerCase());
		
		if(commandCheck !== false && penguin.moderator) {
			return commandsService.CommandsEvent.emit(commandCheck, penguin, message);
		}

		if(filterVersion == null) {
			getFilter(penguin.database, function() {
				checkMessage(penguin, message);
			});
		} else {
			checkMessage(penguin, message);
		}
	}
	
	this.checkMessage = function(penguin, message) {
		var lowerMsg = message.toLowerCase();
		
		if(this.filterCategories['ban'].indexOf(String(lowerMsg)) >= 0) {
			return banMessage(penguin, message);
		} else if(this.filterCategories['kick'].indexOf(String(lowerMsg)) >= 0) {
			return kickMessage(penguin, message);
		} else if(this.filterCategories['mute'].indexOf(String(lowerMsg)) >= 0) {
			return sendBlockedMessage(penguin, message);
		}
		
		let words = message.split(' ');
		for(var index in words) {
			var word = words[index];
			
			if(this.filterCategories['ban'].indexOf(String(word).toLowerCase()) >= 0) {
				return banMessage(penguin, message);
			} else if(this.filterCategories['kick'].indexOf(String(word).toLowerCase()) >= 0) {
				return kickMessage(penguin, message);
			} else if(this.filterCategories['mute'].indexOf(String(word).toLowerCase()) >= 0) {
				return sendBlockedMessage(penguin, message);
			} else	if(this.filterCategories['blacklist'].indexOf(String(word).toLowerCase()) >= 0) {
				return sendBlockedMessage(penguin, message);
			}
			
			var noSymbols = word.replace(/[^a-zA-Z ]/g, '');
			if(this.filterCategories['ban'].indexOf(String(noSymbols).toLowerCase()) >= 0) {
				return banMessage(penguin, message);
			} else if(this.filterCategories['kick'].indexOf(String(noSymbols).toLowerCase()) >= 0) {
				return kickMessage(penguin, message);
			} else if(this.filterCategories['mute'].indexOf(String(noSymbols).toLowerCase()) >= 0) {
				return sendBlockedMessage(penguin, message);
			} else if(this.filterCategories['blacklist'].indexOf(String(noSymbols).toLowerCase()) >= 0) {
				return sendBlockedMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['ban']) {
			var word = this.filterCategories['ban'][index];
			
			if(word == lowerMsg) {
				return banMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return banMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['kick']) {
			var word = this.filterCategories['kick'][index];
			
			if(word == lowerMsg) {
				return kickMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return kickMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['mute']) {
			var word = this.filterCategories['mute'][index];
			
			if(word == lowerMsg) {
				return sendBlockedMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return sendBlockedMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['blacklist']) {
			var word = this.filterCategories['blacklist'][index];
			
			if(word == lowerMsg) {
				return sendBlockedMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return sendBlockedMessage(penguin, message);
			}
		}
		
		for(var index in this.filterCategories['strpos']) {
			var word = this.filterCategories['strpos'][index];
			
			if(word == lowerMsg) {
				return sendBlockedMessage(penguin, message);
			}
			
			if(word == lowerMsg.replace(/\s+/g, '')) {
				return sendBlockedMessage(penguin, message);
			}
			
			if(lowerMsg.indexOf(word) >= 0) {
				return sendBlockedMessage(penguin, message);
			}
		}
		
		return sendMessage(penguin, message);
	}
	
	this.banMessage = function(penguin, message) {
		banPlayer(penguin, message);
		
		logMessage(penguin, message, 'banned');
	}
	
	this.kickMessage = function(penguin, message) {
		kickPlayer(penguin);
		
		logMessage(penguin, message, 'kicked');
	}
	
	this.sendBlockedMessage = function(penguin, message) {
		for(var index in penguin.room.players) {
			var player = penguin.room.players[index];
			
			if(player.moderator) {
				player.send('mm', penguin.room.internal_id, message, penguin.id);
			}
		}
		
		logMessage(penguin, message, 'mod');
	}
	
	this.sendMessage = function(penguin, message) {
		penguin.room.send(penguin, 'sm', penguin.room.internal_id, penguin.id, message);
		
		logMessage(penguin, message, 'sent');
	}
	
	this.logMessage = function(penguin, message, action) {
		penguin.remote.storeMessage(penguin.id, penguin.name(), message, action.toUpperCase());
	}
}