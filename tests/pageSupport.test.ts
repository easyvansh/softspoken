import { describe, expect, it } from "vitest";
import { isPotentiallySupportedPage } from "../core";

describe("isPotentiallySupportedPage", () => {
  it("allows regular web pages", () => {
    expect(isPotentiallySupportedPage("https://example.com/article")).toBe(
      true,
    );
  });

  it("rejects restricted browser pages and invalid URLs", () => {
    expect(isPotentiallySupportedPage("chrome://extensions")).toBe(false);
    expect(isPotentiallySupportedPage("about:blank")).toBe(false);
    expect(isPotentiallySupportedPage("not a url")).toBe(false);
  });
});
