import pluralize from "pluralize";
import chalk from 'chalk';
import consola from './consola';
import operations from "./operations";
import parameter from "./parameter";
import { defaultOpsModifier } from './config'

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
            let match = (/^(?:(?<parent>[a-zA-Z0-9-\s]+)\/{1}){0,2}(?<resource>[a-zA-Z0-9-\s]+)?(?:\[(?<ops>[2-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-4])\]+)?(?:::(?<tag>[a-zA-Z0-9-]+))?$/g).exec(resourceString);
            if (!match)
                throw new Error(`There\'s something wrong with the format of this (${resourceString}) resource argument`);

            let saveName = match.groups.resource.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

            this.name = pluralize.singular(saveName);
            this.tag = match.groups.tag || match.groups.resource;
            this.collection = pluralize(saveName);
            this.parent = match.groups.parent ? new resource(match.groups.parent) : null;
            this.idParameter = new parameter(pluralize.singular(match.groups.resource), (this.parent != null));
            this.ops = new operations(match.groups.ops || defaultOpsModifier);
            this.collectionPath = this.ops.hasCollectionOps ? this.determinePath(this.parent, this.collection) : null;
            this.resourcePath = this.ops.hasResourceOps ? this.determinePath(this.parent, this.collection, this.idParameter) : null;

            consola.trace(`-- Found ${chalk.cyan(this.name)} resource with ops ${chalk.cyan(this.ops)}`);
        }
    }

    determinePath(parent, collection, idParameter) {
        var path = '/';
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