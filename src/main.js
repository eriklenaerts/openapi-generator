import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import pluralize from 'pluralize';

async function compileTemplate(templatePath, templateData, targetPath, options) {
    // read the file and use the callback to render
    fs.readFile(templatePath, function (err, data) {
        if (!err) {
            // call the render function
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

    console.log(options);

    // Get the entities who are provided and separated by a ','
    var entities;
    var templateData;
    
    if (options.entities !== '') {
        entities = options.entities.toString().split(',');

        templateData = {
            apiName: options.name,
            entity: []
        };

        entities.map(function(entity) {        
            templateData.entity.push({ 
                "name": entity,
                "collection": pluralize(entity)
            });
         })
        
         if (options.verbose)
            console.log('%s found %s %s ', chalk.yellow.bold('TRACE'), entities.length, pluralize('entity', entities.length));    
    }
    else {
        templateData = {
            apiName: options.name
        };

        if (options.verbose)
            console.log('%s found 0 entities ', chalk.yellow.bold('TRACE'));    

    }

    
    return templateData;
}

async function determineTarget(options) {
    var targetDir = options.targetDirectory || process.cwd();

    if (!fs.existsSync(targetDir)){
        fs.mkdirSync(targetDir);
    }

    var targetPath = path.resolve(targetDir, options.name.toLowerCase() + '.' + options.format.toLowerCase());

    if (options.verbose)
        console.log('%s target location: ' + targetPath, chalk.yellow.bold('TRACE'));

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
        console.log('%s template location: ' + templatePath, chalk.yellow.bold('TRACE'));

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






