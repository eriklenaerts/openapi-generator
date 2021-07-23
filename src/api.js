import resource from './resource';

export default class api {
    name;
    urlFriendlyName;
    resources;
    tags;

    constructor(name, resourcesString) {
        this.name = name.toLowerCase();
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