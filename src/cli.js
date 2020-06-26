import arg from 'arg';
import inquirer from 'inquirer';
import { generate } from './main.js';

function parseArgumentsIntoOptions(rawArgs) {
    const args = arg(
        {
            '--yes': Boolean,
            '--format': String,
            '--oasVersion': Number,
            '--entities': String,
            '--target': String,
            '--verbose': Boolean,
            '-y': '--yes',
            '-f': '--format',
            '-ov': '--oasVersion',
            '-e': '--entities',
            '-t': '--target',
            '-v': '--verbose',
        },
        {
            argv: rawArgs.slice(2),
        }
    );
    return {
        skipPrompts: args['--yes'] || false,
        name: args._[0],
        format: args['--format'] || 'yaml',
        entities: args['--entities'],
        oasVersion: args['--oasVersion'],
        targetDirectory: args['--target'] || process.cwd(),
        verbose: args['--verbose'] || false,
    }
}

async function promptForMissingOptions(options) {
    const defaultFormat = 'yaml';
    const defaultOASVersion = 3;
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
            default: defaultFormat,
        });
    }
    if (!options.oasVersion) {
        questions.push({
            type: 'list',
            name: 'oasVersion',
            message: 'Choose an Open API specification version:',
            choices: [ 
                ('v3 (Open API specification)', 3),
                ('v2 (former swagger)', 2),
            ],
            default: defaultOASVersion,
            
        });
    }
    if (!options.entities) {
        questions.push({
            type: 'input',
            name: 'entities',
            message: 'Add a comma seperated list of entities (e.g. \'invoice\'):',
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
    await generate(options);
}