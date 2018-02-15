var network = require('../../../../util/network.js');
var logger = require('../../../../util/logger.js');
var range = require("range").range;

function FindFour() {
	this.players = [];
	this.spectators = [];

	this.board = [
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 0, 0, 0, 0]
	];

	this.seatTurn = 0;

	this.MAX_STREAK = 4;
	this.ROWS = this.board.length;
	this.COLUMNS = this.board[0].length;

	this.INVALID_PLACE = -1;
	this.PLACED = 0;
	this.GAME_WIN = 1;
	this.GAME_TIE = 2;
	this.GAME_NOFIND = 3;

	logger.log('BOARD::{0}x{1}'.format(this.COLUMNS, this.ROWS), 'cyan');

	this.boardToString = function() {
		let boardString = this.board.map((row) => row.join(','));
		
		return boardString.join(',');
	}

	this.boardToArray = function() {
		let boardString = this.boardToString();

		return boardString.split(',').map(Number);
	}

	this.boardFull = function() {
		let board = this.boardToArray();

		if(board.indexOf(0) == -1) {
			return true;
		}

		return false;
	}

	this.playerSeatToIndex = function(seat) {
		return Math.floor(Number(seat) + 1);
	}

	this.boardAntiCheat = function(penguin, obj) {
		let tempBoard = this.board.slice(0, this.board.length);

		if(obj.seat != this.seatTurn) {
			logger.log('Seat cheat attempt', 'red');

			return network.removePenguin(penguin);
		}

		if(this.board[obj.row][obj.column] !== 0) {
			logger.log('Board placement cheat attempt', 'red');

			return network.removePenguin(penguin);
		}

		tempBoard[obj.row][obj.column] = 'x';

		console.log('BOARD', tempBoard);

		if(this.board[obj.row][(obj.column + 1)] !== undefined) {
			if(this.board[obj.row][(obj.column + 1)] == 0) {
				logger.log('Board gravity hax', 'red');

				return network.removePenguin(penguin);
			}
		}
	}

	this.columnCheck = function(column) {
		let streak = 0;

		for(let row of this.board) {
			if(row[column] != this.playerSeatToIndex(this.seatTurn)) {
				streak = 0;
				continue;
			}

			streak++;

			if(streak == this.MAX_STREAK) return this.GAME_WIN;
		}

		return this.GAME_NOFIND;
	}

	this.checkVerticalWin = function() {
		for(let column of range(this.ROWS)) {
			if(this.columnCheck(column) == this.GAME_WIN) return this.GAME_WIN;
		}

		return this.GAME_NOFIND;
	}

	this.checkHorizontalWin = function() {
		let streak = 0;

		for(let row of this.board) {
			for(let chip of row) {
				if(chip == this.playerSeatToIndex(this.seatTurn)) {
					streak++;

					if(streak == this.MAX_STREAK) return this.GAME_WIN;
				} else {
					streak = 0;
				}
			}
		}

		return this.GAME_NOFIND;
	}

	this.checkDiagonalWin = function() {
		let streak = 0;

		for(let row = 0; row < this.ROWS; row++) {
			let columns = this.board[row].length;

			for(let column = 0; column < columns; column++) {
				if(this.board[row][column] == this.playerSeatToIndex(this.seatTurn)) {
					if(this.board[row + 1] && this.board[row + 1][column + 1] == this.playerSeatToIndex(this.seatTurn) &&
						this.board[row + 2] && this.board[row + 2][column + 2] == this.playerSeatToIndex(this.seatTurn) &&
						this.board[row + 3] && this.board[row + 3][column + 3] == this.playerSeatToIndex(this.seatTurn)) {
							return this.GAME_WIN;
					}

					if(this.board[row - 1] && this.board[row - 1][column - 1] == this.playerSeatToIndex(this.seatTurn) &&
						this.board[row - 2] && this.board[row - 2][column - 2] == this.playerSeatToIndex(this.seatTurn) &&
						this.board[row - 3] && this.board[row - 3][column - 3] == this.playerSeatToIndex(this.seatTurn)) {
							return this.GAME_WIN;
					}

					if(this.board[row - 1] && this.board[row - 1][column + 1] == this.playerSeatToIndex(this.seatTurn) &&
						this.board[row - 2] && this.board[row - 2][column + 2] == this.playerSeatToIndex(this.seatTurn) &&
						this.board[row - 3] && this.board[row - 3][column + 3] == this.playerSeatToIndex(this.seatTurn)) {
							return this.GAME_WIN;
					}
				}
			}
		}

		return this.GAME_NOFIND;
	}

	this.checkWin = function() {
		if(this.boardFull()) return this.GAME_TIE;

		if(this.checkVerticalWin() != this.GAME_NOFIND) return this.GAME_WIN;

		if(this.checkHorizontalWin() != this.GAME_NOFIND) return this.GAME_WIN;

		if(this.checkDiagonalWin() != this.GAME_NOFIND) return this.GAME_WIN;

		return this.PLACED;
	}

	this.movement = function(penguin, obj) {
		let seat = Number(obj.seat);
		let column = Number(obj.column);
		let row = Number(obj.row);

		this.boardAntiCheat(penguin, obj);

		this.board[row][column] = this.playerSeatToIndex(seat);

		//check board
		let winStatus = this.checkWin();

		console.log('wS', winStatus);
		switch(winStatus) {
			case this.GAME_TIE:
				return this.gameOver();
			case this.GAME_WIN:
				return this.gameWin();
		}

		this.seatTurn == 0 ? this.seatTurn = 1 : this.seatTurn = 0;
	}

	this.gameWin = function(penguin) {
		let nickname = this.players[this.seatTurn].name();

		logger.log('{0} WON!'.format(nickname), 'green');

		for(let player of this.players) {
			if(player.playerSeat == this.seatTurn) {
				player.addCoins(20);
			} else {
				player.addCoins(10);
			}

			player.send('zo', player.room.internal_id, player.coins);

			//leaveTable(player);
		}

		this.flushSpectators();
	}

	this.gameOver = function(penguin) {
		for(let player of this.players) {
			player.addCoins(5);
			player.send('zo', player.room.internal_id, player.coins);

			//leaveTable(player);
		}

		this.flushSpectators();
	}

	this.flushSpectators = function() {
		for(let player of this.spectators) {
			player.send('zo', player.room.internal_id, player.coins);

			//leaveTable(player);
		}
	}
}

module.exports = FindFour;