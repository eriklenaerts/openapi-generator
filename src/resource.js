import pluralize from "pluralize";
import chalk from 'chalk';
import consola from './consola';
import operations from "./operations";

export default class resource {
    parent;
    name;
    collection;
    idParameter;
    tag;
    ops;
    collectionPath;
    resourcePath;
    verbose

    constructor(resourceString, verbose) {
        if (resourceString) {
            // test this regex here: https://regex101.com/r/ZLQZGW/1
            let match = (/^(?:(?<parent>[a-zA-Z0-9-]+)\/{1}){0,2}(?<resource>[a-zA-Z0-9-]+)?(?:\[(?<ops>[2-9]|[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-4])\]+)?(?:::(?<tag>[a-zA-Z0-9-]+))?$/g).exec(resourceString);
            if (!match)
                throw new Error(`There\'s something wrong with the format of this (${resourceString}) resource argument`);

            this.verbose = verbose
            this.name = match.groups.resource;
            this.tag = match.groups.tag || match.groups.resource;
            this.collection = pluralize(match.groups.resource);
            this.parent = match.groups.parent ? new resource(match.groups.parent) : null;
            this.idParameter = this.name + 'Id';
            this.ops = new operations(match.groups.ops, this.verbose);
            this.collectionPath = this.ops.hasCollectionOps ? this.determinePath(this.parent, this.collection) : null;
            this.resourcePath = this.ops.hasResourceOps ? this.determinePath(this.parent, this.collection, this.idParameter) : null;

            consola.trace(`-- Found ${chalk.cyan(this.name)} resource with ops ${chalk.cyan(this.ops)}`, this.verbose);
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

    toString() {
        return this.name;
    }
}