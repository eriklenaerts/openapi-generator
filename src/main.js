import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import handlebarsHelpers from 'handlebars-helpers';
import shortid from 'shortid'
import api from './api';
import consola from './consola';
import template from './template';
import config from './config'

async function compileTemplate(template, templateData, outputPath) {
    // load handlebar helper functions that extend the capabilities
    handlebarsHelpers.math({ handlebars: handlebars });
    handlebarsHelpers.string({ handlebars: handlebars });

    handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
        return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    handlebars.registerHelper('ifGT', function (arg1, arg2, options) {
        return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
    });

    handlebars.registerHelper('ifNotEquals', function (arg1, arg2, options) {
        return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
    });

    var hbTemplate = handlebars.compile(template);
    consola.trace('- Template succesfully compiled');

    var resultData = hbTemplate(templateData);
    consola.trace('- Cooking the OpenAPI document by merging the Parsed API info with the template');

    fs.writeFile(outputPath, resultData, err => {
        if (err)
            consola.error('Error saving generated data.');

        process.exit(1);
    });

    consola.trace('- OpenAPI document saved (FileSystem)');
}

async function getTemplate(options) {
    let t = new template(options.template);
    let content = await t.getTemplate();
    return content;
}

async function getTemplateData(options) {
    let apiData = new api(options);
    return apiData;
}

async function determineOutputPath(options) {
    // convert a ~ path to an absolute path if needed.
    let outputLocation = options.outputLocation.replace(/^~($|\/|\\)/,`${require('os').homedir()}$1`);

    consola.trace('Checking output location');

    try {
        fs.statSync(outputLocation);
    } catch (err) {
        try {
            consola.trace(`- creating output folder ${chalk.blueBright.underline(outputLocation)}`);
            fs.mkdirSync(outputLocation);
        } catch (error) {
            consola.error('Can\'t create output folder\n\t' + error.message);
            process.exit(1);
        }
    }

    try {
        fs.accessSync(outputLocation, fs.constants.W_OK);
    } catch (error) {
        consola.error('Can\'t write to output folder\n\t' + error.message);
        process.exit(1);
    }

    consola.trace('- output folder: ' + chalk.reset.blueBright.underline(outputLocation) + ' looks good.');

    let uniqueFileNamePostfix = options.uniqueOutputFileName ? '_' + shortid.generate() : '';
    if (options.uniqueOutputFileName) 
        consola.trace('- generating a unique output postfix ' + chalk.cyan(uniqueFileNamePostfix));

    let outputPath = path.resolve(outputLocation, options.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '-api-' + options.apiVersion + uniqueFileNamePostfix + '.yaml');

    return outputPath;
}

export async function generate(options) {
    consola.start('Gathering ingredients ...');
    var template = await getTemplate(options);
    var templateData = await getTemplateData(options);
    var outputPath = await determineOutputPath(options);
    consola.done('All ingredients prepared.');

    consola.start('Brewing your OpenAPI document...');
    await compileTemplate(template, templateData, outputPath);
    consola.done(`OpenAPI document ready & served, you can find it here: ${chalk.blueBright.underline(outputPath)}`);

    if (config.noSetupFound)
        consola.newline().tip(`Use '--setup' to prepare a sample configuration file where you can set some defaults, handy if you use this tool often.`)

    return true;
}






