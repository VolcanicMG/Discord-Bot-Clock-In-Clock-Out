/* eslint-disable no-unused-vars */
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

let filePathString = '';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-entry')
        .setDescription('Removes all entries on specific date (Format: MM/DD/YYYY)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('date')
                .setDescription('Set the date: (Format: MM/DD/YYYY)')
                .setRequired(true)),
    async execute(interaction) {

        const date = interaction.options.getString('date');

        // Set the folder to the ID of the user
        filePathString = `Times/${interaction.user.id}.json`;

        // Try and delete the entry
        if (DeleteEntry(filePathString, date)) {
            await interaction.reply({ content: `Deleted ${date} and all its time.`, ephemeral: true });
        }
        else {
            await interaction.reply({ content: `Date: ${date} doesn't exist. Or unable to parse data`, ephemeral: true });
        }
    },
};

function DeleteEntry(filePath, date) {
    // Read the existing data from the file
    if (fs.existsSync(filePath) === false) {
        return false;
    }

    // Read the existing data from the file
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        return false;
    }

    const dateRegEx = /^\d{2}\/\d{2}\/\d{4}$/;
    if (date.match(dateRegEx)) {
        // The string matches the format
        // Filter out entries with the specified date
        data = data.filter(entry => entry.date !== date);

        // Write the updated data to the file
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    else {
        // The string does not match the format
        return false;
    }

    return true;
}