import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins only truthy class values", () => {
    const value = cn("card", null, "active", undefined, false, "shadow");

    expect(value).toBe("card active shadow");
  });

  it("returns empty string when all inputs are falsy", () => {
    const value = cn(undefined, null, false);

    expect(value).toBe("");
  });
});
