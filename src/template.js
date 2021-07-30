import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import consola from './consola';
import { templateProvider, templateBaseLocation } from './config'

const providers = {
    FileSystem: 'FileSystem',
    Online: 'Online'
}

export default class template {
    name;
    oasVersion;
    format;
    provider;
    verbose;

    constructor(options) {
        this.format = options.format;
        this.oasVersion = options.oasVersion;
        this.name = options.template
        this.provider = templateProvider;
        this.verbose = options.verbose;
    }

    async getTemplateFromOnline(templateLocation) {
        const axios = require("axios");
        consola.trace(`- Downloading template from ${chalk.blueBright.underline(templateLocation)}`, this.verbose);

        try {
            let response = await axios({
                url: templateLocation,
                timeout: 8000,
                headers: {
                    'Content-Type': 'text/yaml',
                }
            })
            if (response.status == 200) {
                consola.trace(`- Finished download, retrieved ${response.data.length} bytes.`, this.verbose);
            }

            return response.data;

        } catch (error) {
            throw new Error(`Downloading template from ${templateLocation}\n\t${error}`);
        }
    }

    async getTemplateFromFS(templateLocation) {

        consola.trace(`- Reading template from ${chalk.blueBright.underline(templateLocation)}`, this.verbose);

        try {
            let content = fs.readFileSync(templateLocation).toString();

            consola.trace(`- Finished, retrieved ${content.length} bytes.`, this.verbose);

            return content;
        } catch (error) {
            consola.error(error)
            process.exit(1)
        }
    }

    async getTemplateLocationForFS(templateName, format, oasVersion) {

        try {
            const templateFolder = path.join(
                __dirname,
                templateBaseLocation.trim(),
                format.toLowerCase(),
                oasVersion.toString().toLowerCase()
            );

            const status = fs.statSync(templateFolder);

            var templateLocation = path.normalize(path.join(templateFolder, templateName));

            return templateLocation;
        } catch (error) {
            throw new Error(error.message + '\n\tValidate your configuration in your \'env\' file.');
        }

    }

    async getTemplateLocationForOnline(templateName, format, oasVersion) {
        try {
            const templateLocation = new URL(`${format}/${oasVersion}/${templateName}`, templateBaseLocation.trim());
            return templateLocation.toString();
        } catch (error) {
            throw new Error(error.message + '\n\tValidate your configuration in your \'env\' file.');
        }

    }

    async getTemplate() {
        let template;
        let templateLocation;
        consola.trace(`Retrieving template`, this.verbose);
        consola.trace(`- template ${chalk.cyan(this.name)}`, this.verbose);
        consola.trace(`- template provider ${chalk.cyan(this.provider)} (retrieved from '.env' configuration file)`, this.verbose);

        if (this.provider == providers.FileSystem) {
            templateLocation = await this.getTemplateLocationForFS(this.name, this.format, this.oasVersion);
            template = await this.getTemplateFromFS(templateLocation);
        }

        if (this.provider == providers.Online) {
            templateLocation = await this.getTemplateLocationForOnline(this.name, this.format, this.oasVersion);
            template = await this.getTemplateFromOnline(templateLocation);
        }

        return template;
    }
}