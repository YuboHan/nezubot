const https = require('https')
const keys = require('./private/tokens.js')
const fileHelper = require('./FileHelper.js')

const riotApiPath = 'https://na1.api.riotgames.com/'

var champions = fileHelper.readJsonFromFile('./RiotDatabase/champion.json')

module.exports = {
    /**
     * Get the game JSON from Riot API
     * param[in] URL(string)          Online match history URL
     * param[out] callback(function)  Callback function. Parameter accepts team JSON
     */
    getGameJson : function(URL, callback)
    {
        let gameId = _getGameIdFromURL(URL)
        let httpsCall = riotApiPath + 'lol/match/v4/matches/' 
                                    + gameId + '?api_key=' 
                                    + keys.private_riot_token

        // Make the https call
        https.get(httpsCall, response =>
        {
            let data = ''
            response.on('data', chunk =>
            {
                data += chunk
            })

            response.on('end', chunk =>
            {
                callback(JSON.parse(data))
            })
        }).on('error', err =>
        {
            throw 'Error in sending http request: ' + err.Message
        })
    },

    /**
     * Get Game ID from online match history URL
     * param[in] URL(string)  Online match history URL
     * return(string)         Game ID
     */
    getGameIdFromURL : function(URL)
    {
        return _getGameIdFromURL(URL)
    },

    getChampionNameByKey(key) {
        for (var i in champions.data) {
            if (champions.data[i].key == key) {
                return i
            }
        }

        switch(key)
        {
            case 141: return 'Kayn'
            case 142: return 'Zoe'
            case 145: return 'Kaisa'
            case 246: return 'Qiyana'
            case 350: return 'Yuumi'
            case 497: return 'Rakan'
            case 498: return 'Xayah'
            case 516: return 'Ornn'
            case 517: return 'Sylas'
            case 518: return 'Neeko'
            case 555: return 'Pyke'
        }

        console.log("Warning: Cannot find champion ID: " + key)
        return 'UnknownChampion(' + key + ')'
    }
}

/**
 * Get Game ID from online match history URL
 * param[in] URL(string)  Online match history URL
 * return(string)         Game ID
 */
function _getGameIdFromURL(URL)
{
    let strSplit = URL.split('/#match-details/')[1].split('/')

    if (strSplit.length < 2)
    {
        throw 'Error: Match history URL is not correct.'
    }

    return strSplit[1]
}
