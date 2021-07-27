import arg from 'arg';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { generate } from './main.js';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--yes': Boolean,
            '--format': String,
            '--oasVersion': String,
            '--apiVersion': String,
            '--resources': String,
            '--target': String,
            '--verbose': Boolean,
            '--help': Boolean,
            '-f': '--format',
            '-o': '--oasVersion',
            '-a': '--apiVersion',
            '-r': '--resources',
            '-t': '--target',
            '-v': '--verbose',
            '-h': '--help',
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        name: args._[0],
        format: args['--format'] || 'yaml',
        resources: args['--resources'],
        oasVersion: args['--oasVersion'] || 'v3',
        apiVersion: args['--apiVersion'] || 'v1',
        targetDirectory: args['--target'] || process.cwd(),
        verbose: args['--verbose'] || false,
        help: args['--help'] || false,
    }
}

function showHeader() {
    var pjson = require('../package.json');
    console.log(chalk.whiteBright.bold(`\nOpen API document generator (v${pjson.version})`));
    console.log('------------------------------------');
    console.log('Use this commandline to generate an Open API document (aka a \'swagger\' file) to get you kick started for design and development of a REST API.');
    console.log(chalk.dim.italic('Developed by Erik Lenaerts, 2021. Contact me at erik.lenaerts@line20.be\n'));
}

function showHelp() {
    console.log('Usage: \n\topenapi-docgen <name> [options]');
    console.log('\n<name>\t\t\t\tthe name of your API (You should omit the acronim \'API\' preferable)');
    console.log('\n[OPTIONS)');
    console.log('--format|-f <value>\t\tspecify the format \'json\' or \'yaml\' ' + chalk.dim('(default)'));
    console.log('--oasVersion|-o <value>\t\tthe Open API specification version \'v2\' or \'v3\' ' + chalk.dim('(default)'));
    console.log('--apiVersion|-av <value>\t\tthe version for your API for example \'v1\' '  + chalk.dim('(default)') + ' or 1.2.0');
    console.log('--resources|-r <value>\t\ta comma seperated list of resource names, e.g. \'invoice, product\'');
    console.log('\t\t\t\tFor each resource you can specify the operations you like and a specific tag.\n');
    console.log('\t\t\t\tSelect your operators:');
    console.log('\t\t\t\t----------------------');
    console.log('\t\t\t\tAdd a number between squar brackets after your resource name. This is a calculated binary number based on the following values');
    console.log('\t\t\t\t  2 - GET the resource collection ' + chalk.dim('(default)'));
    console.log('\t\t\t\t  4 - POST to the collection ' + chalk.dim('(default)'));
    console.log('\t\t\t\t  8 - GET one resource ' + chalk.dim('(default)'));
    console.log('\t\t\t\t 16 - HEAD or check if resource exists.');
    console.log('\t\t\t\t 32 - PUT or replace a resource ' + chalk.dim('(default)'));
    console.log('\t\t\t\t 64 - PATCH a resource ' + chalk.dim('(default)'));
    console.log('\t\t\t\t128 - DELETE a resource ' + chalk.dim('(default)'));
    console.log('\t\t\t\tTake the sum of the numbers for the operations you like and provide this in square brackets with the resource.');
    console.log('\t\t\t\tFor example \'location[96]\' will generate a PUT and PATCH operation only.\n');
    console.log('\t\t\t\tSpecify a tag:');
    console.log('\t\t\t\t--------------');
    console.log('\t\t\t\tFor example \'location::mytag\' will set the tag of the location operations to \'mytag\'');
    console.log('\t\t\t\tFor example \'location[2]::mytag\' will set the tag to \'mytag\' for only the GET collection operation\n');
    console.log('\t\t\t\tAdd a child resource:');
    console.log('\t\t\t\t---------------------');
    console.log('\t\t\t\tFor example \'location/address\' will add an address resource under a ' + chalk.dim('(minimal)') + ' location resource.');
    console.log('\t\t\t\tFor example \'location, location/address\' will add full location ' + chalk.dim('(with default ops)') + ' resource and then address resource as sub resource of the location resource.');
    console.log('\t\t\t\tFor example \'location/address::mytag\' will set the tag to \'mytag\' for the address sub resource.\n');
    console.log('--target|-t <value>\t\tspecify the target folder for the generated output '  + chalk.dim('(default it uses the current directory).'));
    console.log('--verbose|-v\t\t\tflag to include verbose tracing messages ' + chalk.dim('(default false)'));
    console.log('--help|-h\t\t\tShows this help ');
}

