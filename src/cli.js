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
            '--resources': String,
            '--target': String,
            '--verbose': Boolean,
            '--help': Boolean,
            '-y': '--yes',
            '-f': '--format',
            '-o': '--oasVersion',
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
        skipPrompts: args['--yes'] || false,
        name: args._[0],
        format: args['--format'] || 'yaml',
        resources: args['--resources'],
        oasVersion: args['--oasVersion'] || 'v3',
        targetDirectory: args['--target'] || process.cwd(),
        verbose: args['--verbose'] || false,
        help: args['--help'] || false,
    }
}

function showHelp(showHeader) {
    if (showHeader) {
        var pjson = require('../package.json');
        console.log('\nOpen API document generation (v%s)', pjson.version);
        console.log('-------------------------------------');
        console.log('Use this commandline to generate an Open API document to get you kick started for design and development of a REST API.');
    }
    console.log('\nUsage: \n\topenapi-docgen <name> [options]');
    console.log('\n<name>\t\t\t\tthe name of your API (You should omit the acronim \'API\' preferable)');
    console.log('\n[OPTIONS)');
    console.log('--format|-f <value>\t\tspecify the format \'yaml\' (default) or \'json\'');
    console.log('--oasVersion|-o <value>\t\tthe Open API specification version \'v2\' or \'v3\' (default)');
    console.log('--resources|-r <value>\t\ta comma seperated list of resource names, e.g. \'invoice, product\'');
    console.log('\t\t\t\tFor each resource you can specify the operations you like and a specific tag.\n');
    console.log('\t\t\t\tSelect your operators:');
    console.log('\t\t\t\t----------------------');
    console.log('\t\t\t\tAdd a number between squar brackets after your resource name. This is a calculated binary number based on the following values');
    console.log('\t\t\t\t  2 - GET the collection:');
    console.log('\t\t\t\t  4 - POST to the collection:');
    console.log('\t\t\t\t  8 - GET one item:');
    console.log('\t\t\t\t 16 - HEAD one item:');
    console.log('\t\t\t\t 32 - PUT one item:');
    console.log('\t\t\t\t 64 - PATCH one item:');
    console.log('\t\t\t\t128 - DELETE one item:');
    console.log('\t\t\t\tAdd the numbers in front for the operations you like and provide this with the resource.');
    console.log('\t\t\t\tFor example \'location[96]\' will generate a PUT and PATCH operation only.\n');
    console.log('\t\t\t\tSpecify a tag:');
    console.log('\t\t\t\t--------------');
    console.log('\t\t\t\tFor example \'location::mytag\' will set the tag of the location operations to \'mytag\'');
    console.log('\t\t\t\tFor example \'location[2]::mytag\' will set the tag to \'mytag\' for only the GET collection operation\n');
    console.log('\t\t\t\tAdd a child resource:');
    console.log('\t\t\t\t-------------------');
    console.log('\t\t\t\tFor example \'location/address\' will add an address resource as sub resource of the location resource.');
    console.log('\t\t\t\tFor example \'location/address::mytag\' will set the tag to \'mytag\' for both the location as the address sub resource\n');
    console.log('--target|-t <value>\t\tspecify the target folder for the generated output (default it uses the current directory).');
    console.log('--yes|-y\t\t\tthis flag will run the document generator without prompting for questions and use the default values. (default off)');
    console.log('--verbose|-v\t\t\tflag to include verbose tracing messages (default off)');
    console.log('--help\t\t\tShows this help ');
}

async function promptForMissingOptions(options) {
    const defaultFormat = 'yaml';
    const defaultOASVersion = 'v3';
    const defaultVerbose = false;
    const defaultTargetDirectory = process.cwd();

    if (options.skipPrompts) {
        return {
            ...options,
            format: options.format || defaultFormat,
            targetDirectory: options.targetDirectory || defaultTargetDirectory,
            oasVersion: options.oasVersion || defaultOASVersion,
            verbose: options.verbose || defaultVerbose
        };
    }

    if (options.help) {
        showHelp(true);
        process.exit(1);
    }

    const questions = [];
    if (!options.name) {
        questions.push({
            type: 'input',
            name: 'name',
            message: 'What\'s the name of your API:',
            validate: async (input) => {
                if (input === '') {
                    return 'You should give your API a name, it will feel lost without one.';
                }

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
            message: 'Add a comma seperated list of resources (e.g. \'invoice\'):'
        });
    }

    const answers = await inquirer.prompt(questions);
    return {
        ...options,
        format: options.format || answers.format,
        oasVersion: options.oasVersion || answers.oasVersion,
        name: options.name || answers.name,
        resources: options.resources || answers.resources
    };
}

export async function cli(args) {
    try {
        let options = parseArgumentsIntoOptions(args);
        options = await promptForMissingOptions(options);
        await generate(options);
    }
    catch (err) {
        console.error('%s %s', chalk.red.bold('ERROR'), err.message);
        showHelp(false);
        process.exit(1);
    }
}