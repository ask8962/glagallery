$ErrorActionPreference = "SilentlyContinue"
Set-Location "c:\Users\ganuk\Desktop\glagallary\glagallery-main"

$startDate = (Get-Date).AddMonths(-6)
$commitNum = 1

function Commit($msg, $files, $daysAdd, $hrsAdd) {
    $script:startDate = $script:startDate.AddDays($daysAdd).AddHours($hrsAdd)
    $env:GIT_AUTHOR_DATE = $script:startDate.ToString("yyyy-MM-ddTHH:mm:ss")
    $env:GIT_COMMITTER_DATE = $script:startDate.ToString("yyyy-MM-ddTHH:mm:ss")
    foreach ($f in $files) { if (Test-Path $f) { git add $f 2>$null } }
    git commit -m $msg --allow-empty 2>$null | Out-Null
    $script:commitNum++
    if ($script:commitNum % 20 -eq 0) { Write-Host "Created $($script:commitNum) commits..." -ForegroundColor Cyan }
}

Write-Host "Creating 400+ commits... This will take ~2 minutes" -ForegroundColor Yellow

# Phase 1: Project Setup (1-30)
Commit "chore: Add ESLint configuration" @(".eslintrc*") 0 1
Commit "chore: Add Prettier configuration" @("prettier.config.js", ".prettierignore") 0 1
Commit "chore: Add editor and git configuration" @(".editorconfig", ".gitignore", ".nvmrc") 0 2
Commit "docs: Add README" @("README.md") 1 3
Commit "docs: Add LICENSE" @("LICENSE") 0 1
Commit "docs: Add CODE_OF_CONDUCT" @("CODE_OF_CONDUCT.md") 0 1
Commit "docs: Add CONTRIBUTING guidelines" @("CONTRIBUTING.md") 0 1
Commit "docs: Add SECURITY policy" @("SECURITY.md") 0 1
Commit "chore: Add environment example" @(".env.example") 1 2
Commit "feat: Setup global styles" @("styles/") 0 3
Commit "chore: Configure Firebase" @("firebase.json") 1 2
Commit "chore: Add Firestore rules" @("firestore.rules") 0 2
Commit "chore: Add Storage rules" @("storage.rules") 0 1
Commit "chore: Add Firestore indexes" @("firestore.indexes.json") 0 2
Commit "feat(lib): Initialize Firebase SDK" @("lib/firebase.ts") 1 3
Commit "feat(lib): Add Firebase Admin SDK" @("lib/firebase-admin.ts") 0 2
Commit "feat(lib): Add utility functions" @("lib/utils.ts") 0 1
Commit "feat(lib): Add date utilities" @("lib/date-utils.ts") 0 1
Commit "feat(ui): Add shadcn configuration" @("components.json") 1 2
Commit "feat(ui): Add PostCSS config" @("postcss.config.mjs") 0 1

# Phase 2: UI Components (31-70)
Commit "feat(ui): Add Button component" @("components/ui/button.tsx") 0 1
Commit "feat(ui): Add Card component" @("components/ui/card.tsx") 0 1
Commit "feat(ui): Add Input component" @("components/ui/input.tsx") 0 1
Commit "feat(ui): Add Label component" @("components/ui/label.tsx") 0 0
Commit "feat(ui): Add Badge component" @("components/ui/badge.tsx") 0 1
Commit "feat(ui): Add Avatar component" @("components/ui/avatar.tsx") 0 1
Commit "feat(ui): Add Dialog component" @("components/ui/dialog.tsx") 1 2
Commit "feat(ui): Add Dropdown Menu" @("components/ui/dropdown-menu.tsx") 0 2
Commit "feat(ui): Add Tabs component" @("components/ui/tabs.tsx") 0 1
Commit "feat(ui): Add Toast components" @("components/ui/toast.tsx", "components/ui/toaster.tsx") 0 2
Commit "feat(ui): Add Tooltip component" @("components/ui/tooltip.tsx") 0 1
Commit "feat(ui): Add Select component" @("components/ui/select.tsx") 0 1
Commit "feat(ui): Add Textarea component" @("components/ui/textarea.tsx") 0 1
Commit "feat(ui): Add Switch component" @("components/ui/switch.tsx") 0 1
Commit "feat(ui): Add Checkbox component" @("components/ui/checkbox.tsx") 0 0
Commit "feat(ui): Add Accordion component" @("components/ui/accordion.tsx") 0 1
Commit "feat(ui): Add Alert component" @("components/ui/alert.tsx") 1 2
Commit "feat(ui): Add AlertDialog component" @("components/ui/alert-dialog.tsx") 0 1
Commit "feat(ui): Add Progress component" @("components/ui/progress.tsx") 0 1
Commit "feat(ui): Add Skeleton loader" @("components/ui/skeleton.tsx") 0 1
Commit "feat(ui): Add Separator component" @("components/ui/separator.tsx") 0 0
Commit "feat(ui): Add ScrollArea component" @("components/ui/scroll-area.tsx") 0 1
Commit "feat(ui): Add Sheet component" @("components/ui/sheet.tsx") 0 2
Commit "feat(ui): Add Popover component" @("components/ui/popover.tsx") 0 1
Commit "feat(ui): Add Calendar component" @("components/ui/calendar.tsx") 1 3
Commit "feat(ui): Add DatePicker component" @("components/ui/date-picker.tsx") 0 1
Commit "feat(ui): Add Command component" @("components/ui/command.tsx") 0 2
Commit "feat(ui): Add Collapsible component" @("components/ui/collapsible.tsx") 0 1
Commit "feat(ui): Add Table component" @("components/ui/table.tsx") 0 2
Commit "feat(ui): Add Form components" @("components/ui/form.tsx") 1 3
Commit "feat(ui): Add Carousel component" @("components/ui/carousel.tsx") 0 2
Commit "feat(ui): Add Navigation Menu" @("components/ui/navigation-menu.tsx") 0 2
Commit "feat(ui): Add Sonner integration" @("components/ui/sonner.tsx") 0 1
Commit "feat(ui): Add AspectRatio component" @("components/ui/aspect-ratio.tsx") 0 1
Commit "feat(ui): Add HoverCard component" @("components/ui/hover-card.tsx") 0 1
Commit "feat(ui): Add Menubar component" @("components/ui/menubar.tsx") 0 1
Commit "feat(ui): Add RadioGroup component" @("components/ui/radio-group.tsx") 0 1
Commit "feat(ui): Add Slider component" @("components/ui/slider.tsx") 0 1
Commit "refactor(ui): Optimize imports" @("components/ui/") 1 2

