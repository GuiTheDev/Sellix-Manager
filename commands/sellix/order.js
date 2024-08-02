const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('undici');





module.exports = {
    
    
    data: new SlashCommandBuilder()
        .setName('order')
        .setDescription('Get Order Info')
        .addStringOption(option => 
            option.setName('uid')
                .setDescription('The product UniqueID')
                .setRequired(true)
                .setAutocomplete(true)
                
        ),


        async autocomplete(interaction, sellixapi, sellixkey, embedephemeral,) {
            const focusedvalue = interaction.options.getFocused();
    
            const forthereq = await request(`https://dev.sellix.io/v1/orders`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${sellixapi}`
                
                }
            })
            const ordersobject = {}
            const response = await forthereq.body.json()
            if (response.status != 200) return console.error("CANT GET API KEY, CHECK API KEY")
            const orders = response.data.orders
            let choices = []
            
            orders.forEach((order, i) => {
                ordersobject[order.uniqid] = order.uniqid
                choices.push(order.uniqid)
            })
            


            const filt = choices
                .filter(choice => choice.startsWith(focusedvalue))
                .slice(0, 25)
            
            await interaction.respond(
                filt.map((choice => ({name: choice, value: choice})))
            )
        },

    async execute(interaction,sellixapi) {
        const uniqueid = interaction.options.getString('uid')
        




        const forthereq = await request(`https://dev.sellix.io/v1/orders/${uniqueid}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            },
        })
        const general = await forthereq.body.json()
        const alldata = general.data
        const order = alldata.order
 

        if (general.status == 200) {
            var timestamp_created = order.created_at
            var date = new Date(timestamp_created * 1000);
            const responseEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle("Order Details")
                .setDescription(`UID: ${uniqueid}`)
                .setImage(`https://imagedelivery.net/95QNzrEeP7RU5l5WdbyrKw/${order.product.image_attachment.cloudflare_image_id}/default`)
                .setURL(`https://dashboard.sellix.io/invoices/${uniqueid}`)
                .setFooter({ text: 'Sellix Bot', iconURL: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/5f038a919ab82900015059fc/0x0.png'})
                .addFields(
                    { name: '🏭  Product Bought', value: order.product_title},
                    { name: '💰  Total paid', value: order.total.toString() },
                    { name: '📧  Customer Email', value: order.customer_email},
                    { name: '🔢  Quantity', value: order.quantity.toString()},
                    { name: '📈  Status', value: order.status},
                    { name: '🕒  Created at', value: date.toDateString()}

                )
            
            await interaction.reply({ embeds:[responseEmbed] , ephemeral: embedephemeral})
        } else {
            await interaction.reply({ content: '❌ Something failed, check api key, uniqueid or contact bot developer!',ephemeral: true})
        }
        
    },
};