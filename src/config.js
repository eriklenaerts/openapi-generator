const env = require('dotenv');
const { default: consola } = require('./consola');
env.config();

module.exports = {
    templateProvider: process.env.TEMPLATE_PROVIDER || 'FileSystem',
    templateBaseLocation: process.env.TEMPLATES_BASE_LOCATION || '../templates',
    defaultTemplate: process.env.DEFAULT_TEMPLATE || 'basic.hbs',
    defaultOutputLocation: process.env.DEFAULT_OUTPUT_LOCATION || process.cwd(),
    uniqueOutputFileName: process.env.UNIQUE_OUTPUT_FILENAME ? (process.env.UNIQUE_OUTPUT_FILENAME.trim() == 'true') : false,
    defaultOpsModifier: isNaN(process.env.DEFAULT_OPS) ? 238 : parseInt(process.env.DEFAULT_OPS),
};