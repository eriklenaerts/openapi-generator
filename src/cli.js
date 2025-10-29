import arg from 'arg';
import chalk from 'chalk';
import inquirer from 'inquirer';
import consola from './consola.js';
import { generate } from './main.js';
import config from './config.js';

const pjson = await import('../package.json', { assert: { type: 'json' } });

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
      '-h': '--help',
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  return {
    name: args._[0],
    resources: args['--resources'],
    apiVersion: args['--apiVersion'] ?? 'v1',
    outputLocation: args['--output'] ?? config.defaultOutputLocation ?? process.cwd(),
    uniqueOutputFileName: args['--unique'] ?? config.uniqueOutputFileName ?? false,
    verbose: args['--verbose'] ?? false,
    setup: args['--setup'] ?? false,
    template: args['--template'] ?? config.defaultTemplate ?? 'default.hbs',
    help: args['--help'] ?? false,
  };
}

function showHeader() {
  consola.newline().title(`Open API document generator (v${pjson.default.version})`);
  consola.log('Use this command line to generate an Open API document (aka a \'swagger\' file) to get you started for designing and developing a REST API.');
  consola.sub('Developed by Erik Lenaerts, 2021. Contact me at erik.lenaerts@line20.be');
  consola.newline().tip(`Start your journey with the command '${chalk.cyan('openapi-docgen --setup')}' to create a setup file with configuration options.`).newline();
}

function showHelp() {
  consola.subtitle('Usage:');
  consola.log('   openapi-docgen <name> [options]');
  consola.newline().log('<name>\t\t\t\tThe name of your API (preferably omit the acronym \'API\')');
  consola.newline().log('[options]');
  consola.log('--apiVersion|-a <value>\tThe version for your API, e.g., \'v1\' ' + chalk.dim('(default)') + ' or 1.2.0');
  consola.log('--resources|-r <value>\tA comma-separated list of resource names, e.g., \'invoice, product\'');
  consola.tab(4).log('For each resource, you can specify the operations and a specific tag.\n');
  consola.tab(4).subtitle('Select your operators:');
  consola.tab(4).log('Add a number between square brackets after your resource name. This is a calculated binary number based on the following values:');
  consola.tab(4).log('  1 - GET the resource collection ' + chalk.dim('(default)'));
  consola.tab(4).log('  2 - POST to the collection ' + chalk.dim('(default)'));
  consola.tab(4).log('  4 - POST (Async) to the collection ' + chalk.dim('(default)'));
  consola.tab(4).log('  8 - GET one resource ' + chalk.dim('(default)'));
  consola.tab(4).log(' 16 - HEAD or check if a resource exists.');
  consola.tab(4).log(' 32 - PUT or replace a resource ' + chalk.dim('(default)'));
  consola.tab(4).log(' 64 - PATCH a resource ' + chalk.dim('(default)'));
  consola.tab(4).log('128 - DELETE a resource ' + chalk.dim('(default)'));
  consola.tab(4).log('Take the sum of the numbers for the operations you want and provide this in square brackets with the resource.');
  consola.tab(4).log('For example, \'location[96]\' will generate PUT and PATCH operations only.\n');
  consola.tab(4).subtitle('Specify a tag:');
  consola.tab(4).log('For example, \'location::mytag\' will set the tag of the location operations to \'mytag\'');
  consola.tab(4).log('For example, \'location[1]::mytag\' will set the tag to \'mytag\' for only the GET collection operation\n');
  consola.tab(4).subtitle('Add a child resource:');
  consola.tab(4).log('For example, \'location/address\' will add an address resource under a ' + chalk.dim('(minimal)') + ' location resource.');
  consola.tab(4).log('For example, \'location, location/address\' will add a full location ' + chalk.dim('(with default ops)') + ' resource and then an address resource as a sub-resource of the location resource.');
  consola.tab(4).log('For example, \'location/address::mytag\' will set the tag to \'mytag\' for the address sub-resource.\n');
  consola.log('--template|-t <value>\tSpecify the template you want to use ' + chalk.dim('(default is \'basic.hbs\').'));
  consola.log('--output|-o <value>\tSpecify the output folder for the generated output ' + chalk.dim('(default is the current working directory).'));
  consola.log('--unique|-u\t\t\tRequest a unique output filename. If not, output files will be overwritten ' + chalk.dim('(default false).'));
  consola.log('--verbose|-v\t\t\tInclude verbose tracing messages ' + chalk.dim('(default false)'));
  consola.log('--setup|-s\t\t\tCreate a draft environment configuration file ' + chalk.dim('(default false)'));
  consola.log('--help|-h\t\t\tShow this help.');
  consola.newline().subtitle('Configuration:');
  consola.log('You can configure the following in the \'.env\' file.');
  consola.newline().log('TEMPLATE_PROVIDER\t\tSpecify if you want templates to be served from the file system or online.');
  consola.tab(4).log('Choose between \'FileSystem\' or \'Online\'');
  consola.log('TEMPLATES_BASE_LOCATION\t\tSet the base location for the given Template Provider.');
  consola.log('DEFAULT_TEMPLATE\t\tOverride the default template. Note that the --template argument still takes precedence.');
  consola.newline();
}

