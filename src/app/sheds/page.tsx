"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ShedsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to farms page since sheds are now managed within farms
    router.replace("/farms")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-gray-600">Sheds are now managed within farms.</p>
      </div>
    </div>
  )
}