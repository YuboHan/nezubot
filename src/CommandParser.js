const stats = require('./GameStats.js')

module.exports = {
    /**
     * Parse user input
     * @param[in] receivedMessage(Message)  User input
     * @param[in] discIds(Object)           Library of unique disc ids
     */
    parseMessage : function (receivedMessage, discIds) {
        let msg = receivedMessage.content
        let channel = receivedMessage.channel

        // Only parse commands (starts with !)
        if (msg[0] == '!') {
            parseCommand(receivedMessage, discIds)
        }
    }
}

/**
 * Parse user input
 * @param[in] msg(string)       User input
 * @param[in] channel(Channel)  Channel where the message came from
 * @param[in] discIds(Objec)    Unique discord ids
 */
function parseCommand(msg, discIds)
{
    // Get command name
    let command = msg.content.substr(1).toLowerCase().split(/[\s\n\r]+/)[0]

    // Get arguments for the command. The arguments will NOT include the command string, and will
    // be newline delimited or comma delimited
    let args = msg.content.replace('!' + command, '').trim().split(/[\n\r,]+/)

    switch(command)
    {
        case 'help':
            let ret = ''
            ret += 'Usage. Parameters in square brackets are optional:\n\n'
            ret += '!post-game-stats [blueSideTeamName ,redSideTeamName], onlineMatchHistoryLink\n'
            ret += '!publish-game-stats googleSheetsLink\n'
            msg.channel.send(ret)
            break
        case 'post-game-stats':
            if (msg.channel.id == discIds.gpResultsChannel)
            {
                stats.postGameStats(msg.channel, args, 'gp')
            }
            else if (msg.channel.id == discIds.ibsgResultsChannel)
            {
                stats.postGameStats(msg.channel, args, 'ibsg')
            }
            else
            {
                console.log('Error: channel "' + msg.channel.name + '" called !post-game-stats, ' +
                            'but it is not recognized.')
            }
            msg.channel.send('Game results successfully submitted.')
            break
        case 'publish-game-stats':
            if (msg.author.username == 'Dotenark')
            {
                if (msg.channel.id == discIds.gpResultsChannel)
                {
                    stats.publishGameStats(msg.channel, args, 'gp')
                }
                else if (msg.channel.id == discIds.ibsgResultsChannel)
                {
                    stats.publishGameStats(msg.channel, args, 'ibsg')
                }
                else
                {
                    console.log('Error: channel "' + msg.channel.name + '" called !post-game-stats, ' +
                                'but it is not recognized.')
                }
                msg.channel.send('Stats have been published.')
            }
            else
            {
                msg.channel.send('Currently, only Dotenark#9089 can publish game stats :(')
            }
            break
    }
}