async function promptForMissingOptions(options) {
  const updatedOptions = {
    ...options,
    outputLocation: options.outputLocation ?? process.cwd(),
    apiVersion: options.apiVersion ?? 'v1',
    verbose: options.verbose ?? false,
    generatorVersion: pjson.default.version,
    generationTimestamp: new Date(Date.now()).toUTCString(),
  };

  if (options.name && options.resources) {
    consola.trace('No prompts needed. Using the provided command-line arguments and defaults.', updatedOptions.verbose);
    return updatedOptions;
  }

  const questions = [];

  if (options.name) {
    if (options.name.length < 3) {
      consola.warn(`The name ${chalk.cyan(options.name)} is rather short. Please provide 3 or more characters.`);
      options.name = null;
    }
    const match = (/^(?:[a-zA-Z0-9-\s])*$/g).exec(options.name);
    if (!match) {
      consola.warn(`The name ${chalk.cyan(options.name)} contains invalid characters. Please use letters, numbers, or hyphens only.`);
      options.name = null;
    }
  }

  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'What\'s the name of your API?',
      validate: async (input) => {
        if (!input) return 'Please provide a name for your API.';
        if (input.length < 3) return `The name ${chalk.cyan(input)} is too short. Please provide 3 or more characters.`;
        const match = (/^(?:[a-zA-Z0-9-\s])*$/g).exec(input);
        if (!match) return `The name ${chalk.cyan(input)} contains invalid characters. Please use letters, numbers, or hyphens only.`;
        return true;
      },
    });
  }

  if (!options.resources) {
    questions.push({
      type: 'input',
      name: 'resources',
      message: 'What resources would you like to generate?' + chalk.reset.white(' (e.g., \'invoice, customer\'):'),
      validate: async (input) => {
        if (!input) return 'An API without resources seems odd.';
        const match = (/^(?:[a-zA-Z0-9-,\s])*$/g).exec(input);
        if (!match) return `The input ${chalk.cyan(input)} contains invalid characters. Please use letters, numbers, hyphens, or commas.`;
        return true;
      },
    });
  }

  const answers = await inquirer.prompt(questions);

  // Prompts based on the given resources
  questions.length = 0;
  const resources = answers.resources?.split(',').map(resource => resource.trim());

  if (resources) {
    resources.forEach(resource => {
      questions.push({
        type: 'checkbox',
        name: `${resource}Ops`,
        message: `Select the operations for ${chalk.reset.cyan(resource)}:`,
        choices: [
          { name: '[GET] \tList all resources', short: 'List', value: 1, checked: (config.defaultOpsModifier & 1) === 1 },
          { name: '[POST] \tCreate a resource', short: 'Create', value: 2, checked: (config.defaultOpsModifier & 2) === 2 },
          { name: '[GET] \tRead one resource', short: 'Read', value: 8, checked: (config.defaultOpsModifier & 8) === 8 },
          { name: '[HEAD] \tCheck if a resource exists', short: 'Check', value: 16, checked: (config.defaultOpsModifier & 16) === 16 },
          { name: '[PUT] \tReplace a resource', short: 'Replace', value: 32, checked: (config.defaultOpsModifier & 32) === 32 },
          { name: '[PATCH] \tUpdate a resource', short: 'Update', value: 64, checked: (config.defaultOpsModifier & 64) === 64 },
          { name: '[DELETE] \tRemove a resource', short: 'Delete', value: 128, checked: (config.defaultOpsModifier & 128) === 128 },
        ],
      });

      questions.push({
        type: 'confirm',
        name: `${resource}AsyncCreate`,
        message: `Would you like the creation of ${chalk.reset.cyan(resource)} to be asynchronous? (Useful if it takes a long time to create)`,
        default: false,
        when: (answers) => answers[`${resource}Ops`]?.includes(2),
      });

      questions.push({
        type: 'input',
        name: `${resource}Tag`,
        message: `What tag would you like to use for ${chalk.reset.cyan(resource)}?` + chalk.reset.white(' Typically, the tag is the same as the resource name.') + ':',
        default: resource,
      });

      questions.push({
        type: 'input',
        name: `${resource}Parent`,
        message: `What's the parent resource for ${chalk.reset.cyan(resource)}?` + chalk.reset.white(' (Hit enter if you do not need one)') + ':',
        default: null,
      });
    });
  }

  const resourceDetails = await inquirer.prompt(questions);

  // Assemble the structured resource string
  let resourcesString = '';
  resources?.forEach(resource => {
    let ops = resourceDetails[`${resource}Ops`].reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    if (resourceDetails[`${resource}AsyncCreate`]) ops += 2;
    const parent = resourceDetails[`${resource}Parent`];
    const tag = resource !== resourceDetails[`${resource}Tag`] ? `::${resourceDetails[`${resource}Tag`]}` : '';
    resourcesString += parent ? `${parent}/` : '';
    resourcesString += `${resource}[${ops}]${tag},`;
  });

  resourcesString = resourcesString.slice(0, -1);

  // Assemble the command suggestion
  const commandSuggestion = `openapi-docgen ${consola.quoteSymbol}${options.name || answers.name}${consola.quoteSymbol} -r ${consola.quoteSymbol}${answers.resources || resourcesString}${consola.quoteSymbol}${options.verbose ? ' -v' : ''}${options.template ? ` -t ${consola.quoteSymbol}${options.template}${consola.quoteSymbol}` : ''}`;

  consola.newline().trace(`Assembled the following resource structure: ${chalk.cyan(resourcesString)}`, updatedOptions.verbose);
  consola.newline().tip(`Want to skip prompts next time? Copy and run this command: ${chalk.cyan(commandSuggestion)}`);
  consola.newline();

  return {
    ...options,
    apiVersion: options.apiVersion ?? answers.apiVersion,
    name: options.name ?? answers.name,
    resources: options.resources ?? resourcesString,
  };
}

export async function cli(args) {
  try {
    showHeader();
    const options = parseArgumentsIntoOptions(args);
    consola.traceMode = options.verbose;

    if (options.setup) {
      await config.setup();
      process.exit(0);
    }

    if (options.help) {
      showHelp();
      process.exit(0);
    }

    const updatedOptions = await promptForMissingOptions(options);
    await generate(updatedOptions);
    consola.newline().log(chalk.whiteBright.bold('Enjoy the results, goodbye & have a nice day ;)'));
  } catch (error) {
    consola.error(chalk.red.italic(error.message));
    process.exit(1);
  }
}