async function promptForMissingOptions(options) {
    options = {
        ...options,
        format: options.format || 'yaml',
        targetDirectory: options.targetDirectory || process.cwd(),
        oasVersion: options.oasVersion || 'v3',
        apiVersion: options.apiVersion || 'v1',
        verbose: options.verbose || false
    }

    if (options.name && options.resources) {
        if (options.verbose)
            console.log('%s No prompts needed here, using the provided commandline arguments and defaults, good job, you managed to master the CLI ...', chalk.yellow.bold('TRACE'));

        return options;
    }

    const questions = [];
    if (options.name) {
        if (options.name.length < 3) {
            console.log(`Seems ${chalk.cyan(options.name)} is rather short, I'd like 3 or more characters much better. Let's try again.`);
            options.name = null;
        }

        let match = (/^(?:[a-zA-Z0-9-])*$/g).exec(options.name);
        if (!match) {
            console.log(`Sorry m8, can't work with name ${chalk.cyan(options.name)}. Not fond of special characters here. Let's try again.`);
            options.name = null;
        }

        console.log(`I need a few more details about ${chalk.cyan(options.name + ' (' + options.apiVersion +')')} to make this magic work. Let's see...\n`);
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

                let match = (/^(?:[a-zA-Z0-9-])*$/g).exec(input);
                if (!match)
                    return `Sorry, I can't work with the name ${chalk.cyan(input)}, special characters throw me off. Please use letters, numbers or hyphens only. Cheers ;)`;

                return true;
            }
        });
    }

    if (!options.format) {
        questions.push({
            type: 'list',
            name: 'format',
            message: 'Select the syntax you want to use:',
            choices: ['json', 'yaml'],
            default: defaultFormat
        });
    }
    if (!options.oasVersion) {
        questions.push({
            type: 'list',
            name: 'oasVersion',
            message: 'Choose an Open API specification version:',
            choices: [
                ('v3 (Open API specification)', 'v3'),
                ('v2 (former swagger)', 'v2'),
            ],
            default: defaultOASVersion

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
                    { name: '[GET] \tList all resources', short: 'List', value: 2, checked: true },
                    { name: '[POST] \tCreate a resource', short: 'Create', value: 4, checked: true },
                    { name: '[GET] \tRead one resource', short: 'Read', value: 8, checked: true },
                    { name: '[HEAD] \tCheck if a resource exist', short: 'Check', value: 16 },
                    { name: '[PUT] \tReplace a resource', short: 'Replace', value: 32, checked: true },
                    { name: '[PATCH] \tUpdate a resource', short: 'Update', value: 64, checked: true },
                    { name: "[DELETE] \tRemove a resource.", short: 'Delete', value: 128, checked: true }]
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
    if (options.verbose) {
        console.log('%s assembed the following resource structure: %s', chalk.yellow.bold('TRACE'), chalk.cyan(answers.resources));
    }

    console.log('\n%s Want to skip prompts next time? Copy and run this command: %s', chalk.blue.bold('TIP'), chalk.cyan('openapi-docgen ' + (options.name || answers.name) + ' -r \'' + answers.resources + (options.verbose ? '\' -v\n' : '\'\n')));

    return {
        ...options,
        format: options.format || answers.format,
        oasVersion: options.oasVersion || answers.oasVersion,
        apiVersion: options.apiVersion || answers.apiVersion,
        name: options.name || answers.name,
        resources: options.resources || answers.resources
    };
}

export async function cli(args) {
    try {
        showHeader();

        let options = parseArgumentsIntoOptions(args);
        if (options.help) {
            showHelp();
            process.exit(1);
        }
        options = await promptForMissingOptions(options);
        await generate(options);
    }
    catch (err) {
        console.error('%s %s', chalk.red.bold('ERROR'), chalk.red.italic(err.message));
        process.exit(1);
    }
}