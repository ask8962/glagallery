import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number.parseInt(process.env.SMTP_PORT || "587"),
            secure: Number.parseInt(process.env.SMTP_PORT || "587") === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
        });

        await transporter.verify();

        // Attempt to send
        const info = await transporter.sendMail({
            from: `"Test Server" <${process.env.SMTP_FROM_EMAIL}>`,
            to: process.env.SMTP_USER,
            subject: "Diagnostic Email Test",
            text: "If you receive this, the SMTP connection is working perfectly.",
        });

        return NextResponse.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
        console.error("Diagnostic Email Error:", {
            code: error.code,
            message: error.message,
        });
        return NextResponse.json({ success: false, error: error.message, code: error.code }, { status: 500 });
    }
}
