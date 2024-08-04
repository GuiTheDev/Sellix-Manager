const { SlashCommandBuilder} = require('discord.js');
const { request } = require('undici');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setstoredomain')
        .setDescription('Set store domain(example.com or www.example.com)')
        .addStringOption(option => 
            option.setName('storedomain')
                .setDescription('Your store domain')
                .setRequired(true)
        ),

    async execute(interaction, sellixapi, sellixkey, embedephemeral, ephemeral, role, storedomain) {
        const optnkey = interaction.options.getString('storedomain')

        storedomain.set(interaction.guild.id, optnkey)
        
        await interaction.reply({ content: `✅ Set store domain to ${optnkey}`, ephemeral: true });
        
    },
};