const { SlashCommandBuilder, CommandInteraction } = require('discord.js');
const { request } = require('undici');





module.exports = {
    
    
    data: new SlashCommandBuilder()
        .setName('pay')
        .setDescription('Create payment link for a product')
        .addStringOption(option => 
            option.setName('slug')
                .setDescription('The product slug')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option => 
            option.setName('coupon')
                .setDescription('Coupon to auto add to the purchase')
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
            productsobject[item.title] = item.slug
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

    async execute(interaction,sellixapi) {
        const slug = interaction.options.getString('slug')
        const coupon = interaction.options.getString('coupon')
        if (coupon !=null) {
            await interaction.reply({ content: `✅ Here is the link **https://epicmomentsuper.mysellix.io/product/${slug}?couponCode=${coupon}&step=0**`,ephemeral: false})
        } else {
            await interaction.reply({ content: `✅ Here is the link **https://epicmomentsuper.mysellix.io/product/${slug}?step=0**`,ephemeral: false})
        }
        
        
    },
};