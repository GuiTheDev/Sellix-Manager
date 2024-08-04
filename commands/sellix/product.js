const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('undici');





module.exports = {
    
    
    data: new SlashCommandBuilder()
        .setName('product')
        .setDescription('Get Product Info')
        .addStringOption(option => 
            option.setName('uid')
                .setDescription('The product UniqueID')
                .setRequired(true)
                .setAutocomplete(true)
        ),

        

    async autocomplete(interaction, sellixapi) {
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

    async execute(interaction, sellixapi, sellixkey, embedephemeral) {
        const uniqueid = interaction.options.getString('uid')
        




        const forthereq = await request(`https://dev.sellix.io/v1/products/${uniqueid}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            },
        })
        const general = await forthereq.body.json()
        const alldata = general.data
        const product = alldata.product
 

        if (general.status == 200) {
            let stocknumber = product.stock
            if (stocknumber == -1) {
                stocknumber = '∞'
            }
        
            
            const responseEmbed = new EmbedBuilder()
                .setColor([148,0,211])
                .setTitle(product.title)
                .setDescription(product.description)
                .setURL('https://dashboard.sellix.io/products')
                .setFooter({ text: 'Sellix Bot', iconURL: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/5f038a919ab82900015059fc/0x0.png'})
                .addFields(
                    { name: '🆔  Product UID', value: product.uniqid.toString()},
                    { name: '🏷️  Price Displayed', value: product.price_display.toString(), inline:true},
                    { name: '💰  Actual Price', value: product.price.toString(), inline:true},
                    { name: '🚛  Stock', value: stocknumber.toString()}

                )
            
            await interaction.reply({ embeds:[responseEmbed] , ephemeral: embedephemeral})
        } else {
            await interaction.reply({ content: '❌ Something failed, check api key, uniqueid or contact bot developer!',ephemeral: true})
        }
        
    },
};