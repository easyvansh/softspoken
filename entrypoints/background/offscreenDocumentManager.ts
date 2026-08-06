export interface OffscreenDocumentGateway {
  hasDocument(documentUrl: string): Promise<boolean>;
  createDocument(path: string): Promise<void>;
  getDocumentUrl(path: string): string;
}

export class OffscreenDocumentManager {
  private creatingDocument: Promise<void> | undefined;

  constructor(
    private readonly path: string,
    private readonly gateway: OffscreenDocumentGateway,
  ) {}

  hasDocument(): Promise<boolean> {
    return this.gateway.hasDocument(this.gateway.getDocumentUrl(this.path));
  }

  async ensureDocument(): Promise<void> {
    if (await this.hasDocument()) {
      return;
    }

    if (this.creatingDocument === undefined) {
      this.creatingDocument = this.gateway
        .createDocument(this.path)
        .finally(() => {
          this.creatingDocument = undefined;
        });
    }

    await this.creatingDocument;
  }
}
