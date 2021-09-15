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
    hasAsyncOps;

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
        this.hasAsyncOps = this.resources.find(r => r.ops.hasPostAsync) !== undefined;
    };

    parseResources(resourcesString) {
        consola.trace(`- Parsing resources`);
        if (resourcesString) {
            let resourceArray = resourcesString.toString().split(',').map(r => r.trim());
            var resources = [];
            resourceArray.forEach(element => {
                const r = new resource(element);
                resources.push(r);
                consola.trace(`-- Found ${chalk.cyan(r.name)} resource with ops ${chalk.cyan(r.ops)}`);
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
                    missingParents.push(new resource(res.parent.name + '[9]::' + res.tag));
                    consola.trace(`-- Discovered missing parent ${chalk.cyan(res.parent.name)} for ${chalk.cyan(res.name)}`);
                }
            }
        })

        if (missingParents && missingParents.length > 0) {
            resources = [].concat(missingParents, resources);
            consola.trace(`-- Added the ${missingParents.length} missing ${pluralize('parent', missingParents.length)} ${chalk.cyan(missingParents.join(', '))} ${pluralize('resource', missingParents.length)} with ops ${chalk.cyan('list, get')}`);
        }

        return resources;

    }

    findUniqueTags(resources) {
        let taglist = [ new tag('system', ['health checks', 'monitoring', 'caching'])];

        resources.forEach(resource => {
            let t = taglist.find(t => t.name.toLowerCase() === resource.tag.toLowerCase());
            if (!t) {
                taglist.unshift(new tag(resource.tag, new Array(resource.collection)))
            }
            else {
                t.usedInCollection.push(resource.collection);
            }

        });

        // re-sort tags
        taglist.sort((a, b) => {
            if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
            if (a.name.toLowerCase() > b.name.toLowerCase()) return 1;
            return 0;
        });

        consola.trace(`- Found ${taglist.length} unique ${pluralize('tag', taglist.length)} ${chalk.cyan(taglist.join(', '))}`);

        return taglist;
    }
}