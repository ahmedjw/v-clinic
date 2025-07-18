import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
    return (
        <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-col items-center justify-center py-12">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <CardTitle className="text-6xl font-bold text-primary">404</CardTitle>
                    <CardDescription className="text-xl text-muted-foreground">Page Not Found</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg">Oops! The page you are looking for does not exist.</p>
                    <Link href="/">
                        <Button>Go to Homepage</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
