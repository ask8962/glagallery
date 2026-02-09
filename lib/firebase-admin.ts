import * as admin from "firebase-admin"

// Check if required environment variables are present
const hasRequiredEnvVars =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY

let isInitialized = false

if (!admin.apps.length && hasRequiredEnvVars) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        })
        isInitialized = true
        console.log("🔥 Firebase Admin Initialized")
    } catch (error) {
        console.error("Firebase admin initialization error", error)
        isInitialized = false
    }
} else if (admin.apps.length) {
    isInitialized = true
}

if (!hasRequiredEnvVars) {
    console.error("⚠️ Missing Firebase Admin environment variables!")
    console.error("Required: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY")
}

// Only export if initialized, otherwise export dummy objects that throw helpful errors
export const adminDb = isInitialized
    ? admin.firestore()
    : new Proxy({} as admin.firestore.Firestore, {
        get: () => { throw new Error("Firebase Admin not initialized - check environment variables") }
    })

export const adminAuth = isInitialized
    ? admin.auth()
    : new Proxy({} as admin.auth.Auth, {
        get: () => { throw new Error("Firebase Admin not initialized - check environment variables") }
    })

export const adminStorage = isInitialized
    ? admin.storage()
    : new Proxy({} as admin.storage.Storage, {
        get: () => { throw new Error("Firebase Admin not initialized - check environment variables") }
    })

export { isInitialized as firebaseAdminInitialized }
