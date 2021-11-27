module.exports = async (manager, packet) => {

    if (!["MESSAGE_REACTION_ADD"].includes(packet.t)) return;

    const starboards = manager.starboards.filter(sb => sb.emoji == (packet.d.emoji.id || packet.d.emoji.name));
    if (!starboards.length) return;

    const message = await manager.client.channels.cache.get(packet.d.channel_id).messages.fetch(packet.d.message_id).catch(() => { });
    if (!message) return;

    starboards.forEach(starboard => {
        starboard.postStarMessage(message);
    });

};