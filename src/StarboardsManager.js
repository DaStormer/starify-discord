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
        if (this._options.storage.type == "sqlite") {
            this._options.storage = {
                type: "sqlite",
                file: this._options.storage.file,
                name: "database",
                username: "user",
                password: "password",
                host: "localhost",
            };
        }

        /**
         * Starboards managed by this manager
         * @type {Starboard[]}
         */
        this.starboards = [];

        const database = new Sequelize(this._options.storage.name, this._options.storage.username, this._options.storage.password, {
            host: this._options.storage.host,
            dialect: this._options.storage.type,
            logging: false,
            storage: this._options.storage.file,
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

    /**
     * Inititate the manager
     * @private
     */
    async _init() {

        await this.starboardsDB.sync();

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

        this.emit("starboardCreated", starboard, this);

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

        this.emit("starboardDeleted", starboard, this);

        return true;

    }

    /**
     * Edit a starboard
     * @param {Starboard|number} editStarboard The ID of the starboard to edit
     * @param {StarboardOptions} newOptions New edited options for the starboard
     */
    async edit(editStarboard, newOptions) {

        const starboard = this.starboards.find(sb => sb.id == (editStarboard.id || editStarboard));
        if (!starboard) throw new Error(`Starboard (${editStarboard.id || editStarboard}) does not exist!`);

        newOptions = merge(starboard._options, newOptions);

        this.starboards = this.starboards.filter(sb => sb.id !== starboard.id);

        const newStarboard = this.starboards.push(new Starboard(this, starboard.id, newOptions, starboard.messages));

        await this.starboardsDB.update({ where: { id: starboard.id } }, { options: newOptions }).catch(() => { });

        this.emit("starboardEdited", starboard, newStarboard, this);

        return true;

    }

}

module.exports = StarboardsManager;