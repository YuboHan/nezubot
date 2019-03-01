const {Player, Roster, Team} = require('./Objects.js')
const jsonHelper = require('./JsonHelper.js')
const fs = require('fs')

var teamsJsonName = "Teams.json"

module.exports = {
    // Parse user input
    // @param[in] receivedMessage  String representing user input
    parseMessage : function (receivedMessage) {
        let msg = receivedMessage.content
        let channel = receivedMessage.channel

        if (msg[0] == '!') {
            parseCommand(msg, channel)
        }
        else {
            try {
                // Currently registered teams
                var teams = jsonHelper.loadTeamsFromFile(teamsJsonName)

                // New team to add
                var newTeam = parseTeamSubmission(msg, channel)

                // Check if team is already in database and remove old entry if it is
                for (var i in teams) {
                    if (teams[i].teamId == newTeam.teamId) {
                        channel.send("Warning: Team has already submitted a roster! It will now be updated to current submission.")
                        teams.splice(i, 1)
                    }
                }

                // Add new team to teams list
                teams.push(newTeam)

                jsonHelper.writeJsonToFile(teams, teamsJsonName)

                channel.send("Roster successfully updated")
            }
            catch(err) {
                channel.send("Something went wrong. Roster not updated.\n" + err)
            }
        }
    }
}

// Parse and execute a command. Commands always start with !
// @param[in] msg      User input
// @param[in] channel  Handle to discord channel in which this message was sent
function parseCommand(msg, channel) {
    let splitCommand = msg.substr(1).toLowerCase().split(/\s+/)

    switch(splitCommand[0]) {
        case "help":            channel.send("!help is not implemented yet. Ping dotenark#0989 for questions.")
            break
        case "reset-teams":
            var emptyArray = []
            jsonHelper.writeJsonToFile(emptyArray, teamsJsonName)
            break
        case "show-teams":
            var ret = ""
            var teams = jsonHelper.loadTeamsFromFile(teamsJsonName)
            console.log(JSON.stringify(teams, null, 4 ))
            if (teams.length == 0) {
                ret = "No teams listed."
            }
            else {
                for (var i in teams) {
                    ret += jsonHelper.teamJsonToString(teams[i]) + "\n\n"
                }
            }
            channel.send(ret)
            break
    }
}

// If the input message is not a command, then it is assumed to be a team roster.
// This function takes the input, and adds the team roster to the database.
// @param[in] msg      User input
// @param[in] channel  Handle to discord channel in which this message was sent
function parseTeamSubmission(msg, channel) {
    let teamArray = msg.split(/\r?\n/)

    var teamName = ""
    var roster = new Roster()

    for (var i in teamArray) {
        // First line is always team name
        if (i == 0) {
            teamName = teamArray[0]
        }
        else {
            var colonDelim = teamArray[i].split(':')

            if (colonDelim.length != 2) {
                throw "Incorrect roster format: \"" + teamArray[i] + "\""
            }

            roster.addPlayer(colonDelim[0], colonDelim[1])
        }
    }

    var team = new Team()
    team.populate(teamName, roster)

    return team
}
