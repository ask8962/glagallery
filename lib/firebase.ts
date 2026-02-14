import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"
import { firebaseConfig } from "./firebase-config"

// Initialize once (singleton)
const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app)
const storage: FirebaseStorage = getStorage(app)

export { app, auth, db, storage }
export const googleProvider = new GoogleAuthProvider()

/**
 * Returns initialized Firebase instances.
 * Useful for ensuring Firebase is ready before usage in components.
 * 
 * @returns Object containing app, auth, db, and storage instances
 */
export function getFirebase() {
  return { app, auth, db, storage }
}
