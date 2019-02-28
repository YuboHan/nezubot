const discord = require('discord.js')                   // Acquire Discord API
const private_bot_token = require('./src/private.js')

// Local libraries
//const utils = require('./src/utils.js')                 // Utility functions
const commandHelper = require('./src/CommandHelper.js') // Function definitions for parsing discord user instructions

// Discord client handle. All utility functions will get passed this instance.
const client = new discord.Client()

// Bot comes online.
client.on('ready', () => {
    // List all servers bot is connected to
    console.log("Connected as " + client.user.tag)
    console.log("Servers:")

    // Find channel named "general"
    // TODO: Make this more robust with matching guild name as well
    var channelID
    client.guilds.forEach(guild => {
        console.log(" - " + guild.name)

        // List all channels
        guild.channels.forEach((channel) => {
            console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
        })

        channelID = guild.channels.find(channel => channel.name === "general").id
    })

    if (channelID == undefined)
        console.log("WARNING: No channel called \"general\" found.")

    var generalChannel = client.channels.get(channelID)
    generalChannel.send("Nezubot has connected, come say hi!")
})

// Bot receives a message
client.on('message', receivedMessage => {
    // Prevent bot from responding to its own comments
    if (receivedMessage.author == client.user)
        return

    commandHelper.parseMessage(receivedMessage)
})

// Connect bot
client.login(private_bot_token)