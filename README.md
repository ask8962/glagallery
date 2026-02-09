# 🎓 GLA Gallery

> **Campus Memories & Hackathon Management Platform**  
> A modern web application for GLA University students to share campus moments and participate in hackathons.

![Next.js](https://img.shields.io/badge/Next.js-15.2-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-12.7-orange?logo=firebase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?logo=opensourceinitiative)
![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?logo=github)
[![GitHub Stars](https://img.shields.io/github/stars/ask8962/glagallery?style=social)](https://github.com/ask8962/glagallery)

---

## ✨ Features

### 📅 Campus Event Hub
- **Event Discovery** - Browse upcoming workshops, hackathons, and cultural fests
- **Smart Calendar** - Monthly view of all campus activities
- **Digital Ticketing** - QR-coded tickets generated instantly upon registration
- **RSVP System** - Manage capacity and registration deadlines
- **🆕 No-Show Penalty System**
  - **Reliability Score** - Users earn trust by attending events they book
  - **Automatic Restrictions** - Penalizes repeat no-shows to ensure fair access
  - **Badges** - Visual reliability indicators (Excellent/Good/Fair/Poor) on profiles

### 📸 Gallery & Social
- **Photo & Video Uploads** - Share campus memories with compression support
- **Like & Comment System** - Engage with posts from fellow students
- **User Profiles** - Customizable profiles with social links
- **Tagging & Hashtags** - Organize content with tags and trending hashtags
- **Bookmarks** - Save posts for later viewing
- **Follow System** - Follow your friends and get updates
- **🆕 Social Share** - One-click share to WhatsApp, Twitter, Facebook, LinkedIn

### 🏆 Hackathon Management
- **Create Hackathons** - Admins can organize hackathon events
- **Team Registration** - Students can form teams and register
- **Project Submissions** - Submit projects with GitHub links, demos, videos
- **Judging System** - Judges score submissions with customizable criteria
- **Live Leaderboard** - Real-time ranking of teams
- **🆕 QR Check-in** - Teams get unique QR codes for venue entry
  - Sound effects on successful scan
  - Print roster for organizers

### 🎮 Gamification
- **Points System** - Earn points for uploads, likes, comments
- **Levels & Badges** - Progress through levels and unlock achievements
- **Login Streaks** - Maintain daily login streaks
- **Leaderboard** - Compete with other students

### 🎁 Rewards Store
- **Redeem Points** - Exchange earned points for digital/physical rewards
- **Catalog System** - Browse rewards by category (Digital, Physical, Privilege)
- **Redemption History** - Track status of your orders
- **Admin Management** - Admins can manage stock and fulfill orders

### 🔔 Notifications
- **🆕 Push Notifications** - Real-time browser/mobile alerts via Firebase Cloud Messaging
- **In-App Notifications** - Get notified about likes, comments, follows
- **Email Notifications** - Optional email alerts for important events
- **Hackathon Updates** - Deadline reminders and announcements

### 👨‍💼 Admin Panel
- **User Management** - View and manage all users
- **Event Management** - View all events, process no-shows, and export attendee lists
- **📢 Broadcast Emails** - Send targeted announcements to users (All/Selected)
- **Content Moderation** - Review reported content
- **Analytics Dashboard** - Visualize platform statistics
- **QR Scanner** - Built-in scanner for event and hackathon check-ins

### 🔒 Security & Privacy
- **Secure Auth** - Firebase Google Sign-In with strict email domain restrictions (@gla.ac.in)
- **2FA Protection** - Optional Email OTP for sensitive actions
- **Rate Limiting** - Advanced API rate limiting to prevent abuse
- **CSP & Headers** - Strict Content Security Policy and security headers
- **Audit Logging** - Comprehensive security logging for critical actions
- **Input Sanitization** - Robust protection against injection attacks
- **Privacy Controls** - Users can manage profile visibility and data settings

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | Radix UI + shadcn/ui |
| **Database** | Firebase Firestore |
| **Authentication** | Firebase Auth (Google) |
| **Storage** | Firebase Storage |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Deployment** | Vercel |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Firebase project

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
   
   Create a `.env.local` file:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # App Configuration
   NEXT_PUBLIC_APP_URL=https://glagallery.vercel.app
   
   # Security
   JWT_SECRET=your_jwt_secret_here
   
   # Email (Optional)
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

- **GLA Email Restriction**: Only users with `@gla.ac.in` emails can sign in.
- **Email OTP 2FA**: Optional Two-Factor Authentication using server-side generated 6-digit codes.
- **API Rate Limiting**:
  - **OTP Requests**: Limited to 5 requests per hour per IP.
  - **OTP Verification**: Limited to 10 attempts per hour per IP.
  - **General APIs**: Uploads (10/hr), Comments (50/hr), Likes (100/hr) are all ratelimited by IP to prevent spam.
- **Secure Cookies**: Auth cookies are set with `httpOnly`, `secure` (in production), and `SameSite` attributes to prevent XSS and CSRF attacks.
- **Firebase Security Rules**: Granular database & storage rules ensuring users can only edit their own data.
- **Role-Based Access Control**: Strict segregation between Student and Admin privileges.

---

## 📁 Project Structure

```
glagallery/
├── app/                        # Next.js App Router pages
│   ├── about/                  # About page
│   ├── admin/                  # Admin dashboard
│   │   ├── analytics/          # Platform analytics
│   │   ├── email-logs/         # Email delivery logs
│   │   ├── reports/            # Content moderation
│   │   └── scanner/            # Event/Hackathon QR scanner
│   ├── api/                    # Server-side API routes
│   ├── changelog/              # Release notes
│   ├── contact/                # Contact form
│   ├── events/                 # Campus Event Hub
│   │   ├── [id]/               # Event details
│   │   ├── create/             # Create new event
│   │   └── my-tickets/         # User's tickets
│   ├── faq/                    # Frequently Asked Questions
│   ├── gallery/                # Main photo gallery
│   ├── hackathons/             # Hackathon Management
│   │   ├── [id]/               # Hackathon details
│   │   │   ├── check-in/       # Team QR check-in
│   │   │   ├── judge/          # Submission judging
│   │   │   ├── register/       # Team registration
│   │   │   ├── submit/         # Project submission
│   │   │   └── team/           # Team workspace
│   │   └── create/             # Create new hackathon
│   ├── privacy/                # Privacy Policy
│   ├── profile/                # User profiles & settings
│   ├── search/                 # User search
│   ├── terms/                  # Terms of Service
│   ├── trending/               # Trending posts
│   ├── upload/                 # Post upload
│   └── verify-2fa/             # 2FA verification
├── components/                 # Reusable UI components
│   ├── admin/                  # Admin-specific components
│   ├── events/                 # Event-related components
│   ├── hackathons/             # Hackathon-specific components
│   ├── profile/                # Profile components
│   └── ui/                     # shadcn/ui library components
└── lib/                        # Core utilities & configs
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Add all `.env.local` variables to your Vercel project settings.

---

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Anukalp Gupta**  
GLA University, Mathura  
[anukalp.gupta_cs23@gla.ac.in](mailto:anukalp.gupta_cs23@gla.ac.in)

---

<p align="center">
  Made with ❤️ for GLA University
</p>
