import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import api from './api';

async function compileTemplate(templatePath, templateData, targetPath, options) {
    // read the file and use the callback to render
    fs.readFile(templatePath, function (err, data) {
        if (!err) {
            // call the render function
            var helpers = require('handlebars-helpers');
            var math = helpers.math({
                handlebars: handlebars
            });
            var strings = helpers.string({
                handlebars: handlebars
            });

            handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
                return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
            });

            handlebars.registerHelper('ifNotEquals', function(arg1, arg2, options) {
                return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
            });

            var template = handlebars.compile(data.toString());

            var resultData = template(templateData);

            fs.writeFile(targetPath, resultData, function (err) {
                if (err)
                    return console.error('%s Error saving generated data.', chalk.red.bold('ERROR'));
                process.exit(1);
            });
        } else {
            // handle file read error
            console.error('%s Error reading template', chalk.red.bold('ERROR'));
            process.exit(1);
        }
    });
}

async function determineTemplateData(options) {
    return new api(options.name, options.resources);
}

async function determineTarget(options) {
    var targetDir = options.targetDirectory || process.cwd();

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
    }

    var targetPath = path.resolve(targetDir, options.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '-api' + '.' + options.format.toLowerCase());

    if (options.verbose)
        console.log('%s target location: %s', chalk.yellow.bold('TRACE'), chalk.bold(targetPath));

    return targetPath;
}

async function determineTemplate(options) {
    // todo: get templates from a common location (e.g. github)
    // or the template location can be specified as cli option
    const currenFileUrl = import.meta.url;
    const templateDir = path.resolve(
        new URL(currenFileUrl).pathname,
        '../../templates',
        options.format.toLowerCase(),
        options.oasVersion.toString().toLowerCase()
    );

    var templatePath = path.resolve(templateDir, 'basic.hbs');

    if (options.verbose)
        console.log('%s template location: %s', chalk.yellow.bold('TRACE'), chalk.bold(templatePath));

    return templatePath;
}


export async function generate(options) {

    console.log('%s Preparing templates', chalk.green.bold('DONE'));

    var templatePath = await determineTemplate(options);
    var templateData = await determineTemplateData(options);
    var targetPath = await determineTarget(options);

    console.log('%s Compiling templates using handlebars', chalk.green.bold('DONE'));

    await compileTemplate(templatePath, templateData, targetPath, options);

    console.log('%s OpenAPI files generated', chalk.green.bold('DONE'));

    return true;
}






