const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType} = require('discord.js');
const { request } = require('undici');


module.exports = {
    
    
    data: new SlashCommandBuilder()
        .setName('createcoupon')
        .setDescription('Create Coupon Code')
        .addStringOption(option => 
            option.setName('code')
                .setDescription('The code you want to create')
                .setRequired(true)
                
        )
        .addStringOption(option =>
            option.setName('discount_type')
                .setDescription('Type of discount, percentage or fixed')
                .setRequired(true)
                .addChoices(
                    { name: 'Percentage', value: 'PERCENTAGE'},
                    { name: 'Fixed', value: 'FIXED'}
                )
        )
        .addNumberOption(option => 
            option.setName('discount_amount')
                .setDescription('The discount ammount')
                .setRequired(true)
            
        )
        
        .addIntegerOption(option => 
            option.setName('max_uses')
                .setDescription('Coupon code max uses, leave empty for unlimited')

        )
        .addStringOption(option =>
            option.setName('expire_at')
                .setDescription('Set expire date use format YYYY-MM-DD HH-MM-SS (example: 2024-07-16 23:00:00)')

        ),


    async execute(interaction,sellixapi) {
        const dateregex = /[0-9]{4}-[0-9]{2}-[0-9]{2}\s[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?/i;
        const code = interaction.options.getString('code')
        const discount_type = interaction.options.getString('discount_type')
        const discount_amount = interaction.options.getNumber('discount_amount')
        const max_uses = interaction.options.getInteger('max_uses')
        const expire = interaction.options.getString('expire_at')
        var expireunix
        let products_bound = []
        if(expire == null) {
            expireunix = 0
        } else {
            if (!dateregex.test(expire)){
                await interaction.reply({ content: '❌ Your date and time have an invalid format, remember YYYY-MM-DD HH:MM:SS', ephemeral: true})
            
            } else {
                expireunix = Date.parse(expire)
            }

            
        }


        if (max_uses != null && Math.sign(max_uses) != 1 ) return await interaction.reply({ content: '❌ Max Uses must be a **positive integer**', ephemeral: true})
        


        const forprodu = await request(`https://dev.sellix.io/v1/products`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            }
        })
        const productsobject = {}
        const responseprod = await forprodu.body.json()
        if (responseprod.status != 200) return console.error("CANT GET API KEY, CHECK API KEY")
        const products = responseprod.data.products
        
        

        products.forEach((item, i) => {
            productsobject[item.title] = item.uniqid
        })
        let choices = []
        
        for (const key in productsobject) {
            const choice = {
                label: key,
                value: productsobject[key]
            }
            choices.push(choice)
        }
        choices.push({ label: 'All Products', value: 'allp'})
       
        
      

        const selectbounds = new StringSelectMenuBuilder()
            .setCustomId('prodbounds')
            .setPlaceholder('Choose the products you want the coupon to work for')
            .addOptions(choices)
            .setMaxValues(choices.length)


        const row = new ActionRowBuilder()
            .addComponents(selectbounds)

        await interaction.reply({
            content: 'Choose which products!',
            components: [row],
            ephemeral: true
        })
        const collectorFilter = interaction.channel.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 3_600_000 });

        collectorFilter.on('collect', async i => {
            await i.update({ content: '� Creating coupon', components:[]});
            products_bound = i.values

            if (products_bound.includes('allp')) {
                products_bound = []
            }


            const forthereq = await request(`https://dev.sellix.io/v1/coupons`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${sellixapi}`
                
                },
                body: JSON.stringify({
                    "code": code,
                    "discount_value": discount_amount,
                    "discount_type": discount_type,
                    "products_bound": products_bound,
                    "max_uses": max_uses,
                    "expire_at": expireunix
                })
            })
    
            const response = await forthereq.body.json()
    
    
            if (response.status == 200) {
                await interaction.followUp({ content: `✅ Created coupon **${code}**, with UID **${response.data.uniqid}** successfully`, ephemeral: true})
            } else if(response.status == 400) {
                await interaction.followUp({ content: `❌ Something failed, error: **${response.error}**`,ephemeral: true})
            } else {
                await interaction.followUp({ content: `❌ Something failed, check API key or contact developer!`,ephemeral: true})
            }
        });

        collectorFilter.on('end', async collected => {
            if (collected.size === 0) {
                interaction.followUp({ content: '❌ No selection was made.', ephemeral: true });
            }
        });
      

        
        
    },


};