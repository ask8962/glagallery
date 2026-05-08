import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = "team@campushub.pro"
const FROM_NAME = "CampusHub"

function generateWelcomeHTML(name: string, email: string): string {
  const firstName = name.split(" ")[0] || "there"

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to CampusHub!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0d1117; color: #c9d1d9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0d1117; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background-color: #161b22; border-radius: 16px; overflow: hidden; border: 1px solid #30363d;">
          
          <!-- Hero Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #0f3460 50%, #16213e 100%); padding: 50px 40px; text-align: center;">
              <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #facc15, #f59e0b); margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 36px;">🎓</span>
              </div>
              <h1 style="color: #facc15; margin: 0 0 8px 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Welcome to CampusHub!</h1>
              <p style="color: #8b949e; margin: 0; font-size: 16px;">Your campus journey starts now ✨</p>
            </td>
          </tr>

          <!-- Personal Greeting -->
          <tr>
            <td style="padding: 40px 40px 0;">
              <h2 style="color: #f0f6fc; margin: 0 0 16px 0; font-size: 24px;">Hey ${firstName}! 👋</h2>
              <p style="color: #8b949e; font-size: 16px; line-height: 1.8; margin: 0 0 20px 0;">
                We're absolutely thrilled to have you join the <strong style="color: #facc15;">CampusHub</strong> community! 
                You've just unlocked access to the most powerful campus engagement platform — where events come alive, 
                hackathons ignite innovation, clubs foster belonging, and every achievement you earn tells your unique story.
              </p>
              <p style="color: #8b949e; font-size: 16px; line-height: 1.8; margin: 0 0 24px 0;">
                Whether you're a first-year exploring new interests or a final-year leading projects — 
                CampusHub is designed to amplify your campus experience and make every moment count.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #30363d, transparent);"></div>
            </td>
          </tr>

          <!-- Features Grid -->
          <tr>
            <td style="padding: 30px 40px;">
              <h3 style="color: #f0f6fc; margin: 0 0 20px 0; font-size: 18px;">🚀 Here's what you can do right away:</h3>
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                    <div style="background: #1c2333; border-radius: 12px; padding: 20px; border: 1px solid #30363d;">
                      <div style="font-size: 28px; margin-bottom: 8px;">📅</div>
                      <h4 style="color: #facc15; margin: 0 0 6px 0; font-size: 15px;">Discover Events</h4>
                      <p style="color: #8b949e; margin: 0; font-size: 13px; line-height: 1.5;">Browse and register for cultural fests, tech talks, workshops, sports meets, and more.</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
                    <div style="background: #1c2333; border-radius: 12px; padding: 20px; border: 1px solid #30363d;">
                      <div style="font-size: 28px; margin-bottom: 8px;">💻</div>
                      <h4 style="color: #facc15; margin: 0 0 6px 0; font-size: 15px;">Join Hackathons</h4>
                      <p style="color: #8b949e; margin: 0; font-size: 13px; line-height: 1.5;">Form teams, submit projects, and compete in campus-wide coding challenges.</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding: 8px 8px 8px 0; vertical-align: top;">
                    <div style="background: #1c2333; border-radius: 12px; padding: 20px; border: 1px solid #30363d;">
                      <div style="font-size: 28px; margin-bottom: 8px;">🏅</div>
                      <h4 style="color: #facc15; margin: 0 0 6px 0; font-size: 15px;">Earn Rewards</h4>
                      <p style="color: #8b949e; margin: 0; font-size: 13px; line-height: 1.5;">Collect points for every activity. Level up, unlock badges, and redeem from the   .</p>
                    </div>
                  </td>
                  <td width="50%" style="padding: 8px 0 8px 8px; vertical-align: top;">
                    <div style="background: #1c2333; border-radius: 12px; padding: 20px; border: 1px solid #30363d;">
                      <div style="font-size: 28px; margin-bottom: 8px;">🤝</div>
                      <h4 style="color: #facc15; margin: 0 0 6px 0; font-size: 15px;">Join Clubs</h4>
                      <p style="color: #8b949e; margin: 0; font-size: 13px; line-height: 1.5;">Explore 50+ student clubs — from robotics to photography, debate to dance.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Motivation Section -->
          <tr>
            <td style="padding: 10px 40px 30px;">
              <div style="background: linear-gradient(135deg, #1c2333, #0f3460); border-radius: 12px; padding: 24px; border: 1px solid #30363d; text-align: center;">
                <p style="color: #facc15; font-size: 20px; margin: 0 0 8px 0; font-weight: 700;">💡 Pro Tip</p>
                <p style="color: #c9d1d9; font-size: 15px; line-height: 1.7; margin: 0;">
                  Complete your profile, follow friends, and RSVP to your first event — 
                  you'll earn <strong style="color: #facc15;">50 bonus points</strong> and your first badge! 
                  The leaderboard is waiting for you. 🏆
                </p>
              </div>
            </td>
          </tr>

          <!-- Quick Stats -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align: center; padding: 16px;">
                    <div style="font-size: 28px; font-weight: 800; color: #facc15;">1500+</div>
                    <div style="font-size: 12px; color: #8b949e; margin-top: 4px;">Active Students</div>
                  </td>
                  <td width="33%" style="text-align: center; padding: 16px; border-left: 1px solid #30363d; border-right: 1px solid #30363d;">
                    <div style="font-size: 28px; font-weight: 800; color: #facc15;">10+</div>
                    <div style="font-size: 12px; color: #8b949e; margin-top: 4px;">Events Per Year</div>
                  </td>
                  <td width="33%" style="text-align: center; padding: 16px;">
                    <div style="font-size: 28px; font-weight: 800; color: #facc15;">10+</div>
                    <div style="font-size: 12px; color: #8b949e; margin-top: 4px;">Student Clubs</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="https://campushub.pro" style="display: inline-block; background: linear-gradient(135deg, #facc15, #f59e0b); color: #0d1117; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; letter-spacing: 0.3px;">
                🚀 Explore CampusHub Now
              </a>
              <p style="color: #8b949e; font-size: 13px; margin: 16px 0 0 0;">
                Or visit <a href="https://campushub.pro" style="color: #facc15; text-decoration: none;">campushub.pro</a> directly
              </p>
            </td>
          </tr>

          <!-- What's Next -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <h3 style="color: #f0f6fc; margin: 0 0 16px 0; font-size: 16px;">📋 Your First Steps:</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #c9d1d9; font-size: 14px;">
                    <span style="color: #facc15; font-weight: 700; margin-right: 8px;">1.</span>
                    Complete your profile — add a bio, interests, and your department
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #c9d1d9; font-size: 14px;">
                    <span style="color: #facc15; font-weight: 700; margin-right: 8px;">2.</span>
                    Browse upcoming events and RSVP to ones that excite you
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #c9d1d9; font-size: 14px;">
                    <span style="color: #facc15; font-weight: 700; margin-right: 8px;">3.</span>
                    Search for friends and follow them to build your network
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #c9d1d9; font-size: 14px;">
                    <span style="color: #facc15; font-weight: 700; margin-right: 8px;">4.</span>
                    Join a club that matches your passion and start contributing
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #c9d1d9; font-size: 14px;">
                    <span style="color: #facc15; font-weight: 700; margin-right: 8px;">5.</span>
                    Check the leaderboard and start climbing the ranks! 🏆
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0d1117; padding: 30px 40px; text-align: center; border-top: 1px solid #30363d;">
              <p style="color: #facc15; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">CampusHub — Where Campus Comes Alive</p>
              <p style="color: #484f58; font-size: 12px; margin: 0 0 12px 0;">
                Powering student engagement across institutions
              </p>
              <p style="color: #484f58; font-size: 11px; margin: 0;">
                This email was sent to <span style="color: #8b949e;">${email}</span> because you just joined CampusHub.<br>
                © ${new Date().getFullYear()} CampusHub. All rights reserved.
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
    const { name, email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("Resend not configured — skipping welcome email")
      return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 200 })
    }

    const html = generateWelcomeHTML(name || "Student", email)

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: "🎉 Welcome to CampusHub — Your Campus Journey Starts Now!",
      html: html,
    })

    if (error) {
      console.error("Welcome email error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log("✅ Welcome email sent to:", email)
    return NextResponse.json({ success: true, message: "Welcome email sent" })
  } catch (error: any) {
    console.error("Welcome email error:", error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
