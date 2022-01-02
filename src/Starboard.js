const deepmerge = require("deepmerge");
const Discord = require("discord.js");
// eslint-disable-next-line no-unused-vars
const { StarboardOptions, DefaultStarboardOptions, StarMessageData } = require("./Constants");
// eslint-disable-next-line no-unused-vars
const StarboardsManager = require("./StarboardsManager");

class Starboard {
    /**
     * A starboard
     * @param {StarboardsManager} manager The starboard manager
     * @param {number} id The ID of this starboard
     * @param {StarboardOptions} options The starboard options
     * @param {StarMessageData[]} messages The messages in this starboard
     */
    constructor(manager, id, options, messages) {

        /**
         * The manager of this starboard
         * @type {StarboardsManager}
         */
        this.manager = manager;

        /**
         * The options of this starboard
         * @type {StarboardOptions}
         * @private
         */
        this._options = deepmerge(DefaultStarboardOptions, options);

        /**
         * The ID of this starboard
         * @type {number}
         */
        this.id = id;

        /**
         * The ID of the channel of this starboard
         * @type {Discord.Snowflake}
         */
        this.channelID = this._options.channelID;

        /**
         * The emoji to react with for this starboard
         * @type {Discord.EmojiIdentifierResolvable}
         */
        this.emoji = this._options.emoji;

        /**
         * The amount of reactions required for this starboard
         * @type {number}
         */
        this.threshold = this._options.threshold;

        /**
         * The color of the embed(s) of this starboard's messages
         * @type {Discord.EmojiIdentifierResolvable}
         */
        this.color = this._options.color;

        /**
         * Whether members can star their own messages for this starboard
         * @type {boolean}
         */
        this.selfStar = this._options.selfStar;

        /**
         * Whether bots can star messages for this starboard
         * @type {boolean}
         */
        this.botStar = this._options.botStar;

        /**
         * Ignore star reactions from members who pass this function
         * @type {Function?}
         */
        this.ignoreMembers = eval("(" + this._options.ignoreMembers + ")") ?? (() => false);

        /**
         * Ignore star reactions for messages that pass this function
         * @type {Function?}
         */
        this.ignoreMessages = eval("(" + this._options.ignoreMessages + ")") ?? (() => false);

        /**
         * The messages in this starboard
         * @type {StarMessageData[]}
         */
        this.messages = messages;

    }

    /**
     * The channel of this starboard
     * @type {Discord.TextChannel|Discord.NewsChannel}
     */
    get channel() {
        return this.manager.client.channels.cache.get(this.channelID);
    }

    /**
     * The ID of the guild of this starboard
     * @type {Discord.Snowflake}
     */
    get guildId() {
        return this.channel.guildId;
    }

    /**
     * The guild of this starboard
     * @type {Discord.Guild}
     */
    get guild() {
        return this.manager.client.guilds.cache.get(this.guildId);
    }

    /**
     * Post a new message in the starboard channel
     * @param {Discord.Message} message The message to post in the starboard channel
     */
    async postStarMessage(message) {

        if (this.ignoreMessages(message)) return;

        const reaction = await message.reactions.cache.get(this.emoji).fetch();

        const starCount = (await this.guild.members.fetch({ user: (await reaction.users.fetch()).map(reactionUser => reactionUser.id) })).filter(mem => !this.ignoreMembers(mem) && (this.selfStar || mem.id !== message.author.id) && (this.botStar || !mem.user.bot)).size;

        if (starCount < this.threshold) return;

        const starEmbed = new Discord.MessageEmbed()
            .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
            .setColor(this.color)
            .setDescription(message.content ?? "*no message content*")
            .addField("Author", message.author.toString(), true)
            .addField("Channel", message.channel.toString(), true)
            .setTimestamp();

        const repliedMessage = message.reference?.messageId && !message.system ? await message.fetchReference() : null;

        if (repliedMessage) {
            starEmbed.addField(`Replied To: ${repliedMessage.author.tag}`, repliedMessage.content.length < 1024 ? repliedMessage.content : repliedMessage.content.slice(0, repliedMessage.content.length - (repliedMessage.content.length - 1020) + "..."));
            starEmbed.addField("Messages", `[Jump To Message](${message.url})\n[Jump To Replied Message](${repliedMessage.url})`);
        } else
            starEmbed.addField("Message", `[Jump To Message](${message.url})`);

        const postedStarMessage = this.messages.includes(message.id) ?
            (await this.channel.messages.fetch(this.messages.find(sMsg => sMsg.messageID == message.id).starMessageID).catch(() => { }))?.edit({
                content: `${reaction.emoji} **${starCount}**`,
                embeds: [starEmbed, ...message.embeds],
                files: [...message.attachments.values()],
            }) || await this.channel.send({
                content: `${reaction.emoji} **${starCount}**`,
                embeds: [starEmbed, ...message.embeds],
                files: [...message.attachments.values()],
            })
            : await this.channel.send({
                content: `${reaction.emoji} **${starCount}**`,
                embeds: [starEmbed, ...message.embeds],
                files: [...message.attachments.values()],
            });

        this.messages = this.messages.filter(sMsg => sMsg.messageID !== message.id);
        this.messages.push({ messageID: message.id, starMessageID: postedStarMessage.id, stars: starCount });

        this.manager.starboardsDB.update({ messages: JSON.stringify(this.messages) }, { where: { id: this.id } });

        this.manager.emit("starboardMessagePosted", postedStarMessage, this);

        return true;

    }

    /**
     * Delete a message from the starboard
     * @param {Discord.Message} message The message to be deleted from the starboard
     */
    async deleteStarMessage(message) {

        const starMessageData = this.messages.find(sMsg => sMsg.starMessageID == message.id);
        if (!starMessageData) return false;

        const starMessage = await this.channel.messages.fetch(message.id).catch(() => { });
        if (starMessage) starMessage.delete().catch(() => { });

        this.messages = this.messages.filter(sMsg => sMsg.starMessageID !== message.id);

        this.manager.starboardsDB.update({ messages: JSON.stringify(this.messages) }, { where: { id: this.id } });

        this.manager.emit("starboardMessageDeleted", starMessage ?? message.id, this);

        return true;

    }

}

module.exports = Starboard;
