const { SlashCommandBuilder } = require('discord.js');
const { request } = require('undici');
const { sellixapi } = require('../../config.json')




module.exports = {
    
    
    data: new SlashCommandBuilder()
        .setName('changeprice')
        .setDescription('Change product price')
        .addStringOption(option => 
            option.setName('uid')
                .setDescription('The product UniqueID')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addNumberOption(option => 
            option.setName('newprice')
                .setDescription('the new price')
                .setRequired(true)),

        

    async autocomplete(interaction, client) {
        const focusedvalue = interaction.options.getFocused();

        const forthereq = await request(`https://dev.sellix.io/v1/products`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            }
        })
        const productsobject = {}
        const response = await forthereq.body.json()

        if (response.status != 200) return console.error("CANT GET API KEY, CHECK API KEY")
        const products = response.data.products
        
        


        products.forEach((item, i) => {
            productsobject[item.title] = item.uniqid
        })
        let choices = []
        
        for (const key in productsobject) {
            const choice = {
                name: key,
                value: productsobject[key]
            }
            choices.push(choice)
        }
       
        
        await interaction.respond(
            choices.map((choice => ({name: choice.name, value: choice.value})))
        )
    },

    async execute(interaction) {
        const uniqueid = interaction.options.getString('uid')
        const price = interaction.options.getNumber('newprice')




        const forthereq = await request(`https://dev.sellix.io/v1/products/${uniqueid}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            },
            body: JSON.stringify({
                "price": price,
            })
        })

        const response = await forthereq.body.json()

        if (response.status == 200) {
            await interaction.reply({ content: `✅ Changed product price with id **${uniqueid}** to **${price}$**`, ephemeral: true})
        } else {
            await interaction.reply({ content: `❌ Something failed, check api key, uniqueid or contact bot developer!, error: ${response.error}`,ephemeral: true})
        }
        
    },
};