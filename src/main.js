import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import handlebarsHelpers from 'handlebars-helpers';
import exit from 'process';
import api from './api';
import consola from './consola';
import template from './template';


async function compileTemplate(template, templateData, targetPath, options) {
    // read the file and use the callback to render
    consola.start('Brewing your OpenAPI document...');

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
    consola.trace('- Template succesfully compiled', options.verbose);

    var resultData = hbTemplate(templateData);
    consola.trace('- Cooking the OpenAPI document by merging the Parsed API info with the template', options.verbose);

    fs.writeFile(targetPath, resultData, err => {
        if (err)
            consola.error('Error saving generated data.');

        process.exit(1);
    });

    consola.trace('- OpenAPI document saved (FileSystem)', options.verbose);
    consola.done(`OpenAPI document ready & served, you can find it here: ${chalk.blueBright.underline(targetPath)}`);
    consola.tip(`Use '-t|--target <target>' to specify a different output location. ${chalk.dim.italic('(Standard it uses the working directory)')}`);
}

async function getTemplate(options) {
    let t = new template(options);
    let content = await t.getTemplate();
    return content;
}


async function getTemplateData(options) {
    let apiData = new api(options);
    return apiData;
}

async function determineTarget(options) {
    var targetLocation = options.targetLocation;

    consola.trace('Checking Target location', options.verbose);

    try {
        fs.statSync(targetLocation);
    } catch (err) {
        try {
            consola.trace(`- creating target folder ${chalk.blueBright.underline(targetLocation)}`, options.verbose);
            fs.mkdirSync(targetLocation);
        } catch (error) {
            consola.error('Can\'t create target folder\n\t' + error.message);
            process.exit(1);
        }
    }

    try {
        fs.accessSync(targetLocation, fs.constants.W_OK);
    } catch (error) {
        consola.error('Can\'t write to target folder\n\t' + error.message);
        process.exit(1);
    }


    consola.trace('- target folder: ' + chalk.reset.blueBright.underline(targetLocation) + ' looks good.', options.verbose);

    var targetPath = path.resolve(targetLocation, options.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '-api' + '.' + options.format.toLowerCase());

    return targetPath;
}

export async function generate(options) {
    consola.start('Gathering ingredients ...');
    var template = await getTemplate(options);
    var templateData = await getTemplateData(options);
    var targetPath = await determineTarget(options);
    consola.done('All ingredients prepared.');

    await compileTemplate(template, templateData, targetPath, options);

    return true;
}






