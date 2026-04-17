import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore"
import { getFirebase } from "./firebase"
import type { Hackathon, Team, TeamMember, Submission, HackathonJudging, JudgeScore } from "./types"
import { validateHackathon, validateTeamName, validateProjectSubmission, sanitizeText } from "./validation"

// Get all hackathons
export async function getAllHackathons(status?: Hackathon["status"], organizationId?: string) {
  const { db } = getFirebase()
  const hackathonsRef = collection(db, "hackathons")

  try {
    const constraints: any[] = [];
    if (status) constraints.push(where("status", "==", status));
    if (organizationId) constraints.push(where("organizationId", "==", organizationId));
    constraints.push(orderBy("startDate", "desc"));
    
    const q = query(hackathonsRef, ...constraints);

    const snapshot = await getDocs(q)
    const hackathons: Hackathon[] = []
    snapshot.forEach((doc) => {
      hackathons.push({ id: doc.id, ...(doc.data() as any) })
    })
    return hackathons
  } catch (error: any) {
    // If permission denied or index missing, try without ordering
    if (error.code === "permission-denied") {
      console.error("Permission denied accessing hackathons:", error)
      throw new Error("You don't have permission to view hackathons. Please sign in with a GLA email.")
    }

    // If index doesn't exist, try without ordering
    if (error.code === "failed-precondition" || error.message?.includes("index")) {
      console.warn("Index missing, fetching without ordering:", error)
      try {
        const fallbackConstraints: any[] = [];
        if (status) fallbackConstraints.push(where("status", "==", status));
        if (organizationId) fallbackConstraints.push(where("organizationId", "==", organizationId));
        const snapshot = await getDocs(query(hackathonsRef, ...fallbackConstraints))
        const hackathons: Hackathon[] = []
        snapshot.forEach((doc) => {
          hackathons.push({ id: doc.id, ...(doc.data() as any) })
        })
        // Sort manually
        hackathons.sort((a, b) => {
          const aDate = (a.startDate as any)?.toDate?.() || new Date(0)
          const bDate = (b.startDate as any)?.toDate?.() || new Date(0)
          return bDate.getTime() - aDate.getTime()
        })
        return hackathons
      } catch (fallbackError: any) {
        console.error("Error fetching hackathons (fallback):", fallbackError)
        throw fallbackError
      }
    }

    console.error("Error fetching hackathons:", error)
    throw error
  }
}

// Get hackathon by ID
export async function getHackathonById(hackathonId: string): Promise<Hackathon | null> {
  const { db } = getFirebase()
  const hackathonRef = doc(db, "hackathons", hackathonId)
  const snapshot = await getDoc(hackathonRef)

  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...(snapshot.data() as any) }
}

