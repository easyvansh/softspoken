import { describe, expect, it } from "vitest";
import { isSoftSpokenMessage } from "../messaging";

describe("isSoftSpokenMessage", () => {
  it("accepts known SoftSpoken message discriminators", () => {
    expect(
      isSoftSpokenMessage({ type: "softspoken.article.load-request" }),
    ).toBe(true);
  });

  it("rejects unknown external data", () => {
    expect(isSoftSpokenMessage(null)).toBe(false);
    expect(isSoftSpokenMessage({ type: "starter.hello" })).toBe(false);
    expect(isSoftSpokenMessage({})).toBe(false);
  });
});
