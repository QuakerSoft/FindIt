import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import sgMail from '@sendgrid/mail';

if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({
    credential: cert(serviceAccount),
  });
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const resetLink = await getAuth().generatePasswordResetLink(email);

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: 'Reset your FindIt CSUN password',
      text: `Click this link to reset your password: ${resetLink}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #A6192E;">Reset your password</h2>
          <p>Click the button below to reset your FindIt CSUN password:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #A6192E; color: #FAF7F2; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 20px; color: #6B6560;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending reset email:', error);

    if (error.code === 'auth/user-not-found') {
      return res.status(200).json({ success: true });
    }

    return res.status(500).json({ error: 'Failed to send reset email' });
  }
}