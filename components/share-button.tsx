"use client"

import { useState } from "react"
import { Share2, Copy, Check, MessageCircle, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { buildAppURL } from "@/lib/config"

interface ShareButtonProps {
    postId: string
    postTitle: string
    postDescription?: string
    className?: string
    variant?: "default" | "ghost" | "outline"
    size?: "default" | "sm" | "lg" | "icon"
}

export function ShareButton({
    postId,
    postTitle,
    postDescription,
    className,
    variant = "ghost",
    size = "sm",
}: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const shareUrl = buildAppURL(`/gallery?post=${postId}`)
    const shareText = `Check out "${postTitle}" on CampusHub! 🎓📸`
    const fullShareText = postDescription
        ? `${shareText}\n\n${postDescription.slice(0, 100)}${postDescription.length > 100 ? "..." : ""}`
        : shareText

    // Native Web Share API (works on mobile)
    async function handleNativeShare() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: postTitle,
                    text: shareText,
                    url: shareUrl,
                })
                toast.success("Shared successfully!")
            } catch (error: any) {
                if (error.name !== "AbortError") {
                    console.error("Share failed:", error)
                }
            }
        }
    }

    // Copy link to clipboard
    async function handleCopyLink() {
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            toast.success("Link copied to clipboard!")
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error("Copy failed:", error)
            toast.error("Failed to copy link")
        }
    }

    // Share to WhatsApp
    function handleWhatsApp() {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
            `${fullShareText}\n\n${shareUrl}`
        )}`
        window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    }

    // Share to Twitter/X
    function handleTwitter() {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            shareText
        )}&url=${encodeURIComponent(shareUrl)}`
        window.open(twitterUrl, "_blank", "noopener,noreferrer")
    }

    // Share to Facebook
    function handleFacebook() {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
        )}&quote=${encodeURIComponent(shareText)}`
        window.open(facebookUrl, "_blank", "noopener,noreferrer")
    }

    // Share to LinkedIn
    function handleLinkedIn() {
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            shareUrl
        )}`
        window.open(linkedInUrl, "_blank", "noopener,noreferrer")
    }

    // Check if native share is available
    const hasNativeShare = typeof navigator !== "undefined" && navigator.share

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size}
                    className={className}
                    title="Share this post"
                >
                    <Share2 className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {hasNativeShare && (
                    <>
                        <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
                            <Share2 className="mr-2 h-4 w-4" />
                            <span>Share...</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    </>
                )}

                <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer">
                    <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
                    <span>WhatsApp</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleTwitter} className="cursor-pointer">
                    <Twitter className="mr-2 h-4 w-4 text-sky-500" />
                    <span>Twitter / X</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleFacebook} className="cursor-pointer">
                    <svg
                        className="mr-2 h-4 w-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span>Facebook</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={handleLinkedIn} className="cursor-pointer">
                    <svg
                        className="mr-2 h-4 w-4 text-blue-700"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    <span>LinkedIn</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    {copied ? (
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                    ) : (
                        <Copy className="mr-2 h-4 w-4" />
                    )}
                    <span>{copied ? "Copied!" : "Copy Link"}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
