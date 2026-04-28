# 🎨 GLA Gallery - App Wireframe Workflow

## Overview
GLA Gallery is a campus community platform for CampusHub students featuring photo sharing, event management, hackathons, clubs, and rewards.

---

## 🌐 Application Flow Diagram

```mermaid
flowchart TB
    subgraph Entry["🚀 Entry Point"]
        LP[Landing Page] --> AUTH{Authenticated?}
        AUTH -->|No| LOGIN[Login Page]
        AUTH -->|Yes| HOME
    end
    
    subgraph Auth["🔐 Authentication"]
        LOGIN --> GLA_EMAIL[Enter GLA Email]
        GLA_EMAIL --> OTP[Verify OTP]
        OTP --> PROFILE_SETUP[Complete Profile]
        PROFILE_SETUP --> HOME
    end
    
    subgraph Main["📱 Main App"]
        HOME[Home Feed] --> GALLERY
        HOME --> EVENTS
        HOME --> HACKATHONS
        HOME --> CLUBS
        HOME --> PROFILE
        HOME --> REWARDS
    end
    
    subgraph Gallery["🖼️ Gallery Module"]
        GALLERY[Gallery Feed] --> POST_VIEW[View Post]
        GALLERY --> UPLOAD[Upload Media]
        GALLERY --> ALBUMS[Albums]
        POST_VIEW --> COMMENTS[Comments]
        POST_VIEW --> SHARE[Share]
        POST_VIEW --> SAVE[Save to Collection]
        ALBUMS --> ALBUM_CREATE[Create Album]
        ALBUMS --> ALBUM_VIEW[View Album]
    end
    
    subgraph EventsModule["📅 Events Module"]
        EVENTS[Events List] --> EVENT_DETAILS[Event Details]
        EVENT_DETAILS --> REGISTER[Register]
        EVENT_DETAILS --> WAITLIST[Join Waitlist]
        EVENT_DETAILS --> CALENDAR[Add to Calendar]
        REGISTER --> QR_TICKET[Get QR Ticket]
    end
    
    subgraph HackModule["💻 Hackathons"]
        HACKATHONS[Hackathon List] --> HACK_DETAILS[Hackathon Details]
        HACK_DETAILS --> HACK_REGISTER[Register Team]
        HACK_DETAILS --> SCHEDULE[View Schedule]
        HACK_DETAILS --> SPONSORS[View Sponsors]
        HACK_REGISTER --> TEAM_CHAT[Team Chat]
        HACK_REGISTER --> SUBMISSION[Submit Project]
    end
    
    subgraph ClubsModule["🏢 Clubs"]
        CLUBS[Clubs Directory] --> CLUB_PAGE[Club Profile]
        CLUB_PAGE --> CLUB_JOIN[Join Club]
        CLUB_PAGE --> CLUB_DOCS[Documents]
        CLUB_PAGE --> CLUB_EVENTS[Club Events]
        CLUB_PAGE --> ANNOUNCEMENTS[Announcements]
    end
    
    subgraph RewardsModule["🎁 Rewards"]
        REWARDS[Rewards Store] --> REWARD_ITEM[View Reward]
        REWARD_ITEM --> REDEEM[Redeem Points]
        REWARDS --> POINTS_HISTORY[Transaction History]
    end
    
    subgraph ProfileModule["👤 Profile"]
        PROFILE[My Profile] --> EDIT_PROFILE[Edit Profile]
        PROFILE --> MY_POSTS[My Posts]
        PROFILE --> MY_TICKETS[My Tickets]
        PROFILE --> SETTINGS[Settings]
        PROFILE --> NOTIFICATIONS[Notifications]
    end
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant LP as Landing Page
    participant API as Auth API
    participant FB as Firebase
    participant DB as Firestore
    
    U->>LP: Visit app
    LP->>U: Show landing page
    U->>LP: Click "Login"
    LP->>U: Show email input
    U->>API: Submit GLA email
    API->>API: Validate @gla.ac.in
    API->>U: Send OTP via email
    U->>API: Enter OTP
    API->>FB: Verify & create session
    FB->>DB: Create/update user profile
    DB->>U: Redirect to home
```

---

## 📱 Screen Hierarchy

