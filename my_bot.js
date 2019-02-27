// Tutorial link: https://www.devdungeon.com/content/javascript-discord-bot-tutorial

const Discord = require('discord.js')
const fs = require('fs')

const client = new Discord.Client()

var channelID = "0"
var teamsFileName = "Rosters.json"

// enums for names
var privateName = 0
var publicName = 1

client.on('ready', () => {
	// List all servers bot is connected to
    console.log("Connected as " + client.user.tag)
    console.log("Servers:")
    client.guilds.forEach((guild) => {
    	console.log(" - " + guild.name)

    	// List all channels
    	guild.channels.forEach((channel) => {
    		console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
    	})

    	channelID = guild.channels.find(channel => channel.name === "general").id
    })

    var generalChannel = client.channels.get(channelID)
    generalChannel.send("Nezubot has connected, come say hi!")
})

client.on('message', (receivedMessage) => {
	// Prevent bot from responding to its own messages
	if (receivedMessage.author == client.user) {
		return
	}

	let msg = receivedMessage.content
	let discChannel = receivedMessage.channel

	if (msg[0] == '!') {
		let splitCommand = msg.substr(1).toLowerCase().split(/\s+/)

		switch (splitCommand[0]) {
			case "help":
				discChannel.send("Help is not implemented yet. Ping dotenark#9089 for questions.")
			case "reset-teams":
				resetTeams(teamsFileName)
				break;
			case "show-teams":
				emitTeamsJson(getTeamsJson(teamsFileName), discChannel)
				break;
			default:
				discChannel.send("Error: Invalid command \"" + msg + "\"")
				return
				break;
		}
	}
	else {
		var rosterObj;
		try {
			// Get current database
			var curTeams = getTeamsJson(teamsFileName)
			console.log(curTeams)

			// Get new team to add
			var rosterObj = processRoster(msg, receivedMessage.channel)

			// Check if team already exists
			for (var i in curTeams) {
				if (curTeams[i]["name"][privateName] == rosterObj["name"][privateName]) {
					discChannel.send("Warning: Team has already submitted a roster! Will update to current submission.")

					curTeams.splice(i, 1)
				}
			}

			curTeams.push(rosterObj)

			// Populate database
			let data = JSON.stringify(curTeams, null, 4);
			fs.writeFileSync(teamsFileName, data);

			opGGLink = getTeamOpGGLink(rosterObj["roster"])

			discChannel.send("Success: Roster successfully added!\n" +
										 "op.gg link: " + opGGLink)
			console.log(JSON.stringify(rosterObj, null, 4))
		}
		catch (err) {
			discChannel.send("Cannot read roster. \n- " + err)
		}
	}
})


/**
 * Print out all rosters to discord channel
 * @param[in] teams  Array of JSON objects representing the teams
 * @param[in] ch     Handle to discord channel
 * @return           null
 */
function emitTeamsJson(teams, ch) {
	var ret = ""
	for (var i in teams) {
		ret += teamJsonToString(teams[i], ch) + "\n\n"
	}

	ch.send(ret)
}

/**
 * Format single roster to string
 * @param[in] teams  Array of JSON objects representing the teams
 * @param[in] ch     Handle to discord channel
 * @return           null
 */
function teamJsonToString(team) {
	var ret = "Team: " + team.name[publicName]

	Object.keys(team.roster).forEach(function(key) {
		if (key != "subs") {
			ret += "\n- " + key.charAt(0).toUpperCase() + key.slice(1) + ": " + team.roster[key][publicName] + " (" + getOpGGLink(team.roster[key]) + ")"
		}
		else {
			ret += "\n- Subs: "
			var first = true
			for (var i in team.roster[key]) {
				if (first) {
					first = false
				}
				else {
					ret += ", "
				}
				ret += team.roster[key][i][publicName] + " (" + getOpGGLink(team.roster[key][i]) + ")"
			}
		}
	});

	ret += "\nMulti-query op.gg link: " + getTeamOpGGLink(team.roster)

	return ret
}

/**
 * Resets teams information stored in fn (filename)
 * @param[in] fn  file name of json file to reset
 * @return        null
 */
function resetTeams(fn) {
	var data = "[]"
	fs.writeFileSync(fn, data)
}

/**
 * @param[in] fn  file name of json file to read
 * @return        JSON object representing values read from fn
 */
function getTeamsJson(fn) {
	return JSON.parse(fs.readFileSync(fn))
}

