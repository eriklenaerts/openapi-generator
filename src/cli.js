import arg from 'arg';
import chalk from 'chalk';
import inquirer from 'inquirer';
import consola from './consola.js';
import { generate } from './main.js';
import config from './config'

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--yes': Boolean,
            '--apiVersion': String,
            '--resources': String,
            '--output': String,
            '--unique': Boolean,
            '--template': String,
            '--verbose': Boolean,
            '--setup': Boolean,
            '--help': Boolean,
            '-a': '--apiVersion',
            '-r': '--resources',
            '-o': '--output',
            '-u': '--unique',
            '-t': '--template',
            '-v': '--verbose',
            '-s': '--setup',
            '-h': '--help'
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        name: args._[0],
        resources: args['--resources'],
        apiVersion: args['--apiVersion'] || 'v1',
        outputLocation: args['--output'] || config.defaultOutputLocation || process.cwd(),
        uniqueOutputFileName: args['--unique'] || config.uniqueOutputFileName || false,
        verbose: args['--verbose'] || false,
        setup: args['--setup'] || false,
        template: args['--template'] || config.defaultTemplate || 'default.hbs',
        help: args['--help'] || false,
    }
}

function showHeader() {
    var pjson = require('../package.json');
    consola.newline().title(`Open API document generator (v${pjson.version})`);
    consola.log('Use this commandline to generate an Open API document (aka a \'swagger\' file) to get you kick started for design and development of a REST API.');
    consola.sub('Developed by Erik Lenaerts, 2021. Contact me at erik.lenaerts@line20.be').newline();
}

function showHelp() {
    consola.subtitle('Usage:');
    consola.log('   openapi-docgen <name> [options]');
    consola.newline().log('<name>\t\t\t\tthe name of your API (You should omit the acronim \'API\' preferable)');
    consola.newline().log('[options)');
    consola.log('--apiVersion|-a <value>\t\tthe version for your API for example \'v1\' ' + chalk.dim('(default)') + ' or 1.2.0');
    consola.log('--resources|-r <value>\t\ta comma seperated list of resource names, e.g. \'invoice, product\'');
    consola.tab(4).log('For each resource you can specify the operations you like and a specific tag.\n');
    consola.tab(4).subtitle('Select your operators:');
    consola.tab(4).log('Add a number between squar brackets after your resource name. This is a calculated binary number based on the following values');
    consola.tab(4).log('  2 - GET the resource collection ' + chalk.dim('(default)'));
    consola.tab(4).log('  4 - POST to the collection ' + chalk.dim('(default)'));
    consola.tab(4).log('  8 - GET one resource ' + chalk.dim('(default)'));
    consola.tab(4).log(' 16 - HEAD or check if resource exists.');
    consola.tab(4).log(' 32 - PUT or replace a resource ' + chalk.dim('(default)'));
    consola.tab(4).log(' 64 - PATCH a resource ' + chalk.dim('(default)'));
    consola.tab(4).log('128 - DELETE a resource ' + chalk.dim('(default)'));
    consola.tab(4).log('Take the sum of the numbers for the operations you like and provide this in square brackets with the resource.');
    consola.tab(4).log('For example \'location[96]\' will generate a PUT and PATCH operation only.\n');
    consola.tab(4).subtitle('Specify a tag:');
    consola.tab(4).log('For example \'location::mytag\' will set the tag of the location operations to \'mytag\'');
    consola.tab(4).log('For example \'location[2]::mytag\' will set the tag to \'mytag\' for only the GET collection operation\n');
    consola.tab(4).subtitle('Add a child resource:');
    consola.tab(4).log('For example \'location/address\' will add an address resource under a ' + chalk.dim('(minimal)') + ' location resource.');
    consola.tab(4).log('For example \'location, location/address\' will add full location ' + chalk.dim('(with default ops)') + ' resource and then address resource as sub resource of the location resource.');
    consola.tab(4).log('For example \'location/address::mytag\' will set the tag to \'mytag\' for the address sub resource.\n');
    consola.log('--template|-t <value>\t\tspecify the template you like to use ' + chalk.dim('(default is \'basic.hbs\'.)'));
    consola.log('--output|-o <value>\t\tspecify the output folder for the generated output ' + chalk.dim('(default it uses the current working directory).'));
    consola.log('--unique|-u\t\t\tflag to request a unique output filename, if not, output files will be overwritten ' + chalk.dim('(default false).'));
    consola.log('--verbose|-v\t\t\tflag to include verbose tracing messages ' + chalk.dim('(default false)'));
    consola.log('--setup|-s\t\t\tflag to perform a setup, basically creating a draft environment configuration file ' + chalk.dim('(default false)'));
    consola.log('--help|-h\t\t\tShows this help ');
    consola.newline().subtitle('Configuration:')
    consola.log('You can configure the following in the \'.env\' file.')
    consola.newline().log('TEMPLATE_PROVIDER\t\tSpecify if you want templates to be served from the file system or online.');
    consola.tab(4).log('Choose between the \'FileSystem\' or \'Online\'')
    consola.log('TEMPLATES_BASE_LOCATION\t\tSet the base location for the given Template Provider.');
    consola.log('DEFAULT_TEMPLATE\t\tOverrides the default template. Note that the --template argument still takes precedence.');
    consola.newline();
}

