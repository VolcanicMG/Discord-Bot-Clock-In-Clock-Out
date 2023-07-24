/* eslint-disable no-unused-vars */
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, userMention, bold } = require('discord.js');
const fs = require('fs');

let filePathString = '';
let keepSendingMessages = true;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clock-in')
        .setDescription('Start the timer for the current user')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // Check to make sure we are using the right channel
        if (interaction.channelId !== '********************') {
            await interaction.reply({ content: `ID:${interaction.channelID} Unable to use this command within this channel. Please us in clock-in-clock-out!`, ephemeral: true });
            return;
        }

        // Start the time here
        const options = { timeZone: 'America/Denver', hour: 'numeric', minute: '2-digit', hour12: true };
        const currentTime = new Date().toLocaleTimeString('en-US', options);
        const startTime = Date.now();
        let endTime;
        const avatarUrl = interaction.user.displayAvatarURL();

        // Set the folder to the ID of the user
        filePathString = `Times/${interaction.user.id}.json`;
        console.log(filePathString);

        // Get the current times
        const times = CalculateTotals(filePathString);

        // Set a reminder
        const myTimer = SendDelayedMessage(interaction.user, 'You are still checked in!', 60);
        keepSendingMessages = true;

        // Buttons
		const confirm = new ButtonBuilder()
        .setCustomId('check-out')
        .setLabel('Check Out')
        .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(confirm);

        // Embed
        const exampleEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(`${interaction.user.username}'s time was started.`)
        .setAuthor({ name: `${interaction.user.username}`, iconURL: `${avatarUrl}` })
        .setDescription(`${interaction.user.username}'s time was started at ${currentTime}`)
        .setThumbnail(`${avatarUrl}`)
        .addFields(
            { name: 'Total Time:', value: `${times.allTime.hours}H ${times.allTime.minutes}M` },
            { name: '\u200B', value: '\u200B' },
            { name: 'Time Today:', value: `${times.today.hours}H ${times.today.minutes}M`, inline: true },
            { name: 'Time This Week:', value: `${times.thisWeek.hours}H ${times.thisWeek.minutes}M`, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: 'Started', iconURL: `${avatarUrl}` });

        // Send the embed
        const response = await interaction.reply({ embeds: [exampleEmbed], components: [row] });

        // Button checking
        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter });

            if (confirmation.customId === 'check-out') {
                // Add checking here
                const endTimestring = new Date().toLocaleTimeString('en-US', options);
                endTime = Date.now();

                let timeDiff = Math.abs(startTime - endTime);
                const diffHours = Math.floor(timeDiff / (1000 * 60 * 60));
                timeDiff -= diffHours * (1000 * 60 * 60);
                const diffMinutes = Math.floor(timeDiff / (1000 * 60));

                // Stop the timer
                StopTimer(myTimer);

                // Adds the entry
                AddEntry(filePathString, diffHours, diffMinutes);

                await confirmation.update({ embeds: [], content: `${userMention(interaction.user.id)} clocked out! \n\nStarting time: ${bold(currentTime)} \nEnding time: ${bold(endTimestring)} \nThey worked for ${bold(diffHours)} hour(s) and ${bold(diffMinutes)} minute(s).`, components: [] });
            }
        } catch (e) {
            console.debug(`Unable to get button, Exception: \n${e}`);
        }
    },
};

function SendDelayedMessage(user, message, delayInMinutes) {
    const delayInMilliseconds = delayInMinutes * 60000;

        if (!keepSendingMessages) {return;}
        let myTimer = setTimeout(() => {
            // code to run after delay
            if (keepSendingMessages) {
                user.send(message);
                myTimer = SendDelayedMessage(user, message, delayInMinutes);
            }
            else {return;}

        }, delayInMilliseconds);

        return myTimer;
}

function StopTimer(timerID) {
    keepSendingMessages = false;
    clearTimeout(timerID);
}

function AddEntry(filePath, hours, minutes) {

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