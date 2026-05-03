const { Client, GatewayIntentBits } = require('discord.js');

// ==========================================
// CONFIGURATION (Put your keys here)
// ==========================================

// 1. Paste your Discord Bot Token inside the quotes below
const DISCORD_TOKEN = "MTUwMDM1MTQzNTQ1ODYxMzI4OA.GBwldf.8oE6XgGS2XerGmFDFyHTMNkdEMJJifCy2xx3_0";

// 2. Paste your Netlify Personal Access Token inside the quotes below
const NETLIFY_TOKEN = "nfp_hwtZrXHQP9iKvEYAbXAkEhgy7UfafPnY769e";

// 3. Paste your Netlify Site ID inside the quotes below
const NETLIFY_SITE_ID = "0d058016-fcd9-4fb6-9af2-f7010eb120e0";

// ==========================================

if (DISCORD_TOKEN === "PASTE_YOUR_DISCORD_TOKEN_HERE") {
    console.error("❌ You forgot to paste your tokens into the code!");
    process.exit(1);
}

// Initialize Discord Client
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

client.on('ready', () => {
    console.log(`✅ Bot is online and logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    // Ignore other bots
    if (message.author.bot) return;

    // Command: !add-domain example.com
    if (message.content.startsWith('!add-domain ')) {
        const targetDomain = message.content.split(' ')[1]?.toLowerCase().replace(/[^a-z0-9.-]/g, '');

        if (!targetDomain) {
            return message.reply('Please provide a valid domain. Example: `!add-domain example.com`');
        }

        const replyMessage = await message.reply(`⏳ Adding \`${targetDomain}\` to Netlify project...`);

        try {
            // 1. Fetch current aliases so we don't overwrite them
            const siteRes = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`, {
                headers: { 'Authorization': `Bearer ${NETLIFY_TOKEN}` }
            });
            
            if (!siteRes.ok) throw new Error('Failed to fetch Netlify site data. Check your Site ID and Netlify Token.');
            const siteData = await siteRes.json();
            
            // 2. Combine old aliases with the new one (using Set to prevent duplicates)
            const currentAliases = siteData.domain_aliases || [];
            const newAliases = [...new Set([...currentAliases, targetDomain])];

            // 3. Send the updated list back to Netlify
            const updateRes = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${NETLIFY_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    domain_aliases: newAliases
                })
            });

            if (!updateRes.ok) throw new Error('Failed to update domain aliases on Netlify.');

            // Success message
            await replyMessage.edit(`✅ Success! \`${targetDomain}\` is now mapped to your Netlify project.\n\n*Note: The domain owner must manually create an A Record pointing to \`75.2.60.5\` in their DNS settings.*`);

        } catch (error) {
            console.error(error);
            await replyMessage.edit(`❌ An error occurred: \`${error.message}\``);
        }
    }
});

client.login(DISCORD_TOKEN);
