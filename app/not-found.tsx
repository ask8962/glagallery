import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
            <h1 className="text-6xl font-black text-primary/20">404</h1>
            <h2 className="text-2xl font-bold">Page Not Found</h2>
            <p className="text-muted-foreground max-w-md">
                Oops! The page you are looking for has vanished into the digital void.
            </p>
            <Link href="/">
                <Button>Return Home</Button>
            </Link>
        </div>
    )
}