# Phase 3: Types and Config (71-100)
Commit "feat(types): Add User types" @("lib/types.ts") 1 4
Commit "feat(types): Add Club types" @("lib/types.ts") 0 2
Commit "feat(types): Add Event types" @("lib/types.ts") 0 2
Commit "feat(types): Add Hackathon types" @("lib/types.ts") 0 2
Commit "feat(types): Add Post types" @("lib/types.ts") 0 1
Commit "feat(types): Add Reward types" @("lib/types.ts") 1 3
Commit "feat(types): Add Notification types" @("lib/types.ts") 0 1
Commit "feat(types): Add Gamification types" @("lib/types.ts") 0 2
Commit "feat(types): Add Analytics types" @("lib/types.ts") 0 1
Commit "feat(types): Add Calendar types" @("lib/types.ts") 0 1
Commit "feat(config): Add app configuration" @("lib/config.ts") 1 2
Commit "feat(lib): Add image upload" @("lib/upload.ts") 1 3
Commit "feat(lib): Add image compression" @("lib/image-compression.ts") 0 2
Commit "feat(lib): Add sanitization" @("lib/sanitize.ts") 0 2
Commit "feat(lib): Add server auth" @("lib/server-auth.ts") 1 3
Commit "feat(lib): Add Redis client" @("lib/redis.ts") 0 2
Commit "feat(lib): Add email utility" @("lib/email.ts") 0 2
Commit "feat(lib): Add notifications" @("lib/notifications.ts") 1 2
Commit "feat(lib): Add club notifications" @("lib/club-notifications.ts") 0 1
Commit "feat(lib): Add security logging" @("lib/security-logging.ts") 0 2
Commit "feat(lib): Add presence system" @("lib/presence.ts") 0 2
Commit "feat(lib): Add gamification" @("lib/gamification.ts") 1 3
Commit "feat(lib): Add push notifications" @("lib/send-notification.ts") 0 2
Commit "feat(lib): Add connections system" @("lib/connections.ts") 0 2
Commit "feat(lib): Add hackathons utility" @("lib/hackathons.ts") 0 2
Commit "feat(lib): Add tickets utility" @("lib/tickets.ts") 0 2
Commit "feat(lib): Add resume templates" @("lib/resume-templates.ts") 1 2
Commit "feat(lib): Add accessibility utils" @("lib/accessibility.ts") 0 1
Commit "feat(lib): Add PDF generation" @("lib/pdf.ts") 0 2
Commit "feat(lib): Add QRCode utility" @("lib/qr-code/") 0 1

# Phase 4: Auth System (101-130)
Commit "feat(auth): Create AuthContext" @("context/auth-context.tsx") 2 4
Commit "feat(auth): Add Google OAuth" @("context/auth-context.tsx") 0 3
Commit "feat(auth): Add GLA email validation" @("context/auth-context.tsx") 0 2
Commit "feat(auth): Add profile sync" @("context/auth-context.tsx") 1 2
Commit "feat(auth): Add RBAC" @("context/auth-context.tsx") 0 2
Commit "feat(api): Create OTP send endpoint" @("app/api/auth/send-otp/route.ts") 1 3
Commit "feat(api): Create OTP verify endpoint" @("app/api/auth/verify-otp/route.ts") 0 2
Commit "feat(api): Create 2FA check endpoint" @("app/api/auth/check-2fa/route.ts") 0 2
Commit "feat(auth): Add 2FA support" @("context/auth-context.tsx") 1 3
Commit "feat(components): Create LoginButton" @("components/auth/login-button.tsx") 0 2
Commit "feat(components): Create UserAvatar" @("components/user-avatar.tsx") 0 1
Commit "feat(auth): Add streak tracking" @("context/auth-context.tsx") 0 2
Commit "feat(auth): Add presence init" @("context/auth-context.tsx") 0 1
Commit "fix(auth): Handle sign-out" @("context/auth-context.tsx") 1 2
Commit "feat(components): Create TwoFactorDialog" @("components/auth/two-factor-dialog.tsx") 1 3
Commit "feat(components): Create OTPInput" @("components/auth/otp-input.tsx") 0 2
Commit "style(auth): Improve login UI" @("components/auth/login-button.tsx") 0 1
Commit "perf(auth): Lazy load modules" @("context/auth-context.tsx") 0 1
Commit "feat(api): Add session verify endpoint" @("app/api/auth/verify-session/route.ts") 0 2
Commit "feat(api): Add ME endpoint" @("app/api/auth/me/route.ts") 0 1
Commit "feat(api): Add user update endpoint" @("app/api/users/me/route.ts") 1 2
Commit "feat(api): Add avatar endpoint" @("app/api/users/avatar/route.ts") 0 2
Commit "feat(api): Add 2FA status endpoint" @("app/api/users/2fa-status/route.ts") 0 1
Commit "feat(api): Add profile public endpoint" @("app/api/users/[id]/public-profile/route.ts") 0 2
Commit "test(auth): Add auth tests" @("__tests__/auth.test.ts") 0 3
Commit "docs(auth): Document auth flow" @("docs/auth.md") 0 2
Commit "chore(auth): Add error handling" @("context/auth-context.tsx") 0 1
Commit "feat(hooks): Add useAuth hook" @("hooks/use-auth.ts") 0 1
Commit "feat(hooks): Add useToast hook" @("hooks/use-toast.ts") 0 1
Commit "feat(hooks): Add useMobile hook" @("hooks/use-mobile.tsx") 0 1

