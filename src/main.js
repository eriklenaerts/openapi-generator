import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import api from './api';
import { version } from 'os';
import { exit } from 'process';

async function compileTemplate(templatePath, templateData, targetPath, options) {
    // read the file and use the callback to render
    fs.readFile(templatePath, function (err, data) {
        if (!err) {
            // load handlebar helper functions that extend the capabilities
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

            handlebars.registerHelper('ifGT', function(arg1, arg2, options) {
                return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
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
    let apiData = new api(options.name, options.apiVersion, options.resources);

    if (options.verbose)
        console.log('%s API data successfuly parsed, found %s resources.', chalk.yellow.bold('TRACE'), apiData.resources.length);

    return apiData;
}

async function determineTarget(options) {
    var targetDir = options.targetDirectory || process.cwd();

    if (!fs.existsSync(targetDir)) {
        try {
            fs.mkdirSync(targetDir);
        } catch (err) {
            console.log(chalk.red.bold('ERROR ') + chalk.reset.red('Can\'t write to target location ') + chalk.reset.blueBright.underline(targetDir) + chalk.reset.red(' there\'s something wrong with this path.'));
            exit(1);
        }
    }

    var targetPath = path.resolve(targetDir, options.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() + '-api' + '.' + options.format.toLowerCase());

    if (options.verbose)
        console.log('%s target location: %s', chalk.yellow.bold('TRACE'), chalk.blueBright.underline(targetPath));

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
        console.log('%s template retrieved from location: %s', chalk.yellow.bold('TRACE'), chalk.blueBright.underline(templatePath));

    return templatePath;
}


export async function generate(options) {

    console.log('%s Gathering ingredients...', chalk.green.bold('START'));
    var templatePath = await determineTemplate(options);
    var templateData = await determineTemplateData(options);
    var targetPath = await determineTarget(options);

    console.log('%s all ingredients prepared.', chalk.green.bold('DONE'));
    console.log('%s Brewing your API...', chalk.green.bold('START'));

    await compileTemplate(templatePath, templateData, targetPath, options);

    console.log('%s OpenAPI file ready & served, you can find it here: %s', chalk.green.bold('DONE'), chalk.blueBright.underline(targetPath));
    console.log(`${chalk.blue.bold('TIP')} Use '-t|--target <target>' to specify a different output location, ${chalk.dim.italic('(Standard it uses the working directory)')}`);
    return true;
}






