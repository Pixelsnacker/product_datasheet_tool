import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  isTeamSession: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let isTeamSession = false;

  // First try normal Manus OAuth authentication
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }

  // If no authenticated user, automatically use the owner account (no login required)
  if (!user) {
    try {
      const ownerUser = await db.getUserByOpenId(ENV.ownerOpenId);
      if (ownerUser) {
        user = ownerUser;
        isTeamSession = true;
      }
    } catch (error) {
      // Fallback failed silently
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    isTeamSession,
  };
}
