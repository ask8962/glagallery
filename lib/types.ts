// Expanded role hierarchy for institutional support
export type Role =
  | "student"           // Regular student
  | "faculty"           // Professor/Lecturer
  | "staff"             // Administrative staff
  | "club_advisor"      // Faculty who advises clubs
  | "department_head"   // HOD/Department coordinator
  | "dean"              // Dean of faculty
  | "admin"             // Platform admin
  | "super_admin"       // Full access

// Department list for GLA University
export type Department =
  | "Computer Science"
  | "Information Technology"
  | "Electronics & Communication"
  | "Electrical Engineering"
  | "Mechanical Engineering"
  | "Civil Engineering"
  | "Biotechnology"
  | "Pharmacy"
  | "Management"
  | "Law"
  | "Agriculture"
  | "Basic Sciences"
  | "Humanities"
  | "Other"

// Faculty-specific profile extension
export type FacultyProfile = {
  department: Department
  designation: string          // e.g., "Assistant Professor"
  employeeId?: string          // University employee ID
  cabinNumber?: string
  officeHours?: string
  advisedClubs?: string[]      // Club IDs this faculty advises
  subjects?: string[]
  researchAreas?: string[]
  publications?: number
  isVerified: boolean          // Admin verified
  verifiedAt?: any
  verificationRequest?: {
    status: "pending" | "approved" | "rejected"
    submittedAt: any
    reviewedAt?: any
    reviewedBy?: string
    rejectionReason?: string
  }
}

export type Badge = {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt?: any
}

export type SocialLinks = {
  instagram?: string
  twitter?: string
  linkedin?: string
  github?: string
  website?: string
}

export type PrivacySettings = {
  profileVisibility: "public" | "private" | "followers"
  showEmail: boolean
  showActivity: boolean
  allowFollowRequests: boolean
}

export type NotificationPreferences = {
  emailNotifications: boolean
  likeNotifications: boolean
  commentNotifications: boolean
  followNotifications: boolean
  hackathonNotifications: boolean
  mentionNotifications: boolean
}

export type UserProfile = {
  uid: string
  name: string
  email: string
  role: Role
  photoURL?: string
  bio?: string
  socialLinks?: SocialLinks
  privacySettings?: PrivacySettings
  notificationPreferences?: NotificationPreferences
  followers?: string[]
  following?: string[]
  // Gamification
  points?: number
  level?: number
  badges?: Badge[]
  streak?: number
  lastActive?: any
  // Moderation
  warnings?: number
  restricted?: boolean
  restrictedUntil?: any
  // 2FA
  twoFactorEnabled?: boolean
  // Push Notifications
  fcmTokens?: string[]
  // Event Attendance Tracking (No-Show System)
  eventStats?: {
    registered: number      // Total events registered
    attended: number        // Events where ticket was used (checked in)
    noShows: number         // Events registered but didn't attend
    lastNoShowAt?: any      // Timestamp of last no-show
  }
  reliabilityScore?: number // 0-100, calculated from stats
  eventRestricted?: boolean // If true, can't register for paid events
  // Faculty/Staff specific
  facultyProfile?: FacultyProfile
}

export type Comment = {
  uid: string
  text: string
  name: string
  photoURL?: string
  createdAt: any
  hidden?: boolean
  moderationScore?: number
  flagged?: boolean
}

export type Post = {
  id: string
  mediaURL: string
  mediaType: "image" | "video"
  uploaderUid: string
  uploaderName: string
  uploaderPhotoURL?: string
  title: string
  description?: string
  tags: string[]
  hashtags?: string[]
  taggedUsers?: string[]
  likes: string[]
  comments: Comment[]
  bookmarkedBy?: string[]
  createdAt: any
  trendingScore?: number
  // Moderation
  status?: "pending" | "approved" | "removed" | "flagged"
  moderationScore?: number
  reportCount?: number
}

// Hackathon Management System Types
export type HackathonStatus = "upcoming" | "registration" | "active" | "judging" | "completed"

export type Hackathon = {
  id: string
  title: string
  description: string
  theme?: string
  rules?: string[]
  prizes?: string[]
  startDate: any
  endDate: any
  registrationDeadline: any
  submissionDeadline: any
  maxTeamSize: number
  minTeamSize: number
  status: HackathonStatus
  organizerUid: string
  organizerName: string
  judges?: string[]
  categories?: string[]
  createdAt: any
  updatedAt?: any
  bannerURL?: string
  location?: string
  isOnline: boolean
  registrationOpen: boolean
  // Detailed Schedule
  schedule?: {
    time: string
    title: string
    description?: string
    speaker?: string
  }[]
  // Sponsors
  sponsors?: Sponsor[]
}

