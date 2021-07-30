import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import exit from 'process';
import api from './api';
import consola from './consola';

async function compileTemplate(templatePath, templateData, targetPath, options) {
    // read the file and use the callback to render
    fs.readFile(templatePath, function (err, data) {
        if (!err) {
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

            var template = handlebars.compile(data.toString());
            consola.trace('Template succesfully interpreted.', options.verbose);

            var resultData = template(templateData);
            consola.trace('CLI input merged with the template.', options.verbose);

            fs.writeFile(targetPath, resultData, function (err) {
                if (err)
                    consola.error('Error saving generated data.');
                process.exit(1);
            });
            consola.trace('Output stored on disk.', options.verbose);
            consola.done(`OpenAPI file ready & served, you can find it here: ${chalk.blueBright.underline(targetPath)}`);
            consola.tip(`Use '-t|--target <target>' to specify a different output location. ${chalk.dim.italic('(Standard it uses the working directory)')}`);
        } else {
            // handle file read error
            consola.error('Error reading template');
            process.exit(1);
        }
    });
}

async function determineTemplateData(options) {
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

    consola.trace(`target location: ${chalk.blueBright.underline(targetPath)}` ,options.verbose);

    return targetPath;
}

async function determineTemplate(options) {
    // todo: get templates from a common location (e.g. github)
    // or the template location can be specified as cli option

    const templateFolder = path.join(
        __dirname,
        '../templates',
        options.format.toLowerCase(),
        options.oasVersion.toString().toLowerCase()
    );

    var templatePath = path.normalize(path.join(templateFolder, 'basic.hbs'));

    consola.trace(`template location: ${chalk.blueBright.underline(templatePath)}`, options.verbose);

    return templatePath;
}

export async function generate(options) {
    consola.start('Gathering ingredients...');
    var templatePath = await determineTemplate(options);
    var targetPath = await determineTarget(options);
    var templateData = await determineTemplateData(options);
    consola.done('All ingredients prepared.');

    await compileTemplate(templatePath, templateData, targetPath, options);
    
    return true;
}






