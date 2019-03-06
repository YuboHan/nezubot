const keys = require('./private/tokens.js')
const jsonHelper = require('./JsonHelper.js')
const https = require('https')
const fs = require('fs')

const championDbLink = './RiotDatabase/champion.json'
const riotApiPath = 'https://na1.api.riotgames.com/'

var champions = jsonHelper.readJsonFromFile(championDbLink)

module.exports = {
    statsToCsv : function(matchLink, channel, csvName) {
        var strSplit = matchLink.split('/#match-details/')[1].split('/')
        var region = strSplit[0]
        var gameId = strSplit[1]

        https.get(riotApiPath + 'lol/match/v4/matches/' + gameId + '?api_key=' + keys.private_riot_token, response => {
            let data = ''

            response.on('data', chunk => {
                data += chunk
            })

            response.on('end', chunk => {
                console.log('All chunks received!')
                outputStatsToCsv(JSON.parse(data), channel, csvName)
            })
        }).on('error', err => {
            console.log('Error in sending http request: ' + err.message)
        })
    },

    statsToJson : function(matchLink, callback) {
        var strSplit = matchLink.split('/#match-details/')[1].split('/')
        var region = strSplit[0]
        var gameId = strSplit[1]

        https.get(riotApiPath + 'lol/match/v4/matches/' + gameId + '?api_key=' + keys.private_riot_token, response => {
            let data = ''

            response.on('data', chunk => {
                data += chunk
            })

            response.on('end', chunk => {
                callback(JSON.parse(data))
            })
        }).on('error', err => {
            console.log('Error in sending http request: ' + err.message)
        })
    },

    getChampionNameByKey(key) {
        for (var i in champions.data) {
            if (champions.data[i].key == key) {
                return i
            }
        }

        if (key == 517) {
            return "Sylas"
        }

        console.log("Warning: Cannot find champion ID: " + key)
        return 'UnknownChampion'
    }
}

// role, player, champion, kill, death, assist, KDA, CS, CS/M, Damage, Gold, 
// Vision Score, Kill participation, damage/min, damage/death, damage percentage, 
// damage/100 gold, gold percentage, kill percentage, death percentage, assist percentage

// dragons, rift herald, barons, towers, inhibitors
// drags/10, barons/10, towers/10, inhibs/10

// Team totals:
// Kills, deaths, assists, CS, CS/M (avg), Damage, gold

class TeamR {
    // @param[in] name  Name as string
    // @param[in] win   Win as boolean
    constructor(name, team, win) {
        this.name = name
        this.teamId = team.teamId
        this.players = []
        this.win = win
        this.towers = team.towerKills
        this.inhibs = team.inhibitorKills
        this.barons = team.baronKills
        this.dragons = team.dragonKills
        this.heralds = team.riftHeraldKills

        // Need to collect by iterating over all players
        this.totalKills = 0
        this.totalDeaths = 0
        this.totalAssists = 0
        this.totalCs = 0
        this.totalDamage = 0
        this.totalVisionScore = 0
        Object.seal(this)
    }
}

function getPlayerStatsAndUpdateTeam(playerJson, team) {
    var player = {}

    player.champion     = getChampionNameByKey(playerJson.championId)
    player.kills        = playerJson.stats.kills
    player.deaths       = playerJson.stats.deaths
    player.assists      = playerJson.stats.assists
    player.kda          = (player.kills + player.assists) / player.deaths
    player.totalDamage  = playerJson.stats.totalDamageDealtToChampions
    player.gold         = playerJson.stats.goldEarned
    player.visionScore  = playerJson.stats.visionScore
    player.controlWards = playerJson.stats.visionWardsBoughtInGame
    player.cs           = playerJson.stats.totalMinionsKilled +
                          playerJson.stats.neutralMinionsKilled

    team.totalKills       += player.kills
    team.totalDeaths      += player.deaths
    team.totalAssists     += player.assists
    team.totalCs          += player.cs
    team.totalDamage      += player.totalDamage
    team.totalVisionScore += player.visionScore

    team.players.push(player)
}

function teamStatsToString(team, gameDuration) {
    var ret = ''

    if (team.teamId == 100) {
        ret += 'Blue side'
    }
    else {
        ret += 'Red side'
    }
    if (team.win == true) {
        ret += ' (winner)\n'
    }
    else {
        ret += '\n'
    }


    ret += 'Team stats\n'
    ret += 'Kills,' + team.totalKills + '\n'
    ret += 'Deaths,' + team.totalDeaths + '\n'
    ret += 'Assists,' + team.totalAssists + '\n'
    ret += 'AverageKda,' + ((team.totalKills + team.totalAssists) / team.totalDeaths) + '\n'
    ret += 'CS,' + team.totalCs + '\n'
    ret += 'CS/m,' + (team.totalCs / (gameDuration / 60)) + '\n'
    ret += 'Damage,' + team.totalDamage + '\n'
    ret += 'Dragons,' + team.dragons + '\n'
    ret += 'Rift Herald,' + team.heralds + '\n'
    ret += 'Barons,' + team.barons + '\n'
    ret += 'Towers,' + team.towers + '\n'
    ret += 'Inhibitors,' + team.inhibs + '\n'

    ret += 'Player stats\n'
    var firstVal = true
    for (var i in team.players[0]) {
        if (firstVal) {
            firstVal = false
        }
        else {
            ret += ','
        }

        ret += i
    }

    ret += '\n'

    for (var i in team.players) {
        firstVal = true
        for (var key in team.players[i]) {
            if (firstVal) {
                firstVal = false
            }
            else {
                ret += ','
            }
            ret += team.players[i][key]
        }
        ret += '\n'
    }

    return ret
}

function outputStatsToCsv(gameJson, channel, filename) {
    var gameDuration = gameJson.gameDuration // In seconds

    var team1Win = false
    if (gameJson.teams[0].win == "Win") {
        team1Win = true
    }

    var team1 = new TeamR('null', gameJson.teams[0], team1Win)
    var team2 = new TeamR('null', gameJson.teams[1], !team1Win)

    // Iterate through all players to populate list
    for (var i in gameJson.participants) {
        if (gameJson.participants[i].teamId == team1.teamId) {
            getPlayerStatsAndUpdateTeam(gameJson.participants[i], team1)
        }
        else if (gameJson.participants[i].teamId == team2.teamId) {
            getPlayerStatsAndUpdateTeam(gameJson.participants[i], team2)
        }
        else {
            throw "Error: Invalid team ID " + team1.teamId
        }
    }

    var ret = teamStatsToString(team1, gameDuration)
    ret += '\n' + teamStatsToString(team2, gameDuration)

    fs.writeFileSync(filename, ret)
}