// Create hackathon
export async function createHackathon(hackathonData: Omit<Hackathon, "id" | "createdAt" | "updatedAt">) {
  const { db } = getFirebase()
  const hackathonsRef = collection(db, "hackathons")

  // Validate hackathon data
  const startDate = (hackathonData.startDate as any)?.toDate?.() || new Date()
  const endDate = (hackathonData.endDate as any)?.toDate?.() || new Date()

  const validation = validateHackathon({
    title: hackathonData.title,
    description: hackathonData.description,
    startDate,
    endDate,
  })

  if (!validation.valid) {
    throw new Error(validation.errors.join(". "))
  }

  // Filter out undefined values (Firestore doesn't accept undefined)
  const cleanedData: any = {}
  Object.keys(hackathonData).forEach((key) => {
    const value = (hackathonData as any)[key]
    if (value !== undefined) {
      cleanedData[key] = value
    }
  })

  // Use sanitized values
  cleanedData.title = validation.sanitized.title
  cleanedData.description = validation.sanitized.description

  const newHackathon = {
    ...cleanedData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(hackathonsRef, newHackathon)
  return docRef.id
}

// Update hackathon
export async function updateHackathon(hackathonId: string, updates: Partial<Hackathon>) {
  const { db } = getFirebase()
  const hackathonRef = doc(db, "hackathons", hackathonId)

  // Filter out undefined values (Firestore doesn't accept undefined)
  const cleanedUpdates: any = {}
  Object.keys(updates).forEach((key) => {
    const value = (updates as any)[key]
    if (value !== undefined) {
      cleanedUpdates[key] = value
    }
  })

  await updateDoc(hackathonRef, {
    ...cleanedUpdates,
    updatedAt: serverTimestamp(),
  })
}

// Delete hackathon
export async function deleteHackathon(hackathonId: string) {
  const { db } = getFirebase()
  const hackathonRef = doc(db, "hackathons", hackathonId)
  await deleteDoc(hackathonRef)
}

// Register for hackathon (create team)
export async function registerForHackathon(
  hackathonId: string,
  teamName: string,
  leaderUid: string,
  leaderName: string,
  leaderEmail: string,
  leaderPhotoURL?: string,
) {
  const { db } = getFirebase()
  const teamsRef = collection(db, "hackathons", hackathonId, "teams")

  const teamNameValidation = validateTeamName(teamName)
  if (!teamNameValidation.valid) {
    throw new Error(teamNameValidation.error || "Invalid team name")
  }

  const team: Omit<Team, "id"> = {
    hackathonId,
    name: teamNameValidation.sanitized, // Use sanitized name
    members: [
      {
        uid: leaderUid,
        name: sanitizeText(leaderName), // Sanitize leader name
        email: leaderEmail,
        photoURL: leaderPhotoURL,
        role: "Team Leader",
        joinedAt: Timestamp.now(),
      },
    ],
    leaderUid,
    leaderName: sanitizeText(leaderName), // Sanitize leader name
    status: "registered",
    createdAt: serverTimestamp(),
  }

  const docRef = await addDoc(teamsRef, team)

  // Send registration confirmation notification
  try {
    const { notifyHackathonRegistration } = await import("@/lib/notifications")
    const hackathon = await getHackathonById(hackathonId)
    if (hackathon) {
      await notifyHackathonRegistration(leaderUid, hackathonId, hackathon.title)
    }
  } catch (error) {
    console.error("Failed to send registration notification:", error)
    // Don't fail the operation if notification fails
  }

  return docRef.id
}

// Get user's teams for a hackathon
export async function getUserTeams(hackathonId: string, userId: string): Promise<Team[]> {
  const { db } = getFirebase()
  const teamsRef = collection(db, "hackathons", hackathonId, "teams")
  // Get all teams and filter client-side since Firestore doesn't support nested array queries
  const q = query(teamsRef)

  const snapshot = await getDocs(q)
  const teams: Team[] = []
  snapshot.forEach((doc) => {
    const data = doc.data() as any
    // Check if user is actually a member
    if (data.members && data.members.some((m: TeamMember) => m.uid === userId)) {
      teams.push({ id: doc.id, ...data })
    }
  })
  return teams
}

// Get all teams for a hackathon
export async function getHackathonTeams(hackathonId: string): Promise<Team[]> {
  const { db } = getFirebase()
  const teamsRef = collection(db, "hackathons", hackathonId, "teams")
  const q = query(teamsRef, orderBy("createdAt", "asc"))

  const snapshot = await getDocs(q)
  const teams: Team[] = []
  snapshot.forEach((doc) => {
    teams.push({ id: doc.id, ...(doc.data() as any) })
  })
  return teams
}

// Get team by ID
export async function getTeamById(hackathonId: string, teamId: string): Promise<Team | null> {
  const { db } = getFirebase()
  const teamRef = doc(db, "hackathons", hackathonId, "teams", teamId)
  const snapshot = await getDoc(teamRef)

  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...(snapshot.data() as any) }
}

// Add member to team
export async function addTeamMember(hackathonId: string, teamId: string, member: Omit<TeamMember, "joinedAt">) {
  const { db } = getFirebase()
  const teamRef = doc(db, "hackathons", hackathonId, "teams", teamId)

  const team = await getTeamById(hackathonId, teamId)
  if (!team) throw new Error("Team not found")

  // Check team size
  const hackathon = await getHackathonById(hackathonId)
  if (!hackathon) throw new Error("Hackathon not found")

  if (team.members.length >= hackathon.maxTeamSize) {
    throw new Error(`Team is full. Maximum team size is ${hackathon.maxTeamSize}`)
  }

  // Check if user is already in a team
  const userTeams = await getUserTeams(hackathonId, member.uid)
  if (userTeams.length > 0) {
    throw new Error("User is already registered in a team for this hackathon")
  }

  const newMember: TeamMember = {
    ...member,
    joinedAt: Timestamp.now(),
  }

  await updateDoc(teamRef, {
    members: arrayUnion(newMember),
  })

  // Send notification to the new team member
  try {
    const { notifyTeamInvite } = await import("@/lib/notifications")
    await notifyTeamInvite(member.uid, hackathonId, teamId, team.name, team.leaderName, team.leaderUid)
  } catch (error) {
    console.error("Failed to send team invite notification:", error)
    // Don't fail the operation if notification fails
  }
}

