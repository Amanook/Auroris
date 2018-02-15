const mysql = require('mysql2');
const mysqlPromise = require('mysql2/promise');
const util = require('util');
const logger = require('../../util/logger.js');
const error_handler = require('../../util/error_handler.js');
const dbEngine = require('./engine.js');

function Database() {
    this.host;
    this.user;
    this.password;
    this.database;
    this.test_sql;
    this.connection;
    this.promiseConnection;
    this.engine;

    this.start = function(config) {
        var mysql = config;

        this.host = mysql['host'];
        this.user = mysql['user'];
        this.password = mysql['password'];
        this.database = mysql['database'];
        this.test_sql = mysql['test_sql'];

        this.start_connection();
		
		delete config;
		delete mysql;
    }

	this.start_connection = async function() {
		if(this.host == null || this.user == null || this.password == null || this.database == null || this.test_sql == null) {
			return logger.log('database details incorrect.', 'red');
		}

		this.connection = mysql.createConnection({
			host: this.host,
			user: this.user,
			password: this.password,
			database: this.database
		});

        this.connection.connect = this.checkConnection();
        this.connection.on('error', error_handler.databaseError);

        /*this.promiseConnection = await mysqlPromise.createConnection({
            host: this.host,
            user: this.user,
            password: this.password,
            database: this.database
        });

        this.promiseConnection.on('error', error_handler.databaseError);*/
		
		this.setWorldDataById(global.world_id, 'worldPopulation', 0);
		
		this.dbHeartbeat();
		setInterval(this.dbHeartbeat.bind(this), 3.6e+6);

        //this.engine = new dbEngine(this.promiseConnection, this);
		
		delete this.host
		delete this.user
		delete this.password
		delete this.database
	}

    this.checkConnection = function(error) {
        if(error) {
            logger.log('could not connect to mysql', 'red');
            process.exit();
        }

        this.testConnection();
    }

	this.dbHeartbeat = function() {
		if(this.connection !== undefined) {
			this.connection.query('SELECT 1');
			
			this.getWorldDataById(global.world_id, 'worldPopulation', (function(count) {
				this.getWorldDataById(global.world_id, 'worldName', function(name) {
					//logger.log('Pinging Database', 'blue');
					//logger.log('There are ' + count + ' player(s) on ' + name, 'blue');
				});
			}).bind(this));
		}
	}

    this.testConnection = function() {
        this.connection.query(this.test_sql, function(error, result) {
            if(error !== null) {
                logger.log('could not connect to mysql', 'red');
                process.exit();
            }

            //logger.log('MySQL Connected', 'cyan');
        });
    }
	
	this.unlockCodeExists = function(code, callback) {
		if(code == null) {
			return callback(false);
		}
	
		var query = "SELECT ID FROM redemption WHERE Name = ?";
	
		this.connection.query(query, [code], function(error, results, fields) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}
	
			if(results.length > 0) {
				return callback(true);
			}
	
			return callback(false);
		});
	}
	
	this.getUnlockCodeByName = function(code, callback) {
		var query = "SELECT * FROM redemption WHERE Name = ?";

		this.connection.query(query, [code], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}

			let row = result[0];
			
			return callback(row['ID'], row['Name'], row['Type'], row['Items'], row['Coins'], row['Expired'], row['Redeemed']);
		});
	}
	
	this.updateUnlockCode = function(id, column, value, callback) {
		var query = "UPDATE redemption SET " + column + " = ? WHERE ID = ?";
	
		this.connection.query(query, [value, id], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}
	
			if(typeof(callback) == 'function') {
				return callback(true);
			}
		});
	}
	
	this.getBuddyWorldData = function(buddy, index, callback) {
		var query = 'SELECT CurrentServer, Username FROM penguins WHERE Online = 1 AND Username = ?;';
		
		this.connection.query(query, [buddy], function(error, result) {
				if(error !== null) {
					return logger.log(error.toString(), 'red');
				}
				
				if(result[0] !== undefined) {
					var worldId = result[0]['CurrentServer'];
					
					return callback(true, worldId, index);
				} else {
					return callback(false, 0, index);
				}
			});
	}
	
	this.getWorldData = function(callback) {
		var query = "SELECT * FROM worlds";

		this.connection.query(query, [], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}

			return callback(result);
		});
	}
	
	this.getWorldDataById = function(worldId, column, callback) {
		var query = "SELECT " + column + " FROM worlds WHERE worldID = ?";

		this.connection.query(query, [worldId], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}

			return callback(result[0][column]);
		});
	}
	
	this.setWorldDataById = function(worldId, column, value, callback) {
		var query = "UPDATE worlds SET " + column + " = ? WHERE worldID = ?";

		this.connection.query(query, [value, worldId], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}

			if(typeof(callback) == 'function') {
				return callback(true);
			}
		});
	}

    this.player_exists = function(name, callback) {
        if(name == null) {
            return callback(false);
        }

        var query = "SELECT Username FROM penguins WHERE Username = ?";

        this.connection.query(query, [name], function(error, results, fields) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            if(results.length > 0) {
                return callback(true);
            }

            return callback(false);
        });
    }

    this.playerIdExists = function(id, callback) {
        if(id == null) {
            return callback(false);
        }

        var query = "SELECT ID FROM penguins WHERE ID = ?";

        this.connection.query(query, [id], function(error, results, fields) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            if(results.length > 0) {
                return callback(true);
            }

            return callback(false);
        });
    }
	
	this.getMyBuddies = function(string, columns, callback) {
		if(typeof columns !== 'object') {
			return callback(false);
		}

		var query = "SELECT " + columns.join() + " FROM penguins WHERE Username IN ('" + string + "')";

		this.connection.query(query, [], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}

			return callback(result);
		});
	}

    this.get_column = function(id, column, callback) {
        var query = "SELECT " + column + " FROM penguins WHERE ID = ?";

        this.connection.query(query, [id], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            return callback(result[0][column]);
        });
    }

    this.get_columns = function(id, columns, callback) {
        if(typeof columns !== 'object') {
            return callback(false);
        }

        var query = "SELECT " + columns.join() + " FROM penguins WHERE ID = ?";

        this.connection.query(query, [id], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            return callback(result[0]);
        });
    }

    this.get_column_name = function(name, column, callback) {
        var query = "SELECT " + column + " FROM penguins WHERE Username = ?";

        this.connection.query(query, [name], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            return callback(result[0][column]);
        });
    }

    this.get_columns_name = function(name, columns, callback) {
        if(typeof columns !== 'object') {
            return callback(false);
        }

        var query = "SELECT " + columns.join() + " FROM penguins WHERE Username = ?";

        this.connection.query(query, [name], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            return callback(result[0]);
        });
    }

    this.update_column = function(id, column, value, callback) {
        var query = "UPDATE penguins SET " + column + " = ? WHERE ID = ?";

        this.connection.query(query, [value, id], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

			if(typeof(callback) == 'function') {
				return callback(true);
			}
        });
    }

    this.getIglooDetails = function(iglooId, callback) {
        var query = "SELECT Type, Music, Floor, Furniture, Owner FROM `igloos` WHERE ID = ?";

        this.connection.query(query, [iglooId], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            let details = result[0];
            let iglooDetails = [details["Type"], details["Music"], details["Floor"], details["Furniture"]];
            let playerId = details['Owner'];

            /*console.log('gid', playerId, iglooCacheList[Number(playerId)]);

            if(iglooCacheList[Number(playerId)] == undefined) {
                iglooCacheList[Number(playerId)] = {};

                iglooCacheList[Number(playerId)].active = Number(iglooId);
                iglooCacheList[Number(playerId)].type = details['Type'];
                iglooCacheList[Number(playerId)].music = details['Music'];
                iglooCacheList[Number(playerId)].floor = details['Floor'];
                iglooCacheList[Number(playerId)].furniture = details['Furniture'];
                iglooCacheList[Number(playerId)].iglooDetails = iglooDetails.join('%');
            }*/

            return callback(iglooDetails.join('%'));
        });
    }
	
    this.updateIglooColumn = function(id, column, value, callback) {
        var query = "UPDATE igloos SET " + column + " = ? WHERE ID = ?";

        this.connection.query(query, [value, id], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
			
			if(typeof(callback) == 'function') {
				return callback(true);
			}
        });
    }
	
	this.getPlayerPuffles = function(playerId, callback) {
		var query = "SELECT ID, Name, Type, Food, Play, Rest, Walking FROM `puffles` WHERE Owner = ?";
	
		this.connection.query(query, [playerId], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}
	
			return callback(result);
		});
	}
	
    this.playerOwnsPuffle = function(puffleId, playerId, callback) {
        var query = "SELECT Owner FROM `puffles` WHERE Owner = ? AND ID = ?";

        this.connection.query(query, [playerId, puffleId], function(error, results, fields) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            if(results.length > 0) {
                return callback(true);
            }

            return callback(false);
        });
    }
	
    this.getPlayerPuffle = function(puffleId, callback) {
        var query = "SELECT ID, Name, Type, Food, Play, Rest, Walking FROM `puffles` WHERE ID = ?";

        this.connection.query(query, [puffleId], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            return callback(result[0]);
        });
    }
	
    this.updatePuffleColumn = function(puffleId, column, value, callback) {
        var query = "UPDATE `puffles` SET " + column + " = ? WHERE ID = ?";

        this.connection.query(query, [value, puffleId], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
			
			if(typeof(callback) == 'function') {
				return callback(true);
			}
        });
    }
	
    this.adoptPuffle = function(playerId, puffleName, puffleType, callback) {
        var query = "INSERT INTO `puffles` (`ID`, `Owner`, `Name`, `AdoptionDate`, `Type`, `Food`, `Play`, `Rest`, `Walking`) VALUES (NULL, ?, ?, UNIX_TIMESTAMP(), ?, '100', '100', '100', '0');";
		
        this.connection.query(query, [playerId, puffleName, puffleType], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
			
			var puffleId = result.insertId;
			
			if(typeof(callback) == 'function') {
				return callback(puffleId);
			}
        });
    }
	
    this.getPostcardsById = function(playerId, callback) {
        var query = "SELECT SenderName, SenderID, Type, Details, Date, ID FROM `postcards` WHERE Recipient = ?";

        this.connection.query(query, [playerId], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            return callback(result);
        });
    }
	
    this.getUnreadPostcardCount = function(playerId, callback) {
        var query = "SELECT HasRead FROM `postcards` WHERE Recipient = ?";

        this.connection.query(query, [playerId], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
			
			var readCount = 0;

            for(var index in result) {
				if(Number(result[index]['HasRead']) == 0) {
					readCount++;
				}
			}
			
			if(isNaN(readCount) || readCount == undefined || readCount < 0) {
				readCount = 0;
			}
			
			return callback(readCount);
        });
    }
	
    this.getPostcardCount = function(playerId, callback) {
        var query = "SELECT Recipient FROM `postcards` WHERE Recipient = ?";

        this.connection.query(query, [playerId], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
			
			return callback(result.length);
        });
    }
	
    this.mailChecked = function(playerId, callback) {
        var query = "UPDATE `postcards` SET HasRead = '1' WHERE Recipient = ?";

        this.connection.query(query, [playerId], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
			
			if(typeof(callback) == 'function') {
				return callback(true);
			}
        });
    }
	
	this.sendMail = function(recipientId, senderName, senderId, postcardDetails, sentDate, postcardType, callback) {
		var query = "INSERT INTO `postcards` (`ID`, `Recipient`, `SenderName`, `SenderID`, `Details`, `Date`, `Type`) VALUES (NULL, ?, ?, ?, ?, ?, ?)";
		
        this.connection.query(query, [recipientId, senderName, senderId, postcardDetails, sentDate, postcardType], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
			
			var postcardId = result.insertId;
			
			if(typeof(callback) == 'function') {
				return callback(postcardId);
			}
        });
	}
	
    this.playerOwnsPostcard = function(postcardId, playerId, callback) {
        var query = "SELECT Recipient FROM `postcards` WHERE ID = ? AND Recipient = ?";

        this.connection.query(query, [postcardId, playerId], function(error, results, fields) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            if(results.length > 0) {
                return callback(true);
            }

            return callback(false);
        });
    }
	
    this.deleteMail = function(postcardId, callback) {
        var query = "DELETE FROM `postcards` WHERE `ID` = ?";

        this.connection.query(query, [postcardId], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
			
			if(typeof(callback) == 'function') {
				return callback(true);
			}
        });
    }
	
    this.deleteMailFromPlayer = function(recipientId, senderId, callback) {
        var query = "DELETE FROM `postcards` WHERE `Recipient` = ? AND `SenderID` = ?";

        this.connection.query(query, [recipientId, senderId], function(error, result) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
			
			if(typeof(callback) == 'function') {
				return callback(true);
			}
        });
    }
	
    this.getSocialFilter = function(callback) {
        var query = "SELECT * FROM `social`";

        this.connection.query(query, [], function(error, results, fields) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            return callback(results[0]);
        });
    }
	
    this.getFilterVersion = function(callback) {
        var query = "SELECT version FROM `social`";

        this.connection.query(query, [], function(error, results, fields) {
            if(error !== null) {
                return logger.log(error.toString(), 'red');
            }

            return callback(results[0]['version']);
        });
    }
	
	this.storeMessage = function(id, nickname, message, action) {
		var query = "INSERT INTO `chatlog` (`ID`, `PlayerID`, `PlayerNickname`, `Message`, `Timestamp`, `Action`) VALUES (NULL, ?, ?, ?, NULL, ?)";
		
		this.connection.query(query, [id, nickname, message, action], function(error, result) {
			if(error !== null) {
                return logger.log(error.toString(), 'red');
            }
		});
	}
	
	this.getDonationsTotal = function(callback) {
		var query = "SELECT donationTotal FROM `cfc`";

		this.connection.query(query, [], function(error, results, fields) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}

			return callback(results[0]['donationTotal']);
		});
	}

	this.updateDonationsTotal = function(newAmount, callback) {
		var query = "UPDATE `cfc` SET donationTotal = ?";

       this.connection.query(query, [newAmount], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}
		
			if(typeof(callback) == 'function') {
				return callback(true);
			}
		});
	}
	
	this.getCharityById = function(categoryId, callback) {
		if(categoryId > 3) {
			return;
		}
		
		categoryCol = 'cat' + categoryId;
		var query = "SELECT " + categoryCol + " FROM `cfc`";
		
		this.connection.query(query, [], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}
		
			return callback(result[0][categoryCol]);
		});
	}
	
	this.updateCharityTotal = function(categoryId, newAmount, callback) {
		if(categoryId > 3) {
			return;
		}
		
		categoryCol = 'cat' + categoryId;
		var query = "UPDATE `cfc` SET " + categoryCol + " = ?";
	
		this.connection.query(query, [newAmount], function(error, result) {
			if(error !== null) {
				return logger.log(error.toString(), 'red');
			}
			
			if(typeof(callback) == 'function') {
				return callback(true);
			}
		});
	}
}

module.exports = Database;
