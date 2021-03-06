const riotHelper = require('./RiotHelper.js')
const fileHelper = require('./FileHelper.js')
const googleAuth = require('./GoogleAuth.js')
const sheetsHelper = require('./SheetsHelper.js')

const gamesFileName = './logs/gamesResults.json'

const gpResultsFile = './logs/gpResults.json'
const ibsgResultsFile = './logs/ibsgResults.json'

const ibsgTeamsFileName = './TeamsDatabase/ibsgTeams.json'
const gpTeamsFileName = './TeamsDatabase/gpTeams.json'

module.exports = {
    /**
     * Get game JSON from Riot API, and save data (append data) to gamesFileName
     * param[in] channel(Channel)  Channel to send responses to
     * param[in] args(string[])    Arguments passed in by user. Args can either be [URL] or
     *                             [Team1, Team2, URL]
     * param[in] league(string)    Determines which league to post stats to. Can be 'gp' or 'ibsg'.
     */
    postGameStats : function(channel, args, league)
    {
        if (args.length != 3)
        {
            throw 'Error: Improperly formatted !post-game-stats call.'
        }

        let URL = args[2]
        let teamsJson = {}
        let teamObjs = []

        if (league == 'gp')
        {
            teamsJson = fileHelper.readJsonFromFile(gpTeamsFileName)
        }
        else if (league == 'ibsg')
        {
            teamsJson = fileHelper.readJsonFromFile(ibsgTeamsFileName)
        }
        else
        {
            throw 'Error: Unrecognized league "' + league + '"'
        }

        let winnerId = args[0].trim().toUpperCase()
        let loserId = args[1].trim().toUpperCase()

        if (winnerId in teamsJson)
        {
            teamObjs.push(teamsJson[winnerId])
        }
        else
        {
            throw 'Unrecognized team ' + winnerId
        }

        if (loserId in teamsJson)
        {
            teamObjs.push(teamsJson[loserId])
        }
        else
        {
            throw 'Unrecognized team ' + loserId
        }

        riotHelper.getGameJson(URL, (gameJson) =>
        {
            if (gameJson.status != undefined)
            {
                throw 'Error: Riot API returned error, status code ' + gameJson.status.status_code
                            + '. (is Riot API key outdated?)\n' + gameJson.status.message
            }

            let jsonToAppend = {
                'gameId' : riotHelper.getGameIdFromURL(URL),
                'gameUrl' : URL,
                'teamObjs' : teamObjs,
                'stats' : gameJson
            }

            let gamesFileName = ''

            if (league == 'gp')
            {
                gamesFileName = gpResultsFile
            }
            else if (league == 'ibsg')
            {
                gamesFileName = ibsgResultsFile
            }
            else
            {
                throw 'Error: Unrecognized league "' + league + '"'
            }

            fileHelper.appendJsonToListFile(gamesFileName, jsonToAppend, 'gameId')
        })
    },

    /**
     * Format and add game stats to google sheets spreadsheet
     * param[in] channel(Channel)  Handle to discord channel
     * param[in] args(JSON)        JSON file representing arguments:
     *                             {stats(JSON game object from RIOT), teamName[2](string), id(string)}
     * param[in] league(string)    Determines which league to post stats to. Can be 'gp' or 'ibsg'.
     */
    publishGameStats : function(channel, args, league)
    {
        if (args.length != 1)
        {
            throw 'Error: Improperly formatted !publish-game-stats call.'
        }

        let id = sheetsHelper.getIdsFromURL(args[0])

        let gamesFileName = ''

        if (league == 'gp')
        {
            gamesFileName = gpResultsFile
        }
        else if (league == 'ibsg')
        {
            gamesFileName = ibsgResultsFile
        }
        else
        {
            throw 'Error: Unrecognized league "' + league + '"'
        }
        
        // Get all game stats
        let gamesJson = fileHelper.readJsonFromFile(gamesFileName)

        sheetsHelper.formatJsonAndPublishToSheets(id, gamesJson)
    }
}
