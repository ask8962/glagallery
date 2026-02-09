"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { updatePrivacySettings } from "@/lib/profile"
import type { UserProfile, PrivacySettings } from "@/lib/types"
import { Settings, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PrivacySettingsProps {
  profile: UserProfile
  onUpdate: () => void
}

export function PrivacySettings({ profile, onUpdate }: PrivacySettingsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<PrivacySettings>(
    profile.privacySettings || {
      profileVisibility: "public",
      showEmail: false,
      showActivity: true,
      allowFollowRequests: true,
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await updatePrivacySettings(profile.uid, settings)

      if (result.success) {
        toast.success("Privacy settings updated successfully!")
        setOpen(false)
        onUpdate()
      } else {
        toast.error("Failed to update privacy settings")
      }
    } catch (error) {
      console.error("Error updating privacy settings:", error)
      toast.error("An error occurred while updating privacy settings")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Privacy Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Privacy Settings</DialogTitle>
          <DialogDescription>
            Control who can see your profile and activity
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Visibility */}
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <Select
              value={settings.profileVisibility}
              onValueChange={(value: "public" | "private" | "followers") =>
                setSettings({ ...settings, profileVisibility: value })
              }
            >
              <SelectTrigger id="profileVisibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="followers">Followers Only</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {settings.profileVisibility === "public" &&
                "Anyone can view your profile"}
              {settings.profileVisibility === "followers" &&
                "Only your followers can view your profile"}
              {settings.profileVisibility === "private" &&
                "Your profile is hidden from others"}
            </p>
          </div>

          {/* Show Email */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showEmail">Show Email</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to see your email address
              </p>
            </div>
            <Switch
              id="showEmail"
              checked={settings.showEmail}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showEmail: checked })
              }
            />
          </div>

          {/* Show Activity */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showActivity">Show Activity Feed</Label>
              <p className="text-sm text-muted-foreground">
                Display your activity feed on your profile
              </p>
            </div>
            <Switch
              id="showActivity"
              checked={settings.showActivity}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showActivity: checked })
              }
            />
          </div>

          {/* Allow Follow Requests */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowFollowRequests">Allow Follow Requests</Label>
              <p className="text-sm text-muted-foreground">
                Let others request to follow you (for private profiles)
              </p>
            </div>
            <Switch
              id="allowFollowRequests"
              checked={settings.allowFollowRequests}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allowFollowRequests: checked })
              }
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
