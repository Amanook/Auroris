var logger = require('../../util/logger.js');
var network = require('../../util/network.js');
var EventEmitter = require('events');

require('./post.js');

/* Webhook Service */

webhookUrls = {
	'buyers-log': 'https://discordapp.com/api/webhooks/280817518900150294/ygJu-rs3mpQcWJlqztMuJAvK0mOrbDXMOf09xX-CQQfqps5bIhW6EHWcfidXrsWKjgYI',
	'coin-log': 'https://discordapp.com/api/webhooks/320694039458611201/5WH2QTj9mua7HTaQh-BpdKhrt11PEbgF8MY0qctgx7HLWNVKrTVRc0diipYw9DRAOttf',
	'staff-log': 'https://discordapp.com/api/webhooks/281972719896231938/g3eZCQpEpKMJ8AClzKmw6s46aKapAbddRKDBHIs_DuTXKG6ocG6rXHTBnf0gfV8ovClM',
	'coinsforchange': 'https://discordapp.com/api/webhooks/390582034080464896/1hJJqLcKpYsO0sQLQHVe_mefgxzNx_aDaOaOvMRpWcmNrchnX4DlVqbFMDUAnuNM0LQR'
};

WebhookEvent = new EventEmitter();

function baseLog(data, mention = true) {
	var _data = [];
	
	for(var key in data) {
		var value = data[key];
		var string = `*${key}*: **${value}**`;
		
		_data.push(string);
	}
	
	_data = _data.join('|\n');
	
	var message = ` ~~                                                                   ~~\n${_data}\n`;
	
	if(mention) {
		message += `<@184233664807174145> <@180656781276610560>`;
	}
	
	return message;
}

WebhookEvent.on('buyers-log', (array) => {
	var message = baseLog(array);
	var username = 'Buyers Log';
	var url = webhookUrls['buyers-log'];
	
	PostEvent.emit('PostRequest', url, {'username': username, 'content': message});
});

WebhookEvent.on('staff-log', (array) => {
	var message = baseLog(array);
	var username = 'Staff Log';
	var url = webhookUrls['staff-log'];
	
	PostEvent.emit('PostRequest', url, {'username': username, 'content': message});
});

WebhookEvent.on('coin-log', (array) => {
	var message = baseLog(array);
	var username = 'Coin Log';
	var url = webhookUrls['coin-log'];
	
	PostEvent.emit('PostRequest', url, {'username': username, 'content': message});
});

WebhookEvent.on('coinsforchange', (array) => {
	var message = baseLog(array, false);
	var username = 'Donation Log';
	var url = webhookUrls['coinsforchange'];
	
	PostEvent.emit('PostRequest', url, {'username': username, 'content': message});
});

module.exports.webhookUrls = webhookUrls;
module.exports.WebhookEvent = WebhookEvent;