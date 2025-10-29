import chalk from 'chalk';
import dotenv from 'dotenv';
import consola from './consola.js';
import axios from 'axios';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

dotenv.config();

// Named exports
export const templateProvider = process.env.TEMPLATE_PROVIDER ?? 'FileSystem';
export const templateBaseLocation = process.env.TEMPLATES_BASE_LOCATION ?? '../templates';
export const defaultTemplate = process.env.DEFAULT_TEMPLATE ?? 'basic.hbs';
export const defaultOutputLocation = process.env.DEFAULT_OUTPUT_LOCATION ?? process.cwd();
export const uniqueOutputFileName = process.env.UNIQUE_OUTPUT_FILENAME?.trim() === 'true';
export const defaultOpsModifier = Number.isNaN(Number(process.env.DEFAULT_OPS_MODIFIER))
    ? 235
    : Number(process.env.DEFAULT_OPS_MODIFIER);
export const noSetupFound = !(
    process.env.TEMPLATE_PROVIDER ||
    process.env.TEMPLATES_BASE_LOCATION ||
    process.env.DEFAULT_TEMPLATE ||
    process.env.DEFAULT_OUTPUT_LOCATION ||
    process.env.UNIQUE_OUTPUT_FILENAME ||
    process.env.DEFAULT_OPS_MODIFIER
);

// Default export (optional)
export default {
    templateProvider,
    templateBaseLocation,
    defaultTemplate,
    defaultOutputLocation,
    uniqueOutputFileName,
    defaultOpsModifier,
    noSetupFound,
    setup,
};

async function setup() {
    consola.trace('Retrieving sample config file.');
    const configContent = await downloadConfig('https://raw.githubusercontent.com/eriklenaerts/openapi-generator/master/.env.example');
    const configFileLocation = await saveConfig(configContent);
    consola.done(`Prepared a configuration file for you here ${chalk.blueBright.underline(configFileLocation)}`);
    consola.tab().log('Feel free to have a peek or change some settings');
}

async function downloadConfig(fileLocation) {
    consola.trace(`- Downloading config from ${chalk.blueBright.underline(fileLocation)}`);
    try {
        const response = await axios({
            url: fileLocation,
            timeout: 8000,
            headers: {
                'Content-Type': 'text/plain',
            },
        });

        if (response.status === 200) {
            consola.trace(`- Finished download, retrieved ${response.data.length} bytes.`);
        }

        return response.data;
    } catch (error) {
        throw new Error(`Error downloading config from ${fileLocation}: ${error.message}`);
    }
}

async function saveConfig(content) {
    const outputPath = join(process.cwd(), '.env');
    consola.trace(`- Config file will be saved here ${chalk.blueBright.underline(outputPath)}`);
    try {
        writeFileSync(outputPath, content);
        consola.trace('- Saved config file');
        return outputPath;
    } catch (err) {
        throw new Error(`Error saving config file: ${err.message}`);
    }
}
