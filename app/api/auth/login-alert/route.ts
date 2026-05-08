import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = "team@campushub.pro"
const FROM_NAME = "CampusHub Security"

// Extract real IP from request headers (works on Vercel, Cloudflare, etc.)
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
    return forwarded.split(",")[0].trim()
  }
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) return cfIp.trim()

  return "Unknown"
}

// Fetch geo-location from IP (server-side — no CORS issues)
async function getLocationFromIP(ip: string): Promise<{ city: string; region: string; country: string }> {
  try {
    if (!ip || ip === "Unknown" || ip === "::1" || ip === "127.0.0.1") {
      return { city: "Localhost", region: "Dev Environment", country: "" }
    }
    // ip-api.com is free and doesn't need API key (100 req/min)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country`, {
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.status === "success") {
        return {
          city: data.city || "Unknown",
          region: data.regionName || "",
          country: data.country || "",
        }
      }
    }
  } catch {
    // Geo lookup failed, continue with defaults
  }
  return { city: "Unknown", region: "", country: "" }
}

function generateLoginAlertHTML(
  name: string,
  email: string,
  browser: string,
  os: string,
  ip: string,
  timestamp: string,
  location: string
): string {
  const firstName = name.split(" ")[0] || "there"

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Alert — CampusHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #e4e4e7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #18181b; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #09090b 0%, #1c1917 100%); padding: 36px 40px; text-align: center;">
              <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #16a34a); margin: 0 auto 16px; line-height: 56px; text-align: center;">
                <span style="font-size: 28px;">&#128274;</span>
              </div>
              <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">New Login Detected</h1>
              <p style="color: #71717a; margin: 0; font-size: 14px;">Security alert for your CampusHub account</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 16px;">
              <p style="color: #e4e4e7; font-size: 16px; line-height: 1.7; margin: 0;">
                Hey <strong style="color: #ffffff;">${firstName}</strong>, we noticed a new sign-in to your CampusHub account. Here are the details:
              </p>
            </td>
          </tr>

          <!-- Login Details Card -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; border-radius: 12px; border: 1px solid #27272a; overflow: hidden;">
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #27272a;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 120px;">Browser</td>
                        <td style="color: #fafafa; font-size: 15px; font-weight: 500;">&#127760; ${browser}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #27272a;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 120px;">Device</td>
                        <td style="color: #fafafa; font-size: 15px; font-weight: 500;">&#128187; ${os}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #27272a;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 120px;">IP Address</td>
                        <td style="color: #fafafa; font-size: 15px; font-weight: 500;">&#128225; ${ip}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #27272a;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 120px;">Location</td>
                        <td style="color: #fafafa; font-size: 15px; font-weight: 500;">&#128205; ${location}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color: #71717a; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; width: 120px;">Time</td>
                        <td style="color: #fafafa; font-size: 15px; font-weight: 500;">&#128336; ${timestamp}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="background: linear-gradient(135deg, #422006, #431407); border-radius: 12px; padding: 20px 24px; border: 1px solid #92400e;">
                <p style="color: #fbbf24; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">&#9888;&#65039; Wasn't you?</p>
                <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; margin: 0;">
                  If you didn't sign in, your account may be compromised. Please 
                  <a href="https://campushub.pro/profile" style="color: #fbbf24; text-decoration: underline;">Apply Two-Factor Authentication</a> 
                  or contact us at <a href="mailto:team@campushub.pro" style="color: #fbbf24; text-decoration: underline;">team@campushub.pro</a>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(to right, transparent, #27272a, transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px; text-align: center;">
              <p style="color: #52525b; font-size: 12px; margin: 0 0 4px 0;">
                This is an automated security alert from <strong style="color: #71717a;">CampusHub</strong>
              </p>
              <p style="color: #3f3f46; font-size: 11px; margin: 0;">
                Sent to ${email} &middot; &copy; ${new Date().getFullYear()} CampusHub
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, browser, os } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("Resend not configured — skipping login alert email")
      return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 200 })
    }

    // Get real IP from server-side request headers
    const ip = getClientIP(request)
    console.log("Detected client IP:", ip)

    // Get geo-location from IP (server-side, no CORS issues)
    const geo = await getLocationFromIP(ip)
    const locationStr = [geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "Unknown Location"
    console.log("Resolved location:", locationStr)

    const timestamp = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "short",
    })

    const html = generateLoginAlertHTML(
      name || "User",
      email,
      browser || "Unknown Browser",
      os || "Unknown Device",
      ip,
      timestamp,
      locationStr
    )

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: `🔐 New login to your CampusHub account`,
      html: html,
    })

    if (error) {
      console.error("Login alert email error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("✅ Login alert sent to:", email, "| IP:", ip, "| Location:", locationStr)
    return NextResponse.json({ success: true, message: "Login alert sent" })
  } catch (error: any) {
    console.error("Login alert error:", error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
