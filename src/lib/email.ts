import nodemailer from "nodemailer";

const SMTP_HOST = import.meta.env.SMTP_HOST;
const SMTP_USER = import.meta.env.SMTP_USER;
const SMTP_PASSWORD = import.meta.env.SMTP_PASSWORD;

function getTransport() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: 465,
    secure: true,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

export async function sendWelcomeEmail(
  firstName: string,
  username: string,
  recipientName: string,
  recipientEmail: string,
): Promise<void> {
  const text = `Welcome to Dabney, ${firstName}!

Your Dabney account is ready for you to activate. It gives you access to the Dabney wiki (from https://dabney.caltech.edu, click "Services" and then "Wiki") as well as other services on the website. The wiki is a very useful resource: it has room combinations, contact info for house resources, printer info, and more, so be sure to take a look!

Your username is '${username}'. You'll shortly receive an email with a link to set your password. If the link expires before you get to it, you can also set your password by using the "forgot password" button on the login page.

If you run into any trouble setting up your account, please contact the comptrollers. For any other questions about the wiki, website, or house tech, feel free to ask as well. Thank you, and we hope you enjoy your time in Dabney!

Dabney IMSS`;

  await getTransport().sendMail({
    from: `"Dabney Comptrollers" <${SMTP_USER}>`,
    to: `"${recipientName}" <${recipientEmail}>`,
    subject: "Your Dabney Account",
    text,
  });
}
