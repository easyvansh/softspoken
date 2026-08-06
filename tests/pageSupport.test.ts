import { describe, expect, it } from "vitest";
import { isPotentiallySupportedPage } from "../core";

describe("isPotentiallySupportedPage", () => {
  it("allows regular HTTP and HTTPS pages", () => {
    expect(isPotentiallySupportedPage("https://example.com/article")).toBe(
      true,
    );
    expect(isPotentiallySupportedPage("http://localhost:3000")).toBe(true);
  });

  it("rejects restricted browser pages and invalid URLs", () => {
    expect(isPotentiallySupportedPage("chrome://extensions")).toBe(false);
    expect(isPotentiallySupportedPage("about:blank")).toBe(false);
    expect(isPotentiallySupportedPage("file:///tmp/article.html")).toBe(false);
    expect(isPotentiallySupportedPage("data:text/plain,article")).toBe(false);
    expect(isPotentiallySupportedPage("ftp://example.com/article")).toBe(false);
    expect(isPotentiallySupportedPage("not a url")).toBe(false);
  });
});
