import { describe, it, expect } from "vitest";
import { validateReturnUrl } from "../../lib/safeRedirect";

describe("validateReturnUrl", () => {
  it("allows safe relative return URLs", () => {
    expect(validateReturnUrl("/group/ABC123/settings", "/home")).toBe("/group/ABC123/settings");
    expect(validateReturnUrl("/group/ABC123/dashboard?tab=all", "/home")).toBe("/group/ABC123/dashboard?tab=all");
  });

  it("falls back on invalid or malicious open-redirect URLs", () => {
    expect(validateReturnUrl("https://evil.com", "/home")).toBe("/home");
    expect(validateReturnUrl("//evil.com", "/home")).toBe("/home");
    expect(validateReturnUrl("/\\evil.com", "/home")).toBe("/home");
    expect(validateReturnUrl("javascript:alert(1)", "/home")).toBe("/home");
    expect(validateReturnUrl(null, "/home")).toBe("/home");
    expect(validateReturnUrl("", "/home")).toBe("/home");
  });

  it("correctly matches target group routes", () => {
    const cleanCode = "ABC123";
    const defaultTarget = `/group/${cleanCode}/dashboard`;

    const getTargetUrl = (rawReturnUrl) => {
      const validated = validateReturnUrl(rawReturnUrl, defaultTarget);
      const upperPath = validated.toUpperCase();
      return (upperPath === `/GROUP/${cleanCode}` || upperPath.startsWith(`/GROUP/${cleanCode}/`))
        ? validated
        : defaultTarget;
    };

    expect(getTargetUrl("/group/ABC123/settings")).toBe("/group/ABC123/settings");
    expect(getTargetUrl("/group/abc123/report")).toBe("/group/abc123/report");
    expect(getTargetUrl("/group/ABC123")).toBe("/group/ABC123");
    expect(getTargetUrl("/group/XYZ999/settings")).toBe("/group/ABC123/dashboard");
    expect(getTargetUrl("//malicious.com")).toBe("/group/ABC123/dashboard");
    expect(getTargetUrl(null)).toBe("/group/ABC123/dashboard");
  });
});
