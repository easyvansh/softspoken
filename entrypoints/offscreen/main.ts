import { isSoftSpokenMessage } from "@/messaging";

browser.runtime.onMessage.addListener((message: unknown) => {
  if (!isSoftSpokenMessage(message)) {
    return false;
  }

  return false;
});
