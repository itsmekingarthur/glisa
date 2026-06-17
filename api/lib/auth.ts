import jwt from "jsonwebtoken";
import { VercelRequest } from "@vercel/node";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production-12345";

export function authenticate(req: VercelRequest) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}
