import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  onSnapshot,
  serverTimestamp,
  getCountFromServer,
} from "firebase/firestore"
import { getFirebase } from "./firebase"
import type { Notification, NotificationType } from "./types"
import { buildAppURL } from "./config"

// Create a notification
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
  metadata?: Notification["metadata"],
): Promise<string> {
  const { db } = getFirebase()
  const notificationsRef = collection(db, "notifications")

  const absoluteLink = link ? (link.startsWith("http") ? link : buildAppURL(link)) : undefined

  const notification: Omit<Notification, "id"> = {
    userId,
    type,
    title,
    message,
    link: absoluteLink,
    read: false,
    createdAt: serverTimestamp(),
    metadata,
  }

  const docRef = await addDoc(notificationsRef, notification)

  // Trigger email notification via API
  try {
    // Get user email from Firestore (client-side has access)
    const { db } = getFirebase()
    const userRef = doc(db, "users", userId)
    const userDoc = await getDoc(userRef)
    const userEmail = userDoc.exists() ? userDoc.data().email : null

    if (!userEmail) {
      console.warn("User email not found, skipping email notification:", userId)
      return docRef.id
    }

    const response = await fetch("/api/notifications/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId: docRef.id,
        userId,
        userEmail,
        type,
        title,
        message,
        link: absoluteLink, // Pass absolute link to API
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Email API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || "Unknown error",
        details: errorData.details,
      })

      // Log to email_logs on client side if server-side logging failed
      try {
        const { addDoc, collection: col, serverTimestamp: st } = await import("firebase/firestore")
        const emailLogsRef = col(db, "email_logs")
        await addDoc(emailLogsRef, {
          userId,
          email: userEmail,
          notificationId: docRef.id,
          notificationType: type,
          status: "failed",
          error: errorData.error || "Unknown error",
          createdAt: st(),
        })
      } catch (logError) {
        console.warn("Failed to log email error:", logError)
      }
    } else {
      const data = await response.json().catch(() => ({}))
      console.log("Email notification triggered:", data)
    }
  } catch (error: any) {
    console.error("Failed to trigger email notification:", {
      message: error.message,
      error,
    })
  }

  // Trigger push notification via API
  try {
    const pushResponse = await fetch("/api/notifications/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        title,
        body: message,
        link: absoluteLink,
        type,
        data: metadata,
      }),
    })

    if (pushResponse.ok) {
      const pushData = await pushResponse.json().catch(() => ({}))
      console.log("Push notification triggered:", pushData)
    } else {
      console.warn("Push notification failed:", pushResponse.status)
    }
  } catch (error: any) {
    // Silent fail for push - it's optional
    console.warn("Failed to trigger push notification:", error.message)
  }

  return docRef.id
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const { db } = getFirebase()
  const notificationRef = doc(db, "notifications", notificationId)

  await updateDoc(notificationRef, {
    read: true,
    readAt: serverTimestamp(),
  })
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string) {
  const { db } = getFirebase()
  const notificationsRef = collection(db, "notifications")
  const q = query(notificationsRef, where("userId", "==", userId), where("read", "==", false))

  const snapshot = await getDocs(q)
  const updates = snapshot.docs.map((doc) =>
    updateDoc(doc.ref, {
      read: true,
      readAt: serverTimestamp(),
    }),
  )

  await Promise.all(updates)
}

// Get notifications for a user
export async function getUserNotifications(userId: string, limitCount = 50): Promise<Notification[]> {
  const { db } = getFirebase()
  const notificationsRef = collection(db, "notifications")
  const q = query(notificationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(limitCount))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as any),
  }))
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { db } = getFirebase()
  const notificationsRef = collection(db, "notifications")
  const q = query(notificationsRef, where("userId", "==", userId), where("read", "==", false))

  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
}

