const CronJob = require('cron').CronJob;
const activities = require('../assets/json/activity.json');
const client = require('../server/client');
const SequelizeProvider = require('../providers/Sequelize');
const { memberTable, vouchesTable } = require('../server/models');

module.exports = async () => {
  // TODO: Set provider in the client file instead of here (not consistently holding data)
  await client.setProvider(new SequelizeProvider(client.database)).catch(error => console.error);
  const clientSync = client.database.sync();
  const vouchesSync = vouchesTable.sync();
  const memberSync = memberTable.sync();
  Promise.all([clientSync, vouchesSync, memberSync]);
  const botUsername = (client.config.env.substring(0, 5).toLowerCase() === 'prod') ? client.config.bot.name : `${client.config.bot.name}DEV`;
  if (client.user.username !== botUsername) {
    // Set the username to nameDEV if still in testing or developement
    console.log(`[READY] Changing bot username from ${client.user.username} to  ${botUsername}`);
    client.user.setUsername(botUsername);
  }
  client.myGuild = client.guilds.get(client.config.server.id) || client.guilds.find(guild => guild.name === client.config.server.name);
  if (!client.myGuild) throw new Error('Guild Not Found');
  const channelNames = [
    'membership',
    'meta',
    'modmail',
    'public',
    'roster',
    'welcome'
  ];
  const roleNames = [
    'admins',
    'mods',
    'members',
    'newbies',
    'all'
  ];
  client.myChannels = {};
  client.myRoles = {};
  channelNames.forEach(async (channelName) => {
    // Look for the channel ID in the settings, then look for it based on ID in config, then look for it by name
    const foundChannel = await client.myGuild.channels.get(client.provider.get('global', `${channelName}`, client.config.server.channels[channelName].id)) || client.myGuild.channels.find(channel => channel.name === client.config.server.channels[channelName].name);
    client.myChannels[channelName] = await foundChannel;
    // console.log(`Setting up channel ${foundChannel.name}`);
  });
  roleNames.forEach(async (roleName) => {
    // Look for role in client settings, then search for it in the guild if fails
    const foundRole = await client.myGuild.roles.get(client.provider.get('global', `${roleName}`, client.config.server.roles[roleName].id)) || client.myGuild.roles.find(role => role.name === client.config.server.roles[roleName].name);
    client.myRoles[roleName] = await foundRole;
    // console.log(`Setting up role ${foundRole.name}`);
  });
  // new CronJob('*/10 * * * * *', async () => {
  //   const readyNewbies = await members.findAll({ where: { vouches: 5 } });
  //   console.log(readyNewbies);
  // }).start();
  client.voucherTarget = client.provider.get('global', 'voucherTarget', '5');
  const firstActivity = activities[Math.floor(Math.random() * activities.length)];
  client.user.setActivity(firstActivity.text, { type: firstActivity.type });
  client.setInterval(() => {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    client.user.setActivity(activity.text, { type: activity.type });
  }, 10 * 60 * 1000);
  await console.log(`[READY] Logged in as ${client.user.tag}! (${client.user.id})`);
};
