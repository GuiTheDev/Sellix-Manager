const { SlashCommandBuilder} = require('discord.js');
const { request } = require('undici');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setapikey')
        .setDescription('Set sellix api key')
        .addStringOption(option => 
            option.setName('apikey')
                .setDescription('Sellix api key')
                .setRequired(true)
        ),

    async execute(interaction, sellixapi, sellixkey) {
        const optnkey = interaction.options.getString('apikey')

        const checkvalid = await request(`https://dev.sellix.io/v1/self`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${optnkey}`
            
            }
        })

        const checkvalidres = await checkvalid.body.json()

        if (checkvalidres.status == 200) {
            sellixkey.set(interaction.guild.id, optnkey)

            await interaction.reply({content: `✅ Selix API key set to **${optnkey}**`, ephemeral:true})
        } else {
            await interaction.reply(`❌ Invalid key`)
        }

        
    },
};