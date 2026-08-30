import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { loadApiKeys } from "../config/load-config.js";
import type { RippleRole } from "../domain/types.js";

export type AuthenticatedRequest = Request & {
  correlationId?: string;
  actor?: string;
  roles?: RippleRole[];
};

export function correlationMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ?? randomUUID();
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  next();
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const apiKeys = loadApiKeys();
  if (apiKeys.length === 0) {
    req.roles = ["analyst", "approver", "admin"];
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization: Bearer <token>" });
    return;
  }

  const token = header.slice(7);
  const match = apiKeys.find((k) => k.key === token);
  if (!match) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }

  req.roles = match.roles;
  req.actor = match.label ?? `api-key:${token.slice(0, 8)}`;
  next();
}

export function oidcActorMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const oidcSub = req.headers["x-oidc-sub"] as string | undefined;
  const oidcEmail = req.headers["x-oidc-email"] as string | undefined;
  if (oidcSub || oidcEmail) {
    req.actor = oidcEmail ?? oidcSub;
  }
  next();
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const limit = Number(process.env.MCP_RATE_LIMIT ?? 120);
  const windowMs = Number(process.env.MCP_RATE_WINDOW_MS ?? 60_000);
  const key =
    (req.headers.authorization as string) ??
    req.ip ??
    req.socket.remoteAddress ??
    "anonymous";

  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));

  if (bucket.count > limit) {
    res.status(429).json({ error: "Rate limit exceeded" });
    return;
  }
  next();
}

export function requireRole(...roles: RippleRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRoles = req.roles ?? [];
    if (roles.some((r) => userRoles.includes(r) || userRoles.includes("admin"))) {
      next();
      return;
    }
    res.status(403).json({ error: `Requires one of: ${roles.join(", ")}` });
  };
}

export function requestLogMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();
  res.on("finish", () => {
    const entry = {
      ts: new Date().toISOString(),
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
      actor: req.actor,
    };
    console.log(JSON.stringify(entry));
  });
  next();
}
