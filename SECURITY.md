# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in CampusHub, please report it responsibly:

1. **Email**: Send details to [ganukalp70@gmail.com](mailto:ganukalp70@gmail.com)
2. **Subject**: Use "SECURITY: [Brief Description]"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

## Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days (depending on severity)

## Security Measures

This project implements the following security measures:

- **Authentication**: Firebase Auth with GLA email restriction
- **Two-Factor Authentication**: Optional email OTP 2FA
- **Rate Limiting**: Redis-based rate limiting on sensitive endpoints
- **Input Validation**: Server-side validation on all API routes
- **HTTPS Only**: Enforced via Vercel deployment
- **Secure Cookies**: HttpOnly, Secure, SameSite attributes
- **CORS**: Restricted to allowed origins
- **Firebase Security Rules**: Role-based access control

## Disclosure Policy

We follow responsible disclosure practices. We ask that you:

1. Do not publicly disclose until we've addressed the issue
2. Do not access data that doesn't belong to you
3. Act in good faith

Thank you for helping keep CampusHub secure! 🔒
