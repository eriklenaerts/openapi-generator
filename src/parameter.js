export default class Parameter {
    name;
    key;

    constructor(resourceName, hasParent) {
        const camelCaseName = resourceName.replace(/\W+(.)/g, (_, chr) => chr.toUpperCase());
        this.name = `${camelCaseName}IdParam`;
        this.key = hasParent ? `${camelCaseName}Id` : 'id';
    }

    toString() {
        return this.name;
    }
}