// Subscribe to notifications for a user (real-time)
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  limitCount = 50,
): () => void {
  const { db } = getFirebase()
  const notificationsRef = collection(db, "notifications")
  const q = query(notificationsRef, where("userId", "==", userId), orderBy("createdAt", "desc"), limit(limitCount))

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }))
    callback(notifications)
  })
}

// Delete notification
export async function deleteNotification(notificationId: string) {
  const { db } = getFirebase()
  const { deleteDoc } = await import("firebase/firestore")
  const notificationRef = doc(db, "notifications", notificationId)
  await deleteDoc(notificationRef)
}

// Helper functions for specific notification types

// Team invite notification
export async function notifyTeamInvite(
  userId: string,
  hackathonId: string,
  teamId: string,
  teamName: string,
  inviterName: string,
  inviterUid: string,
) {
  return createNotification(
    userId,
    "team_invite",
    "Team Invitation",
    `${inviterName} invited you to join team "${teamName}"`,
    `/hackathons/${hackathonId}/team`,
    {
      hackathonId,
      teamId,
      fromUserId: inviterUid,
      fromUserName: inviterName,
    },
  )
}

// Hackathon registration confirmation
export async function notifyHackathonRegistration(userId: string, hackathonId: string, hackathonTitle: string) {
  return createNotification(
    userId,
    "hackathon_registration",
    "Registration Confirmed",
    `You have successfully registered for "${hackathonTitle}"`,
    `/hackathons/${hackathonId}`,
    {
      hackathonId,
    },
  )
}

// Comment notification
export async function notifyComment(
  userId: string,
  postId: string,
  commentId: string,
  commenterName: string,
  commenterUid: string,
  postTitle: string,
) {
  return createNotification(
    userId,
    "comment",
    "New Comment",
    `${commenterName} commented on your post "${postTitle}"`,
    `/gallery?post=${postId}`,
    {
      postId,
      commentId,
      fromUserId: commenterUid,
      fromUserName: commenterName,
    },
  )
}

// Like notification
export async function notifyLike(
  userId: string,
  postId: string,
  likerName: string,
  likerUid: string,
  postTitle: string,
) {
  return createNotification(
    userId,
    "like",
    "New Like",
    `${likerName} liked your post "${postTitle}"`,
    `/gallery?post=${postId}`,
    {
      postId,
      fromUserId: likerUid,
      fromUserName: likerName,
    },
  )
}

// Hackathon update notification
export async function notifyHackathonUpdate(
  userId: string,
  hackathonId: string,
  hackathonTitle: string,
  updateMessage: string,
) {
  return createNotification(
    userId,
    "hackathon_update",
    "Hackathon Update",
    `${hackathonTitle}: ${updateMessage}`,
    `/hackathons/${hackathonId}`,
    {
      hackathonId,
    },
  )
}

// Submission deadline reminder
export async function notifySubmissionDeadline(
  userId: string,
  hackathonId: string,
  hackathonTitle: string,
  deadlineDate: Date,
) {
  return createNotification(
    userId,
    "submission_deadline",
    "Submission Deadline Reminder",
    `Reminder: Submission deadline for "${hackathonTitle}" is approaching`,
    `/hackathons/${hackathonId}/submit`,
    {
      hackathonId,
    },
  )
}

// Mention notification
export async function notifyMention(
  userId: string,
  postId: string,
  mentionerName: string,
  mentionerUid: string,
  postTitle: string,
) {
  return createNotification(
    userId,
    "mention",
    "You were mentioned",
    `${mentionerName} mentioned you in "${postTitle}"`,
    `/gallery?post=${postId}`,
    {
      postId,
      fromUserId: mentionerUid,
      fromUserName: mentionerName,
    },
  )
}

// Follow notification
export async function notifyFollow(userId: string, followerName: string, followerUid: string) {
  return createNotification(
    userId,
    "follow", // Correct type for follow notifications
    "New Follower",
    `${followerName} started following you`,
    `/profile/${followerUid}`,
    {
      fromUserId: followerUid,
      fromUserName: followerName,
    },
  )
}
