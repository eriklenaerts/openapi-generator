import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { promisify } from 'util';

const access = promisify(fs.access);

async function compileTemplate(options) {

    options.templatePath = path.resolve(options.templateDirectory, 'oas-document.hbs');
    var dataJson = require('/Users/eriklenaerts/Documents/api-system/generator/data.json');
    console.log(options);

    // read the file and use the callback to render
    fs.readFile(options.templatePath, function (err, data) {
        if (!err) {
            // make the buffer into a string
            var source = data.toString();
            // call the render function
            var template = handlebars.compile(source);
            var outputString = template({
                'api-name': options.name,
                'entity': [{
                    "name": "invoice",
                    "collection": "invoices"
                },
                {
                    "name": "product",
                    "collection": "products"
                }]
            });

            var newFile = 'test/oas-document.yaml';

            if (!fs.existsSync('test')){
                fs.mkdirSync('test');
            }

            fs.writeFile(newFile, outputString, function (err) {
                if (err) 
                    return console.log(err);
                console.log('succes')
            });
        } else {
            // handle file read error
            console.error('%s Error reading template', chalk.red.bold('ERROR'));
            process.exit(1);
        }
    });
}

export async function generate(options) {
    const currenFileUrl = import.meta.url;
    const templateDir = path.resolve(
        new URL(currenFileUrl).pathname,
        '../../templates',
        options.format.toLowerCase()
    );

    try {
        await access(templateDir, fs.constants.R_OK);
    } catch (err) {
        console.error('%s Invalid template location', chalk.red.bold('ERROR'));
        process.exit(1);
    }
    
    options = {
        ...options,
        targetDirectory: options.targetDirectory || process.cwd(),
        templateDirectory: templateDir
    };
    
    console.log('%s Fetching templates', chalk.green.bold('DONE'));

    // todo: get templates from a common location (e.g. github)
    // or the template location can be specified as cli option

    console.log('%s Compiling templates using handlebars', chalk.green.bold('DONE'));

    await compileTemplate(options);

    console.log('%s OpenAPI files generated', chalk.green.bold('DONE'));

    return true;
}






