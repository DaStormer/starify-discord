// eslint-disable-next-line no-unused-vars
const Discord = require("discord.js");

/**
 * The options for starboards
 * @typedef StarboardOptions
 * @property {Discord.Snowflake} channelID The ID of the channel where starred messages should be sent
 * @property {Discord.EmojiIdentifierResolvable} [emoji="⭐"] The emoji to react with for this starboard
 * @property {number} threshold The amount of reactions required for this starboard
 * @property {Discord.ColorResolvable} [color="#f0ec0e"] The color of the embed(s) of the starboard messages
 * @property {boolean} [selfStar=false] Whether users can star their own messages
 * @property {boolean} [botStar=false] Whether bots can star messages
 * @property {Function?} [ignoreMembers=null] Ignore star reactions from members who pass this function
 * @property {Function?} [ignoreMessages=null] Ignore star reactions for messages that pass this function
 */
exports.StarboardOptions = {};

exports.DefaultStarboardOptions = {
    emoji: "⭐",
    color: "#f0ec0e",
    selfStar: false,
    botStar: false,
    ignoreMembers: null,
    ignoreMessages: null,
};

/**
 * The starboards manager options
 * @typedef StarboardsManagerOptions
 * @property {StorageOptions} storage The starboards storage options
 * @property {StarboardOptions} default Default starboard options for new starboards
 */
exports.StarboardsManagerOptions = {};

exports.DefaultStarboardsManagerOptions = {
    storage: {
        type: "sqlite",
        file: "./starboards.sqlite",
        name: "database",
        username: "user",
        password: "password",
        host: "localhost",
        port: null,
    },
    default: {
        emoji: "⭐",
        color: "#f0ec0e",
        selfStar: false,
        botStar: false,
        ignoreMembers: null,
        ignoreMessages: null,
    },
};

/**
 * Starboard message data
 * @typedef StarMessageData
 * @property {Discord.Snowflake} messageID The ID of the message that was starred
 * @property {Discord.Snowflake} starMessageID The ID of the starboard post of this message
 * @property {number} stars The amount of star reactions of this message
 */
exports.StarMessageData = {};

/**
 * The starboards storage options
 * @typedef StorageOptions
 * @property {"sqlite"|"postgres"|"mysql"|"mssql"|"mariadb"} [type="sqlite"] The type/dialect of the database
 * @property {string?} [file="./starboards.sqlite"] The path to the storage file (sqlite only)
 * @property {string} [name="database"] The name of the database
 * @property {string} [username="user"] The username to login with
 * @property {string} [password="password"] The password to login with
 * @property {string} [host="localhost"] The IP of the database host
 * @property {string?} [port=null] The port of the database
 */