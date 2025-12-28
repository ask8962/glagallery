/**
 * Admin API Route
 *
 * Server-side admin operations with proper JWT authorization checks.
 * All admin actions MUST go through this API for security.
 */

import { type NextRequest, NextResponse } from "next/server"
import { verifyAdminAccess, checkServerRateLimit } from "@/lib/server-auth"
import { getFirebase } from "@/lib/firebase"
import { doc, updateDoc, deleteDoc, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { sanitizeText } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAccess(request)
    if (!authCheck.authorized || !authCheck.user) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 })
    }

    const userEmail = authCheck.user.email
    const body = await request.json()
    const { action, ...params } = body

    const rateLimitCheck = checkServerRateLimit(userEmail, "UPLOAD", 60 * 60 * 1000)
    if (!rateLimitCheck.allowed) {
      return NextResponse.json({ error: rateLimitCheck.error }, { status: 429 })
    }

    const { db } = getFirebase()

    switch (action) {
      case "hidePost": {
        const { postId } = params
        if (!postId) {
          return NextResponse.json({ error: "Post ID required" }, { status: 400 })
        }
        await updateDoc(doc(db, "posts", postId), { hidden: true })
        return NextResponse.json({ success: true, message: "Post hidden" })
      }

      case "unhidePost": {
        const { postId } = params
        if (!postId) {
          return NextResponse.json({ error: "Post ID required" }, { status: 400 })
        }
        await updateDoc(doc(db, "posts", postId), { hidden: false })
        return NextResponse.json({ success: true, message: "Post unhidden" })
      }

      case "deletePost": {
        const { postId } = params
        if (!postId) {
          return NextResponse.json({ error: "Post ID required" }, { status: 400 })
        }
        await deleteDoc(doc(db, "posts", postId))
        return NextResponse.json({ success: true, message: "Post deleted" })
      }

      case "hideComment": {
        const { postId, commentId } = params
        if (!postId || !commentId) {
          return NextResponse.json({ error: "Post ID and Comment ID required" }, { status: 400 })
        }
        await updateDoc(doc(db, `posts/${postId}/comments/${commentId}`), { hidden: true })
        return NextResponse.json({ success: true, message: "Comment hidden" })
      }

      case "deleteComment": {
        const { postId, commentId } = params
        if (!postId || !commentId) {
          return NextResponse.json({ error: "Post ID and Comment ID required" }, { status: 400 })
        }
        await deleteDoc(doc(db, `posts/${postId}/comments/${commentId}`))
        return NextResponse.json({ success: true, message: "Comment deleted" })
      }

      case "resolveReport": {
        const { reportId, resolution } = params
        if (!reportId) {
          return NextResponse.json({ error: "Report ID required" }, { status: 400 })
        }
        await updateDoc(doc(db, "reports", reportId), {
          status: "resolved",
          resolution: sanitizeText(resolution || "Resolved by admin"),
          resolvedAt: new Date(),
          resolvedBy: userEmail,
        })
        return NextResponse.json({ success: true, message: "Report resolved" })
      }

      case "dismissReport": {
        const { reportId } = params
        if (!reportId) {
          return NextResponse.json({ error: "Report ID required" }, { status: 400 })
        }
        await updateDoc(doc(db, "reports", reportId), {
          status: "dismissed",
          resolvedAt: new Date(),
          resolvedBy: userEmail,
        })
        return NextResponse.json({ success: true, message: "Report dismissed" })
      }

      case "updateUserRole": {
        const { userId, role } = params
        if (!userId || !role) {
          return NextResponse.json({ error: "User ID and role required" }, { status: 400 })
        }
        if (!["user", "moderator", "admin"].includes(role)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }
        await updateDoc(doc(db, "users", userId), { role })
        return NextResponse.json({ success: true, message: `User role updated to ${role}` })
      }

      case "banUser": {
        const { userId, reason } = params
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }
        await updateDoc(doc(db, "users", userId), {
          banned: true,
          banReason: sanitizeText(reason || "Violated community guidelines"),
          bannedAt: new Date(),
          bannedBy: userEmail,
        })
        return NextResponse.json({ success: true, message: "User banned" })
      }

      case "unbanUser": {
        const { userId } = params
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }
        await updateDoc(doc(db, "users", userId), {
          banned: false,
          banReason: null,
          bannedAt: null,
          bannedBy: null,
        })
        return NextResponse.json({ success: true, message: "User unbanned" })
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Admin API error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminAccess(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get("type")

    const { db } = getFirebase()

    switch (dataType) {
      case "reports": {
        const reportsRef = collection(db, "reports")
        const q = query(reportsRef, where("status", "==", "pending"), orderBy("createdAt", "desc"), limit(50))
        const snapshot = await getDocs(q)
        const reports = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        return NextResponse.json({ reports })
      }

      case "flaggedContent": {
        const postsRef = collection(db, "posts")
        const q = query(postsRef, where("flagged", "==", true), limit(50))
        const snapshot = await getDocs(q)
        const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        return NextResponse.json({ posts })
      }

      default:
        return NextResponse.json({ error: "Unknown data type" }, { status: 400 })
    }
  } catch (error: any) {
    console.error("Admin API GET error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
