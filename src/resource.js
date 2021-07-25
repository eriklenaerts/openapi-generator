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
            // test this regex here: https://regex101.com/r/ZLQZGW/1
            let match = (/^(?:(?<parent>[a-zA-Z0-9-]+)\/{1}){0,2}(?<resource>[a-zA-Z0-9-]+)?(?:\[(?<ops>[2-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-4])\]+)?(?:::(?<tag>[a-zA-Z0-9-]+))?$/g).exec(resourceString);
            if (!match)
                throw new Error(`There\'s something wrong with the format of this (${resourceString}) resource argument`);

            this.name = match.groups.resource;
            this.tag = match.groups.tag || match.groups.resource ;
            this.collection = pluralize(match.groups.resource);
            this.parent = match.groups.parent ? new resource(match.groups.parent) : null;
            this.idParameter = this.name + 'Id';
            this.ops = this.parseOps(match.groups.ops);
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

    parseOps(opsModifier) {
        if (opsModifier) {
            if (opsModifier < 2 || opsModifier > 254)
                throw new Error(`Incorrect numeric value for operations modifier (... [${opsModifier}] ...). Use a numeric value between 2 and 254`);
            var ops = {
                "list": (opsModifier & 2) == 2,
                "post": (opsModifier & 4) == 4,
                "get": (opsModifier & 8) == 8,
                "head": (opsModifier & 16) == 16,
                "put": (opsModifier & 32) == 32,
                "patch": (opsModifier & 64) == 64,
                "delete": (opsModifier & 128) == 128,
                "hasCollectionOps": ((opsModifier & 2) == 2) || ((opsModifier & 4) == 4),
                "hasresourceOps": (opsModifier & 8) == 8 || (opsModifier & 16) == 16 || (opsModifier & 32) == 32 || (opsModifier & 64) == 64 || (opsModifier & 128) == 128
            };

            return ops;
        }

        return {
            "list": true,
            "post": true,
            "get": true,
            "head": false,
            "put": true,
            "patch": true,
            "delete": true,
            "hasCollectionOps": true,
            "hasresourceOps": true
        };
    }
}