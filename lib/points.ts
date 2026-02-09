import { adminDb } from "@/lib/firebase-admin"
import { Timestamp } from "firebase-admin/firestore"
import type { PointTransactionType } from "@/lib/types"

/**
 * Log a point transaction to the ledger
 */
export async function logPointTransaction(
    userId: string,
    amount: number,
    type: PointTransactionType,
    description: string,
    referenceId?: string
): Promise<void> {
    try {
        await adminDb.collection("point_transactions").add({
            userId,
            amount,
            type,
            description,
            referenceId: referenceId || null,
            createdAt: Timestamp.now()
        })
    } catch (error) {
        console.error("Failed to log point transaction:", error)
        // Don't throw - logging should be non-blocking
    }
}
