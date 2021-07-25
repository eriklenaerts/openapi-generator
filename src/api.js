import resource from './resource';
import chalk from 'chalk';

export default class api {
    name;
    urlFriendlyName;
    resources;
    tags;
    version;

    constructor(name, version, resourcesString) {
        if (name) {
            let match = (/^(?:[a-zA-Z0-9-])*$/g).exec(name);
            if (!match)
                throw new Error(`The name (${name}) is invalid, please use small or big letters, numbers or hyphens (-) only.`);
        }

        this.name = name.toLowerCase();
        this.version = version;
        this.urlFriendlyName = name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
        this.resources = this.parseResources(resourcesString);
        this.tags = this.findUniqueTags(this.resources);
    };

    parseResources(resourcesString) {
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
        resources.forEach(res => {
            if(res.parent) {
                if (!resources.find(parentResource => parentResource.name === res.parent)) {
                    // the parent is added under the same tag as the orphan and with only the two GET ops
                    resources.unshift(new resource(res.parent.name + '[10]::' + res.tag));

                    console.log('%s parent %s added for orphant %s child', chalk.yellow.bold('TRACE'), chalk.cyan(res.parent.name), chalk.cyan(res.name));
                }
            }
        })
        return resources;

    }

    findUniqueTags(resources) {
        var taglist = [
            { "name": "system", "collection": ["health checks", "monitoring", "caching"] }
        ];

        resources.forEach(resource => {
            var tag = taglist.find(tag => tag.name.toLowerCase() === resource.tag.toLowerCase());
            if (!tag) {
                taglist.unshift(
                    {
                        "name": resource.tag, 
                        "collection": new Array(resource.collection)
                    }
                );
            }
            else {
                tag.collection.push(resource.collection);
            }
                
        });

        return taglist;
    }
}