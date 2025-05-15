"use client"

import { Button } from "@/components/ui/button"
import { CirclePlus } from "lucide-react"
import Link from "next/link"

export function GiveCreditButton() {
  return (
    <Link href="/dashboard/give-credit">
      <Button className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 rounded-full flex items-center gap-2 fixed bottom-8 right-8 shadow-xl z-50 px-6 py-3 transform hover:scale-105 transition-all duration-300">
        <CirclePlus className="h-5 w-5" />
        給予 Credit
      </Button>
    </Link>
  )
}