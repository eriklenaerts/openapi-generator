import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import exit from 'process';
import api from './api';
import consola from './consola';
import template from './template';


async function compileTemplate(template, templateData, targetPath, options) {
    // read the file and use the callback to render
        consola.start('Brewing your API...');

        // load handlebar helper functions that extend the capabilities
        var helpers = require('handlebars-helpers');
        var math = helpers.math({
            handlebars: handlebars
        });
        var strings = helpers.string({
            handlebars: handlebars
        });

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
        consola.trace('Template succesfully interpreted.', options.verbose);

        var resultData = hbTemplate(templateData);
        consola.trace('CLI input merged with the template.', options.verbose);

        fs.writeFile(targetPath, resultData, err => {
            if (err)
                consola.error('Error saving generated data.');
            
            process.exit(1);
        });

        consola.trace('Output stored on disk.', options.verbose);
        consola.done(`OpenAPI file ready & served, you can find it here: ${chalk.blueBright.underline(targetPath)}`);
        consola.tip(`Use '-t|--target <target>' to specify a different output location. ${chalk.dim.italic('(Standard it uses the working directory)')}`);
}

async function getTemplate(options) {
    let t = new template(options);
    let content = await t.getTemplate();
    return content;
}


async function getTemplateData(options) {
    let apiData = new api(options.name, options.apiVersion, options.resources);

    consola.trace(`API data successfuly parsed, found ${apiData.resources.length} resource(s).`, options.verbose);

    return apiData;
}

async function determineTarget(options) {
    var targetDir = options.targetDirectory || process.cwd();

    if (!fs.existsSync(targetDir)) {
        try {
            fs.mkdirSync(targetDir);
        } catch (err) {
            consola.error('Can\'t write to target location ' + chalk.reset.blueBright.underline(targetDir));
            exit(1);
        }
    }

    var targetPath = path.resolve(targetDir, options.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '-api' + '.' + options.format.toLowerCase());

    consola.trace(`Output location (FileSystem): ${chalk.blueBright.underline(targetPath)}`, options.verbose);

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






