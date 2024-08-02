const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle} = require('discord.js');
const { request } = require('undici');





module.exports = {
    
    
    data: new SlashCommandBuilder()
        .setName('restock')
        .setDescription('Add stock to Serial Product')
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

    async execute(interaction, sellixapi) {
        const uniqueid = interaction.options.getString('uid')
        




        const getproduct = await request(`https://dev.sellix.io/v1/products/${uniqueid}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            },
        })
        const general = await getproduct.body.json()
        const alldata = general.data
        const product = alldata.product
        

        if (general.status == 200) {
            if(product.type != "SERIALS") return await interaction.reply({ content: '❌ Product needs to be type SERIAL',ephemeral: true})
            
            const modal = new ModalBuilder()
                .setCustomId("getstock")
                .setTitle("Add stock!")


            const stockinput = new TextInputBuilder()
                .setCustomId("getstockbox")
                .setLabel("Add serials for stock here")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
                .setPlaceholder("SERIAL1,SERIAL2,SERIAL3,SERIAL4 (separate with ',')")

            const arow = new ActionRowBuilder().addComponents(stockinput)
            modal.addComponents(arow)

            await interaction.showModal(modal)

            const filter = (interaction) => interaction.customId === 'getstock';
            interaction.awaitModalSubmit({ filter, time: 3_600_000 })
            .then(async interaction => {
                const stock = interaction.fields.getTextInputValue('getstockbox')
                const stockarrayin = stock.split(",")
                const stockarray = [...stockarrayin, ...product.serials]
                const addstock = await request(`https://dev.sellix.io/v1/products/${uniqueid}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${sellixapi}`
                    
                    },
                    body: JSON.stringify({
                        "serials": stockarray
                    })

                })
                
                const addstockresponse = await addstock.body.json()

                if (addstockresponse.status == 200) {
                    await interaction.reply({ content: `✅ Added Stock successfully`, ephemeral: true})
                } else {
                    await interaction.reply({ content: `❌ Something failed, check api key, uniqueid or contact bot developer! error: ${addstockresponse.error}`,ephemeral: true})
                }
            })
            .catch(console.error);
        } 
        else {
            await interaction.reply({ content: `❌ Something failed, check api key, uniqueid or contact bot developer! error: ${general.error}`,ephemeral: true})
        }
        
    },
};