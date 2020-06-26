import arg from 'arg';
import inquirer from 'inquirer';
import { generate } from './main.js';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--yes': Boolean,
            '--install': Boolean,
            '--format': String,
            '--oasVersion': Number,
            '--entities': String,
            '-y': '--yes',
            '-f': '--format',
            '-ov': '--oasVersion',
            '-e': '--entities',
            '-i': '--install'
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        skipPrompts: args['--yes'] || false,
        name: args._[0],
        format: args['--format'],
        entities: args['--entities'],
        oasVersion: args['--oasVersion'],
        runInstall: args['--install'] || false,
    }
}

async function promptForMissingOptions(options) {
    const defaultFormat = 'yaml';
    const defaultOASVersion = 3;

    if (options.skipPrompts) {
        return {
            ...options,
            format: options.format || defaultFormat,
            oasVersion: options.defaultOASVersion || defaultOASVersion
        };
    }

    const questions = [];
    if (!options.name) {
        questions.push({
            type: 'input',
            name: 'name',
            message: 'Please provide the name of your API',
        });
    }
    if (!options.format) {
        questions.push({
            type: 'list',
            name: 'format',
            message: 'Please choose which syntax you want to use',
            choices: ['json', 'yaml'],
            default: defaultFormat,
        });
    }
    if (!options.oasVersion) {
        questions.push({
            type: 'list',
            name: 'oasVersion',
            message: 'Please choose the version of the Open API specification',
            choices: [ 
                ('v3 (Open API specification)', 3),
                ('v2 (former swagger)', 2),
            ],
            default: defaultOASVersion,
            
        });
    }
    if (!options.name) {
        questions.push({
            type: 'input',
            name: 'entities',
            message: 'Add a comma seperated list of entities',
        });
    }

    const answers = await inquirer.prompt(questions);
    return {
        ...options,
        format: options.format || answers.format,
        oasVersion: options.oasVersion || answers.oasVersion,
        name: options.name || answers.name,
        entities: options.entities || answers.entities,
    }
}

export async function cli(args) {
    let options = parseArgumentsIntoOptions(args);
    options = await promptForMissingOptions(options);
    console.log(options);
    await generate(options);
}