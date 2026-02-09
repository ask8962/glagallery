import { collection, query, where, getDocs } from "firebase/firestore"
import { getFirebase } from "./firebase"

// Extract @mentions from text
export function extractMentions(text: string): string[] {
  if (!text) return []
  
  const mentionRegex = /@(\w+)/g
  const matches = text.match(mentionRegex)
  
  if (!matches) return []
  
  // Remove duplicates and convert to lowercase
  const unique = [...new Set(matches.map(tag => tag.toLowerCase()))]
  
  return unique
}

// Search users by name or email
export async function searchUsers(searchTerm: string, limit: number = 10) {
  const { db } = getFirebase()
  
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef)
    const snapshot = await getDocs(q)
    
    const users: any[] = []
    snapshot.forEach((doc) => {
      const userData = doc.data()
      const name = userData.name?.toLowerCase() || ""
      const email = userData.email?.toLowerCase() || ""
      const search = searchTerm.toLowerCase()
      
      if (name.includes(search) || email.includes(search)) {
        users.push({
          uid: doc.id,
          name: userData.name,
          email: userData.email,
          photoURL: userData.photoURL
        })
      }
    })
    
    return users.slice(0, limit)
  } catch (error) {
    console.error("Error searching users:", error)
    return []
  }
}

// Format text with clickable mentions
export function splitTextByMentions(text: string): Array<{ text: string; isMention: boolean }> {
  if (!text) return [{ text, isMention: false }]
  
  const mentionRegex = /(@\w+)/g
  const parts = text.split(mentionRegex)
  
  return parts.map(part => ({
    text: part,
    isMention: part.match(mentionRegex) !== null
  }))
}

// Get username from email (before @)
export function getUsernameFromEmail(email: string): string {
  return email.split('@')[0]
}

// Validate if mention exists as user
export async function validateMentions(mentions: string[]): Promise<string[]> {
  const { db } = getFirebase()
  const validMentions: string[] = []
  
  try {
    for (const mention of mentions) {
      const username = mention.replace('@', '').toLowerCase()
      const usersRef = collection(db, "users")
      const q = query(usersRef)
      const snapshot = await getDocs(q)
      
      snapshot.forEach((doc) => {
        const email = doc.data().email?.toLowerCase() || ""
        if (email.startsWith(username + '@')) {
          validMentions.push(mention)
        }
      })
    }
  } catch (error) {
    console.error("Error validating mentions:", error)
  }
  
  return validMentions
}
