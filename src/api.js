import chalk from 'chalk';
import pluralize from 'pluralize';
import resource from './resource';
import tag from './tag';
import consola from './consola';

export default class api {
    name;
    urlFriendlyName;
    resources;
    tags;
    version;

    constructor(options) {

        consola.trace(`Parsing CLI input for API ${chalk.cyan(options.name + ' (' + options.apiVersion + ')')}`);

        if (options.name) {
            let match = (/^(?:[a-zA-Z0-9-\s])*$/g).exec(options.name);
            if (!match)
                throw new Error(`The name (${options.name}) is invalid, please use small or big letters, numbers or hyphens (-) only.`);
        }
        this.name = options.name.toLowerCase();
        this.version = options.apiVersion;
        this.urlFriendlyName = options.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
        this.resources = this.parseResources(options.resources);
        this.tags = this.findUniqueTags(this.resources);
    };

    parseResources(resourcesString) {
        consola.trace(`- Parsing resources`);
        if (resourcesString) {
            var resourceArray = resourcesString.toString().split(',').map(r => r.trim());
            var resources = [];
            resourceArray.forEach(element => {
                resources.push(new resource(element));
            });
        }

        resources = this.findMissingParents(resources);

        return resources;
    }

    // find missing parents for orphans, that is when a sub resource was asked for like "-r main/sub[14]", without asking for the parent as well like "-r main, main/sub[14]"
    findMissingParents(resources) {
        let missingParents = [];
        resources.forEach(res => {
            if (res.parent) {
                if (!resources.find(parentResource => parentResource.name === res.parent.name)) {
                    // the parent is added under the same tag as the orphan and with only the two GET ops
                    missingParents.push(new resource(res.parent.name + '[10]::' + res.tag));
                    consola.trace(`parent ${chalk.cyan(res.parent.name)} added for orphant ${chalk.cyan(res.name)} child`);
                }
            }
        })

        if (missingParents && missingParents.length > 0) {
            resources = [].concat(missingParents, resources);
            consola.trace(`- Added ${missingParents.length} missing ${pluralize('parent', missingParents.length)} ${chalk.cyan(missingParents.join(', '))}`);
        }

        return resources;

    }

    findUniqueTags(resources) {
        var taglist = [ new tag('system', ['health checks', 'monitoring', 'caching'])];

        resources.forEach(resource => {
            var t = taglist.find(t => t.name.toLowerCase() === resource.tag.toLowerCase());
            if (!t) {
                taglist.unshift(new tag(resource.tag, new Array(resource.collection)))
            }
            else {
                t.usedInCollection.push(resource.collection);
            }

        });

        consola.trace(`- Found ${taglist.length} unique ${pluralize('tag', taglist.length)} ${chalk.cyan(taglist.join(', '))}`);

        return taglist;
    }
}