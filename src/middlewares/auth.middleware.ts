import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id?: string;
  userId?: string;
  email: string;
  name?: string | null;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string | null;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação não fornecido" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const secret = process.env.JWT_SECRET!;
    const payload = jwt.verify(token, secret) as JwtPayload;
    const id = payload.id ?? payload.userId;

    if (!id) {
      res.status(401).json({ error: "Token invÃ¡lido ou expirado" });
      return;
    }

    req.user = {
      id,
      email: payload.email,
      name: payload.name ?? null,
    };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
