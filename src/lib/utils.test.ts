import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    const showBar = false;
    const showBaz = true;
    expect(cn("foo", showBar && "bar", "baz")).toBe("foo baz");
    expect(cn("foo", showBaz && "bar", "baz")).toBe("foo bar baz");
  });

  it("should merge Tailwind classes correctly", () => {
    // Later class should override earlier conflicting class
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("should handle arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should handle objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("should handle empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(null, undefined)).toBe("");
  });

  it("should handle mixed inputs", () => {
    expect(cn("base", ["array"], { object: true })).toBe("base array object");
  });
});
