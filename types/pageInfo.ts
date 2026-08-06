export interface PageSnapshot {
  readonly title: string;
  readonly pageUrl: string;
  readonly selectedText: string;
}

interface PageInformationBase {
  readonly title: string;
  readonly hostname: string;
  readonly pageUrl: string;
}

export type PageInformation = PageInformationBase &
  (
    | {
        readonly hasSelectedText: false;
      }
    | {
        readonly hasSelectedText: true;
        readonly selectedTextCharacterCount: number;
      }
  );

export type PageInformationFailureReason =
  | "no-active-tab"
  | "unsupported-page"
  | "inaccessible-page"
  | "invalid-page-response"
  | "messaging-failure";

export interface PageInformationError {
  readonly reason: PageInformationFailureReason;
  readonly message: string;
}

export type PageInformationLoadState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly page: PageInformation }
  | { readonly status: "failure"; readonly error: PageInformationError };
