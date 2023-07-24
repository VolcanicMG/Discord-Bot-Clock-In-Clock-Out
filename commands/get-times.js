/* eslint-disable no-unused-vars */
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

let filePathString = '';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('get-time')
        .setDescription('Get the times for the current user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Check the users (leave blank for yourself)'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Get the user
        let user = interaction.user;
        if (interaction.options.getUser('user') !== null) {
           user = interaction.options.getUser('user');
        }

        const avatarUrl = user.displayAvatarURL();

        // Set the folder to the ID of the user
        filePathString = `Times/${user.id}.json`;
        console.log(filePathString);

        // Get the current times
        const times = CalculateTotals(filePathString);
        const numberOfEnteries = CountEntriesInJSONFile(filePathString);

        // Embed
        const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${user.username}'s Stats.`)
        .setAuthor({ name: `${user.username}`, iconURL: `${avatarUrl}` })
        .setThumbnail(`${avatarUrl}`)
        .addFields(
            { name: 'Total Clock-ins:', value: `${numberOfEnteries}` },
            { name: 'Total Time:', value: `${times.allTime.hours}H ${times.allTime.minutes}M` },
            { name: '\u200B', value: '\u200B' },
            { name: 'Time Today:', value: `${times.today.hours}H ${times.today.minutes}M`, inline: true },
            { name: 'Time This Week:', value: `${times.thisWeek.hours}H ${times.thisWeek.minutes}M`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'Stats', iconURL: `${avatarUrl}` });

        // Send the embed
        await interaction.reply({ embeds: [exampleEmbed] });
    },
};

function CountEntriesInJSONFile(filePath) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Object.keys(data).length;
  }

function CalculateTotals(filePath) {
    // Read the data from the file
    try {
        // Check if the file exists
        if (!fs.existsSync(filePath)) {
            return {
                today: { hours: 0, minutes: 0 },
                thisWeek: { hours: 0, minutes: 0 },
                allTime: { hours: 0, minutes: 0 },
            };
        }
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        // Calculate the total for today
        const today = new Date();
        const todayString = (today.getMonth() + 1).toString().padStart(2, '0') + '/' +
            today.getDate().toString().padStart(2, '0') + '/' +
            today.getFullYear();
        const todayTotal = data.filter(entry => entry.date === todayString)
            .reduce((total, entry) => {
                total.hours += entry.hours;
                total.minutes += entry.minutes;
                return total;
            }, { hours: 0, minutes: 0 });

        // Calculate the total for this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekTotal = data.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= weekStart;
        }).reduce((total, entry) => {
            total.hours += entry.hours;
            total.minutes += entry.minutes;
            return total;
        }, { hours: 0, minutes: 0 });

        // Calculate the total for all time
        const allTimeTotal = data.reduce((total, entry) => {
            total.hours += entry.hours;
            total.minutes += entry.minutes;
            return total;
        }, { hours: 0, minutes: 0 });

        // Normalize the totals
        [todayTotal, weekTotal, allTimeTotal].forEach(total => {
            total.hours += Math.floor(total.minutes / 60);
            total.minutes %= 60;
        });

        return {
            today: todayTotal,
            thisWeek: weekTotal,
            allTime: allTimeTotal,
        };
    }
    catch (e) {
        console.log('Unable to gather data');

        // Since we will probably still need to return stuff just return 0
        return {
            today: { hours: 0, minutes: 0 },
            thisWeek: { hours: 0, minutes: 0 },
            allTime: { hours: 0, minutes: 0 },
        };
    }
}