/**
 * Get op.gg link of single summoner
 * @param[in] summonerName  Summoner name in the form of [privateName, publicName]
 * @return                  link to op.gg of player
 */
function getOpGGLink(summonerName) {
	return "https://na.op.gg/summoner/userName=" + summonerName[privateName]
}

/**
 * @param[in] roster {role: name} object, where name is string representing summoner name of player
 * @return           op.gg link as string
 */
function getTeamOpGGLink(roster) {
	var retVal = "https://na.op.gg/multi/query="

	var firstVal = true

	Object.keys(roster).forEach(function(key) {
		if (key == "subs") {
			for (var i in roster[key]) {
				if (firstVal) {
					firstVal = false
				}
				else {
					retVal += "%2C"
				}
				retVal += roster[key][i][privateName]
			}
		}
		else {
			if (firstVal) {
				firstVal = false
			}
			else {
				retVal += "%2C"
			}
			retVal += roster[key][privateName]
		}
	});

	console.log(JSON.stringify(roster, null, 4))

	return retVal
}

/**
 * @param[in] msg            input message as string
 * @param[in] channelHandle  Handle to channel (ie. msg.channel)
 * @return                   Object representing team and roster
 */
function processRoster(msg, channelHandle) {
	let rosterArray = msg.split(/\r?\n/)

	// Each name will be represented as a size 2 array (array[0] = "Formatted Name", array[1] = "Unique Name")
	var teamName = []
	var top      = []
	var jungle   = []
	var mid      = []
	var adc      = []
	var support  = []
	var subs     = []

	for (var i in rosterArray) {
		// Team name
		if (i == 0) {
			teamName = [rosterArray[i].toLowerCase().replace(/\s+/g, ''), rosterArray[i]]
		}

		else {
			var reducedString = rosterArray[i].toLowerCase().replace(/\s+/g, '').split(':')
			
			if (reducedString.length != 2) {
				throw "Incorrect roster format: \"" + reducedString + "\""
			}

			var formattedName = rosterArray[i].split(':')[1].trim()

			// There can only be one person assigned to each role, but multiple subs
			switch(reducedString[0]) {
				case "top":
					if (top.length == 2) {
						throw "Error: Multiple instances of top"
					}
					top = [reducedString[1], formattedName]
					break;
				case "jungle":
				case "jg":
					if (jungle.length == 2) {
						throw "Error: Multiple instances of jungle"
					}
					jungle = [reducedString[1], formattedName]
					break;
				case "mid":
				case "middle":
					if (mid.length == 2) {
						throw "Error: Multiple instances of mid"
					}
					mid = [reducedString[1], formattedName]
					break;
				case "adc":
				case "bot":
					if (adc.length == 2) {
						throw "Error: Multiple instances of adc"
					}
					adc = [reducedString[1], formattedName]
					break;
				case "support":
				case "supp":
				case "sup":
					if (support.length == 2) {
						throw "Error: Multiple instances of support"
					}
					support = [reducedString[1], formattedName]
					break;
				case "sub":
				case "substitute":
					subs.push([reducedString[1], formattedName])
					break;
				default:
					throw "Error: Unrecognized role \"" + reducedString[0] + "\""
					break;
			}
		}
	}

	var roster = {}

	if (top.length == 2) roster.top = top;
	if (jungle.length == 2) roster.jungle = jungle;
	if (mid.length == 2) roster.mid = mid;
	if (adc.length == 2) roster.adc = adc;
	if (support.length == 2) roster.support = support;
	if (subs.length > 0) roster.subs = subs;

	var retVal = {"name": teamName, "roster": roster}

	return retVal
}

// Get your bot's secret token from:
// https://discordapp.com/developers/applications/
// Click on your application -> Bot -> Token -> "Click to Reveal Token"
bot_secret_token = "NTUwMTY1NzExNzM4MjQxMDQ0.D1ehcQ.d3SBzyLz30kUqwJthdspSR77Ny0"

client.login(bot_secret_token)



/*
Basic features (todo):
- Only staff can update active teams and respective team captains (and other permissions)
- Game schedule (team win rate, possibly stats but that might be too involved)
	- People can ping bot for offline results


Future features?

- Check if person is part of multiple teams
- Link discord name with summoner name
	- Auto assign discord profiles to teams at start of each week
- Bot reminders for special events, casts, deadlines, etc. (eg if a team is not in time for roster submission)


*/