import pluralize from "pluralize";
import operations from "./operations.js";
import parameter from "./parameter.js";
import { defaultOpsModifier } from './config.js'

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
            let match = (/^(?:(?<parent>[a-zA-Z0-9-\s]+)\/{1}){0,2}(?<resource>[a-zA-Z0-9-\s]+)?(?:\[(?<ops>[1-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])\]+)?(?:::(?<tag>[a-zA-Z0-9-]+))?$/g).exec(resourceString);
            if (!match)
                throw new Error(`There\'s something wrong with the format of this (${resourceString}) resource argument`);

            let saveName = match.groups.resource.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

            this.name = pluralize.singular(saveName);

            //consola.trace(`-- Found ${chalk.cyan(this.name)} resource`);

            this.collection = pluralize(saveName);
            this.parent = match.groups.parent ? new resource(match.groups.parent) : null;
            this.tag = this.determineTag(match.groups.tag, this.name, this.parent)
            this.idParameter = new parameter(pluralize.singular(match.groups.resource), (this.parent != null));
            this.ops = new operations(match.groups.ops || defaultOpsModifier);
            this.collectionPath = this.ops.hasCollectionOps ? this.determinePath(this.parent, this.collection) : null;
            this.resourcePath = this.ops.hasResourceOps ? this.determinePath(this.parent, this.collection, this.idParameter) : null;

            
        }
    }

    determineTag(tag, resourceName, parent ) {
        if (tag)
            return tag;
        
        if (parent)
            return parent.tag

        return resourceName
    }

    determinePath(parent, collection, idParameter) {
        let path = '/';
        if (parent)
            path = parent.resourcePath + '/';

        path += collection;

        if (idParameter)
            path += '/{' + idParameter.key + '}';

        return path;
    }

    toString() {
        return this.name;
    }
}