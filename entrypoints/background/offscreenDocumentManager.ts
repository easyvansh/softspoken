export interface OffscreenDocumentGateway {
  hasDocument(documentUrl: string): Promise<boolean>;
  createDocument(): Promise<void>;
  getDocumentUrl(): string;
}

export class OffscreenDocumentManager {
  private creatingDocument: Promise<void> | undefined;

  constructor(private readonly gateway: OffscreenDocumentGateway) {}

  hasDocument(): Promise<boolean> {
    return this.gateway.hasDocument(this.gateway.getDocumentUrl());
  }

  async ensureDocument(): Promise<void> {
    if (await this.hasDocument()) {
      return;
    }

    if (this.creatingDocument === undefined) {
      this.creatingDocument = this.gateway.createDocument().finally(() => {
        this.creatingDocument = undefined;
      });
    }

    await this.creatingDocument;
  }
}
