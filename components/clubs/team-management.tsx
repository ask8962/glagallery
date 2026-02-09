"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Plus, UserPlus, X, Crown, Users } from "lucide-react"
import { User } from "firebase/auth"
import { getFirebase } from "@/lib/firebase"
import { collection, query, where, getDocs, limit } from "firebase/firestore"
import type { UserProfile } from "@/lib/types"

interface TeamMember {
    uid: string
    name: string
    email: string
    role: string
    addedAt?: string
    photoURL?: string
}

interface TeamManagementProps {
    clubId: string
    presidentUid: string
    user: User
}

const ROLES = [
    "Vice President",
    "Secretary",
    "Treasurer",
    "Event Coordinator",
    "Technical Lead",
    "Marketing Head",
    "Member",
    "Advisor"
]

export function TeamManagement({ clubId, presidentUid, user }: TeamManagementProps) {
    const { db } = getFirebase()
    const [team, setTeam] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [adding, setAdding] = useState(false)
    const [removing, setRemoving] = useState<string | null>(null)

    // Search state
    const [searchEmail, setSearchEmail] = useState("")
    const [searchResults, setSearchResults] = useState<UserProfile[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
    const [selectedRole, setSelectedRole] = useState("")

    const isPresident = user.uid === presidentUid

    useEffect(() => {
        fetchTeam()
    }, [clubId])

    const fetchTeam = async () => {
        try {
            const token = await user.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}/members`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const data = await res.json()
            setTeam(data.team || [])
        } catch (error) {
            console.error("Failed to fetch team:", error)
        } finally {
            setLoading(false)
        }
    }

    const searchUsers = async () => {
        if (!searchEmail || searchEmail.length < 3) {
            toast.error("Enter at least 3 characters")
            return
        }

        setSearching(true)
        try {
            const usersQuery = query(
                collection(db, "users"),
                where("email", ">=", searchEmail.toLowerCase()),
                where("email", "<=", searchEmail.toLowerCase() + "\uf8ff"),
                limit(10)
            )
            const snapshot = await getDocs(usersQuery)
            const users = snapshot.docs.map(doc => doc.data() as UserProfile)
            setSearchResults(users)

            if (users.length === 0) {
                toast.info("No users found")
            }
        } catch (error) {
            console.error("Search error:", error)
            toast.error("Search failed")
        } finally {
            setSearching(false)
        }
    }

    const addMember = async () => {
        if (!selectedUser || !selectedRole) {
            toast.error("Select a user and role")
            return
        }

        setAdding(true)
        try {
            const token = await user.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    memberUid: selectedUser.uid,
                    memberName: selectedUser.name,
                    memberEmail: selectedUser.email,
                    role: selectedRole
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success(data.message)
            setDialogOpen(false)
            resetForm()
            fetchTeam()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setAdding(false)
        }
    }

    const removeMember = async (memberUid: string) => {
        setRemoving(memberUid)
        try {
            const token = await user.getIdToken()
            const res = await fetch(`/api/clubs/${clubId}/members`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ memberUid })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            toast.success("Member removed")
            fetchTeam()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setRemoving(null)
        }
    }

    const resetForm = () => {
        setSearchEmail("")
        setSearchResults([])
        setSelectedUser(null)
        setSelectedRole("")
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Team Management
                        </CardTitle>
                        <CardDescription>
                            Add team members with specific roles.
                        </CardDescription>
                    </div>
                    {isPresident && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Add Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Team Member</DialogTitle>
                                    <DialogDescription>
                                        Search for a student by email and assign them a role.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {/* Search */}
                                    <div className="space-y-2">
                                        <Label>Search by Email</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Enter email..."
                                                value={searchEmail}
                                                onChange={(e) => setSearchEmail(e.target.value)}
                                            />
                                            <Button onClick={searchUsers} disabled={searching}>
                                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Search Results */}
                                    {searchResults.length > 0 && (
                                        <div className="space-y-2">
                                            <Label>Select User</Label>
                                            <div className="max-h-40 overflow-y-auto space-y-2">
                                                {searchResults.map((u) => (
                                                    <div
                                                        key={u.uid}
                                                        onClick={() => setSelectedUser(u)}
                                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedUser?.uid === u.uid
                                                                ? "bg-accent text-accent-foreground"
                                                                : "hover:bg-muted"
                                                            }`}
                                                    >
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={u.photoURL} />
                                                            <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{u.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Role Selection */}
                                    {selectedUser && (
                                        <div className="space-y-2">
                                            <Label>Select Role</Label>
                                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose a role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ROLES.map((role) => (
                                                        <SelectItem key={role} value={role}>
                                                            {role}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={addMember} disabled={adding || !selectedUser || !selectedRole}>
                                        {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Member"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {team.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>No team members added yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {team.map((member) => (
                            <div
                                key={member.uid}
                                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                            >
                                <Avatar>
                                    <AvatarImage src={member.photoURL} />
                                    <AvatarFallback>{member.name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">{member.name}</p>
                                        {member.uid === presidentUid && (
                                            <Crown className="h-4 w-4 text-amber-500" />
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                                </div>
                                <Badge variant="secondary">{member.role}</Badge>
                                {isPresident && member.uid !== presidentUid && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeMember(member.uid)}
                                        disabled={removing === member.uid}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        {removing === member.uid ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <X className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
