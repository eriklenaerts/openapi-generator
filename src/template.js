import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import consola from "./consola";

const providers = {
    FileSystem: 'filesystem',
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
        this.name = 'basic.hbs';
        this.provider = providers.FileSystem;
        this.verbose = options.verbose;
    }

    async getTemplateFromOnline(templateLocation) {
        const axios = require("axios");
        consola.trace(`- Downloading template from ${chalk.blueBright.underline(templateLocation)} (Online)`, this.verbose);

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
            consola.error(error);
        }
    }

    async getTemplateFromFS(templateLocation) {

        consola.trace(`- Reading template from ${chalk.cyan(templateLocation)} (FileSystem)`, this.verbose);

        try {
            let content = fs.readFileSync(templateLocation).toString();
            
            consola.trace(`- Finished, retrieved ${content.length} bytes.`, this.verbose);
            
            return content;
        } catch (error) {
            consola.error(error)
        }
    }

    async getTemplateLocationForFS(templateName, format, oasVersion) {
        const templateFolder = path.join(
            __dirname,
            '../templates',
            format.toLowerCase(),
            oasVersion.toString().toLowerCase()
        );

        var templateLocation = path.normalize(path.join(templateFolder, templateName));

        return templateLocation;
    }

    async getTemplateLocationForOnline(templateName, format, oasVersion) {
        const templateLocation = new URL(`${format}/${oasVersion}/${templateName}`, 'https://raw.githubusercontent.com/eriklenaerts/openapi-generator/master/templates/');
        return templateLocation.toString();
    }

    async getTemplate() {
        let template;
        let templateLocation;
        consola.trace(`Retrieving template`, this.verbose);

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