import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-durian-hub-development-key-32chars"
);

const TOKEN_COOKIE_NAME = "durian_hub_session";
const ADMIN_TOKEN_COOKIE_NAME = "durian_hub_admin_session";
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface SessionPayload {
  userId: number;
  email: string;
  phone: string;
  activeRole: string;
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_TOKEN_COOKIE_NAME);
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: true,
        location: true,
      },
    });

    if (!user) return null;

    if (user.status === "SUSPENDED" && user.suspendedUntil && new Date() > new Date(user.suspendedUntil)) {
      const unlocked = await prisma.user.update({
        where: { id: user.id },
        data: {
          status: "ACTIVE",
          suspendedUntil: null,
          suspensionReason: null,
        },
        include: {
          roles: true,
          location: true,
        },
      });
      return unlocked;
    }

    if (user.status !== "ACTIVE") return null;

    return user;
  } catch {
    return null;
  }
}

export async function getAdminUser() {
  try {
    const cookieStore = await cookies();
    // 1. Try dedicated admin session cookie first (isolated from user session)
    let token = cookieStore.get(ADMIN_TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    }
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: true,
        location: true,
      },
    });

    if (!user) return null;

    if (user.status === "SUSPENDED" && user.suspendedUntil && new Date() > new Date(user.suspendedUntil)) {
      const unlocked = await prisma.user.update({
        where: { id: user.id },
        data: {
          status: "ACTIVE",
          suspendedUntil: null,
          suspensionReason: null,
        },
        include: {
          roles: true,
          location: true,
        },
      });
      return unlocked;
    }

    if (user.status !== "ACTIVE") return null;

    const isAdmin =
      user.activeRole === "ADMIN" ||
      user.roles.some((r) => r.roleType === "ADMIN" && r.status === "ACTIVE");
    if (!isAdmin) return null;

    return user;
  } catch {
    return null;
  }
}
