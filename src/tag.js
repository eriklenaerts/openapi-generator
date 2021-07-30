export default class tag {
    name;
    usedInCollection;

    constructor(name, usedInCollection) {
        this.name = name;
        this.usedInCollection = usedInCollection;
    }

    toString() {
        return this.name;
    }
}