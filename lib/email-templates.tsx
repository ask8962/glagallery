/**
 * Email Templates
 *
 * Professional email templates for all notification types
 * CRITICAL: All links use centralized APP_URL from config
 * NEVER use dynamic URLs, window.location, or request headers
 */

import { buildAppURL, APP_CONFIG } from "./config"
import type { NotificationType } from "./types"

export interface EmailTemplateData {
  title: string
  message: string
  link?: string
  type: NotificationType
  metadata?: Record<string, any>
}

/**
 * Get email subject based on notification type
 */
export function getEmailSubject(type: NotificationType, title?: string): string {
  const subjects: Record<NotificationType, string> = {
    team_invite: "You've been invited to join a team",
    team_joined: "New member joined your team",
    hackathon_registration: "Registration confirmed",
    hackathon_update: "Hackathon update",
    submission_deadline: "Submission deadline reminder",
    judging_complete: "Judging completed",
    comment: "New comment on your post",
    like: "Someone liked your post",
    mention: "You were mentioned",
    follow: "New follower",
    badge: "Badge unlocked!",
    welcome: "Welcome to GLA Gallery",
  }

  return title || subjects[type] || "New notification from GLA Gallery"
}

/**
 * Generate HTML email body
 */
export function generateEmailHTML(data: EmailTemplateData): string {
  const { title, message, link, type } = data

  // Use centralized APP_URL - NEVER use dynamic URLs
  const logoUrl = buildAppURL("/glalogo.jpg")
  const footerLink = buildAppURL("/")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f7f4eb;
      color: #0b1b36;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #0b1b36 0%, #1a2f52 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #efb810;
      margin-bottom: 10px;
    }
    .tagline {
      color: #f7f4eb;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #0b1b36;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .message {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #efb810;
      color: #0b1b36;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .button:hover {
      background-color: #d4a00e;
    }
    .footer {
      background-color: #f0ebdd;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2ded0;
    }
    .footer-text {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .footer-link {
      color: #efb810;
      text-decoration: none;
      font-weight: 500;
    }
    .divider {
      height: 1px;
      background-color: #e2ded0;
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">${APP_CONFIG.APP_NAME}</div>
      <div class="tagline">${APP_CONFIG.APP_DESCRIPTION}</div>
    </div>
    
    <div class="content">
      <h1 class="title">${title}</h1>
      <p class="message">${message}</p>
      
      ${
        link
          ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" class="button">View Details</a>
        </div>
      `
          : ""
      }
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
        This is an automated notification from ${APP_CONFIG.APP_NAME}. 
        You received this email because you are registered with your GLA University account.
      </p>
    </div>
    
    <div class="footer">
      <p class="footer-text">
        <a href="${footerLink}" class="footer-link">${APP_CONFIG.APP_NAME}</a> | 
        GLA University Campus Memories
      </p>
      <p class="footer-text" style="font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} GLA University. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text email body (fallback)
 */
export function generateEmailText(data: EmailTemplateData): string {
  const { title, message, link } = data

  let text = `${APP_CONFIG.APP_NAME}\n${"=".repeat(50)}\n\n`
  text += `${title}\n\n`
  text += `${message}\n\n`

  if (link) {
    text += `View details: ${link}\n\n`
  }

  text += `${"=".repeat(50)}\n`
  text += `This is an automated notification from ${APP_CONFIG.APP_NAME}.\n`
  text += `© ${new Date().getFullYear()} GLA University. All rights reserved.`

  return text
}
