# Data Validation & Sanitization

This document describes the data validation and sanitization system implemented in the GLA Gallery application.

## Overview

Comprehensive validation and sanitization has been implemented to prevent XSS attacks, validate user inputs, filter inappropriate content, and enforce rate limits.

## Components

### Validation Utilities

**Location**: `lib/validation.ts`

Centralized validation and sanitization functions for the entire application.

#### Text Sanitization

- `sanitizeHTML(html: string)` - Sanitizes HTML to prevent XSS attacks
- `sanitizeText(text: string)` - Removes all HTML tags from text
- `sanitizeForDisplay(text: string)` - Sanitizes text for safe display
- `sanitizeForStorage(text: string)` - Sanitizes text for storage (allows some formatting)

#### Input Validation

- `validateTitle(title: string)` - Validates and sanitizes post titles
- `validateDescription(description: string)` - Validates and sanitizes descriptions
- `validateComment(comment: string)` - Validates and sanitizes comments
- `validateEmail(email: string)` - Validates email format and GLA domain
- `validateURL(url: string)` - Validates URL format and protocol

#### File Validation

- `validateFileType(file: File)` - Validates file MIME type
- `validateFileSize(file: File)` - Validates file size (max 10MB)
- `validateFile(file: File)` - Validates both type and size
- `validateFiles(files: FileList | File[])` - Validates multiple files

#### Content Moderation

- `checkProfanity(text: string)` - Checks for profanity and spam patterns
- Basic profanity word list (can be enhanced with external library)
- Spam detection (excessive word repetition)

#### Rate Limiting

- `checkRateLimit(action: "upload" | "comment" | "like")` - Client-side rate limiting
- **Upload**: 10 uploads per hour
- **Comment**: 50 comments per hour
- **Like**: 200 likes per hour
- Uses localStorage for tracking
- **Note**: Server-side rate limiting should also be implemented

#### Hackathon Validation

- `validateHackathon(data)` - Validates hackathon title, description, and dates

## Implementation

### Upload Page

**Location**: `app/upload/page.tsx`

**Validations**:
- ✅ Title validation (required, max 200 chars, sanitized)
- ✅ Description validation (optional, max 2000 chars, sanitized)
- ✅ File type validation (images: JPG, PNG, GIF, WebP; videos: MP4, MOV, AVI, WebM)
- ✅ File size validation (max 10MB)
- ✅ Rate limiting (10 uploads/hour)
- ✅ All inputs sanitized before storage

**Usage**:
\`\`\`tsx
import {
  validateTitle,
  validateDescription,
  validateFiles,
  checkRateLimit,
} from "@/lib/validation"

// In component
const titleValidation = validateTitle(title)
if (!titleValidation.valid) {
  setError(titleValidation.error)
  return
}

const sanitizedTitle = titleValidation.sanitized
\`\`\`

### Comments Drawer

**Location**: `components/comments-drawer.tsx`

**Validations**:
- ✅ Comment text validation (required, max 500 chars, sanitized)
- ✅ Profanity filtering
- ✅ Rate limiting (50 comments/hour)
- ✅ User name sanitization

**Usage**:
\`\`\`tsx
import { validateComment, checkRateLimit, sanitizeText } from "@/lib/validation"

const commentValidation = validateComment(text)
if (!commentValidation.valid) {
  alert(commentValidation.error)
  return
}

const sanitizedComment = commentValidation.sanitized
\`\`\`

### Hackathon Creation

**Location**: `lib/hackathons.ts`

**Validations**:
- ✅ Title validation (max 100 chars)
- ✅ Description validation (max 5000 chars)
- ✅ Date validation (end date after start date)
- ✅ All inputs sanitized

### Gallery Card (Likes)

**Location**: `components/gallery-card.tsx`

**Validations**:
- ✅ Rate limiting (200 likes/hour)

## Constants

### File Types

\`\`\`typescript
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
ALLOWED_VIDEO_TYPES = ["video/mp4", "video/mov", "video/avi", "video/webm"]
MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
\`\`\`

### Text Lengths

\`\`\`typescript
MAX_TITLE_LENGTH = 200
MAX_DESCRIPTION_LENGTH = 2000
MAX_COMMENT_LENGTH = 500
MAX_HACKATHON_TITLE_LENGTH = 100
MAX_HACKATHON_DESCRIPTION_LENGTH = 5000
\`\`\`

### Rate Limits

\`\`\`typescript
upload: 10 per hour
comment: 50 per hour
like: 200 per hour
\`\`\`

## Security Features

### XSS Prevention

- All user inputs are sanitized using DOMPurify
- HTML tags are stripped from text inputs
- Only safe formatting tags allowed in descriptions (if needed)

### Content Moderation

- Profanity filtering (basic word list)
- Spam detection (excessive repetition)
- Can be enhanced with external moderation services

### Rate Limiting

- Client-side rate limiting using localStorage
- Prevents abuse of upload, comment, and like features
- **Important**: Server-side rate limiting should also be implemented

## Dependencies

### Required Packages

\`\`\`json
{
  "dompurify": "^3.0.0",
  "isomorphic-dompurify": "^1.0.0",
  "@types/dompurify": "^3.0.0"
}
\`\`\`

**Installation**:
\`\`\`bash
npm install dompurify isomorphic-dompurify @types/dompurify --legacy-peer-deps
\`\`\`

### Fallback Behavior

If DOMPurify is not installed, the validation utilities use a basic fallback that:
- Removes all HTML tags
- Provides basic sanitization
- Still prevents XSS attacks

## Best Practices

1. **Always validate on client and server** - Client-side validation improves UX, server-side ensures security
2. **Sanitize before storage** - Never store unsanitized user input
3. **Sanitize before display** - Always sanitize when displaying user-generated content
4. **Rate limit aggressively** - Prevent abuse and spam
5. **Validate file types and sizes** - Prevent malicious file uploads
6. **Check profanity** - Maintain community standards

## Future Enhancements

- [ ] Enhanced profanity filter (external library)
- [ ] Image content moderation (detect inappropriate images)
- [ ] Server-side rate limiting (Cloud Functions)
- [ ] Advanced spam detection (ML-based)
- [ ] User reputation system
- [ ] Automated content flagging
- [ ] Integration with moderation services (e.g., Google Cloud Vision API)

## Testing

To test validation:

1. **XSS Prevention**: Try injecting `<script>alert('XSS')</script>` in any text field
2. **File Validation**: Try uploading files with wrong types or sizes
3. **Rate Limiting**: Try uploading/commenting/liking rapidly
4. **Length Validation**: Try entering text exceeding max lengths
5. **Profanity**: Try entering profanity (if word list is populated)

## Notes

- Rate limiting is client-side only - implement server-side rate limiting for production
- Profanity word list is minimal - enhance with comprehensive list or external service
- DOMPurify fallback provides basic protection if package not installed
- All validations return clear error messages for better UX