// Remove member from team
export async function removeTeamMember(hackathonId: string, teamId: string, memberUid: string) {
  const { db } = getFirebase()
  const teamRef = doc(db, "hackathons", hackathonId, "teams", teamId)

  const team = await getTeamById(hackathonId, teamId)
  if (!team) throw new Error("Team not found")

  const member = team.members.find((m) => m.uid === memberUid)
  if (!member) throw new Error("Member not found")

  await updateDoc(teamRef, {
    members: arrayRemove(member),
  })

  // If leader left, assign new leader or delete team
  if (memberUid === team.leaderUid) {
    const remainingMembers = team.members.filter((m) => m.uid !== memberUid)
    if (remainingMembers.length > 0) {
      await updateDoc(teamRef, {
        leaderUid: remainingMembers[0].uid,
        leaderName: remainingMembers[0].name,
      })
    } else {
      await deleteDoc(teamRef)
    }
  }
}

// Submit project
export async function submitProject(
  hackathonId: string,
  teamId: string,
  submissionData: Omit<Submission, "id" | "submittedAt" | "submittedBy" | "hackathonId" | "teamId">,
) {
  const { db } = getFirebase()

  const validation = validateProjectSubmission({
    projectName: submissionData.projectName,
    projectDescription: submissionData.projectDescription,
    repoUrl: submissionData.repoUrl,
    demoUrl: submissionData.demoUrl,
    videoUrl: submissionData.videoUrl,
  })

  if (!validation.valid) {
    throw new Error(validation.errors.join(". "))
  }

  // Filter out undefined values for team update
  const cleanedTeamData: any = {
    projectName: validation.sanitized.projectName,
    projectDescription: validation.sanitized.projectDescription,
  }

  if (validation.sanitized.repoUrl) cleanedTeamData.repoUrl = validation.sanitized.repoUrl
  if (validation.sanitized.demoUrl) cleanedTeamData.demoUrl = validation.sanitized.demoUrl
  if (validation.sanitized.videoUrl) cleanedTeamData.videoUrl = validation.sanitized.videoUrl

  // Update team status
  const teamRef = doc(db, "hackathons", hackathonId, "teams", teamId)
  await updateDoc(teamRef, {
    ...cleanedTeamData,
    status: "submitted",
    submittedAt: serverTimestamp(),
  })

  // Create submission document with sanitized data
  const submissionsRef = collection(db, "hackathons", hackathonId, "submissions")
  const submission: Omit<Submission, "id"> = {
    hackathonId,
    teamId,
    teamName: sanitizeText(submissionData.teamName),
    projectName: validation.sanitized.projectName,
    projectDescription: validation.sanitized.projectDescription,
    repoUrl: validation.sanitized.repoUrl,
    demoUrl: validation.sanitized.demoUrl,
    videoUrl: validation.sanitized.videoUrl,
    submittedAt: serverTimestamp(),
    submittedBy: sanitizeText(submissionData.teamName),
  }

  const docRef = await addDoc(submissionsRef, submission)
  return docRef.id
}

// Get submissions for a hackathon
export async function getHackathonSubmissions(hackathonId: string): Promise<Submission[]> {
  const { db } = getFirebase()
  const submissionsRef = collection(db, "hackathons", hackathonId, "submissions")
  const q = query(submissionsRef, orderBy("submittedAt", "desc"))

  const snapshot = await getDocs(q)
  const submissions: Submission[] = []
  snapshot.forEach((doc) => {
    submissions.push({ id: doc.id, ...(doc.data() as any) })
  })
  return submissions
}

// Get submission by team ID
export async function getSubmissionByTeam(hackathonId: string, teamId: string): Promise<Submission | null> {
  const { db } = getFirebase()
  const submissionsRef = collection(db, "hackathons", hackathonId, "submissions")
  const q = query(submissionsRef, where("teamId", "==", teamId), limit(1))

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  return { id: doc.id, ...(doc.data() as any) }
}