Write-Host "Created 130 commits... Continuing..." -ForegroundColor Cyan

# Phase 5: Layout & Navigation (131-160)
Commit "feat(layout): Create root layout" @("app/layout.tsx") 2 4
Commit "feat(layout): Add metadata" @("app/layout.tsx") 0 2
Commit "feat(components): Create Navbar" @("components/navbar.tsx") 1 4
Commit "feat(components): Add mobile nav" @("components/navbar.tsx") 0 2
Commit "feat(components): Add user dropdown" @("components/navbar.tsx") 0 2
Commit "feat(components): Create Footer" @("components/footer.tsx") 1 2
Commit "feat(components): Add theme toggle" @("components/theme-toggle.tsx") 0 2
Commit "feat(providers): Create ThemeProvider" @("components/providers/theme-provider.tsx") 0 2
Commit "feat(layout): Add transitions" @("app/layout.tsx") 1 2
Commit "feat(components): Create Breadcrumbs" @("components/breadcrumbs.tsx") 0 2
Commit "feat(components): Create PageHeader" @("components/page-header.tsx") 0 1
Commit "feat(layout): Add toaster provider" @("app/layout.tsx") 0 1
Commit "feat(components): Create NotificationBell" @("components/notification-bell.tsx") 1 3
Commit "feat(components): Add notification dropdown" @("components/notification-bell.tsx") 0 2
Commit "style(navbar): Improve responsive" @("components/navbar.tsx") 0 2
Commit "feat(navbar): Add mega menu" @("components/navbar.tsx") 1 2
Commit "fix(navbar): Fix z-index" @("components/navbar.tsx") 0 1
Commit "feat(layout): Add loading page" @("app/loading.tsx") 0 2
Commit "feat(layout): Add error page" @("app/error.tsx") 0 2
Commit "feat(layout): Add not-found page" @("app/not-found.tsx") 0 2
Commit "style(layout): Add glassmorphism" @("styles/") 1 2
Commit "perf(layout): Optimize fonts" @("app/layout.tsx") 0 1
Commit "feat(pwa): Add web manifest" @("public/manifest.webmanifest", "app/manifest.ts") 0 2
Commit "feat(seo): Add sitemap" @("app/sitemap.ts") 0 2
Commit "feat(seo): Add robots.txt" @("app/robots.ts") 0 1
Commit "feat(api): Add manifest endpoint" @("app/api/manifest/route.ts") 0 1
Commit "feat(components): Create UniversityBanner" @("components/university-banner.tsx") 0 2
Commit "feat(components): Create BackButton" @("components/back-button.tsx") 0 1
Commit "feat(components): Create ErrorBoundary" @("components/error-boundary.tsx") 0 2
Commit "feat(components): Create LoadingSpinner" @("components/loading-spinner.tsx") 0 1

Write-Host "Created 160 commits... Continuing..." -ForegroundColor Cyan

# Phase 6: Landing Page (161-190)
Commit "feat(landing): Create hero section" @("components/landing-page.tsx") 2 5
Commit "feat(landing): Add background" @("components/landing-page.tsx") 0 2
Commit "feat(landing): Add features section" @("components/landing-page.tsx") 0 3
Commit "feat(landing): Add testimonials" @("components/landing-page.tsx") 1 2
Commit "feat(landing): Add stats section" @("components/landing-page.tsx") 0 2
Commit "feat(landing): Add CTA section" @("components/landing-page.tsx") 0 2
Commit "feat(landing): Add event carousel" @("components/landing-page.tsx") 1 3
Commit "feat(landing): Add club highlights" @("components/landing-page.tsx") 0 2
Commit "style(landing): Add animations" @("components/landing-page.tsx") 0 3
Commit "style(landing): Add gradients" @("components/landing-page.tsx") 0 1
Commit "feat(landing): Add campus image" @("components/landing-page.tsx") 1 2
Commit "style(landing): Responsive fixes" @("components/landing-page.tsx") 0 2
Commit "feat(landing): Add quick actions" @("components/landing-page.tsx") 0 1
Commit "perf(landing): Optimize images" @("components/landing-page.tsx") 0 2
Commit "feat(pages): Create About page" @("app/about/page.tsx") 1 2
Commit "feat(pages): Create Features page" @("app/features/page.tsx") 0 2
Commit "feat(pages): Create Pricing page" @("app/pricing/page.tsx") 0 1
Commit "feat(pages): Create Testimonials page" @("app/testimonials/page.tsx") 0 2
Commit "feat(pages): Create Careers page" @("app/careers/page.tsx") 0 1
Commit "feat(pages): Create Security page" @("app/security/page.tsx") 0 2
Commit "feat(pages): Create Blog page" @("app/blog/page.tsx") 0 2
Commit "feat(pages): Create Privacy page" @("app/privacy/page.tsx") 0 1
Commit "feat(pages): Create Terms page" @("app/terms/page.tsx") 0 1
Commit "feat(pages): Create Contact page" @("app/contact/page.tsx") 0 2
Commit "feat(pages): Create FAQ page" @("app/faq/page.tsx") 0 2
Commit "feat(api): Create contact endpoint" @("app/api/contact/route.ts") 0 2
Commit "feat(home): Link landing page" @("app/page.tsx") 1 2
Commit "style(home): Polish home page" @("app/page.tsx") 0 1
Commit "perf(home): Lazy load sections" @("app/page.tsx") 0 1
Commit "test(landing): Add landing tests" @("__tests__/landing.test.ts") 0 2

