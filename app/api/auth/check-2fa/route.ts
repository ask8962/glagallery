import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
    try {
        const cookieStore = await cookies()
        const twoFACookie = cookieStore.get("2fa_verified")

        if (twoFACookie?.value) {
            return NextResponse.json({ verified: true })
        }

        return NextResponse.json({ verified: false })
    } catch (error) {
        console.error("Check 2FA error:", error)
        return NextResponse.json({ verified: false })
    }
}
