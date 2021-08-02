export default class parameter {
    name;
    key;

    constructor(resourceName, hasParent) {
        let camelCaseName = resourceName.replace(/\W+(.)/g, (match, chr) => { return chr.toUpperCase();});
        this.name = camelCaseName + 'IdParam';
        this.key = (hasParent) ? camelCaseName + 'Id' : 'id';
    }

    toString() {
        return this.name;
    }
}