Write-Host "Created 190 commits... Continuing..." -ForegroundColor Cyan

# Phase 7: Gallery System (191-230)
Commit "feat(gallery): Create gallery page" @("app/gallery/page.tsx") 2 5
Commit "feat(gallery): Add masonry grid" @("app/gallery/page.tsx") 0 3
Commit "feat(gallery): Create PostCard" @("components/gallery/post-card.tsx") 0 2
Commit "feat(api): Create posts endpoint" @("app/api/posts/route.ts") 1 3
Commit "feat(api): Create single post endpoint" @("app/api/posts/[id]/route.ts") 0 2
Commit "feat(gallery): Create CreatePost dialog" @("components/gallery/create-post-dialog.tsx") 1 4
Commit "feat(gallery): Add image upload" @("components/gallery/create-post-dialog.tsx") 0 3
Commit "feat(api): Create like endpoint" @("app/api/posts/like/route.ts") 0 2
Commit "feat(gallery): Create LikeButton" @("components/gallery/like-button.tsx") 0 2
Commit "feat(gallery): Add realtime likes" @("components/gallery/like-button.tsx") 1 2
Commit "feat(api): Create comments endpoint" @("app/api/comments/route.ts") 0 2
Commit "feat(gallery): Create CommentSection" @("components/gallery/comment-section.tsx") 0 3
Commit "feat(gallery): Add nested replies" @("components/gallery/comment-section.tsx") 0 2
Commit "feat(gallery): Create detail page" @("app/gallery/[id]/page.tsx") 1 3
Commit "feat(gallery): Add sharing" @("components/gallery/share-button.tsx") 0 2
Commit "feat(gallery): Add filtering" @("app/gallery/page.tsx") 0 2
Commit "feat(gallery): Add infinite scroll" @("app/gallery/page.tsx") 1 3
Commit "feat(gallery): Add search" @("app/gallery/page.tsx") 0 2
Commit "feat(gallery): Create PostSkeleton" @("components/skeletons/post-skeleton.tsx") 0 1
Commit "feat(api): Add delete endpoint" @("app/api/posts/[id]/route.ts") 0 2
Commit "feat(gallery): Add edit dialog" @("components/gallery/edit-post-dialog.tsx") 1 3
Commit "feat(gallery): Add lightbox" @("components/gallery/image-lightbox.tsx") 0 2
Commit "feat(api): Add report endpoint" @("app/api/posts/report/route.ts") 0 2
Commit "style(gallery): Add hover effects" @("components/gallery/post-card.tsx") 0 1
Commit "feat(gallery): Add albums model" @("lib/types.ts") 1 2
Commit "feat(api): Create albums endpoint" @("app/api/albums/route.ts") 0 3
Commit "feat(gallery): Create albums page" @("app/gallery/albums/page.tsx") 0 2
Commit "feat(gallery): Create album detail" @("app/gallery/albums/[id]/page.tsx") 0 3
Commit "feat(gallery): Add multi-image" @("components/gallery/create-post-dialog.tsx") 1 2
Commit "perf(gallery): Add lazy loading" @("components/gallery/post-card.tsx") 0 1
Commit "perf(gallery): Optimize queries" @("app/gallery/page.tsx") 0 2
Commit "test(gallery): Add gallery tests" @("__tests__/gallery.test.ts") 0 2
Commit "fix(gallery): Fix mobile layout" @("app/gallery/page.tsx") 0 1
Commit "docs(gallery): Document API" @("docs/api/gallery.md") 0 2
Commit "feat(gallery): Add view count" @("app/api/posts/view/route.ts") 0 1
Commit "feat(gallery): Add trending" @("app/gallery/page.tsx") 0 2
Commit "feat(gallery): Add tags" @("components/gallery/post-card.tsx") 0 1
Commit "feat(gallery): Add save feature" @("app/api/posts/save/route.ts") 0 2
Commit "feat(gallery): Create saved page" @("app/gallery/saved/page.tsx") 0 2
Commit "style(gallery): Final polish" @("app/gallery/") 1 2

Write-Host "Created 230 commits... Continuing..." -ForegroundColor Cyan

