# 🎓 CampusHub
![CampusHub Logo](./public/logo.png)
> **Multi-Tenant Campus Engagement SaaS Platform**  
> A full-stack web application empowering universities to digitize campus life. Manage events, orchestrate hackathons, run student clubs, generate NAAC reports, and build a thriving campus community with instant self-serve onboarding.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?logo=opensourceinitiative)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?logo=github)


---

## ✨ Features

### 📸 Gallery & Social
- **Stories** — Share ephemeral photo/video stories (24-hour auto-expiry)
- **User Profiles** — Customizable profiles with social links, badges, and activity
- **Bookmarks** — Save posts for later viewing
- **Follow System** — Follow friends and get updates in your feed

### 🗣️ Campus Confessions Feed
- **Anonymous Feed** — Endless scrolling viral social feed for campus secrets and stories
- **Reddit-style Voting** — Upvote/downvote system for hot takes and confessions
- **Interactive Polls** — Real-time progress bars for campus-wide opinions
- **Threaded Replies** — Anonymous threaded conversations
- **Lenient Moderation** — Automated content scoring with Super Admin identity reveal capabilities

### 📅 Campus Event Hub
- **Event Discovery** — Browse upcoming workshops, hackathons, and cultural fests
- **Digital Ticketing** — QR-coded tickets generated instantly upon registration
- **RSVP & Waitlist** — Manage capacity, deadlines, and auto-promote from waitlists
- **Calendar Export** — Download `.ics` files for any event
- **No-Show Penalty System** — Reliability scoring and automatic restrictions for repeat no-shows
- **Event Feedback** — Post-event feedback collection system
- **Check-in System** — QR-based check-in at venue entry

### 🏆 Hackathon Management
- **Create Hackathons** — Admins can organize multi-phase hackathon events
- **Team Registration** — Students form and manage teams
- **Project Submissions** — Submit with GitHub links, demos, videos, and descriptions
- **Judging System** — Multi-criteria scoring by assigned judges
- **Live Leaderboard** — Real-time ranking of teams
- **Mentorship System** — Assign mentors to teams
- **Timeline & Schedule** — Detailed hackathon schedule with milestones
- **QR Check-in** — Team QR codes for venue entry with sound effects

### 🏫 Clubs & Societies
- **Club Directory** — Browse and join campus clubs with dedicated pages
- **Club Management** — Cover images, logos, announcements, member management
- **Club Verification** — Official verification workflow with ✅ Verified Badge
- **Role-based Access** — President, Vice President, Secretary, Treasurer, and Member roles
- **Club Analytics** — Engagement metrics and member stats for club admins
- **Recruitment System** — Open/close recruitment periods for clubs
- **Election Manager** — Organize club elections digitally

### 🎮 Gamification
- **Points System** — Earn points for uploads, likes, comments, and attendance
- **Levels & Badges** — Progress through levels and unlock achievements (Bronze/Silver/Gold)
- **Login Streaks** — Maintain daily login streaks for bonus points
- **Leaderboard** — Campus-wide competition rankings

### 🎁 Rewards Store
- **Redeem Points** — Exchange earned points for digital/physical rewards
- **Catalog System** — Browse rewards by category (Digital, Physical, Privilege)
- **Redemption Tracking** — Track status of orders (Pending → Fulfilled)
- **Points Wallet** — Full transaction history with earnings and spendings
- **Admin Management** — Create, edit, and manage rewards stock

### 🔔 Notifications & Emails
- **Automated Welcome Emails** — Beautiful, personalized onboarding emails sent instantly to new users.
- **Push Notifications** — Real-time browser alerts via Firebase Cloud Messaging
- **In-App Notifications** — Likes, comments, follows, event reminders
- **Email Notifications** — Broadcast emails, reward fulfillment, and announcements
- **Notification Center** — Centralized inbox with read/unread states

### 👨‍💼 Super Admin & Organization Panels
- **Multi-Tenant Architecture** — Super Admins get global visibility; Org Admins see only their institution's data.
- **Tenant Management Dashboard** — Provision new tenants, configure subdomains, customize primary brand colors, and suspend/activate tenants instantly.
- **Self-Serve College Onboarding** — Institutions can sign up and launch their branded subdomain in under 2 minutes.
- **NAAC/NBA Report Generator** — One-click PDF export of accreditation-ready reports covering events, clubs, and student engagement metrics.
- **User Management** — View, search, and manage scoped users with role toggles
- **Event & Hackathon Management** — Oversee all events, process no-shows, export attendee lists
- **Club Verification Dashboard** — Approve or reject club verification requests
- **Academic Calendar Manager** — Manage university academic dates
- **Broadcast Emails** — Send targeted announcements to All/Selected users within your tenant
- **Analytics Dashboard** — Visualize platform stats with charts
- **QR Scanner** — Built-in scanner for event and hackathon check-ins
- **Health Monitoring** — System health and API status checks
- **Security Reports** — Audit logs and security event tracking

