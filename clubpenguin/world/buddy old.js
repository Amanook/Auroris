var logger = require('../../util/logger.js');
var network = require('../../util/network.js');

/* Buddies - b# */
module.exports = function() {
    this.structureBuddies = function(penguin) {
        if(penguin.buddies == undefined) {
            return;
        }

        penguin.buddylist = {};

        for(var i = penguin.buddies.length; i > 0; i--) {
            if(penguin.buddies[i] == undefined) {
                continue;
            }

            var buddyDetails = penguin.buddies[i].split(':');
			
            penguin.buddylist[i] = {id: buddyDetails[0], nickname: buddyDetails[1], online: 0};
			penguin.buddiesById[buddyDetails[0]] = i;
        }
    }

    this.getBuddies = function(penguin, data) {
        if(penguin.buddies.length == 0) {
            return penguin.send('gb', -1);
        }

        if(penguin.buddylist == undefined || penguin.buddylist == null) {
            return penguin.send('gb', -1);
        }

        var buddies = [];
        for(var i = Object.keys(penguin.buddylist).length; i > 0; i--) {
            var buddyId = penguin.buddylist[i].id;
            var buddyName = penguin.buddylist[i].nickname;
            var online = penguin.buddylist[i].online;
            var buddyDetails = [buddyId, buddyName, online];

            buddies.push(buddyDetails.join('|'));
        }

        penguin.send('gb', -1, buddies.join('%'));
    }
}
