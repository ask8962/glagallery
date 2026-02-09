# Loading States & Skeletons

This document describes the loading states and skeleton loaders implemented throughout the GLA Gallery application.

## Overview

Comprehensive loading states have been implemented across all main pages to provide better user experience during data fetching and async operations.

## Components

### Skeleton Components

#### Gallery Skeletons
**Location**: `components/skeletons/gallery-skeleton.tsx`

- `GalleryCardSkeleton` - Individual gallery card skeleton
- `GalleryGridSkeleton` - Grid layout skeleton (default: 12 cards)
- `GalleryListSkeleton` - List layout skeleton (default: 6 items)

**Usage**:
\`\`\`tsx
import { GalleryGridSkeleton, GalleryListSkeleton } from "@/components/skeletons/gallery-skeleton"

{loading ? (
  viewMode === "grid" ? (
    <GalleryGridSkeleton count={12} />
  ) : (
    <GalleryListSkeleton count={6} />
  )
) : (
  // Actual content
)}
\`\`\`

#### Profile Skeletons
**Location**: `components/skeletons/profile-skeleton.tsx`

- `ProfileHeaderSkeleton` - Profile header with avatar and info
- `StatsSkeleton` - Statistics cards skeleton
- `ProfilePostsSkeleton` - Profile posts grid skeleton

**Usage**:
\`\`\`tsx
import { ProfileHeaderSkeleton, StatsSkeleton, ProfilePostsSkeleton } from "@/components/skeletons/profile-skeleton"

{loading ? (
  <>
    <ProfileHeaderSkeleton />
    <StatsSkeleton />
    <ProfilePostsSkeleton />
  </>
) : (
  // Actual content
)}
\`\`\`

#### Hackathon Skeletons
**Location**: `components/skeletons/hackathon-skeleton.tsx`

- `HackathonDetailSkeleton` - Full hackathon detail page skeleton
- `HackathonListSkeleton` - Hackathon list grid skeleton

**Usage**:
\`\`\`tsx
import { HackathonDetailSkeleton, HackathonListSkeleton } from "@/components/skeletons/hackathon-skeleton"

{loading ? (
  <HackathonDetailSkeleton />
) : (
  // Actual content
)}
\`\`\`

#### Admin Skeletons
**Location**: `components/skeletons/admin-skeleton.tsx`

- `AdminStatsSkeleton` - Admin statistics cards skeleton
- `AdminTableSkeleton` - Admin table skeleton (configurable rows)
- `AdminPostsSkeleton` - Admin posts grid skeleton

**Usage**:
\`\`\`tsx
import { AdminStatsSkeleton, AdminTableSkeleton, AdminPostsSkeleton } from "@/components/skeletons/admin-skeleton"

{loading ? (
  <>
    <AdminStatsSkeleton />
    <AdminTableSkeleton rows={5} />
  </>
) : (
  // Actual content
)}
\`\`\`

### Loading Spinners

**Location**: `components/loading-spinner.tsx`

- `LoadingSpinner` - Full loading spinner with optional text
- `InlineSpinner` - Small inline spinner for buttons

**Usage**:
\`\`\`tsx
import { LoadingSpinner, InlineSpinner } from "@/components/loading-spinner"

// Full spinner
<LoadingSpinner size="lg" text="Loading..." />

// Inline spinner in button
<Button disabled={loading}>
  {loading ? (
    <>
      <InlineSpinner className="mr-2" />
      Loading...
    </>
  ) : (
    "Submit"
  )}
</Button>
\`\`\`

### Progressive Image Loading

**Location**: `components/progressive-image.tsx`

Progressive image component with blur placeholder and loading states.

**Features**:
- Automatic blur placeholder
- Loading skeleton overlay
- Error state handling
- Smooth fade-in transition

**Usage**:
\`\`\`tsx
import { ProgressiveImage } from "@/components/progressive-image"

<ProgressiveImage
  src={imageUrl}
  alt="Description"
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  quality={85}
/>
\`\`\`

## Implementation by Page

### Gallery Page
- ✅ Skeleton loaders for grid/list views
- ✅ Loading spinner for "Load More" button
- ✅ Progressive image loading in cards

### Profile Page
- ✅ Profile header skeleton
- ✅ Stats cards skeleton
- ✅ Posts grid skeleton
- ✅ Loading state while fetching profile data

### Hackathon Pages
- ✅ Detail page skeleton
- ✅ List page skeleton
- ✅ Loading states for registration and team operations

### Admin Panel
- ✅ Stats skeleton
- ✅ Table skeletons for users/comments
- ✅ Posts grid skeleton
- ✅ Loading states for all async operations

### Upload Page
- ✅ Upload progress indicators
- ✅ Loading spinner in upload button
- ✅ File validation feedback

## Optimistic UI Updates

**Location**: `lib/optimistic-updates.ts`

Utilities for implementing optimistic UI updates.

**Features**:
- Immediate UI updates
- Automatic rollback on error
- Batch update support

**Usage**:
\`\`\`tsx
import { optimisticUpdate } from "@/lib/optimistic-updates"

await optimisticUpdate({
  currentValue: currentLikes,
  optimisticValue: currentLikes + 1,
  updateFn: async () => {
    await addLike(postId)
    return await getLikes(postId)
  },
  onSuccess: (result) => {
    setLikes(result)
  },
  onError: (error, rollbackValue) => {
    setLikes(rollbackValue)
    toast.error("Failed to like post")
  },
})
\`\`\`

## Best Practices

1. **Always show loading states** - Never leave users wondering if something is happening
2. **Use skeletons for initial loads** - Better UX than spinners for page loads
3. **Use spinners for actions** - Buttons and inline operations should use spinners
4. **Progressive loading** - Load images progressively with placeholders
5. **Optimistic updates** - Update UI immediately, sync with server in background
6. **Error handling** - Always provide error states and rollback mechanisms

## Future Enhancements

- [ ] Skeleton animations (shimmer effect)
- [ ] More granular loading states
- [ ] Loading state analytics
- [ ] Custom loading animations
- [ ] Skeleton theme customization
