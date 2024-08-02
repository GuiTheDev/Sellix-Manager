const { SlashCommandBuilder} = require('discord.js');
const { request } = require('undici');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setrole')
        .setDescription('Set role for access')
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Select the role')
                .setRequired(true)
        ),

    async execute(interaction, sellixapi, sellixkey, embedephemeral, ephemeral, role) {
        const optnrole = interaction.options.getRole('role')
        const roleid = await optnrole.id
        
        role.set(interaction.guild.id, roleid)

        await interaction.reply({content: `✅ Set role to <@&${roleid}>`, ephemeral:true})
    

        
    },
};