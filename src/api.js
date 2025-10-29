import chalk from 'chalk';
import pluralize from 'pluralize';
import Resource from './resource.js';
import Tag from './tag.js';
import consola from './consola.js';

export default class Api {
  name;
  urlFriendlyName;
  resources;
  tags;
  version;
  hasAsyncOps;

  constructor(options) {
    consola.trace(`Parsing CLI input for API ${chalk.cyan(`${options.name} (${options.apiVersion})`)}`);
    if (options.name) {
      const match = (/^(?:[a-zA-Z0-9-\s])*$/g).exec(options.name);
      if (!match) {
        throw new Error(`The name (${options.name}) is invalid. Please use letters, numbers, or hyphens (-) only.`);
      }
    }

    this.name = options.name.replace(/\b\sapi$/ig, '');
    this.version = options.apiVersion;
    this.urlFriendlyName = options.name.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
    this.resources = this.parseResources(options.resources);
    this.tags = this.findUniqueTags(this.resources);
    this.hasAsyncOps = this.resources.some(resource => resource.ops.hasPostAsync);
  }

  parseResources(resourcesString) {
    consola.trace('- Parsing resources');
    if (!resourcesString) {
      return [];
    }

    const resourceArray = resourcesString.toString().split(',').map(resource => resource.trim());
    const resources = resourceArray.map(element => {
      const resource = new Resource(element);
      consola.trace(`-- Found ${chalk.cyan(resource.name)} resource with ops ${chalk.cyan(resource.ops)}`);
      return resource;
    });

    return this.findMissingParents(resources);
  }

  findMissingParents(resources) {
    const missingParents = [];
    resources.forEach(resource => {
      if (resource.parent && !resources.some(parentResource => parentResource.name === resource.parent.name)) {
        consola.trace(`-- Discovered missing parent ${chalk.cyan(resource.parent.name)} for ${chalk.cyan(resource.name)}`);
        if (!missingParents.some(missingParent => missingParent.name === resource.parent.name)) {
          missingParents.push(new Resource(`${resource.parent.name}[9]::${resource.tag}`));
        }
      }
    });

    if (missingParents.length > 0) {
      const combinedResources = [...missingParents, ...resources];
      consola.trace(`-- Added ${missingParents.length} missing ${pluralize('parent', missingParents.length)} ${chalk.cyan(missingParents.map(parent => parent.name).join(', '))} ${pluralize('resource', missingParents.length)} with ops ${chalk.cyan('list, get')}`);
      return combinedResources;
    }

    return resources;
  }

  findUniqueTags(resources) {
    const tagList = [new Tag('system', ['health checks', 'monitoring', 'caching'])];

    resources.forEach(resource => {
      const existingTag = tagList.find(tag => tag.name.toLowerCase() === resource.tag.toLowerCase());
      if (!existingTag) {
        tagList.unshift(new Tag(resource.tag, [resource.collection]));
      } else {
        existingTag.usedInCollection.push(resource.collection);
      }
    });

    tagList.sort((tagA, tagB) => tagA.name.localeCompare(tagB.name, undefined, { sensitivity: 'base' }));

    consola.trace(`- Found ${tagList.length} unique ${pluralize('tag', tagList.length)} ${chalk.cyan(tagList.map(tag => tag.name).join(', '))}`);
    return tagList;
  }
}
