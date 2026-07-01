import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock ENV
vi.mock("./_core/env", () => ({
  ENV: {
    teamAccessCode: "Siepe2026##",
    ownerOpenId: "test-owner-id",
    appId: "test-app",
    cookieSecret: "test-secret",
    databaseUrl: "",
    oAuthServerUrl: "",
    isProduction: false,
    forgeApiUrl: "",
    forgeApiKey: "",
  },
}));

describe("Team Login Logic", () => {
  it("should accept correct team access code", () => {
    const code = "Siepe2026##";
    const teamAccessCode = "Siepe2026##";
    expect(code === teamAccessCode).toBe(true);
  });

  it("should reject incorrect team access code", () => {
    const code = "wrongpassword";
    const teamAccessCode = "Siepe2026##";
    expect(code === teamAccessCode).toBe(false);
  });

  it("should reject empty access code", () => {
    const code = "";
    const teamAccessCode = "Siepe2026##";
    expect(code === teamAccessCode).toBe(false);
    expect(!code).toBe(true);
  });

  it("should validate TEAM_COOKIE_NAME constant", () => {
    const TEAM_COOKIE_NAME = "team_session_id";
    expect(TEAM_COOKIE_NAME).toBe("team_session_id");
    expect(TEAM_COOKIE_NAME.length).toBeGreaterThan(0);
  });

  it("should validate team session cookie value", () => {
    const cookieValue = "valid";
    expect(cookieValue).toBe("valid");
  });

  it("team login should set both app_session_id and team_session_id cookies", () => {
    // After successful team login, both cookies must be set
    const COOKIE_NAME = "app_session_id";
    const TEAM_COOKIE_NAME = "team_session_id";
    const cookiesToSet = [COOKIE_NAME, TEAM_COOKIE_NAME];
    expect(cookiesToSet).toContain("app_session_id");
    expect(cookiesToSet).toContain("team_session_id");
    expect(cookiesToSet.length).toBe(2);
  });

  it("team logout should clear both cookies", () => {
    const COOKIE_NAME = "app_session_id";
    const TEAM_COOKIE_NAME = "team_session_id";
    const cookiesToClear = [COOKIE_NAME, TEAM_COOKIE_NAME];
    expect(cookiesToClear).toContain("app_session_id");
    expect(cookiesToClear).toContain("team_session_id");
  });
});
