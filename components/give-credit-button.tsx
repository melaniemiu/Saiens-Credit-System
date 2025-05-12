"use client"

import { Button } from "@/components/ui/button"
import { CirclePlus } from "lucide-react"
import Link from "next/link"

export function GiveCreditButton() {
  return (
    <Link href="/dashboard/give-credit">
      <Button className="bg-black text-white hover:bg-gray-800 rounded-full flex items-center gap-2 fixed bottom-8 right-8 shadow-lg z-50">
        <CirclePlus className="h-4 w-4" />
        重新發點
      </Button>
    </Link>
  )
}