// Hackathon Sponsor
export type SponsorTier = "platinum" | "gold" | "silver" | "bronze" | "partner"

export type Sponsor = {
  id: string
  name: string
  logoURL: string
  tier: SponsorTier
  website?: string
  description?: string
}

export type Team = {
  id: string
  hackathonId: string
  name: string
  members: TeamMember[]
  leaderUid: string
  leaderName: string
  projectName?: string
  projectDescription?: string
  projectURL?: string
  repositoryURL?: string
  demoVideoURL?: string
  presentationURL?: string
  technologies?: string[]
  createdAt: any
  submittedAt?: any
  status: "registered" | "submitted" | "disqualified"
}

export type TeamMember = {
  uid: string
  name: string
  email: string
  photoURL?: string
  role?: string
  joinedAt: any
}

export type Submission = {
  id: string
  hackathonId: string
  teamId: string
  teamName: string
  projectName: string
  projectDescription: string
  projectURL?: string
  repoUrl?: string       // Standardized from repositoryURL
  demoUrl?: string       // Standardized from demoVideoURL
  videoUrl?: string      // Added for video URL
  presentationURL?: string
  screenshots?: string[]
  technologies?: string[]
  submittedAt: any
  submittedBy: string
}

export type JudgingCriteria = {
  id: string
  name: string
  description: string
  maxScore: number
  weight?: number
}

export type JudgeScore = {
  judgeUid: string
  judgeName: string
  criteria: Record<string, number>
  totalScore: number
  comments?: string
  scoredAt: any
}

export type HackathonJudging = {
  hackathonId: string
  submissionId: string
  teamId: string
  scores: JudgeScore[]
  averageScore: number
  finalRank?: number
  finalStatus?: "pending" | "winner" | "runner-up" | "participant"
  winnerCategory?: string
  updatedAt: any
}

// Notification types
export type NotificationType =
  | "team_invite"
  | "team_joined"
  | "hackathon_registration"
  | "hackathon_update"
  | "submission_deadline"
  | "judging_complete"
  | "comment"
  | "like"
  | "mention"
  | "follow"
  | "badge"
  | "welcome"

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  readAt?: any
  createdAt: any
  metadata?: {
    hackathonId?: string
    teamId?: string
    postId?: string
    commentId?: string
    fromUserId?: string
    fromUserName?: string
  }
}

export type EmailLog = {
  id: string
  userId: string
  email: string
  notificationId: string
  notificationType: NotificationType
  status: "pending" | "sent" | "failed"
  error?: string
  sentAt?: any
  createdAt: any
}

// Activity Feed Types
export type ActivityType =
  | "post_uploaded"
  | "post_liked"
  | "post_commented"
  | "comment_received"
  | "like_received"
  | "badge_unlocked"
  | "level_up"
  | "followed"
  | "followed_by"

export type Activity = {
  id: string
  userId: string
  type: ActivityType
  title: string
  description: string
  icon?: string
  link?: string
  metadata?: {
    postId?: string
    commentId?: string
    badgeId?: string
    targetUserId?: string
    targetUserName?: string
  }
  createdAt: any
}

// Report types
export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed"

// Event Hub Types
export type EventOrganizer = {
  name: string
  email: string
  photoURL?: string
  phone?: string
  website?: string
  socialLinks?: SocialLinks
}

export type EventStatus = "draft" | "published" | "cancelled" | "completed"

export type EventVenueType = "on-campus" | "online" | "hybrid"

export type Event = {
  id: string
  title: string
  slug: string
  description: string
  shortDescription: string
  bannerURL: string

  // Date & Time
  startDate: any
  endDate: any
  registrationDeadline?: any

  // Location
  venueType: EventVenueType
  venueName?: string
  venueAddress?: string
  venueMapURL?: string
  meetingLink?: string

  // Organization
  organizerId: string
  organizer: EventOrganizer
  category: "tech" | "cultural" | "sports" | "workshop" | "seminar" | "other"
  tags: string[]

  // Capacity & Ticketing
  isFree: boolean
  price?: number
  capacity: number
  registeredCount: number

  // Metadata
  status: EventStatus
  featured: boolean
  createdAt: any
  updatedAt: any

  // No-Show System
  noShowsProcessed?: boolean
  noShowCount?: number
  noShowsProcessedAt?: any

  // Waitlist System
  waitlist?: string[] // Array of user IDs waiting for spots
}

export type TicketStatus = "valid" | "used" | "cancelled" | "expired"

export type EventTicket = {
  id: string
  eventId: string
  eventTitle: string
  userId: string
  userName: string
  userEmail: string

  // QR Code Data
  ticketCode: string
  qrCodeURL?: string

  // Status
  status: TicketStatus
  usedAt?: any
  bookedAt: any

  // Seat/Gate info stub
  gate?: string
  seat?: string
}

