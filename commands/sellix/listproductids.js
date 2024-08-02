const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { request } = require('undici');
const { sellixapi } = require('../../config.json')


module.exports = {
    data: new SlashCommandBuilder()
        .setName('listproductids')
        .setDescription('Get the UIDS to all products'),

    async execute(interaction, sellixapi, sellixkey, embedephemeral,) {
        const forthereq = await request(`https://dev.sellix.io/v1/products`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            }
        })
        const productsobject = {}
        const response = await forthereq.body.json()
        const products = response.data.products

        products.forEach((item, i) => {
            productsobject[item.title] = item.uniqid
        })

        const responseEmbed = new EmbedBuilder()
            .setTitle("Product ID list")
            .setURL('https://dashboard.sellix.io/products')
            .setFooter({ text: 'Sellix Bot', iconURL: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/5f038a919ab82900015059fc/0x0.png'})
            for (const key in productsobject) {
                responseEmbed.addFields({name: key, value: productsobject[key]})
            }
        


        await interaction.reply({ embeds: [responseEmbed],ephemeral: embedephemeral})
    },
};