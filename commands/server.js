const { SlashCommandBuilder } = require('discord.js');
const wait = require('node:timers/promises').setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides information about the server.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		await interaction.deferReply(); // If required, put the ephermeral tag here in the deferReply: { ephemeral: true }
		await wait(5000);
		await interaction.editReply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
	},
};
// Example using the deferreplay method. This also acts as the initial response, to confirm to Discord that the interaction was received successfully
// and gives you a 15-minute timeframe to complete your tasks before responding.