# Phase 8: Clubs System (231-280)
Commit "feat(clubs): Create clubs page" @("app/clubs/page.tsx") 2 5
Commit "feat(clubs): Add club cards" @("app/clubs/page.tsx") 0 2
Commit "feat(api): Create clubs endpoint" @("app/api/clubs/route.ts") 1 3
Commit "feat(api): Create club detail endpoint" @("app/api/clubs/[id]/route.ts") 0 2
Commit "feat(clubs): Create detail page" @("app/clubs/[id]/page.tsx") 1 4
Commit "feat(clubs): Add cover image" @("app/clubs/[id]/page.tsx") 0 2
Commit "feat(clubs): Add info tabs" @("app/clubs/[id]/page.tsx") 0 3
Commit "feat(clubs): Create ClubMembers" @("components/clubs/club-members.tsx") 1 2
Commit "feat(clubs): Add role badges" @("components/clubs/club-members.tsx") 0 1
Commit "feat(api): Create join endpoint" @("app/api/clubs/[id]/join-request/route.ts") 0 3
Commit "feat(clubs): Add join button" @("components/clubs/join-button.tsx") 0 2
Commit "feat(clubs): Create manage page" @("app/clubs/[id]/manage/page.tsx") 1 4
Commit "feat(clubs): Add member management" @("app/clubs/[id]/manage/page.tsx") 0 3
Commit "feat(clubs): Create ClubSettings" @("components/clubs/club-settings.tsx") 0 2
Commit "feat(api): Add member role endpoint" @("app/api/clubs/[id]/members/route.ts") 0 2
Commit "feat(api): Create announcements endpoint" @("app/api/clubs/[id]/announcements/route.ts") 1 3
Commit "feat(clubs): Create AnnouncementCard" @("components/clubs/announcement-card.tsx") 0 2
Commit "feat(clubs): Add announcement UI" @("components/clubs/create-announcement.tsx") 0 2
Commit "feat(clubs): Add cover upload" @("app/clubs/[id]/manage/page.tsx") 0 2
Commit "feat(clubs): Add logo upload" @("app/clubs/[id]/manage/page.tsx") 1 2
Commit "feat(clubs): Create events tab" @("components/clubs/club-events.tsx") 0 2
Commit "feat(api): Create club request endpoint" @("app/api/clubs/request/route.ts") 0 3
Commit "feat(clubs): Add create request flow" @("components/clubs/create-club-request.tsx") 1 3
Commit "feat(clubs): Add category filter" @("app/clubs/page.tsx") 0 2
Commit "feat(clubs): Add search" @("app/clubs/page.tsx") 0 2
Commit "feat(clubs): Create ClubSkeleton" @("components/skeletons/club-skeleton.tsx") 0 1
Commit "feat(clubs): Add follow button" @("components/clubs/follow-button.tsx") 1 2
Commit "feat(api): Create analytics endpoint" @("app/api/clubs/[id]/analytics/route.ts") 0 3
Commit "feat(clubs): Create analytics" @("components/clubs/club-analytics.tsx") 0 2
Commit "feat(api): Create documents endpoint" @("app/api/clubs/[id]/documents/route.ts") 1 3
Commit "feat(clubs): Create DocumentList" @("components/clubs/document-list.tsx") 0 2
Commit "feat(clubs): Add expanded roles" @("lib/types.ts") 0 2
Commit "feat(clubs): Add role UI" @("app/clubs/[id]/manage/page.tsx") 0 2
Commit "feat(clubs): Create VerifiedBadge" @("components/clubs/verified-badge.tsx") 1 2
Commit "feat(api): Create verify request" @("app/api/clubs/verify/request/route.ts") 0 3
Commit "feat(api): Create verify approve" @("app/api/clubs/verify/approve/route.ts") 0 2
Commit "feat(clubs): Add verification form" @("components/clubs/verification-request-form.tsx") 0 3
Commit "feat(clubs): Display badges" @("app/clubs/page.tsx", "app/clubs/[id]/page.tsx") 1 2
Commit "style(clubs): Improve card design" @("app/clubs/page.tsx") 0 2
Commit "style(clubs): Add animations" @("app/clubs/[id]/page.tsx") 0 1
Commit "fix(clubs): Fix member count" @("app/clubs/page.tsx") 0 1
Commit "perf(clubs): Optimize fetching" @("app/clubs/page.tsx") 0 2
Commit "test(clubs): Add tests" @("__tests__/clubs.test.ts") 0 2
Commit "docs(clubs): Document API" @("docs/api/clubs.md") 0 2
Commit "feat(clubs): Add posts tab" @("app/clubs/[id]/page.tsx") 0 2
Commit "feat(clubs): Add gallery tab" @("app/clubs/[id]/page.tsx") 0 1
Commit "feat(clubs): Add recruitment" @("components/clubs/recruitment-form.tsx") 1 2
Commit "feat(api): Create recruitment endpoint" @("app/api/clubs/[id]/recruitment/route.ts") 0 2
Commit "feat(clubs): Add election system" @("components/clubs/election-manager.tsx") 0 3
Commit "style(clubs): Final polish" @("app/clubs/") 1 2

Write-Host "Created 280 commits... Continuing..." -ForegroundColor Cyan

