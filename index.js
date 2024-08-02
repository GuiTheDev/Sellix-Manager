const fs = require('node:fs');
const path = require('node:path');
const Keyv = require('keyv');
const { Client, Collection, Events, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { token } = require('./config.json');

const sellixkey = new Keyv('sqlite://db/db.sqlite', { namespace: 'sellixkey'})
const ephemeral = new Keyv('sqlite://db/db.sqlite', { namespace: 'ephemeral'})
const role = new Keyv('sqlite://db/db.sqlite', { namespace: 'role'})

const client = new Client({intents: [GatewayIntentBits.Guilds]});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {

	if (interaction.isAutocomplete()) {
		const command = client.commands.get(interaction.commandName);
		
	
		if (!command) return console.log('Command was not found');
	
		if (!command.autocomplete)
		  return console.error(
			`No autocomplete handler was found for the ${interaction.commandName} command.`,
		  );

		if (!interaction.member.roles.cache.has(await role.get(interaction.guild.id))) return
		try {
			const sellixapi = await sellixkey.get(interaction.guild.id)
			if (sellixapi == undefined) throw "apinotset"


		  await command.autocomplete(interaction, sellixapi);
		} catch (error) {
			if(error == 'apinotset') {
				const user = interaction.guild.members.cache.get(interaction.member.id)
				user.send("Your api key is not set, please set it using /setapikey on your server")
			} else {
				console.error(error);
			}
			
		  
		}
	  }


	if (!interaction.isChatInputCommand()) return;
	if(!interaction.guild) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}


	if (!interaction.member.roles.cache.has(await role.get(interaction.guild.id)) && command.data.name != 'setrole') {
		await interaction.reply({content: "❌ You do not have permissions to execute this command", ephemeral:true})
		return
	}


	if (command.data.name == 'setrole' && !interaction.member.permissions.has([PermissionsBitField.Flags.Administrator])) {
		await interaction.reply({content: "❌ You do not have permissions to execute this command", ephemeral:true})
		return
	}
	
	
	
	try {
		const sellixapi = await sellixkey.get(interaction.guild.id)
		let embedephemeral = await ephemeral.get(interaction.guild.id)
		if (sellixapi == undefined && command.data.name != 'setapikey') return await interaction.reply({ content: '❌ You have to set your sellix api key first!', ephemeral: true })
		if (embedephemeral == undefined) { embedephemeral = true}
		await command.execute(interaction, sellixapi, sellixkey, embedephemeral, ephemeral, role);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: '❌ There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: '❌ There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready, bot just logged in as ${readyClient.user.tag}`)
})


client.login(token)