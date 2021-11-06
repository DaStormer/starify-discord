# 🌟 Starify Discord 🌟
starify-discord is a node.js module with a customizable framework that makes it easy to create and manage starboards!

## ✨ Features
- very customizable!
- very easy to use!
- support for multiple databases (SQLite, Postgres, MySQL, Microsoft SQL Server, MariaDB)!
- ability to have "secret" starboards that only work in specific channels!
- ability to restrict starboards to members with a certain role or ignore a certain role!
- and more!

## Example Usage

### Setup:
```js
const Discord = require("discord.js");
const { StarboardsManager } = require("starify-discord");

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });

client.starboardManager = new StarboardsManager(client, {
    storage: {
        type: "sqlite",
        file: "./starboards.sqlite",
        name: "database",
        username: "user",
        password: "password",
        host: "localhost",
    },
    default: {
        emoji: "⭐",
        color: "#f0ec0e",
        selfStar: false,
        botStar: false,
        ignoreMembers: null,
        ignoreMessages: null,
    },
});
```

### Create a starboard:
```js
client.starboardManager.create({
    channelID: message.channelId,
    emoji: "⭐",
    threshold: 10,
    color: "#f0ec0e",
    selfStar: false,
    botStar: false,
    ignoreMembers: null,
    ignoreMessages: null,
});
```

### Delete a starboard:
```js
const starboardID = client.starboardManager.starboards.find(starboard => starboard.channelID == "" && starboard.emoji == "").id;
client.starboardManager.delete(starboardID);
```

### Create a secret starboard:
This `ignoreMessages` function will ignore all messages that aren't from the specified channels!
```js
client.starboardManager.create({
    channelID: message.channelId,
    emoji: "⭐",
    threshold: 10,
    color: "#f0ec0e",
    selfStar: false,
    botStar: false,
    ignoreMembers: null,
    ignoreMessages: (message => !["channel 1 ID, "channel 2 ID"].includes(message.channelId)),
});
```

### Blacklist a role from starboard:
This `ignoreMembers` function will not count star reactions from members who have the specified role!
```js
client.starboardManager.create({
    channelID: message.channelId,
    emoji: "⭐",
    threshold: 10,
    color: "#f0ec0e",
    selfStar: false,
    botStar: false,
    ignoreMembers: (member => member.roles.cache.has("role ID")),
    ignoreMessages: null,
});
```

### Events:
```js
// Fired when a message is added to a starboard
client.starboardManager.on("starboardMessagePosted", (message, starboard) => {
    console.log(message); // the message that was posted to the starboard channel
    console.log(starboard); // the starboard that triggered this
}

// Fired when a starboard is created
client.starboardManager.on("starboardCreated", (starboard) => {
    console.log(starboard); // the starboard that was created
}

// Fired when a starboard is deleted
client.starboardManager.on("starboardDeleted", (starboard) => {
    console.log(starboard); // the starboard that was deleted
}
```

## Coming Soon!
- ability to edit starboard options easily
- leaderboard for top starboard messages
