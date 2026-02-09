"use server"

import { NextRequest, NextResponse } from "next/server"
import { adminDb, adminStorage } from "@/lib/firebase-admin"
import { verifyAuthToken } from "@/lib/server-auth"
import { Timestamp } from "firebase-admin/firestore"
import { v4 as uuidv4 } from "uuid"

// GET: List documents for a club
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: clubId } = await params

        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()

        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const documents = clubDoc.data()?.documents || []

        return NextResponse.json({ documents })

    } catch (error: any) {
        console.error("Get club documents error:", error)
        return NextResponse.json({ error: error.message || "Failed to get documents" }, { status: 500 })
    }
}

// POST: Upload a new document
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await verifyAuthToken(request)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: clubId } = await params

        // Verify user is club admin
        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()
        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const club = clubDoc.data()!
        const isAdmin = club.admins?.includes(authResult.user.uid) || club.presidentUid === authResult.user.uid

        if (!isAdmin) {
            return NextResponse.json({ error: "Only club admins can upload documents" }, { status: 403 })
        }

        const formData = await request.formData()
        const file = formData.get("file") as File
        const docName = formData.get("name") as string
        const docType = formData.get("type") as string

        if (!file || !docName || !docType) {
            return NextResponse.json({ error: "File, name, and type are required" }, { status: 400 })
        }

        // Validate file type (PDF, DOC, DOCX allowed)
        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Only PDF and Word documents are allowed" }, { status: 400 })
        }

        // Upload to Firebase Storage
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const fileName = `clubs/${clubId}/documents/${uuidv4()}_${file.name}`
        const bucket = adminStorage.bucket()
        const fileRef = bucket.file(fileName)

        await fileRef.save(fileBuffer, {
            metadata: { contentType: file.type }
        })

        await fileRef.makePublic()
        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`

        // Add document to club
        const newDocument = {
            id: uuidv4(),
            name: docName,
            url: fileUrl,
            type: docType,
            uploadedBy: authResult.user.uid,
            uploadedAt: Timestamp.now()
        }

        const existingDocs = club.documents || []
        await adminDb.collection("clubs").doc(clubId).update({
            documents: [...existingDocs, newDocument]
        })

        return NextResponse.json({ success: true, document: newDocument })

    } catch (error: any) {
        console.error("Upload club document error:", error)
        return NextResponse.json({ error: error.message || "Failed to upload document" }, { status: 500 })
    }
}

// DELETE: Remove a document
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await verifyAuthToken(request)
        if (!authResult.authenticated || !authResult.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: clubId } = await params
        const { searchParams } = new URL(request.url)
        const docId = searchParams.get("docId")

        if (!docId) {
            return NextResponse.json({ error: "Document ID is required" }, { status: 400 })
        }

        // Verify user is club admin
        const clubDoc = await adminDb.collection("clubs").doc(clubId).get()
        if (!clubDoc.exists) {
            return NextResponse.json({ error: "Club not found" }, { status: 404 })
        }

        const club = clubDoc.data()!
        const isAdmin = club.admins?.includes(authResult.user.uid) || club.presidentUid === authResult.user.uid

        if (!isAdmin) {
            return NextResponse.json({ error: "Only club admins can delete documents" }, { status: 403 })
        }

        // Remove from documents array
        const updatedDocs = (club.documents || []).filter((d: any) => d.id !== docId)

        await adminDb.collection("clubs").doc(clubId).update({
            documents: updatedDocs
        })

        return NextResponse.json({ success: true, message: "Document deleted" })

    } catch (error: any) {
        console.error("Delete club document error:", error)
        return NextResponse.json({ error: error.message || "Failed to delete document" }, { status: 500 })
    }
}
