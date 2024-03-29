export default class operations {
    hasList = true;
    hasPost = true;
    hasPostAsync = false;
    hasGet = true;
    hasHead = false;
    hasPut = true;
    hasPatch = true;
    hasDelete = true;
    hasCollectionOps = true;
    hasResourceOps = true;

    constructor(opsModifier) {
        this.parseOps(opsModifier);
    }

    parseOps(opsModifier) {
        if (opsModifier) {
            if (opsModifier < 1 || opsModifier > 255)
                throw new Error(`Incorrect numeric value for operations modifier (... [${opsModifier}] ...). Use a numeric value between 2 and 254`);

            this.hasList = (opsModifier & 1) == 1;
            this.hasPost = (opsModifier & 2) == 2;
            this.hasPostAsync = (opsModifier & 4) == 4;

            if (this.hasPost && this.hasPostAsync)
                throw new Error(`Choose either a synchronous (post) or asynchronous (postAsync) operation for this resource, not both.`);


            this.hasGet = (opsModifier & 8) == 8;
            this.hasHead = (opsModifier & 16) == 16;
            this.hasPut = (opsModifier & 32) == 32;
            this.hasPatch = (opsModifier & 64) == 64;
            this.hasDelete = (opsModifier & 128) == 128;
            this.hasCollectionOps = ((opsModifier & 1) == 1) || ((opsModifier & 2) == 2) || ((opsModifier & 4) == 4);
            this.hasResourceOps = (opsModifier & 8) == 8 || (opsModifier & 16) == 16 || (opsModifier & 32) == 32 || (opsModifier & 64) == 64 || (opsModifier & 128) == 128;
        }
    }

    toJSON() {
        return this;
    }

    toString() {
        let opsArray = [];
        if (this.hasList) opsArray.push('list');
        if (this.hasPost) opsArray.push('post');
        if (this.hasPostAsync) opsArray.push('post (async)');
        if (this.hasGet) opsArray.push('get');
        if (this.hasHead) opsArray.push('head');
        if (this.hasPut) opsArray.push('put');
        if (this.hasPatch) opsArray.push('patch');
        if (this.hasDelete) opsArray.push('delete');

        return opsArray.join(', ');
    }
}