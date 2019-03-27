const stats = require('./GameStats.js')

module.exports = {
    /**
     * Parse user input
     * @param[in] receivedMessage(Message)  User input
     */
    parseMessage : function (receivedMessage) {
        let msg = receivedMessage.content
        let channel = receivedMessage.channel

        // Only parse commands (starts with !)
        if (msg[0] == '!') {
            parseCommand(msg, channel)
        }
    }
}

/**
 * Parse user input
 * @param[in] msg(string)       User input
 * @param[in] channel(Channel)  Channel where the message came from
 */
function parseCommand(msg, channel)
{
    // Get command name
    let command = msg.substr(1).toLowerCase().split(/[\s\n\r]+/)[0]

    // Get arguments for the command. The arguments will NOT include the command string, and will
    // be newline delimited or comma delimited
    let args = msg.replace('!' + command, '').trim().split(/[\n\r,]+/)

    switch(command)
    {
        case 'help':
            let ret = ''
            ret += 'Usage. Parameters in square brackets are optional:\n\n'
            ret += '!post-game-stats [blueSideTeamName ,redSideTeamName], onlineMatchHistoryLink\n'
            ret += '!publish-game-stats googleSheetsLink\n'
            channel.send(ret)
            break
        case 'post-game-stats':
            stats.postGameStats(channel, args)
            break
        case 'publish-game-stats':
            stats.publishGameStats(channel, args)
            break
    }
}
