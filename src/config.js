const env = require('dotenv');
const { default: consola } = require('./consola');
const result = env.config();

if (result.error) {
    getInstalledPathSync = require('get-installed-path');
    isInstalled = require('is-installed');    
    let installpath = isInstalled.sync('@eriklenaerts/openapi-docgen') ? getInstalledPathSync('@eriklenaerts/openapi-docgen') : process.cwd();
    consola.error('Missing environment file. Be sure that there\'s an \'.env\' file here ' + installpath);
    process.exit();
}

const { parsed: envs } = result;
module.exports = {
    templateProvider: process.env.TEMPLATE_PROVIDER || 'FileSystem',
    templateBaseLocation: process.env.TEMPLATES_BASE_LOCATION || '../templates',
    defaultTemplate : process.env.DEFAULT_TEMPLATE || 'default.hbs', 
    defaultTargetLocation : process.env.DEFAULT_TARGET_LOCATION || process.cwd(),
    uniqueTarget : process.env.UNIQUE_TARGET ? (process.env.UNIQUE_TARGET.trim() == 'true') : false, 
};

