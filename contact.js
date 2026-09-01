import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Change this once your domain is verified in Resend.
// Until then, Resend's shared address (onboarding@resend.dev) works for testing
// without any DNS setup, but can only send to comfortfajugbagbe@gmail.com (the
// account owner's own inbox) — it cannot send to arbitrary recipients.
const FROM_ADDRESS = 'Comfort Fajugbagbe Website <contact@comfortfajugbagbe.com>';
const TO_ADDRESS = 'comfortfajugbagbe@gmail.com';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are all required.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: TO_ADDRESS,
      replyTo: email,
      subject: `New website inquiry from ${name}`,
      text: `You have a new message from your website contact form.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6;">
          <h2>New website inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ error: 'Something went wrong sending your message. Please try again or email directly.' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Something went wrong sending your message. Please try again or email directly.' });
  }
}
