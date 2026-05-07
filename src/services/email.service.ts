import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "Arca <noreply@example.com>";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPasswordResetHtml(resetLink: string): string {
  const safeResetLink = escapeHtml(resetLink);

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recuperacao de senha do ARCA</title>
  </head>
  <body style="margin:0;padding:0;background:#F5F8FF;font-family:Inter,Arial,sans-serif;color:#1A2E4A;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#F5F8FF;margin:0;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:560px;background:#ffffff;border:1px solid #D6E4F0;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(13,43,94,0.12);">
            <tr>
              <td style="background:#0D2B5E;padding:28px 28px 24px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <div style="display:inline-block;border:1px solid rgba(255,255,255,0.18);border-radius:999px;padding:6px 12px;color:#4ECDC4;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;">
                        ARCA
                      </div>
                      <h1 style="margin:18px 0 8px;color:#ffffff;font-size:28px;line-height:1.15;font-weight:800;">
                        Redefina sua senha
                      </h1>
                      <p style="margin:0;color:#D7EEF0;font-size:14px;line-height:1.6;">
                        Recebemos uma solicitacao para criar uma nova senha de acesso ao aplicativo.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 8px;">
                <p style="margin:0 0 16px;color:#1A2E4A;font-size:16px;line-height:1.65;">
                  Use o botao abaixo para continuar a recuperacao da sua conta. Por seguranca, este link expira em <strong>1 hora</strong>.
                </p>
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0 24px;">
                  <tr>
                    <td bgcolor="#0D2B5E" style="border-radius:999px;">
                      <a href="${safeResetLink}" target="_blank" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#0D2B5E;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;">
                        Redefinir senha
                      </a>
                    </td>
                  </tr>
                </table>
                <div style="border:1px solid #D6E4F0;background:#F5F8FF;border-radius:16px;padding:14px 16px;margin:0 0 22px;">
                  <p style="margin:0;color:#6B7F99;font-size:13px;line-height:1.55;">
                    Se o botao nao funcionar, copie e cole este link no navegador:
                  </p>
                  <p style="margin:8px 0 0;font-size:12px;line-height:1.55;word-break:break-all;">
                    <a href="${safeResetLink}" target="_blank" style="color:#00B4A6;text-decoration:none;">${safeResetLink}</a>
                  </p>
                </div>
                <p style="margin:0;color:#6B7F99;font-size:13px;line-height:1.6;">
                  Se voce nao solicitou essa alteracao, ignore este email. Sua senha atual continuara a mesma.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 28px;">
                <div style="height:1px;background:#D6E4F0;margin-bottom:18px;"></div>
                <p style="margin:0;color:#6B7F99;font-size:12px;line-height:1.5;">
                  ARCA - Monitoramento inteligente de especies em tempo real.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildPasswordResetText(resetLink: string): string {
  return [
    "Voce solicitou a recuperacao de senha do Arca.",
    "",
    "Use o link abaixo para criar uma nova senha. Ele expira em 1 hora.",
    resetLink,
    "",
    "Se voce nao solicitou essa alteracao, ignore este email.",
  ].join("\n");
}

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
    html: buildPasswordResetHtml(resetLink),
    text: buildPasswordResetText(resetLink),
  });
}
