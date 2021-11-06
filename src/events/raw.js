module.exports = async (manager, packet) => {

    if (!["MESSAGE_REACTION_ADD"].includes(packet.t)) return;

    const starboard = manager.starboards.find(sb => sb.channelID == packet.d.channel_id && sb.emoji == (packet.d.emoji.id || packet.d.emoji.name));
    if (!starboard) return;

    const message = await manager.client.channels.cache.get(starboard.channelID).messages.fetch(packet.d.message_id).catch(() => { });
    if (!message) return;

    starboard.postStarMessage(message);

};