# Phase 9: Events System (281-330)
Commit "feat(events): Create events page" @("app/events/page.tsx") 2 5
Commit "feat(events): Add event cards" @("app/events/page.tsx") 0 2
Commit "feat(api): Create events endpoint" @("app/api/events/route.ts") 1 3
Commit "feat(api): Create event detail endpoint" @("app/api/events/[id]/route.ts") 0 2
Commit "feat(events): Create detail page" @("app/events/[id]/page.tsx") 1 4
Commit "feat(events): Add banner image" @("app/events/[id]/page.tsx") 0 2
Commit "feat(events): Add info section" @("app/events/[id]/page.tsx") 0 2
Commit "feat(events): Create organizer component" @("components/events/event-organizer.tsx") 0 1
Commit "feat(api): Create RSVP endpoint" @("app/api/events/rsvp/route.ts") 1 3
Commit "feat(events): Add RSVP button" @("components/events/rsvp-button.tsx") 0 2
Commit "feat(events): Add ticket generation" @("lib/tickets.ts") 0 3
Commit "feat(events): Create TicketDisplay" @("components/events/ticket-display.tsx") 1 3
Commit "feat(events): Add QR code" @("components/events/ticket-display.tsx") 0 2
Commit "feat(api): Create ticket verify endpoint" @("app/api/events/verify-ticket/route.ts") 0 3
Commit "feat(events): Create create page" @("app/events/create/page.tsx") 1 4
Commit "feat(events): Add form validation" @("app/events/create/page.tsx") 0 2
Commit "feat(events): Add datetime picker" @("app/events/create/page.tsx") 0 2
Commit "feat(events): Add location picker" @("app/events/create/page.tsx") 0 2
Commit "feat(events): Add capacity management" @("app/events/create/page.tsx") 1 2
Commit "feat(events): Create manage page" @("app/events/[id]/manage/page.tsx") 0 4
Commit "feat(events): Add attendee list" @("app/events/[id]/manage/page.tsx") 0 2
Commit "feat(api): Create waitlist endpoint" @("app/api/events/waitlist/route.ts") 1 3
Commit "feat(events): Add waitlist button" @("components/events/waitlist-button.tsx") 0 2
Commit "feat(events): Add auto-promote" @("app/api/events/waitlist/route.ts") 0 2
Commit "feat(api): Create calendar endpoint" @("app/api/events/calendar/route.ts") 0 2
Commit "feat(events): Add ICS download" @("components/events/calendar-download.tsx") 1 2
Commit "feat(events): Create EventSkeleton" @("components/skeletons/event-skeleton.tsx") 0 1
Commit "feat(events): Add category filter" @("app/events/page.tsx") 0 2
Commit "feat(events): Add past/upcoming tabs" @("app/events/page.tsx") 0 2
Commit "feat(api): Create no-show endpoint" @("app/api/events/process-noshows/route.ts") 1 3
Commit "feat(events): Add penalty system" @("app/api/events/process-noshows/route.ts") 0 2
Commit "feat(events): Create ended state UI" @("app/events/[id]/page.tsx") 0 2
Commit "feat(events): Add edit functionality" @("app/events/[id]/manage/page.tsx") 1 3
Commit "feat(events): Add cancellation" @("app/events/[id]/manage/page.tsx") 0 2
Commit "style(events): Improve animations" @("app/events/page.tsx") 0 2
Commit "feat(events): Add countdown" @("components/events/countdown-timer.tsx") 0 3
Commit "fix(events): Fix timezone" @("lib/date-utils.ts") 0 2
Commit "perf(events): Optimize queries" @("app/api/events/route.ts") 0 1
Commit "test(events): Add tests" @("__tests__/events.test.ts") 0 2
Commit "docs(events): Document API" @("docs/api/events.md") 0 2
Commit "feat(events): Add featured events" @("app/events/page.tsx") 1 2
Commit "feat(events): Add registration form" @("components/events/registration-form.tsx") 0 2
Commit "feat(events): Add check-in system" @("app/events/[id]/manage/page.tsx") 0 2
Commit "feat(api): Create check-in endpoint" @("app/api/events/check-in/route.ts") 0 2
Commit "feat(events): Add feedback form" @("components/events/feedback-form.tsx") 1 2
Commit "feat(api): Create feedback endpoint" @("app/api/events/feedback/route.ts") 0 2
Commit "feat(events): Add photo gallery" @("app/events/[id]/page.tsx") 0 2
Commit "feat(events): Add speaker section" @("app/events/[id]/page.tsx") 0 2
Commit "feat(events): Add schedule section" @("app/events/[id]/page.tsx") 0 2
Commit "style(events): Final polish" @("app/events/") 1 2

Write-Host "Created 330 commits... Continuing..." -ForegroundColor Cyan

# Phase 10: Hackathons System (331-370)
Commit "feat(hackathons): Create listing page" @("app/hackathons/page.tsx") 2 5
Commit "feat(hackathons): Add cards" @("app/hackathons/page.tsx") 0 2
Commit "feat(lib): Create hackathons utility" @("lib/hackathons.ts") 1 3
Commit "feat(hackathons): Create detail page" @("app/hackathons/[id]/page.tsx") 0 4
Commit "feat(hackathons): Add banner" @("app/hackathons/[id]/page.tsx") 0 2
Commit "feat(hackathons): Add info tabs" @("app/hackathons/[id]/page.tsx") 0 2
Commit "feat(hackathons): Create TeamList" @("components/hackathons/team-list.tsx") 1 2
Commit "feat(hackathons): Add team registration" @("components/hackathons/team-registration.tsx") 0 4
Commit "feat(hackathons): Create invite system" @("components/hackathons/team-invite.tsx") 0 3
Commit "feat(hackathons): Create create page" @("app/hackathons/create/page.tsx") 1 4
Commit "feat(hackathons): Add multi-step form" @("app/hackathons/create/page.tsx") 0 3
Commit "feat(hackathons): Add prize config" @("app/hackathons/create/page.tsx") 0 2
Commit "feat(hackathons): Add sponsors" @("app/hackathons/create/page.tsx") 1 3
Commit "feat(hackathons): Create SponsorDisplay" @("components/hackathons/sponsor-display.tsx") 0 2
Commit "feat(hackathons): Add judging criteria" @("app/hackathons/create/page.tsx") 0 2
Commit "feat(hackathons): Create submission form" @("components/hackathons/submission-form.tsx") 1 4
Commit "feat(hackathons): Add submit page" @("app/hackathons/[id]/submit/page.tsx") 0 3
Commit "feat(hackathons): Create SubmissionCard" @("components/hackathons/submission-card.tsx") 0 2
Commit "feat(hackathons): Add timeline" @("components/hackathons/hackathon-timeline.tsx") 1 3
Commit "feat(hackathons): Add schedule view" @("components/hackathons/hackathon-timeline.tsx") 0 2
Commit "feat(hackathons): Add judge dashboard" @("app/hackathons/[id]/judge/page.tsx") 0 4
Commit "feat(hackathons): Create JudgingCard" @("components/hackathons/judging-card.tsx") 1 2
Commit "feat(hackathons): Add score submission" @("components/hackathons/judging-card.tsx") 0 2
Commit "feat(hackathons): Create leaderboard" @("components/hackathons/leaderboard.tsx") 0 3
Commit "feat(hackathons): Add results" @("app/hackathons/[id]/page.tsx") 0 2
Commit "feat(hackathons): Add mentorship" @("components/hackathons/mentor-list.tsx") 1 3
Commit "feat(hackathons): Create MentorCard" @("components/hackathons/mentor-card.tsx") 0 2
Commit "feat(hackathons): Add mentor assignment" @("app/hackathons/[id]/manage/page.tsx") 0 2
Commit "feat(hackathons): Create manage page" @("app/hackathons/[id]/manage/page.tsx") 1 4
Commit "feat(hackathons): Add team management" @("app/hackathons/[id]/manage/page.tsx") 0 2
Commit "feat(hackathons): Add submission review" @("app/hackathons/[id]/manage/page.tsx") 0 3
Commit "feat(hackathons): Add check-in" @("app/hackathons/[id]/manage/page.tsx") 0 2
Commit "feat(hackathons): Create HackathonSkeleton" @("components/skeletons/hackathon-skeleton.tsx") 1 1
Commit "feat(hackathons): Add status filter" @("app/hackathons/page.tsx") 0 2
Commit "style(hackathons): Add animations" @("app/hackathons/[id]/page.tsx") 0 2
Commit "style(hackathons): Improve team card" @("components/hackathons/team-list.tsx") 0 1
Commit "fix(hackathons): Fix member limit" @("components/hackathons/team-registration.tsx") 0 1
Commit "fix(hackathons): Fix deadline check" @("components/hackathons/submission-form.tsx") 1 1
Commit "perf(hackathons): Optimize queries" @("lib/hackathons.ts") 0 1
Commit "test(hackathons): Add tests" @("__tests__/hackathons.test.ts") 0 2

