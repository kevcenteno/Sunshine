const config = require('./config');
const { Client } = require('klasa');
const client = new Client({
    ownerID: config.owner,
    prefix: config.prefix,
    providers: {
        default: 'mongodb',
        mongodb: config.database
    }
});
client.login(config.token);