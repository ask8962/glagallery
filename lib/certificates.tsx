/**
 * Certificate Generation Utilities
 *
 * Generate and manage certificates for hackathon participants and winners.
 */

export interface CertificateData {
  id: string
  recipientName: string
  recipientEmail: string
  recipientUid: string
  hackathonId: string
  hackathonTitle: string
  teamName: string
  teamId: string
  position: "winner" | "runner-up" | "third" | "participant"
  issueDate: Date
  verified: boolean
}

/**
 * Generate a certificate HTML that can be converted to PDF or printed
 */
export function generateCertificateHTML(data: CertificateData): string {
  const positionText =
    data.position === "winner"
      ? "1st Place Winner"
      : data.position === "runner-up"
        ? "2nd Place Runner-up"
        : data.position === "third"
          ? "3rd Place"
          : "Participant"

  const borderColor = data.position === "winner" ? "#efb810" : data.position === "runner-up" ? "#c0c0c0" : "#cd7f32"

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificate - ${data.hackathonTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Georgia', serif;
      background: #f7f4eb;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .certificate {
      width: 100%;
      max-width: 800px;
      background: white;
      border: 8px double ${borderColor};
      padding: 60px;
      position: relative;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    
    .certificate::before {
      content: '';
      position: absolute;
      inset: 15px;
      border: 2px solid ${borderColor};
      pointer-events: none;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #0b1b36;
      margin-bottom: 10px;
    }
    
    .title {
      font-size: 48px;
      color: #0b1b36;
      font-family: 'Times New Roman', serif;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 18px;
      color: #666;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    
    .body {
      text-align: center;
      margin: 40px 0;
    }
    
    .presented-to {
      font-size: 16px;
      color: #666;
      margin-bottom: 20px;
    }
    
    .recipient-name {
      font-size: 36px;
      color: #0b1b36;
      font-family: 'Brush Script MT', cursive;
      border-bottom: 2px solid ${borderColor};
      padding-bottom: 10px;
      display: inline-block;
      margin-bottom: 20px;
    }
    
    .achievement {
      font-size: 18px;
      color: #333;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    
    .position {
      font-size: 28px;
      color: ${borderColor};
      font-weight: bold;
      margin: 20px 0;
    }
    
    .hackathon-name {
      font-size: 24px;
      color: #0b1b36;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .team-name {
      font-size: 16px;
      color: #666;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 30px;
    }
    
    .signature {
      text-align: center;
      flex: 1;
    }
    
    .signature-line {
      width: 200px;
      height: 1px;
      background: #333;
      margin: 0 auto 10px;
    }
    
    .signature-title {
      font-size: 14px;
      color: #666;
    }
    
    .date {
      text-align: center;
      flex: 1;
    }
    
    .date-value {
      font-size: 18px;
      color: #0b1b36;
      margin-bottom: 5px;
    }
    
    .date-label {
      font-size: 14px;
      color: #666;
    }
    
    .certificate-id {
      text-align: center;
      margin-top: 30px;
      font-size: 12px;
      color: #999;
    }
    
    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: #e8f5e9;
      color: #2e7d32;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      margin-top: 15px;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .certificate {
        box-shadow: none;
        max-width: none;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">GLA University</div>
      <h1 class="title">Certificate</h1>
      <p class="subtitle">of Achievement</p>
    </div>
    
    <div class="body">
      <p class="presented-to">This certificate is proudly presented to</p>
      <h2 class="recipient-name">${data.recipientName}</h2>
      
      <p class="achievement">
        For outstanding performance and achievement in
      </p>
      
      <h3 class="hackathon-name">${data.hackathonTitle}</h3>
      <p class="team-name">Team: ${data.teamName}</p>
      
      <p class="position">${positionText}</p>
    </div>
    
    <div class="footer">
      <div class="signature">
        <div class="signature-line"></div>
        <p class="signature-title">Organizer Signature</p>
      </div>
      
      <div class="date">
        <p class="date-value">${formatDate(data.issueDate)}</p>
        <p class="date-label">Date of Issue</p>
      </div>
      
      <div class="signature">
        <div class="signature-line"></div>
        <p class="signature-title">University Representative</p>
      </div>
    </div>
    
    <div class="certificate-id">
      Certificate ID: ${data.id}
      ${data.verified ? '<div class="verified-badge"><span>✓</span> Verified</div>' : ""}
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Format date for certificate
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Generate a unique certificate ID
 */
export function generateCertificateId(hackathonId: string, teamId: string, recipientUid: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `CERT-${hackathonId.substring(0, 4).toUpperCase()}-${timestamp}-${random}`.toUpperCase()
}

/**
 * Verify certificate authenticity (placeholder for database verification)
 */
export async function verifyCertificate(certificateId: string): Promise<{
  valid: boolean
  data?: CertificateData
  error?: string
}> {
  // In production, this would verify against a database
  // For now, return a placeholder
  return {
    valid: true,
    error: "Certificate verification not implemented yet",
  }
}
