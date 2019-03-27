const discord       = require('discord.js')              // Acquire Discord API
const keys          = require('./src/private/tokens.js') // Get private Discord bot token
const commandParser = require('./src/CommandParser.js')  // Get library to parse messages to bot

// Discord client handle. All utility functions will get passed this instance
const client = new discord.Client()

// When the bot comes online
client.on('ready', () => 
{
    // List all servers bot is connected to
    console.log('Connected as ' + client.user.tag)
    console.log('Servers: ')

    let CID
    client.guilds.forEach(guild =>
    {
        console.log(' - ' + guild.name)

        // List all channels
        guild.channels.forEach(channel =>
        {
            console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
        })

        CID = guild.channels.find(channel => channel.name ==='general').id
    })

    if (CID == undefined)
    {
        console.log('Warning: No channel named \'general\' found')
    }

    let generalChannel = client.channels.get(CID)
    generalChannel.send('Nezubot has connected, come say hi!')
})

// Whenever bot receives a message
client.on('message', receivedMessage =>
{
    // Prevent bot from responding to its own comments
    if (receivedMessage.author != client.user)
    {
        commandParser.parseMessage(receivedMessage)
        // try
        // {
        //     commandParser.parseMessage(receivedMessage)
        // }
        // catch(err)
        // {
        //     let ret = 'Error parsing message:\n'
        //     ret += receivedMessage.content
        //     receivedMessage.channel.send(ret)
        // }
    }
})

// Connect bot
client.login(keys.private_bot_token)
