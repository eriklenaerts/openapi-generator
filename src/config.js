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
    templateProvider: process.env.TEMPLATE_PROVIDER,
    templateBaseLocation: process.env.TEMPLATES_BASE_LOCATION,
    defaultTemplate : process.env.DEFAULT_TEMPLATE,
    defaultTarget : process.env.DEFAULT_TARGET,
};

