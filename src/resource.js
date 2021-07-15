import pluralize from "pluralize";

export default class resource {
    parent;
    name;
    collection;
    idParameter;
    tag;
    ops;
    collectionPath;
    resourcePath;

    constructor(resourceString) {
        if (resourceString) {
            this.name = this.parseName(resourceString);
            this.tag = this.parseTag(resourceString);
            this.collection = this.parseCollection(resourceString);
            this.parent = this.parseParent(resourceString);
            this.idParameter = this.name + 'Id';
            this.ops = this.parseOps(resourceString);
            this.collectionPath = this.ops.hasCollectionOps ? this.determinePath(this.parent, this.collection) : null;
            this.resourcePath = this.ops.hasresourceOps ? this.determinePath(this.parent, this.collection, this.idParameter) : null;
        }
    }

    determinePath(parent, collection, idParameter) {
        var path = '/';
        if (parent)
            path = parent.resourcePath + '/';

        path += collection;

        if (idParameter)
            path += '/{' + idParameter + '}';

        return path;

    }

    parseCollection(resourceString) {
        return pluralize(this.parseName(resourceString));
    }

    parseName(resourceString) {
        //strip a specific tag
        if (resourceString && resourceString.includes("::"))
            resourceString = resourceString.split("::")[0].trim();

        //strip specific ops
        if (resourceString && resourceString.includes("["))
            resourceString = resourceString.split("[")[0].trim();

        // strip a specific parent
        if (resourceString && resourceString.includes("/"))
            return resourceString.split("/")[1].trim();

        return resourceString;
    }

    parseParent(resourceString) {
        var resourceName = this.parseName(resourceString);

        // strip a specific parent
        if (resourceString && resourceString.includes("/"))
            return new resource(resourceString.replace('/' + resourceName, ''));

        return null;
    }

    parseOps(resourceString) {
        if (resourceString && resourceString.includes("[")) {
            var opsParam = parseInt(resourceString.match(/\d+/g).map(Number)[0]);
            var ops = {
                "list": (opsParam & 2) == 2,
                "post": (opsParam & 4) == 4,
                "get": (opsParam & 8) == 8,
                "head": (opsParam & 16) == 16,
                "put": (opsParam & 32) == 32,
                "patch": (opsParam & 64) == 64,
                "delete": (opsParam & 128) == 128,
                "hasCollectionOps": ((opsParam & 2) == 2) || ((opsParam & 4) == 4),
                "hasresourceOps": (opsParam & 8) == 8 || (opsParam & 16) == 16 || (opsParam & 32) == 32 || (opsParam & 64) == 64 || (opsParam & 128) == 128
            };

            return ops;
        }

        return {
            "list": true,
            "post": true,
            "get": true,
            "head": true,
            "put": true,
            "patch": true,
            "delete": true,
            "hasCollectionOps": true,
            "hasresourceOps": true
        };
    }

    parseTag(resourceString) {
        // either it has a specific tag
        if (resourceString && resourceString.includes("::"))
            return resourceString.split("::")[1].trim();

        // or we use the resource name instead for a tag
        return this.parseName(resourceString);
    }
}