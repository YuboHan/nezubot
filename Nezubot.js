const discord       = require('discord.js')              // Acquire Discord API
const keys          = require('./src/private/tokens.js') // Get private Discord bot token
const commandParser = require('./src/CommandParser.js')  // Get library to parse messages to bot

// Discord client handle. All utility functions will get passed this instance
const client = new discord.Client()

var discIds = {
    duoEsportsGuild : null,
    dotenarkPrivGuild : null,
    gpResultsChannel : null,
    ibsgResultsChannel : null
}

// When the bot comes online
client.on('ready', () => 
{
    // List all servers bot is connected to
    //console.log('Connected as ' + client.user.tag)
    //console.log('Servers: ')

    client.guilds.forEach(guild =>
    {
        // console.log(' - ' + guild.name + ' - ' + guild['id'] + '\n')

        // // List all channels
        // guild.channels.forEach(channel =>
        // {
        //     console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
        // })

        if (guild.name == 'Duo Esports')
        {
            discIds.duoEsportsGuild = guild.id

            guild.channels.forEach(channel =>
            {
                if (channel.name == 'gpcs-bot-results')
                {
                    discIds.gpResultsChannel = channel.id
                }
                else if (channel.name == 'ibsg-bot-results')
                {
                    discIds.ibsgResultsChannel = channel.id
                }
            })

            if (discIds.gpResultsChannel == null)
            {
                console.log('Error: Cannot find gpcs-bot-results')
            }
            if (discIds.ibsgResultsChannel == null)
            {
                console.log('Error: Cannot find ibsg-bot-results')
            }
        }
        else if (guild.name == 'DotenarkPrivateServer')
        {
            discIds.dotenarkPrivGuild = guild.id
        }
    })
})

// Whenever bot receives a message
client.on('message', receivedMessage =>
{
    if (receivedMessage.channel.id == discIds.gpResultsChannel ||
        receivedMessage.channel.id == discIds.ibsgResultsChannel)
    {
        if (receivedMessage.author != client.user)
        {
            commandParser.parseMessage(receivedMessage, discIds)
            // try
            // {
            //     commandParser.parseMessage(receivedMessage, receivedMessage.channel, discIds)
            // }
            // catch(err)
            // {
            //     let ret = 'Error parsing message:\n'
            //     ret += receivedMessage.content
            //     receivedMessage.channel.send(ret)
            // }
        }
    }
})

// Connect bot
client.login(keys.private_bot_token)
