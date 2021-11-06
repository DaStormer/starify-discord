const { EventEmitter } = require("events");
const Discord = require("discord.js");
const merge = require("deepmerge");
const { Sequelize, Model, DataTypes } = require("sequelize");
// eslint-disable-next-line no-unused-vars
const { StarboardsManagerOptions, DefaultStarboardsManagerOptions, StarboardOptions } = require("./Constants");
const Starboard = require("./Starboard");
const rawEvent = require("./events/raw");

/**
 * Manager for starboards
 */
class StarboardsManager extends EventEmitter {
    /**
     * @param {Discord.Client} client The Discord Client
     * @param {StarboardsManagerOptions} options The starboard manager options
     */
    constructor(client, options) {
        super();

        if (!client || !(client instanceof Discord.Client)) throw new Error("Client parameter must be a valid discord.js client.");

        /**
         * Whether this manager is ready
         * @type {boolean}
         */
        this.ready = false;

        /**
         * The Discord client that instantiated this manager
         * @type {Discord.Client}
         */
        this.client = client;

        /**
         * The options of this manager
         * @type {StarboardsManagerOptions}
         * @private
         */
        this._options = merge(DefaultStarboardsManagerOptions, options);

        /**
         * Starboards managed by this manager
         * @type {Starboard[]}
         */
        this.starboards = [];

        const database = new Sequelize("database", "user", "password", {
            host: "localhost",
            dialect: "sqlite",
            logging: false,
            storage: this._options.storage,
        });

        class Starboards extends Model { }
        Starboards.init({
            options: DataTypes.TEXT,
            messages: DataTypes.TEXT,
        }, {
            sequelize: database,
            tableName: "starboards",
        });

        this.starboardsDB = Starboards;

        this._init();

    }

    async _init() {

        const starboards = await this.starboardsDB.findAll();

        for (const starboard of starboards)
            this.starboards.push(new Starboard(this, starboard.id, JSON.parse(starboard.options), JSON.parse(starboard.messages)));

        this.client.on("raw", packet => rawEvent(this, packet));

        this.ready = true;

    }

    /**
     * Create a new starboard
     * @param {StarboardOptions} options The options of this starboard
     */
    async create(options) {

        options = merge(this._options.default, options);

        if (this.starboards.find(sb => sb.channelID == options.channelID && sb.emoji == options.emoji)) throw new Error(`A starboard with this channel ID (${options.channelID}) and emoji (${options.emoji}) already exists!`);

        const starboardDBEntry = await this.starboardsDB.create({ options: JSON.stringify(options), messages: "[]" });

        const starboard = new Starboard(this, starboardDBEntry.id, options, []);

        this.starboards.push(starboard);

        return starboard;

    }

    /**
     * Delete a starboard
     * @param {Starboard|number} deleteStarboard The ID of the starboard to delete
     */
    async delete(deleteStarboard) {

        const starboard = this.starboards.find(sb => sb.id == (deleteStarboard.id || deleteStarboard));
        if (!starboard) throw new Error(`Starboard (${deleteStarboard.id || deleteStarboard}) does not exist!`);

        this.starboards = this.starboards.filter(sb => sb.id !== starboard.id);

        await this.starboardsDB.destroy({ where: { id: starboard.id } }).catch(() => { });

        return true;

    }

}

module.exports = StarboardsManager;