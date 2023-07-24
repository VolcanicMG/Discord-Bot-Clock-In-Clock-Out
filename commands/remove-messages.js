const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-messages')
        .setDescription('Clear an amount of messages')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Set amount of messages to clean')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)),
    async execute(interaction) {

        const channel = interaction.channel;
        const count = interaction.options.getInteger('amount');

        await channel.bulkDelete(count);
        await interaction.reply({ content: `Deleted ${count} messages from ${channel.name}!`, ephemeral: true });
    },
};
