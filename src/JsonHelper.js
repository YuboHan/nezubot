const fs = require('fs')
const {Player, Roster, Team} = require('./Objects.js')

class JsonHelper {
	constructor() {

	}

	writeJsonToFile(json, fileName) {

		fs.writeFileSync(fileName, JSON.stringify(json, null, 4))
	}

	readJsonFromFile(filename) {
		return JSON.parse(fs.readFileSync(filename))
	}

	loadTeamsFromFile(filename) {
		var ret = []
		var retJson = this.readJsonFromFile(filename)

        for (var i in retJson) {
            var t = new Team()
            t.fromJson(retJson[i])
            ret.push(t)
        }

        return ret
	}

	teamJsonToString(team) {
		var ret = team.teamName

		Object.keys(team.roster).forEach(function(key) {
			if (key != "subs") {
				ret += "\n" + key.charAt(0).toUpperCase() + key.slice(1) + ": " + team.roster[key].summonerName + " (" + team.roster[key].opGG + ")"
			}
			else {
				for (var i in team.roster["subs"]) {
					ret += "\nSubs: " + team.roster["subs"][i].summonerName + " (" + team.roster["subs"][i].opGG + ")"
				}
			}
		});

		ret += "\nMulti-query op.gg link: " + team.teamOpGG

		return ret
	}
}

var jsonHelper = new JsonHelper()

module.exports = jsonHelper