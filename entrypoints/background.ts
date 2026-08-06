import { isSoftSpokenMessage } from "@/messaging";

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!isSoftSpokenMessage(message)) {
      return false;
    }

    return false;
  });
});
