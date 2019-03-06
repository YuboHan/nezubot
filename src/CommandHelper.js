const {Player, Roster, Team} = require('./Objects.js')
const jsonHelper = require('./JsonHelper.js')
const riotHelper = require('./RiotHelper.js')
const discord = require('discord.js')   
const fs = require('fs')

var teamsJsonName = "./Teams.json"
var resultsCsvPath = "./results.csv"

module.exports = {
    // Parse user input
    // @param[in] receivedMessage  String representing user input
    parseMessage : function (receivedMessage) {
        let msg = receivedMessage.content
        let channel = receivedMessage.channel

        // Only parse commands (starts with !)
        if (msg[0] == '!') {
            parseCommand(msg, channel)
        }
    }
}

// Parse and execute a command. Commands always start with !
// @param[in] msg      User input
// @param[in] channel  Handle to discord channel in which this message was sent
function parseCommand(msg, channel) {
    // Remove '!' and split by whitespace
    let splitCommand = msg.substr(1).toLowerCase().split(/\s+/)

    switch(splitCommand[0]) {
        case 'help':
            channel.send('!help is not implemented yet. Ping dotenark#0989 for questions.')
            break
        case 'reset-teams':
            var emptyArray = []
            try {
                jsonHelper.writeJsonToFile(emptyArray, teamsJsonName)
                channel.send('Teams list reset.')
            }
            catch(err) {
                channel.send('Error: Cannot reset teams.\n' + err)
            }
            break
        case 'get-game-stats':
            // TODO: Error handling
            riotHelper.getGameStats(splitCommand[1], channel, resultsCsvPath)
            const localFileAttachment = new discord.Attachment(resultsCsvPath)
            channel.send(localFileAttachment)
            break
        case 'show-teams':
            try {
                var ret = ''
                var teams = jsonHelper.loadTeamsFromFile(teamsJsonName)

                if (teams.length == 0) {
                    ret = 'No teams listed.'
                }
                else {
                    for (var i in teams) {
                        ret += jsonHelper.teamJsonToString(teams[i]) + "\n\n"
                    }
                }
                channel.send(ret)
            }
            catch(err) {
                channel.send('Cannot show teams.\n' + err)
            }
            break
        case 'show-team':
            try {
                var teamId = msg.toLowerCase().replace(/\s+/g, '').split('!show-team').join('')
                var teams = jsonHelper.loadTeamsFromFile(teamsJsonName)

                for (var i in teams) {
                    if (teams[i].teamId == teamId) {
                        channel.send(jsonHelper.teamJsonToString(teams[i]))
                        return
                    }
                }

                throw 'Error: No team named \'' + teamId + '\''
            }
            catch(err) {
                channel.send('Unable to fetch team.\n' + err)
            }
            break
        case 'add-team':
            try {
                // Currently registered teams
                var teams = jsonHelper.loadTeamsFromFile(teamsJsonName)

                // New team to add to list
                var newTeam = parseTeamSubmission(msg, channel)

                // Check if team is already in database and remove old entry if it is
                for (var i in teams) {
                    if (teams[i].teamId == newTeam.teamId) {
                        channel.send('Warning: Team has already submitted a roster! It will now be updated to current submission')

                        // Remove old occurence of current team
                        teams.splice(i, 1)
                    }
                }

                // Add new team to teams list
                teams.push(newTeam)

                jsonHelper.writeJsonToFile(teams, teamsJsonName)

                channel.send('Roster successfully updated!')

                break
            }
            catch(err) {
                channel.send('Something went wrong. Roster not updated.\n' + err)
            }
    }
}

// If the input message is not a command, then it is assumed to be a team roster.
// This function takes the input, and adds the team roster to the database.
// @param[in] msg      User input (full input, so the string will always start with !add-team)
// @param[in] channel  Handle to discord channel in which this message was sent
function parseTeamSubmission(msg, channel) {
    // Split by newline or comma
    let teamArray = msg.split(/[\n\r,]/)
    console.log(teamArray)

    var teamName = ''
    var roster = new Roster()

    for (var i in teamArray) {
        if (i == 0) {
            // Sanity check this should be !add-team
            if (teamArray[0] != '!add-team') {
                throw 'Error: Command to add team should be \'add-team\', but is instead ' + teamArray[0]
            }
        }
        else if (i == 1) {
            // First line is team name
            teamName = teamArray[1]
            if (teamName.replace(/\s+/g, '') == '') {
                throw "Error: teamName cannot be empty (do you have a newline between !add-team and team name?)"
            }
        }
        else {
            var colonDelim = teamArray[i].split(':')

            // No role provided, will add as sub
            if (colonDelim.length == 1) {
                // No role provided, will add as sub
                roster.addPlayer('sub', colonDelim[0])
            }
            else if (colonDelim.length == 2) {
                // Position provided
                roster.addPlayer(colonDelim[0], colonDelim[1])
                console.log('Added \'' + colonDelim[0] + '\' player: ' + colonDelim[1])
            }
            else {
                // Incorrect role submission
                throw 'Error: (role, summonername) not recognized \'' + teamArray[i] + '\''
            }
        }
    }

    var team = new Team()
    team.populate(teamName, roster)

    return team
}
