const fs = require('node:fs');
const path = require('node:path');

const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { request } = require('undici');
const { token, sellixapi, roleID} = require('./config.json');

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
	
		try {
		  await command.autocomplete(interaction);
		} catch (error) {
		  console.error(error);
		}
	  }


	if (!interaction.isChatInputCommand()) return;
	if(!interaction.guild) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	if (!interaction.member.roles.cache.has(roleID)) return await interaction.reply({content: "❌ You do not have permissions to execute this command", ephemeral:true})

	

	try {
		await command.execute(interaction);
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