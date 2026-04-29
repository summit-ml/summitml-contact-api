import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { Analytics } from "@vercel/analytics/next"

const resend = new Resend(process.env.RESEND_API_KEY);

const allowedOrigins = [
  "https://summitml.com",
  "https://www.summitml.com",
  "https://summitml.figma.site",
];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || "";

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, company, phone, service, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await resend.emails.send({
      from: "Summit ML <contact@summitml.com>",
      to: ["hello@summitml.com"],
      replyTo: email,
      subject: `New Summit ML inquiry from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company || "")}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone || "")}</p>
        <p><strong>Service:</strong> ${escapeHtml(service || "")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
}