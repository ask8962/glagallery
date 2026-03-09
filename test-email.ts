import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testEmail() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    try {
        await transporter.verify();
        console.log("✅ Connection verified");

        const info = await transporter.sendMail({
            from: `"GLA Gallery" <${process.env.SMTP_FROM_EMAIL}>`,
            to: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',')[0] : process.env.SMTP_USER,
            subject: "Test Email from GLA Gallery",
            text: "This is a test email to verify SMTP configuration.",
        });

        console.log("✅ Email sent successfully:", info.messageId);
    } catch (error) {
        console.error("❌ Email failed:", error);
    }
}

testEmail();
