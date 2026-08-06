import type { PageInformationLoadState, PageInformationError } from "@/types";
import { isPageInformationResponse } from "./messages";
import type { PageInformationRequest } from "./types";

const request: PageInformationRequest = {
  type: "softspoken.page-info.request",
};

export async function loadCurrentPageInformation(): Promise<PageInformationLoadState> {
  try {
    const response: unknown = await browser.runtime.sendMessage<
      PageInformationRequest,
      unknown
    >(request);

    if (!isPageInformationResponse(response)) {
      return failure({
        reason: "invalid-page-response",
        message: "SoftSpoken received an invalid response for this page.",
      });
    }

    return response.ok
      ? { status: "ready", page: response.page }
      : failure(response.error);
  } catch {
    return failure({
      reason: "messaging-failure",
      message:
        "SoftSpoken could not contact the extension service. Reopen the popup and try again.",
    });
  }
}

function failure(error: PageInformationError): PageInformationLoadState {
  return { status: "failure", error };
}
