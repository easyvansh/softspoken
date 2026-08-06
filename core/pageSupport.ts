const restrictedProtocols = [
  "chrome:",
  "chrome-extension:",
  "edge:",
  "about:",
  "file:",
] as const;

export function isPotentiallySupportedPage(pageUrl: string): boolean {
  try {
    const url = new URL(pageUrl);
    return !restrictedProtocols.some((protocol) => protocol === url.protocol);
  } catch {
    return false;
  }
}