async function promptForMissingOptions(options) {
    options = {
        ...options,
        outputLocation: options.outputLocation || process.cwd(),
        apiVersion: options.apiVersion || 'v1',
        verbose: options.verbose || false
    }

    if (options.name && options.resources) {
        consola.trace('No prompts needed here, using the provided commandline arguments and defaults, good job, you managed to master the CLI ...', options.verbose);

        return options;
    }

    const questions = [];
    if (options.name) {
        if (options.name.length < 3) {
            consola.warn(`Seems ${chalk.cyan(options.name)} is rather short, I'd like 3 or more characters much better. Let's try again.`);
            options.name = null;
        }

        let match = (/^(?:[a-zA-Z0-9-\s])*$/g).exec(options.name);
        if (!match) {
            consola.warn(`Sorry m8, can't work with name ${chalk.cyan(options.name)}. Not fond of special characters here. Let's try again.`);
            options.name = null;
        }
    }

    if (!options.name) {
        questions.push({
            type: 'input',
            name: 'name',
            message: 'What\'s the name of your API:',
            validate: async (input) => {
                if (input === '')
                    return 'You should give your API a name, it will feel lost without one.';

                if (input.length < 3)
                    return `Seems ${chalk.cyan(input)} is rather short. How about providing 3 or more characters, that could work for me.`;

                let match = (/^(?:[a-zA-Z0-9-\s])*$/g).exec(input);
                if (!match)
                    return `Sorry, I can't work with the name ${chalk.cyan(input)}, special characters throw me off. Please use letters, numbers or hyphens only. Cheers ;)`;

                return true;
            }
        });
    }

    if (!options.resources) {
        questions.push({
            type: 'input',
            name: 'resources',
            message: 'What resources would you like me to generate?' + chalk.reset.white(' (I like a comma saparated list of singular nouns, e.g. \'invoice, customer\'):'),
            validate: async (input) => {
                if (input === '') {
                    return 'An API without any resources seems odd...';
                }

                let match = (/^(?:[a-zA-Z0-9-,\s])*$/g).exec(input);
                if (!match)
                    return `Oh dear, too complex for me, this ${chalk.cyan(input)}. Try to use simple things like letters, numbers or hyphens. Thnx ;)`;

                return true;
            }
        });
    }

    const answers = await inquirer.prompt(questions);

    // prompts based on the given resources
    // ask the tag & operations for each resource
    questions.length = 0;
    const resources = answers.resources.split(',').map(r => r.trim());
    if (resources) {
        resources.forEach(resource => {
            questions.push({
                type: 'checkbox',
                name: resource + 'Ops',
                message: 'Select the operations for ' + chalk.reset.cyan(resource) + ':',
                choices: [
                    { name: '[GET] \tList all resources', short: 'List', value: 2, checked: (config.defaultOpsModifier & 2) == 2 },
                    { name: '[POST] \tCreate a resource', short: 'Create', value: 4, checked: (config.defaultOpsModifier & 4) == 4 },
                    { name: '[GET] \tRead one resource', short: 'Read', value: 8, checked: (config.defaultOpsModifier & 8) == 8 },
                    { name: '[HEAD] \tCheck if a resource exist', short: 'Check', value: 16, checked: (config.defaultOpsModifier & 16) == 16 },
                    { name: '[PUT] \tReplace a resource', short: 'Replace', value: 32, checked: (config.defaultOpsModifier & 32) == 32 },
                    { name: '[PATCH] \tUpdate a resource', short: 'Update', value: 64, checked: (config.defaultOpsModifier & 64) == 64 },
                    { name: "[DELETE] \tRemove a resource.", short: 'Delete', value: 128, checked: (config.defaultOpsModifier & 64) == 64 }]
            });
            questions.push({
                type: 'input',
                name: resource + 'Tag',
                message: 'What tag would you like to use for ' + chalk.reset.cyan(resource) + '?' + chalk.reset.white(' Typically I tag the resource using it\'s own name') + ':',
                default: resource
            });
            questions.push({
                type: 'input',
                name: resource + 'Parent',
                message: 'What parent would you like for ' + chalk.reset.cyan(resource) + '?' + chalk.reset.white(' (Hit enter if you do not need one)') + ':',
                default: null
            });
        });
    }
    const resourceDetails = await inquirer.prompt(questions);

    // assemble the structured resource string (as if it was passed using a cli option by the user)
    answers.resources = '';
    resources.forEach(resource => {
        let ops = resourceDetails[resource + 'Ops'].reduce((a, b) => a + b, 0);
        let parent = resourceDetails[resource + 'Parent'];
        let tag = (resource != resourceDetails[resource + 'Tag']) ? '::' + resourceDetails[resource + 'Tag'] : '';
        answers.resources += (parent) ? parent + '/' : '';
        answers.resources += resource + '[' + ops + ']';
        answers.resources += tag;
        answers.resources += ','
    });
    answers.resources = answers.resources.slice(0, -1);
    consola.newline().trace('assembed the following resource structure: ' + chalk.cyan(answers.resources), options.verbose);
    consola.newline().tip('Want to skip prompts next time? Copy and run this command: ' + chalk.cyan('openapi-docgen ' + consola.quoteSymbol + (options.name || answers.name) + consola.quoteSymbol + ' -r ' + consola.quoteSymbol + answers.resources + consola.quoteSymbol + (options.verbose ? '-v\n' : '\n')));

    return {
        ...options,
        apiVersion: options.apiVersion || answers.apiVersion,
        name: options.name || answers.name,
        resources: options.resources || answers.resources
    };
}

export async function cli(args) {
    try {
        showHeader();

        let options = parseArgumentsIntoOptions(args);
        consola.traceMode = options.verbose

        if (options.setup) {
            await config.setup();
            process.exit(1);
        }

        if (options.help) {
            showHelp();
            process.exit(1);
        }
        options = await promptForMissingOptions(options);
        await generate(options);
    }
    catch (err) {
        consola.error(chalk.red.italic(err.message));
        process.exit(1);
    }
}