// Submit judge score
export async function submitJudgeScore(
  hackathonId: string,
  submissionId: string,
  teamId: string,
  judgeScore: Omit<JudgeScore, "scoredAt">,
) {
  const { db } = getFirebase()
  const judgingRef = doc(db, "hackathons", hackathonId, "judging", submissionId)

  const snapshot = await getDoc(judgingRef)
  const scoreWithTimestamp: JudgeScore = {
    ...judgeScore,
    scoredAt: serverTimestamp(),
  }

  if (!snapshot.exists()) {
    // Create new judging document
    // NOTE: setDoc is required here because updateDoc cannot create a document that doesn't exist
    const judging = {
      hackathonId,
      submissionId,
      teamId,
      scores: [scoreWithTimestamp],
      averageScore: judgeScore.totalScore,
      updatedAt: serverTimestamp(),
    }
    await setDoc(judgingRef, judging)
  } else {
    // Update existing judging document
    const existing = snapshot.data() as HackathonJudging
    const existingScores = existing.scores || []

    // Remove old score from this judge if exists
    const filteredScores = existingScores.filter((s) => s.judgeUid !== judgeScore.judgeUid)
    filteredScores.push(scoreWithTimestamp)

    // Calculate average
    const totalScore = filteredScores.reduce((sum, s) => sum + s.totalScore, 0)
    const averageScore = totalScore / filteredScores.length

    await updateDoc(judgingRef, {
      scores: filteredScores,
      averageScore,
      updatedAt: serverTimestamp(),
    } as any)
  }
}

// Get judging results for a hackathon
export async function getHackathonJudging(hackathonId: string): Promise<HackathonJudging[]> {
  const { db } = getFirebase()
  const judgingRef = collection(db, "hackathons", hackathonId, "judging")
  const q = query(judgingRef, orderBy("averageScore", "desc"))

  const snapshot = await getDocs(q)
  const results: HackathonJudging[] = []
  snapshot.forEach((doc) => {
    results.push({ ...(doc.data() as any) })
  })
  return results
}

// Update hackathon status based on dates
export async function updateHackathonStatus(hackathonId: string) {
  const hackathon = await getHackathonById(hackathonId)
  if (!hackathon) return

  const now = Timestamp.now()
  const startDate = hackathon.startDate as Timestamp
  const endDate = hackathon.endDate as Timestamp
  const registrationDeadline = hackathon.registrationDeadline as Timestamp
  const submissionDeadline = hackathon.submissionDeadline as Timestamp

  let newStatus: Hackathon["status"] = hackathon.status

  if (now < registrationDeadline) {
    newStatus = "upcoming"
  } else if (now < startDate) {
    newStatus = "registration"
  } else if (now < submissionDeadline) {
    newStatus = "active"
  } else if (now < endDate) {
    newStatus = "judging"
  } else {
    newStatus = "completed"
  }

  if (newStatus !== hackathon.status) {
    await updateHackathon(hackathonId, { status: newStatus })
  }
}

// Check in a team at the venue
export async function checkInTeam(
  hackathonId: string,
  teamId: string,
  adminUid: string
): Promise<{ success: boolean; message: string }> {
  const { db } = getFirebase()
  const teamRef = doc(db, "hackathons", hackathonId, "teams", teamId)

  try {
    const teamSnap = await getDoc(teamRef)
    if (!teamSnap.exists()) {
      return { success: false, message: "Team not found" }
    }

    const teamData = teamSnap.data()
    if (teamData.checkedIn) {
      return { success: false, message: "Team already checked in" }
    }

    await updateDoc(teamRef, {
      checkedIn: true,
      checkedInAt: serverTimestamp(),
      checkedInBy: adminUid,
    })

    return { success: true, message: `Team "${teamData.name}" checked in successfully` }
  } catch (error) {
    console.error("Error checking in team:", error)
    return { success: false, message: "Failed to check in team" }
  }
}

// Get all checked-in teams for a hackathon
export async function getCheckedInTeams(hackathonId: string): Promise<Team[]> {
  const { db } = getFirebase()
  const teamsRef = collection(db, "hackathons", hackathonId, "teams")

  try {
    const q = query(teamsRef, where("checkedIn", "==", true))
    const snapshot = await getDocs(q)

    const teams: Team[] = []
    snapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...(doc.data() as any) })
    })

    return teams
  } catch (error) {
    console.error("Error getting checked-in teams:", error)
    return []
  }
}

