const fs = require('fs')
const {Player, Roster, Team} = require('./Objects.js')

class JsonHelper {
	constructor() {}

	// Take json object and output to file
	// @param[in] json      Json object to write
	// @param[in] fileName  Name of file to output to. The previous file contents will be overwritten
	writeJsonToFile(json, fileName) {

		fs.writeFileSync(fileName, JSON.stringify(json, null, 4))
	}

	// Read file and parse it into a Json object
	// @param[in] filename  File name to read json file from
	// @return              Json object to return
	readJsonFromFile(filename) {
		return JSON.parse(fs.readFileSync(filename))
	}

	// Read file and parse it into a Team object
	// @param[in] filename  File name to read Team object from
	// @return              Team object to return
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

	// Take a Team Object and format it to a readable output string
	// @param[in] team  Team object to turn into string
	// @return          Returns Team object as string
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