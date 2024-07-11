export class OortStorageError extends Error {
    constructor(message: string, public statusCode?: number) {
      super(message);
      this.name = 'OortStorageError';
      Object.setPrototypeOf(this, OortStorageError.prototype);
    }
  }