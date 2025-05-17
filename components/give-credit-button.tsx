"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { GiveCreditForm } from "./give-credit-form"
import { Gift, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function GiveCreditButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      <div className="fixed bottom-8 right-8 z-40">
        <div className="relative">
          {/* Animated background effect */}
          <div className={cn(
            "absolute inset-0 bg-gradient-fuchsia rounded-full blur-xl opacity-60 transition-all duration-500",
            isHovered ? "scale-125 opacity-80" : "scale-100"
          )} />
          
          {/* Main button */}
          <Button
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            size="lg"
            className="relative h-16 px-8 bg-gradient-fuchsia text-white border-0 shadow-soft-2xl hover:shadow-soft-xl hover:scale-[1.05] transition-all duration-300 flex items-center gap-3 rounded-full"
          >
            <div className="relative">
              <Gift className={cn(
                "h-6 w-6 transition-transform duration-300",
                isHovered ? "rotate-12" : ""
              )} />
              <Sparkles className={cn(
                "h-3 w-3 absolute -top-2 -right-2 transition-all duration-300",
                isHovered ? "opacity-100 scale-100" : "opacity-0 scale-0"
              )} />
            </div>
            <span className="font-bold text-lg">給予 Credit</span>
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-soft-2xl">
          <GiveCreditForm />
        </DialogContent>
      </Dialog>
    </>
  )
}