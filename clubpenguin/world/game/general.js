var logger = require('../../../util/logger.js');
var network = require('../../../util/network.js');
var EventEmitter = require('events');

CEvent = new EventEmitter();

/* Games - z# */
module.exports = function() {
	
	this.calculationsByGame = {
		220: ['findFourScore', 'Find Four'],
		221: ['findFourScore', 'Find Four'],
		
		904: ['coinScore', 'Ice Fishing'],
		905: ['coinScore', 'Cart Surfer'],
		906: ['coinScore', 'Jetpack Adventure'],
		912: ['coinScore', 'Catchin Waves'],
		916: ['coinScore', 'Aqua Grabber'],
		917: ['coinScore', 'Paint By Letters'],
		918: ['coinScore', 'Paint By Letters'],
		919: ['coinScore', 'Paint By Letters'],
		950: ['coinScore', 'System Defender'],
		952: ['coinScore', 'Dance Contest'],
		
		900: ['divideScore', 'Astro Barrier'],
		901: ['divideScore', 'Bean Counters'],
		902: ['divideScore', 'Puffle Round-Up'],
		903: ['divideScore', 'Hydro Hopper'],
		909: ['divideScore', 'Thin Ice'],
		910: ['divideScore', 'Pizzatron 3000'],
		949: ['divideScore', 'Puffle Rescue'],
		955: ['divideScore', 'Puffle Launch'],
		
		999: ['sledScore', 'Sled Racing']
	}
	
	CEvent.on('coinScore', (penguin, score) => {
		var coins = Number(score);
		
		if(Number(score) < 5) {
			coins = 0;
		}
		
		sendGameOver(penguin, coins);
	});
	
	CEvent.on('divideScore', (penguin, score) => {
		var coins = Math.floor(Number(score) / 10);
		
		if(Number(score) < 5) {
			coins = 0;
		}
		
		sendGameOver(penguin, coins);
	});
	
	CEvent.on('sledScore', (penguin, score) => {
		var coins = 0;
		
		switch(Number(score)) {
			case 1:
				coins = 20;
			break;
			case 2:
				coins = 10;
			break;
			case 3:
				coins = 5;
			break;
		}
		
		sendGameOver(penguin, coins);
	});
	
	CEvent.on('findFourScore', (penguin, score) => {
		//find four might be handled differently
	});
	
	this.sendGameOver = function(penguin, coins) {
		if(global.game_stamps[penguin.room.external_id] !== undefined) {
			var stampArray = global.game_stamps[penguin.room.external_id];
			var totalGameStamps = stampArray.length;
			var myCollectedStamps = [];
			
			for(var index in penguin.stamps) {
				if(stampArray.indexOf(Number(penguin.stamps[index])) >= 0) {
					myCollectedStamps.push(penguin.stamps[index]);
				}
			}
			
			var myTotalGameStamps = myCollectedStamps.length;
			
			if(myTotalGameStamps == totalGameStamps) {
				console.log('2x coins!');
				coins = coins * 2;
			}
			
			penguin.addCoins(coins);
			penguin.send('zo', penguin.room.internal_id, penguin.coins, myCollectedStamps.join('|'), myCollectedStamps.length, totalGameStamps, totalGameStamps);
		} else {
			penguin.addCoins(coins);
	
			penguin.send('zo', penguin.room.internal_id, penguin.coins, '', 0, 0, 0);
		}
	}
	
	this.handleGameOver = function(penguin, data) {
		if(!penguin.joined) {
			return network.removePenguin(penguin);
		}

		var score = data[0];
	
		if(isNaN(score)) {
			return network.removePenguin(penguin);
		}
		
		if(!penguin.room.is_game && penguin.room.external_id !== 999) {
			return network.removePenguin(penguin);
		}
		
		if(score > 99991) {
			WebhookEvent.emit('coin-log', {
				'Type': 'Coin Exploit',
				'Player': penguin.id + ':' + penguin.username,
				'Score': score,
				'Current Coins': penguin.coins,
				'Game ID': penguin.room.external_id,
				'Game Name': penguin.room.name,
				'Action': 'Divided score by 100',
				'Edit Player': 'https://team.cprewritten.net/edit_player.php?playerId=' + penguin.id
			});
			
			score = Number(score / 100);
		}
		
		var emit = calculationsByGame[penguin.room.external_id];
		
		if(emit != undefined) {
			logger.log('Game: ' + penguin.room.name, 'green');
			CEvent.emit(emit[0], penguin, score);
		} else {
			logger.log('Game: ' + penguin.room.name, 'red');
			CEvent.emit('divideScore', penguin, score);
		}
	}
	
	this.getGameData = function(penguin, data) {
		penguin.database.get_column(penguin.id, 'GameData', function(gameData) {
			penguin.send('ggd', penguin.room.internal_id, gameData);
		});
	}
	
	this.saveGameData = function(penguin, data) {
		var gameData = data[0];
		
		penguin.database.update_column(penguin.id, 'GameData', gameData);
	}
}
