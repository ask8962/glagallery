// Extract hashtags from text
export function extractHashtags(text: string): string[] {
  if (!text) return []
  
  const hashtagRegex = /#(\w+)/g
  const matches = text.match(hashtagRegex)
  
  if (!matches) return []
  
  // Remove duplicates and convert to lowercase
  const unique = [...new Set(matches.map(tag => tag.toLowerCase()))]
  
  return unique
}

// Format text with clickable hashtags (returns array of parts for rendering)
export function splitTextByHashtags(text: string): Array<{ text: string; isHashtag: boolean }> {
  if (!text) return [{ text, isHashtag: false }]
  
  const hashtagRegex = /(#\w+)/g
  const parts = text.split(hashtagRegex)
  
  return parts.map(part => ({
    text: part,
    isHashtag: part.match(hashtagRegex) !== null
  }))
}

// Get trending hashtags
export async function getTrendingHashtags(db: any, limit: number = 10): Promise<Array<{tag: string, count: number}>> {
  try {
    const { collection, getDocs, query, orderBy: fbOrderBy, limit: fbLimit } = await import('firebase/firestore')
    
    const hashtagsRef = collection(db, 'trending_hashtags')
    const q = query(hashtagsRef, fbOrderBy('count', 'desc'), fbLimit(limit))
    const snapshot = await getDocs(q)
    
    const trending: Array<{tag: string, count: number}> = []
    snapshot.forEach(doc => {
      trending.push(doc.data() as {tag: string, count: number})
    })
    
    return trending
  } catch (error) {
    console.error('Error fetching trending hashtags:', error)
    return []
  }
}

// Update hashtag counts (would be called via Cloud Function in production)
export async function updateHashtagCounts(db: any, hashtags: string[]) {
  try {
    const { doc, setDoc, getDoc, increment } = await import('firebase/firestore')
    
    for (const tag of hashtags) {
      const hashtagRef = doc(db, 'trending_hashtags', tag.toLowerCase().replace('#', ''))
      const hashtagDoc = await getDoc(hashtagRef)
      
      if (hashtagDoc.exists()) {
        await setDoc(hashtagRef, {
          tag: tag.toLowerCase(),
          count: increment(1),
          lastUsed: new Date(),
        }, { merge: true })
      } else {
        await setDoc(hashtagRef, {
          tag: tag.toLowerCase(),
          count: 1,
          lastUsed: new Date(),
          createdAt: new Date(),
        })
      }
    }
  } catch (error) {
    console.error('Error updating hashtag counts:', error)
  }
}
