import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "Arca <noreply@example.com>";

export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  if (!resendApiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`Password reset link for ${email}: ${resetLink}`);
      return;
    }

    throw new Error("Password reset email is not configured.");
  }

  const resend = new Resend(resendApiKey);

  await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: "Recuperacao de senha do Arca",
    html: `
      <p>Voce solicitou a recuperacao de senha do Arca.</p>
      <p>Use o link abaixo para criar uma nova senha. Ele expira em 1 hora.</p>
      <p><a href="${resetLink}">Redefinir senha</a></p>
      <p>Se voce nao solicitou essa alteracao, ignore este email.</p>
    `,
  });
}
