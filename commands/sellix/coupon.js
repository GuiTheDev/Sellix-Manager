const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { request } = require('undici');
const { sellixapi } = require('../../config.json');
const product = require('./product');




module.exports = {
    
    
    data: new SlashCommandBuilder()
        .setName('coupon')
        .setDescription('Get Coupon Info')
        .addStringOption(option => 
            option.setName('uid')
                .setDescription('The coupon UniqueID')
                .setRequired(true)
                .setAutocomplete(true)
        ),

        

    async autocomplete(interaction, client) {
        const focusedvalue = interaction.options.getFocused();

        const forthereq = await request(`https://dev.sellix.io/v1/coupons`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            }
        })
        const couponsobject = {}
        const response = await forthereq.body.json()
        if (response.status != 200) return console.error("CANT GET API KEY, CHECK API KEY")
        const coupons = response.data.coupons
        
        coupons.forEach((item, i) => {
            couponsobject[item.code] = item.uniqid
        })
        let choices = []
        
        for (const key in couponsobject) {
            const choice = {
                name: key,
                value: couponsobject[key]
            }
            choices.push(choice)
        }
       
        
        await interaction.respond(
            choices.map((choice => ({name: choice.name, value: choice.value})))
        )
    },

    async execute(interaction) {
        const uniqueid = interaction.options.getString('uid')
        




        const forthereq = await request(`https://dev.sellix.io/v1/coupons/${uniqueid}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${sellixapi}`
            
            },
        })
        const general = await forthereq.body.json()
        const alldata = general.data
        const coupon = alldata.coupon
        let couponarray = []
        
        if (general.status == 200) {
            let maxuses = coupon.max_uses
            coupon.products_bound_extended.forEach((prodinbound, p) =>{
                couponarray.push(prodinbound.title)
            })

            if (coupon.max_uses == -1) {
                maxuses = '∞'
            }
            if(couponarray.length <= 0) {
                couponarray = 'All products'
            }

            var timestamp_created = coupon.created_at
            var date = new Date(timestamp_created * 1000);
            const responseEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(coupon.code)
                .setDescription(coupon.coupon_type)
                .setURL('https://dashboard.sellix.io/coupons')
                .setFooter({ text: 'Sellix Bot', iconURL: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/5f038a919ab82900015059fc/0x0.png'})
                .addFields(
                    { name: 'Coupon UID', value: coupon.uniqid.toString()},
                    { name: '💰  Discount', value: coupon.discount.toString() + '$'},
                    { name: 'Products bound', value: couponarray.toString()},
                    { name: 'Used', value: coupon.used.toString()},
                    { name: 'Max uses', value: maxuses.toString()},
                    { name: '🕒  Created at', value: date.toDateString()}

                )
            
            await interaction.reply({ embeds:[responseEmbed] , ephemeral: true})
        } else {
            await interaction.reply({ content: `Something failed, check api key, uniqueid or contact bot developer!, error ${general.error}`,ephemeral: true})
        }
        
    },
};