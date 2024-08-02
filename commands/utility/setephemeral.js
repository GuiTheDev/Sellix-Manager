const { SlashCommandBuilder} = require('discord.js');
const { request } = require('undici');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setephemeral')
        .setDescription('Sets if embeds are gonna be ephemeral or not')
        .addBooleanOption(option => 
            option.setName('ephemeral')
                .setDescription('Whether or not it is ephemeral or not')
                .setRequired(true)
        ),

    async execute(interaction, sellixapi, sellixkey, embedephemeral, ephemeral) {
        const optnkey = interaction.options.getBoolean('ephemeral')
      
        ephemeral.set(interaction.guild.id, optnkey)

        await interaction.reply({content: `✅ Embeds ephemeral are now set to **${optnkey}**`, ephemeral:true})
    

        
    },
};