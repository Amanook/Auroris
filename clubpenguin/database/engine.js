const mysql = require('mysql');
const util = require('util');
const logger = require('../../util/logger.js');

class DatabaseEngine {
	constructor(mysqlConnection, parent) {
		this.connection = mysqlConnection;
		this.parent = parent;
	}

	async rowExists(table, column, value) {
		if(table == undefined || column == undefined || value == undefined) {
			return false;
		}

		let query = "SELECT " + column + " FROM " + table + " WHERE " + column + " = ?";
		let result = await this.connection.query(query, [value]);

		try {
			return result[0][0][column] == value;
		}
		catch(error) {
			return false;
		}

		return false;
	}

	async getColumnById(playerId, column) {
		if(playerId == undefined || column == undefined) {
			return undefined;
		}

		let query = "SELECT " + column + " FROM penguins WHERE ID = ?";
		let result = await this.connection.query(query, [playerId]);

		try {
			return result[0][0][column];
		}
		catch(error) {
			return undefined;
		}

		return undefined;
	}

	async playerIdExists(playerId) {
		if(playerId == null || playerId == undefined) {
			return false;
		}

		return await this.rowExists('penguins', 'ID', playerId);
	}
}

module.exports = DatabaseEngine;