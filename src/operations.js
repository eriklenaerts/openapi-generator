export default class Operations {
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
    if (!opsModifier) return;

    if (opsModifier < 1 || opsModifier > 255) {
      throw new Error(`Incorrect numeric value for operations modifier (${opsModifier}). Use a numeric value between 1 and 255.`);
    }

    this.hasList = (opsModifier & 1) === 1;
    this.hasPost = (opsModifier & 2) === 2;
    this.hasPostAsync = (opsModifier & 4) === 4;

    if (this.hasPost && this.hasPostAsync) {
      throw new Error('Choose either a synchronous (post) or asynchronous (postAsync) operation for this resource, not both.');
    }

    this.hasGet = (opsModifier & 8) === 8;
    this.hasHead = (opsModifier & 16) === 16;
    this.hasPut = (opsModifier & 32) === 32;
    this.hasPatch = (opsModifier & 64) === 64;
    this.hasDelete = (opsModifier & 128) === 128;

    this.hasCollectionOps = [1, 2, 4].some(bit => (opsModifier & bit) === bit);
    this.hasResourceOps = [8, 16, 32, 64, 128].some(bit => (opsModifier & bit) === bit);
  }

  toJSON() {
    return {
      hasList: this.hasList,
      hasPost: this.hasPost,
      hasPostAsync: this.hasPostAsync,
      hasGet: this.hasGet,
      hasHead: this.hasHead,
      hasPut: this.hasPut,
      hasPatch: this.hasPatch,
      hasDelete: this.hasDelete,
      hasCollectionOps: this.hasCollectionOps,
      hasResourceOps: this.hasResourceOps,
    };
  }

  toString() {
    const opsArray = [];

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
