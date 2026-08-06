const supportedProtocols = new Set(["http:", "https:"]);

export function isPotentiallySupportedPage(pageUrl: string): boolean {
  try {
    const url = new URL(pageUrl);
    return supportedProtocols.has(url.protocol) && url.hostname.length > 0;
  } catch {
    return false;
  }
}
