const { ok } = require('assert');
const chalk = require('chalk');
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
    setup,
};

async function setup() {
    consola.trace(`Retrieving sample config file.`);
    const configContent = await downloadConfig('https://raw.githubusercontent.com/eriklenaerts/openapi-generator/master/.env.example');
    const configFileLocation = await saveConfig(configContent)
    consola.done(`Prepared a configuration file for you here ${chalk.blueBright.underline(configFileLocation)}`);
    consola.tab().log('Feel free to have a peek or change some settings')
}

async function downloadConfig(fileLocation) {
    const axios = require("axios");
    consola.trace(`- Downloading config from ${chalk.blueBright.underline(fileLocation)}`);

    try {
        let response = await axios({
            url: fileLocation,
            timeout: 8000,
            headers: {
                'Content-Type': 'text',
            }
        })
        if (response.status == 200) {
            consola.trace(`- Finished download, retrieved ${response.data.length} bytes.`);
        }

        return response.data;

    } catch (error) {
        throw new Error(`downloading config from ${fileLocation}\n\t${error}`);
    }
}

async function saveConfig(content) {
    const fs = require('fs')
    const path = require('path');

    const outputPath = path.join(process.cwd(), '.env');
    consola.trace(`- Config file will be saved here ${chalk.blueBright.underline(outputPath)}`);

    try {
        const data = fs.writeFileSync(outputPath, content)
        consola.trace(`- Saved config file`);
        return outputPath;
    } catch (err) {
        throw err;
    }

}