```mermaid
graph TD
    subgraph Public["Public Routes"]
        A1["/"] --> A2["Landing Page"]
        A3["/login"] --> A4["Auth Flow"]
    end
    
    subgraph Protected["Protected Routes - Requires Auth"]
        B1["/home"] --> B2["Feed + Stories"]
        B3["/gallery"] --> B4["Photo/Video Grid"]
        B5["/gallery/albums"] --> B6["Album Browser"]
        B7["/events"] --> B8["Event Cards"]
        B9["/events/:id"] --> B10["Event Detail + Register"]
        B11["/hackathons"] --> B12["Hackathon List"]
        B13["/hackathons/:id"] --> B14["Hack Detail + Team"]
        B15["/clubs"] --> B16["Club Directory"]
        B17["/clubs/:id"] --> B18["Club Profile"]
        B19["/rewards"] --> B20["Rewards Store"]
        B21["/profile"] --> B22["User Profile"]
        B23["/profile/:uid"] --> B24["Other User Profile"]
        B25["/search"] --> B26["Global Search"]
        B27["/assistant"] --> B28["AI Chat Interface"]
    end
    
    subgraph Admin["Admin Routes"]
        C1["/admin"] --> C2["Dashboard"]
        C3["/admin/users"] --> C4["User Management"]
        C5["/admin/moderation"] --> C6["Content Moderation"]
        C7["/admin/clubs"] --> C8["Club Management"]
        C9["/admin/scanner"] --> C10["QR Ticket Scanner"]
        C11["/admin/analytics"] --> C12["Platform Analytics"]
        C13["/admin/rewards"] --> C14["Rewards Management"]
    end
```

---

## 🎯 Core User Journeys

### Journey 1: New User Onboarding
```
Landing Page → Login → Enter GLA Email → Verify OTP → Setup Profile → Home Feed
```

### Journey 2: Post Upload
```
Home → Upload Button → Select Media → Add Caption/Tags → Choose Visibility → Publish → View in Feed
```

### Journey 3: Event Registration
```
Events → Browse Events → View Details → Click Register → Confirm → Receive QR Ticket → Add to Calendar
```

### Journey 4: Hackathon Participation
```
Hackathons → View Details → Create Team → Invite Members → Build Project → Submit → View Leaderboard
```

### Journey 5: Club Engagement
```
Clubs → Search Club → View Profile → Join → Access Documents → View Announcements → Attend Events
```

### Journey 6: Redeem Rewards
```
Profile → View Points → Rewards Store → Select Reward → Confirm Redemption → Collect
```

---

## 🏗️ Component Architecture

| Module | Key Components | Data Source |
|--------|---------------|-------------|
| **Auth** | LoginForm, OTPInput, ProfileSetup | Firebase Auth |
| **Gallery** | PostCard, ImageGrid, UploadDialog, AlbumCard | Firestore `posts`, `albums` |
| **Events** | EventCard, RegisterButton, WaitlistButton, QRTicket | Firestore `events`, `tickets` |
| **Hackathons** | HackathonCard, TeamForm, SubmissionForm, Leaderboard | Firestore `hackathons` |
| **Clubs** | ClubCard, ClubDocuments, AnnouncementFeed | Firestore `clubs` |
| **Rewards** | RewardCard, PointsDisplay, RedemptionHistory | Firestore `rewards`, `redemptions` |
| **Admin** | UserTable, ModerationQueue, AlbumsManager, SponsorsEditor | All collections |

---

## 📊 Data Flow

```mermaid
flowchart LR
    subgraph Client["Frontend (Next.js)"]
        UI[React Components]
        CTX[Auth Context]
        HOOK[Custom Hooks]
    end
    
    subgraph API["API Routes"]
        AUTH_API["/api/auth/*"]
        EVENT_API["/api/events/*"]
        HACK_API["/api/hackathons/*"]
        CLUB_API["/api/clubs/*"]
        REWARD_API["/api/rewards/*"]
    end
    
    subgraph Backend["Firebase"]
        FB_AUTH[Firebase Auth]
        FIRESTORE[Firestore DB]
        STORAGE[Cloud Storage]
    end
    
    UI --> HOOK
    HOOK --> CTX
    CTX --> FB_AUTH
    UI --> API
    API --> FIRESTORE
    API --> STORAGE
```

---

## 🎨 Key UI States

| Screen | Empty State | Loading | Error | Success |
|--------|-------------|---------|-------|---------|
| Feed | "No posts yet" | Skeleton grid | Toast error | Posts display |
| Events | "No events" | Skeleton cards | Retry button | Event cards |
| Clubs | "Join a club!" | Loading spinner | Alert | Club list |
| Tickets | "No tickets" | Shimmer effect | Snackbar | QR codes |
| Albums | "Create first album" | Skeleton | Toast | Album grid |

---

*This workflow represents the complete user experience across GLA Gallery.*