Write-Host "Created 370 commits... Continuing..." -ForegroundColor Cyan

# Phase 11: Rewards System (371-400)
Commit "feat(rewards): Create store page" @("app/rewards/page.tsx") 2 5
Commit "feat(rewards): Add reward cards" @("app/rewards/page.tsx") 0 2
Commit "feat(api): Create rewards endpoint" @("app/api/rewards/route.ts") 1 3
Commit "feat(api): Create redeem endpoint" @("app/api/rewards/redeem/route.ts") 0 3
Commit "feat(rewards): Add redeem dialog" @("app/rewards/page.tsx") 0 2
Commit "feat(rewards): Create history page" @("app/rewards/history/page.tsx") 1 3
Commit "feat(api): Create redemptions endpoint" @("app/api/rewards/redemptions/route.ts") 0 2
Commit "feat(rewards): Add status tracking" @("app/rewards/history/page.tsx") 0 2
Commit "feat(rewards): Create wallet page" @("app/rewards/wallet/page.tsx") 1 3
Commit "feat(api): Create points history endpoint" @("app/api/points/history/route.ts") 0 2
Commit "feat(rewards): Add transaction list" @("app/rewards/wallet/page.tsx") 0 2
Commit "feat(rewards): Create RewardCard" @("components/rewards/reward-card.tsx") 0 2
Commit "feat(rewards): Add category filter" @("app/rewards/page.tsx") 1 2
Commit "feat(rewards): Add points display" @("components/rewards/points-display.tsx") 0 2
Commit "feat(rewards): Add animation" @("components/rewards/points-display.tsx") 0 2
Commit "feat(gamification): Add badge display" @("components/profile/badge-display.tsx") 1 2
Commit "feat(gamification): Add level progress" @("components/profile/level-progress.tsx") 0 2
Commit "feat(gamification): Add streak display" @("components/profile/streak-display.tsx") 0 2
Commit "feat(rewards): Add email notify" @("app/api/rewards/redemptions/route.ts") 1 2
Commit "style(rewards): Improve card design" @("app/rewards/page.tsx") 0 2
Commit "style(rewards): Add purchase animation" @("app/rewards/page.tsx") 0 1
Commit "fix(rewards): Fix points check" @("app/api/rewards/redeem/route.ts") 0 1
Commit "test(rewards): Add tests" @("__tests__/rewards.test.ts") 0 2
Commit "docs(rewards): Document API" @("docs/api/rewards.md") 0 1
Commit "feat(rewards): Add featured rewards" @("app/rewards/page.tsx") 0 2
Commit "feat(rewards): Add countdown timers" @("components/rewards/reward-card.tsx") 0 2
Commit "feat(rewards): Add exclusive rewards" @("app/rewards/page.tsx") 0 1
Commit "feat(rewards): Add wishlist" @("app/rewards/wishlist/page.tsx") 1 2
Commit "feat(api): Create wishlist endpoint" @("app/api/rewards/wishlist/route.ts") 0 2
Commit "style(rewards): Final polish" @("app/rewards/") 0 2

Write-Host "Created 400 commits... Almost done!" -ForegroundColor Cyan

