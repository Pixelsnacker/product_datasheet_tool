import { COOKIE_NAME, TEAM_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Team access code login
  app.post("/api/team-login", async (req: Request, res: Response) => {
    const { code } = req.body;
    
    if (!code || !ENV.teamAccessCode) {
      res.status(400).json({ error: "Access code required" });
      return;
    }
    
    if (code !== ENV.teamAccessCode) {
      res.status(401).json({ error: "Invalid access code" });
      return;
    }
    
    try {
      // Load the owner user from DB to create a real session
      const ownerUser = await db.getUserByOpenId(ENV.ownerOpenId);
      if (!ownerUser) {
        res.status(500).json({ error: "Team session setup failed: owner not found" });
        return;
      }

      // Create a real JWT session token (same as normal login)
      const sessionToken = await sdk.createSessionToken(ownerUser.openId, {
        name: ownerUser.name || "Team",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      // Set the main session cookie (same as Manus OAuth login)
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      // Also set team marker cookie so we can identify team sessions
      res.cookie(TEAM_COOKIE_NAME, "valid", { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true });
    } catch (error) {
      console.error("[Team Login] Failed:", error);
      res.status(500).json({ error: "Team login failed" });
    }
  });

  // Team logout
  app.post("/api/team-logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.clearCookie(TEAM_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