### 🔒 Security & Privacy
- **Dynamic Tenant Routing** — Users are automatically routed to their institution's workspace based on their email domain.
- **2FA Protection** — Optional Email OTP for sensitive actions
- **Rate Limiting** — Per-IP limits on OTP, uploads, comments, and likes (via Upstash Redis)
- **CSP & Security Headers** — Strict Content Security Policy, X-Frame-Options, HSTS
- **Input Sanitization** — DOMPurify-based protection against XSS/injection
- **Audit Logging** — Security event logging for critical admin actions
- **Privacy Controls** — Profile visibility and data settings
- **Firebase Security Rules** — Granular Firestore & Storage rules

### ⌨️ Developer Experience
- **Command Menu** — `Ctrl+K` quick search and navigation
- **Storybook** — Component library documentation
- **Vitest + Playwright** — Unit, integration, and browser tests
- **TypeDoc** — API documentation generation
- **GitHub Actions** — CI/CD pipeline

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router + Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | Radix UI + shadcn/ui |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth (Google OAuth) |
| **Storage** | Firebase Storage |
| **Rate Limiting** | Upstash Redis |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Email** | Nodemailer (SMTP) |
| **QR Codes** | qrcode.react + html5-qrcode |
| **PDF** | jsPDF |
| **Testing** | Vitest + Playwright + Storybook |
| **Deployment** | Vercel |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm 8+ (recommended) or npm
- Firebase project with Firestore, Auth, and Storage enabled

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ask8962/glagallery.git
   cd glagallery
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your values:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # App Configuration
   NEXT_PUBLIC_APP_URL=https://campushub.pro

   # Security
   JWT_SECRET=your_jwt_secret_here

   # Rate Limiting (Upstash Redis)
   UPSTASH_REDIS_REST_URL=your_upstash_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_token

   # Email (Optional — for 2FA & broadcasts)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

4. **Run development server**
   ```bash
   pnpm dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 🔐 Security

| Protection | Details |
|-----------|---------|
| **Tenant Routing** | Domain-based resolution (e.g. `@college.edu`) to isolate organizational data |
| **2FA (Email OTP)** | 6-digit server-generated codes, 5 req/hr limit |
| **API Rate Limiting** | Uploads: 10/hr, Comments: 50/hr, Likes: 100/hr per IP |
| **Security Headers** | CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy |
| **Input Sanitization** | DOMPurify for all user-generated content |
| **Firebase Rules** | Granular read/write rules per collection |
| **RBAC** | Student, Admin, Super Admin role segregation |
| **Session Security** | Inactivity timeout, concurrent login detection, and forced auto-logout |

---

## 📁 Project Structure

```
glagallery/
├── app/                        # Next.js App Router pages
│   ├── admin/                  # Admin dashboard
│   │   ├── analytics/          # Platform analytics
│   │   ├── health/             # System health monitoring
│   │   ├── reports/            # Security reports
│   │   ├── rewards/            # Rewards management
│   │   └── scanner/            # QR scanner
│   ├── api/                    # Server-side API routes
│   │   ├── academic-calendar/  # Calendar management
│   │   ├── admin/              # Admin endpoints
│   │   ├── auth/               # Auth & 2FA endpoints
│   │   ├── clubs/              # Club CRUD & verification
│   │   ├── events/             # Events, RSVP, tickets
│   │   ├── faculty/            # Faculty verification
│   │   ├── notifications/      # Push & in-app notifications
│   │   ├── points/             # Points history
│   │   └── rewards/            # Rewards & redemptions
│   ├── changelog/              # Release notes
│   ├── clubs/                  # Club directory & management
│   ├── confessions/            # Anonymous campus feed
│   ├── events/                 # Campus events
│   ├── hackathons/             # Hackathon platform
│   ├── profile/                # User profile & resume builder
│   ├── rewards/                # Rewards store & wallet
│   └── search/                 # User search
├── components/                 # Reusable UI components
│   ├── admin/                  # Admin-specific components
│   ├── clubs/                  # Club components
│   ├── confessions/            # Confession feed components
│   ├── events/                 # Event components
│   ├── hackathons/             # Hackathon components
│   ├── profile/                # Profile components
│   ├── scanner/                # QR scanner components
│   ├── skeletons/              # Loading skeletons
│   ├── stories/                # Story components
│   └── ui/                     # shadcn/ui primitives
├── context/                    # React Context providers
├── lib/                        # Core utilities & configs
├── __tests__/                  # Test suites
├── stories/                    # Storybook stories
└── docs/                       # Documentation
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all `.env.local` variables in Vercel dashboard
4. Deploy!

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Google provider), **Firestore**, and **Storage**
3. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,storage:rules
   ```

---

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 👨‍💻 Author

**Anukalp Gupta**  
CampusHub  
Website: [https://campushub.pro/](https://campushub.pro/)  
Email: [team@campushub.pro](mailto:team@campushub.pro)  
[GitHub: @ask8962](https://github.com/ask8962)

---

<p align="center">
  Made with ❤️ for Campuses Everywhere
</p>
