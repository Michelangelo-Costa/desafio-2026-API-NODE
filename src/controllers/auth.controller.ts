import crypto from "crypto";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../utils/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendPasswordResetEmail } from "../services/email.service";

const PASSWORD_RESET_MESSAGE = "Se o email existir, enviaremos um link de recuperacao.";
const PASSWORD_UPDATED_MESSAGE = "Senha atualizada com sucesso.";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000;

function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

function isValidPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= MIN_PASSWORD_LENGTH;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function signToken(user: { id: string; email: string; name: string | null }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
  return jwt.sign(
    {
      id: user.id,
      userId: user.id,
      email: user.email,
      name: user.name,
    },
    secret,
    { expiresIn }
  );
}

function hashResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getResetUrl(token: string): string {
  const resetBaseUrl = process.env.PASSWORD_RESET_URL ?? "http://localhost:5173/reset-password";
  const separator = resetBaseUrl.includes("?") ? "&" : "?";
  return `${resetBaseUrl}${separator}token=${encodeURIComponent(token)}`;
}

function toPublicUser(user: { id: string; email: string; name: string | null }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password, name } = req.body;

  if (!isValidEmail(email)) {
    res.status(400).json({ error: "Email invalido" });
    return;
  }

  if (!isValidPassword(password)) {
    res.status(400).json({ error: "Senha deve ter no minimo 8 caracteres" });
    return;
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (existing) {
    res.status(409).json({ error: "Email ja cadastrado" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashed,
      name: typeof name === "string" && name.trim() ? name.trim() : null,
    },
    select: { id: true, email: true, name: true },
  });

  const token = signToken(user);

  res.status(201).json({ token, user: toPublicUser(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!isValidEmail(email) || typeof password !== "string") {
    res.status(400).json({ error: "Email e senha sao obrigatorios" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) {
    res.status(401).json({ error: "Credenciais invalidas" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Credenciais invalidas" });
    return;
  }

  const publicUser = toPublicUser(user);
  const token = signToken(publicUser);

  res.json({ token, user: publicUser });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Nao autorizado" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    res.status(401).json({ error: "Nao autorizado" });
    return;
  }

  res.json(toPublicUser(user));
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    res.status(200).json({ message: PASSWORD_RESET_MESSAGE });
    return;
  }

  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
    res.status(500).json({ error: "Password reset email is not configured." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });

  if (user) {
    try {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(token);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await sendPasswordResetEmail(user.email, getResetUrl(token));
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }
  }

  res.status(200).json({ message: PASSWORD_RESET_MESSAGE });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;

  if (typeof token !== "string" || !token || !isValidPassword(password)) {
    res.status(400).json({ error: "Token ou senha invalidos" });
    return;
  }

  const tokenHash = hashResetToken(token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    res.status(400).json({ error: "Token invalido ou expirado" });
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  res.status(200).json({ message: PASSWORD_UPDATED_MESSAGE });
}

export async function changePassword(req: AuthRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Nao autorizado" });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  if (typeof currentPassword !== "string" || !isValidPassword(newPassword)) {
    res.status(400).json({ error: "Senha atual ou nova senha invalidas" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    res.status(401).json({ error: "Nao autorizado" });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    res.status(401).json({ error: "Senha atual invalida" });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  res.status(200).json({ message: PASSWORD_UPDATED_MESSAGE });
}
