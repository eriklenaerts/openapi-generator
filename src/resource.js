import pluralize from "pluralize";
import Operations from "./operations.js";
import Parameter from "./parameter.js";
import config from './config.js';

export default class Resource {
    parent;
    name;
    collection;
    idParameter;
    tag;
    ops;
    collectionPath;
    resourcePath;

    constructor(resourceString) {
        if (!resourceString) return;

        // Regex explanation: https://regex101.com/r/ZLQZGW/1
        const match = (/^(?:(?<parent>[a-zA-Z0-9-\s]+)\/{1}){0,2}(?<resource>[a-zA-Z0-9-\s]+)?(?:\[(?<ops>[1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\]+)?(?:::(?<tag>[a-zA-Z0-9-]+))?$/g).exec(resourceString);

        if (!match) {
            throw new Error(`Invalid format for resource argument: ${resourceString}`);
        }

        const saveName = match.groups.resource
            .replace(/[^a-z0-9_]+/gi, '-')
            .replace(/^-|-$/g, '')
            .toLowerCase();

        this.name = pluralize.singular(saveName);
        this.collection = pluralize(saveName);
        this.parent = match.groups.parent ? new Resource(match.groups.parent) : null;
        this.tag = this.determineTag(match.groups.tag, this.name, this.parent);
        this.idParameter = new Parameter(pluralize.singular(match.groups.resource), this.parent !== null);
        this.ops = new Operations(match.groups.ops || config.defaultOpsModifier);

        this.collectionPath = this.ops.hasCollectionOps
            ? this.determinePath(this.parent, this.collection)
            : null;

        this.resourcePath = this.ops.hasResourceOps
            ? this.determinePath(this.parent, this.collection, this.idParameter)
            : null;
    }

    determineTag(tag, resourceName, parent) {
        if (tag) return tag;
        if (parent) return parent.tag;
        return resourceName;
    }

    determinePath(parent, collection, idParameter) {
        let path = '/';

        if (parent) {
            path = `${parent.resourcePath}/`;
        }

        path += collection;

        if (idParameter) {
            path += `/{${idParameter.key}}`;
        }

        return path;
    }

    toString() {
        return this.name;
    }
}