export type EventRSVP = {
  eventId: string
  userId: string
  status: "going" | "interested" | "not_going"
  ticketsCount: number
  ticketIds: string[]
  timestamp: any
}

// Club & Society Types
export type ClubCategory = "Technical" | "Cultural" | "Sports" | "Literary" | "Social" | "Other"

export type ClubSocialLinks = {
  instagram?: string
  linkedin?: string
  website?: string
  discord?: string
}

export type Club = {
  id: string
  name: string
  description: string
  logoURL: string
  coverImageURL?: string
  category: ClubCategory
  email?: string
  socialLinks?: ClubSocialLinks
  foundedDate: any
  presidentUid: string
  admins: string[]
  members: string[]
  team?: { uid: string; name: string; email: string; role: ClubRole; addedAt?: string }[]
  documents?: ClubDocument[]
  status: "active" | "inactive"
  createdAt: any
  updatedAt: any
  // Official Verification
  verification?: {
    status: "unverified" | "pending" | "verified" | "rejected"
    verifiedAt?: any
    verifiedBy?: string           // Admin UID who verified
    advisorUid?: string           // Faculty advisor UID
    registrationNumber?: string   // Official university registration
    documents?: string[]          // URLs to registration docs
    rejectionReason?: string
    submittedAt?: any
  }
}

// Club Role Hierarchy
export type ClubRole =
  | "President"
  | "Vice President"
  | "Secretary"
  | "Treasurer"
  | "Event Lead"
  | "Marketing Lead"
  | "Technical Lead"
  | "Member"

// Club Document Repository
export type ClubDocument = {
  id: string
  name: string
  url: string
  type: "constitution" | "minutes" | "budget" | "report" | "other"
  uploadedBy: string
  uploadedAt: any
}

export type ClubRequest = {
  id: string
  requesterUid: string
  requesterName: string
  requesterEmail: string
  clubName: string
  category: ClubCategory
  vision: string
  proposedLogoURL?: string
  status: "pending" | "approved" | "rejected"
  submittedAt: any
  adminComments?: string
  processedAt?: any
}

// Rewards Store Types
export type RewardCategory = "digital" | "physical" | "privilege"

export type Reward = {
  id: string
  name: string
  description: string
  imageURL: string
  category: RewardCategory
  pointsCost: number
  stock: number | null  // null = unlimited
  isActive: boolean
  createdAt: any
}

export type RedemptionStatus = "pending" | "processing" | "fulfilled" | "cancelled"

export type Redemption = {
  id: string
  userId: string
  userName: string
  userEmail: string
  rewardId: string
  rewardName: string
  rewardCategory: RewardCategory
  pointsCost: number
  status: RedemptionStatus
  shippingAddress?: string  // For physical rewards
  createdAt: any
  fulfilledAt?: any
}

// Points Activity Ledger Types
export type PointTransactionType =
  | "daily_login"
  | "post"
  | "like"
  | "comment"
  | "hackathon"
  | "event"
  | "redemption"
  | "refund"
  | "bonus"
  | "other"

export type PointTransaction = {
  id: string
  userId: string
  amount: number  // +ve for earned, -ve for spent
  type: PointTransactionType
  description: string
  referenceId?: string  // Optional link to related doc
  createdAt: any
}

// Gallery Album Types
export type Album = {
  id: string
  name: string
  description?: string
  coverImageURL?: string
  postIds: string[]
  creatorUid: string
  creatorName: string
  visibility: "public" | "private" | "followers"
  createdAt: any
  updatedAt?: any
}

// Academic Calendar Types
export type AcademicEventType =
  | "exam"              // Mid-sem, End-sem
  | "holiday"           // Diwali, Holi, etc.
  | "semester_start"
  | "semester_end"
  | "registration"      // Course registration period
  | "convocation"
  | "placement"
  | "cultural_fest"
  | "sports_week"
  | "workshop"
  | "other"

export type AcademicEvent = {
  id: string
  title: string
  description?: string
  type: AcademicEventType
  startDate: any        // Timestamp
  endDate: any
  allDay: boolean
  recurring?: "yearly" | "semesterly" | null
  affectedDepartments?: string[]  // Empty = all
  color?: string        // For calendar display
  createdBy: string
  createdAt: any
  updatedAt?: any
}

export type AcademicYear = {
  id: string            // e.g., "2025-26"
  name: string          // "Academic Year 2025-26"
  startDate: any
  endDate: any
  semesters: {
    name: string        // "Fall 2025", "Spring 2026"
    startDate: any
    endDate: any
  }[]
  isActive: boolean
}