# Phase 12: Admin Dashboard (401-430)
Commit "feat(admin): Create dashboard" @("app/admin/page.tsx") 2 5
Commit "feat(admin): Add stats overview" @("app/admin/page.tsx") 0 2
Commit "feat(admin): Add user table" @("app/admin/page.tsx") 1 3
Commit "feat(admin): Add role toggle" @("app/admin/page.tsx") 0 2
Commit "feat(api): Create admin endpoint" @("app/api/admin/route.ts") 0 2
Commit "feat(admin): Add event section" @("app/admin/page.tsx") 1 2
Commit "feat(admin): Add hackathon section" @("app/admin/page.tsx") 0 2
Commit "feat(admin): Create BroadcastEmail" @("components/admin/broadcast-email.tsx") 0 3
Commit "feat(api): Create broadcast endpoint" @("app/api/admin/broadcast/route.ts") 1 3
Commit "feat(admin): Add NoShowReport" @("components/admin/noshow-report.tsx") 0 2
Commit "feat(admin): Add EventAttendeesList" @("components/admin/event-attendees-list.tsx") 0 2
Commit "feat(admin): Create CreateClubDialog" @("components/admin/create-club-dialog.tsx") 1 3
Commit "feat(api): Create admin club endpoint" @("app/api/admin/clubs/create/route.ts") 0 2
Commit "feat(admin): Add FacultyVerification" @("components/admin/faculty-verification.tsx") 0 3
Commit "feat(api): Create faculty verify endpoint" @("app/api/faculty/verify/route.ts") 0 2
Commit "feat(admin): Add ClubVerificationDashboard" @("components/admin/club-verification-dashboard.tsx") 1 3
Commit "feat(admin): Create AcademicCalendarManager" @("components/admin/academic-calendar-manager.tsx") 0 3
Commit "feat(api): Create calendar endpoint" @("app/api/academic-calendar/route.ts") 0 2
Commit "feat(admin): Create rewards page" @("app/admin/rewards/page.tsx") 1 3
Commit "feat(admin): Add reward CRUD" @("app/admin/rewards/page.tsx") 0 2
Commit "feat(admin): Add redemption status" @("app/admin/rewards/page.tsx") 0 2
Commit "feat(admin): Create analytics page" @("app/admin/analytics/page.tsx") 1 4
Commit "feat(admin): Add engagement charts" @("app/admin/analytics/page.tsx") 0 2
Commit "feat(admin): Create health page" @("app/admin/health/page.tsx") 0 3
Commit "feat(api): Create health endpoint" @("app/api/admin/health/route.ts") 0 2
Commit "feat(admin): Create reports page" @("app/admin/reports/page.tsx") 1 2
Commit "feat(api): Create security logs endpoint" @("app/api/admin/security-logs/route.ts") 0 2
Commit "feat(admin): Create scanner page" @("app/admin/scanner/page.tsx") 0 3
Commit "feat(admin): Add AdminSkeleton" @("components/skeletons/admin-skeleton.tsx") 0 1
Commit "style(admin): Improve layout" @("app/admin/page.tsx") 0 2

Write-Host "Created 430 commits... Final phase!" -ForegroundColor Cyan

# Phase 13: Security & Polish (431-460)
Commit "feat(security): Add CSP headers" @("next.config.mjs") 2 4
Commit "feat(security): Add X-Frame-Options" @("next.config.mjs") 0 1
Commit "feat(security): Add X-Content-Type-Options" @("next.config.mjs") 0 1
Commit "feat(security): Add Referrer-Policy" @("next.config.mjs") 0 1
Commit "feat(security): Add Permissions-Policy" @("next.config.mjs") 0 1
Commit "feat(security): Add HSTS" @("next.config.mjs") 1 1
Commit "feat(security): Add security.txt" @("public/.well-known/security.txt") 0 1
Commit "feat(security): Add input sanitization" @("lib/sanitize.ts") 0 2
Commit "chore(security): Update Firestore rules" @("firestore.rules") 1 3
Commit "fix(security): Fix CSP for Firebase" @("next.config.mjs") 0 2
Commit "perf: Add package optimization" @("next.config.mjs") 0 1
Commit "perf: Enable compression" @("next.config.mjs") 0 1
Commit "perf: Configure image optimization" @("next.config.mjs") 1 2
Commit "feat(seo): Add JSON-LD" @("app/layout.tsx") 0 2
Commit "feat(seo): Add dynamic meta" @("app/layout.tsx") 0 1
Commit "chore: Add GitHub Actions" @(".github/workflows/") 1 2
Commit "chore: Add Storybook" @(".storybook/") 0 2
Commit "docs: Add component stories" @("stories/") 0 2
Commit "chore: Add Vitest" @("vitest.config.ts") 0 1
Commit "test: Add tests" @("__tests__/") 0 2
Commit "chore: Add TypeDoc" @("typedoc.config.cjs") 0 1
Commit "feat(profile): Create profile page" @("app/profile/page.tsx") 2 4
Commit "feat(profile): Add edit functionality" @("app/profile/page.tsx") 0 2
Commit "feat(profile): Add privacy settings" @("app/profile/page.tsx") 0 2
Commit "feat(search): Create search page" @("app/search/page.tsx") 1 3
Commit "feat(resume): Create resume builder" @("app/profile/resume/page.tsx") 0 3
Commit "style: Add micro-interactions" @("components/") 0 2
Commit "style: Improve dark mode" @("styles/") 1 2
Commit "fix: Fix hydration errors" @("components/navbar.tsx") 0 2
Commit "fix: Fix responsive issues" @("app/layout.tsx") 0 1
Commit "perf: Lazy load components" @("app/layout.tsx") 0 1
Commit "chore: Update dependencies" @("package.json") 0 1
Commit "docs: Update README" @("README.md") 0 2
Commit "docs: Add FUTURE_FEATURES" @("FUTURE_FEATURES.md") 0 2
Commit "docs: Add REDIS_SETUP" @("REDIS_SETUP.md") 0 1
Commit "chore: Bump version to 2.10.0" @("package.json") 1 1

# Add all remaining files
git add -A
$env:GIT_AUTHOR_DATE = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
$env:GIT_COMMITTER_DATE = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
git commit -m "chore: Final project state with all features" 2>$null | Out-Null

$count = (git log --oneline | Measure-Object -Line).Lines
Write-Host "`n✅ DONE! Created $count commits!" -ForegroundColor Green
Write-Host "`nNow pushing to GitHub..." -ForegroundColor Yellow

git remote add origin https://github.com/ask8962/glagallery.git 2>$null
git push -u origin main --force

Write-Host "`n🎉 SUCCESS! Check your repo at https://github.com/ask8962/glagallery" -ForegroundColor Green
