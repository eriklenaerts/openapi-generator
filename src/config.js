import { ok } from 'node:assert';
import chalk from 'chalk';
import dotenv from 'dotenv';
import consola from './consola.js';
import axios from 'axios';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config();

export default {
    templateProvider: process.env.TEMPLATE_PROVIDER || 'FileSystem',
    templateBaseLocation: process.env.TEMPLATES_BASE_LOCATION || '../templates',
    defaultTemplate: process.env.DEFAULT_TEMPLATE || 'basic.hbs',
    defaultOutputLocation: process.env.DEFAULT_OUTPUT_LOCATION || process.cwd(),
    uniqueOutputFileName: process.env.UNIQUE_OUTPUT_FILENAME ? (process.env.UNIQUE_OUTPUT_FILENAME.trim() === 'true') : false,
    defaultOpsModifier: isNaN(process.env.DEFAULT_OPS_MODIFIER) ? 235 : parseInt(process.env.DEFAULT_OPS_MODIFIER),
    noSetupFound: !(process.env.TEMPLATE_PROVIDER || process.env.TEMPLATES_BASE_LOCATION || process.env.DEFAULT_TEMPLATE || process.env.DEFAULT_OUTPUT_LOCATION || process.env.UNIQUE_OUTPUT_FILENAME || process.env.DEFAULT_OPS_MODIFIER),
    setup,
};

async function setup() {
    consola.trace(`Retrieving sample config file.`);
    let configContent = await downloadConfig('https://raw.githubusercontent.com/eriklenaerts/openapi-generator/master/.env.example');
    let configFileLocation = await saveConfig(configContent);
    consola.done(`Prepared a configuration file for you here ${chalk.blueBright.underline(configFileLocation)}`);
    consola.tab().log('Feel free to have a peek or change some settings');
}

async function downloadConfig(fileLocation) {
    consola.trace(`- Downloading config from ${chalk.blueBright.underline(fileLocation)}`);
    try {
        let response = await axios({
            url: fileLocation,
            timeout: 8000,
            headers: {
                'Content-Type': 'text',
            }
        });
        if (response.status === 200) {
            consola.trace(`- Finished download, retrieved ${response.data.length} bytes.`);
        }
        return response.data;
    } catch (error) {
        throw new Error(`Error downloading config from ${fileLocation}\n\t${error}`);
    }
}

async function saveConfig(content) {
    let outputPath = path.join(process.cwd(), '.env');
    consola.trace(`- Config file will be saved here ${chalk.blueBright.underline(outputPath)}`);
    try {
        fs.writeFileSync(outputPath, content);
        consola.trace(`- Saved config file`);
        return outputPath;
    } catch (err) {
        throw err;
    }
}
