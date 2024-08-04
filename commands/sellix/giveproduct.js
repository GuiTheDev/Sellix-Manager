const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('undici');




module.exports = {
    
    
    data: new SlashCommandBuilder()
        .setName('giveproduct')
        .setDescription('Gives a serial code from serial product(also creates invoice)')
        .addStringOption(option => 
            option.setName('uid')
                .setDescription('The product UniqueID')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option => 
            option.setName('customer_email')
                .setDescription('The customer email, or seller for log')
                .setRequired(true)
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
            if (item.type == "SERIALS") {
                productsobject[item.title] = item.uniqid
            }
            
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
        const cmail = interaction.options.getString('customer_email')



        const forthereq = await request(`https://dev.sellix.io/v1/products/${uniqueid}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            },
        })

        const response = await forthereq.body.json()

        if (response.status == 200) {
            if (response.data.product.type == "SERIALS") {
                await interaction.reply({content: "🔃 Registering payment invoice...", ephemeral: true})

                const createpayment = await request(`https://dev.sellix.io/v1/payments`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${sellixapi}`
                        
                    },
                    body: JSON.stringify({
                      "product_id": uniqueid,
                      "white_label": true,
                      "email": cmail
                    })
                })

                createpaymentresponse = await createpayment.body.json()
                if(createpaymentresponse.status == 200) {
                    await interaction.editReply({content: "✅ Invoice Created, closing the invoice now! **This might take a few seconds**", ephemeral: true} )
                    const newinvoiceid = createpaymentresponse.data.invoice.uniqid

                    const completepay = await request(`https://dev.sellix.io/v1/payments/${newinvoiceid}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${sellixapi}`
                            
                        },
                    })

                    completepayresponse = await completepay.body.json()
                    if (completepayresponse.status == 200) {
                        await interaction.editReply("✅ Invoice Paid Successfuly. Operation Complete, getting serial now! ")
                     
                        const getserial = await request(`https://dev.sellix.io/v1/orders/${newinvoiceid}`, {
                            method: 'GET',
                            headers: {
                            'Authorization': `Bearer ${sellixapi}`
                            },
                        })

                        getserialresponse = await getserial.body.json()
                        
                        if(getserialresponse.status == 200) {
                            const responseEmbed = new EmbedBuilder()
                                .setColor([148,0,211])
                                .setTitle('Product Provided')
                                .setURL('https://dashboard.sellix.io/products')
                                .setFooter({ text: 'Sellix Bot', iconURL: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/5f038a919ab82900015059fc/0x0.png'})
                                .addFields(
                                    { name: '🆔  Product: ', value: response.data.product.title},
                                    { name: '🏷️  Given amount', value: '1'},
                                    { name: '💰  Remaining stock', value: (response.data.product.stock-1).toString()},
                                )



                            await interaction.editReply({content: `✅ Serial retrieved; **${getserialresponse.data.order.serials[0]}**`,embeds:[responseEmbed] , ephemeral: embedephemeral})
                            
        

                        } else {
                            await interaction.editReply({ content: `❌ Something failed, check api key, uniqueid or contact bot developer!, error: ${getserialresponse.error}`,ephemeral: true})
                        }
                        

                    } else {
                        await interaction.editReply({ content: `❌ Something failed, check api key, uniqueid or contact bot developer!, error: ${completepayresponse.error}`,ephemeral: true})
                        
                    }

                } else {
                    await interaction.editReply({ content: `❌ Something failed, check api key, uniqueid or contact bot developer!, error: ${createpayment.error}`,ephemeral: true})
                }





            } else {
                await interaction.reply({ content: `❌ That is not a SERIAL type product`,ephemeral: true})
            }
        } else {
            await interaction.reply({ content: `❌ Something failed, check api key, uniqueid or contact bot developer!, error: ${response.error}`,ephemeral: true})
        }
        
    },
};