import chalk from 'chalk';
import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import handlebars from 'handlebars';
import handlebarsHelpers from 'handlebars-helpers';
import { nanoid } from 'nanoid';
import Api from './api.js';
import consola from './consola.js';
import Template from './template.js';
import config from './config.js';
import { homedir } from 'node:os';

const { writeFile, mkdir, access, constants } = fs;

async function compileTemplate(template, templateData, outputPath) {
  // Load Handlebars helper functions
  handlebarsHelpers.math({ handlebars });
  handlebarsHelpers.string({ handlebars });

  handlebars.registerHelper('ifEquals', (arg1, arg2, options) => {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  });

  handlebars.registerHelper('ifGT', (arg1, arg2, options) => {
    return arg1 > arg2 ? options.fn(this) : options.inverse(this);
  });

  handlebars.registerHelper('ifNotEquals', (arg1, arg2, options) => {
    return arg1 !== arg2 ? options.fn(this) : options.inverse(this);
  });

  const hbTemplate = handlebars.compile(template);
  consola.trace('- Template successfully compiled');

  const resultData = hbTemplate(templateData);
  consola.trace('- Cooking the OpenAPI document by merging the parsed API info with the template');

  try {
    await writeFile(outputPath, resultData);
    consola.trace('- OpenAPI document saved (FileSystem)');
  } catch (err) {
    consola.error(`Error saving generated data: ${err.message}`);
    process.exit(1);
  }
}

async function getTemplate(options) {
  const templateInstance = new Template(options.template);
  return templateInstance.getTemplate();
}

async function getTemplateData(options) {
  return {
    api: new Api(options),
    generator: {
      version: options.generatorVersion,
      timestamp: options.generationTimestamp
    }
  };
}

async function determineOutputPath(options) {
  // Convert a ~ path to an absolute path if needed
  const outputLocation = options.outputLocation.replace(/^~($|\/|\\)/, `${homedir()}$1`);
  consola.trace('Checking output location');

  try {
    await access(outputLocation, constants.W_OK);
  } catch {
    try {
      consola.trace(`- Creating output folder ${chalk.blueBright.underline(outputLocation)}`);
      await mkdir(outputLocation, { recursive: true });
    } catch (error) {
      consola.error(`Can't create output folder: ${error.message}`);
      process.exit(1);
    }
  }

  consola.trace(`- Output folder: ${chalk.blueBright.underline(outputLocation)} looks good.`);

  const uniqueFileNamePostfix = options.uniqueOutputFileName ? `_${nanoid()}` : '';
  if (options.uniqueOutputFileName) {
    consola.trace(`- Generating a unique output postfix ${chalk.cyan(uniqueFileNamePostfix)}`);
  }

  const fileName = `${options.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}-api-${options.apiVersion}${uniqueFileNamePostfix}.yaml`;
  return resolve(outputLocation, fileName);
}

export async function generate(options) {
  consola.start('Gathering ingredients...');
  const template = await getTemplate(options);
  const templateData = await getTemplateData(options);
  const outputPath = await determineOutputPath(options);
  consola.done('All ingredients prepared.');

  consola.start('Brewing your OpenAPI document...');
  await compileTemplate(template, templateData, outputPath);

  consola.done(`OpenAPI document ready & served, you can find it here: ${chalk.blueBright.underline(outputPath)}`);

  if (config.noSetupFound) {
    consola.newline().tip(`Use '--setup' to prepare a sample configuration file where you can set some defaults. Handy if you use this tool often.`);
  }

  return true;
}
