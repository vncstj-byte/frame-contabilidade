import { Resend } from "resend";

const FROM = "Frame Contabilidade <noreply@framecontabilidade.com>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendInviteEmail(to: string, role: string, tempPassword: string, loginUrl: string) {
  const roleLabel = role === "admin" ? "Administrador" : role === "gestor" ? "Gestor" : "Cliente";

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: "Seu acesso à Frame Contabilidade",
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: 700; color: #111; margin: 0;">FRAME</h1>
          <p style="color: #888; font-size: 12px; letter-spacing: 2px; margin-top: 4px;">CONTABILIDADE PARA ADVOGADOS</p>
        </div>
        <p style="font-size: 15px; color: #333; line-height: 1.6;">Olá,</p>
        <p style="font-size: 15px; color: #333; line-height: 1.6;">
          Você recebeu acesso à plataforma da <strong>Frame Contabilidade</strong> como <strong>${roleLabel}</strong>.
        </p>
        <div style="background: #f7f7f7; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #666;">Seus dados de acesso:</p>
          <p style="margin: 0; font-size: 15px;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 8px 0 0; font-size: 15px;"><strong>Senha provisória:</strong> ${tempPassword}</p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #c8a35f; color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 10px; font-weight: 600; font-size: 15px;">Acessar plataforma</a>
        </div>
        <p style="font-size: 13px; color: #999; line-height: 1.5;">
          Recomendamos que você altere sua senha após o primeiro acesso.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #bbb; text-align: center;">
          Frame Contabilidade — Contabilidade para Advogados
        </p>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: "Recuperação de senha — Frame Contabilidade",
    html: `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 28px; font-weight: 700; color: #111; margin: 0;">FRAME</h1>
          <p style="color: #888; font-size: 12px; letter-spacing: 2px; margin-top: 4px;">CONTABILIDADE PARA ADVOGADOS</p>
        </div>
        <p style="font-size: 15px; color: #333; line-height: 1.6;">Olá,</p>
        <p style="font-size: 15px; color: #333; line-height: 1.6;">
          Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #c8a35f; color: #fff; text-decoration: none; padding: 14px 40px; border-radius: 10px; font-weight: 600; font-size: 15px;">Redefinir senha</a>
        </div>
        <p style="font-size: 13px; color: #999; line-height: 1.5;">
          Se você não solicitou essa alteração, ignore este email. O link expira em 1 hora.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #bbb; text-align: center;">
          Frame Contabilidade — Contabilidade para Advogados
        </p>
      </div>
    `,
  });

  if (error) throw new Error(error.message);
}
