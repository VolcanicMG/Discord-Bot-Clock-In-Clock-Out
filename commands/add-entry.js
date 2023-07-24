/* eslint-disable no-unused-vars */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

let filePathString = '';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-entry')
        .setDescription('Adds an entry with time in hours and minutes (Uses current date)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addIntegerOption(option =>
            option.setName('hours')
                .setDescription('Set the hour(s)')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('minutes')
                .setDescription('Set the minutes(s)')
                .setRequired(true)),
    async execute(interaction) {

        const hours = interaction.options.getInteger('hours');
        const minutes = interaction.options.getInteger('minutes');

        // Set the folder to the ID of the user
        filePathString = `Times/${interaction.user.id}.json`;

        // Try and delete the entry
        AddTime(filePathString, hours, minutes);
        await interaction.reply({ content: `Added ${hours} Hour(s) and ${minutes} Minute(s)` });
    },
};

function AddTime(filePath, hours, minutes) {
    // Read the existing data from the file
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        data = [];
    }

    // Get the current date
    const today = new Date();
    const date = (today.getMonth() + 1).toString().padStart(2, '0') + '/' +
        today.getDate().toString().padStart(2, '0') + '/' +
        today.getFullYear();

    // Add the new entry
    data.push({ date, hours, minutes });

    // Write the updated data to the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}