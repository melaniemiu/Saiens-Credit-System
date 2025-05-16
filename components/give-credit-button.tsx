"use client"

import { Button } from "@/components/ui/button"
import { CirclePlus } from "lucide-react"
import Link from "next/link"

export function GiveCreditButton() {
  return (
    <Link href="/dashboard/give-credit">
      <Button className="bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 rounded-full flex items-center gap-4 fixed bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 shadow-2xl z-50 px-8 py-8 md:px-12 md:py-10 transform hover:scale-105 transition-all duration-300 text-xl md:text-2xl font-bold">
        <CirclePlus className="h-8 w-8 md:h-10 md:w-10" />
        給予 Credit
      </Button>
    </Link>
  )
}