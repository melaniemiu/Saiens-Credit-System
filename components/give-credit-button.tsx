"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { GiveCreditForm } from "./give-credit-form"
import { Gift } from "lucide-react"

export function GiveCreditButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div className="fixed bottom-8 right-8 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-16 px-8 bg-gradient-primary text-white border-0 shadow-soft-2xl hover:shadow-soft-xl hover:scale-[1.02] transition-all duration-300 flex items-center gap-3 rounded-full"
        >
          <Gift className="h-6 w-6" />
          <span className="font-semibold text-lg">給予 Credit</span>
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-soft-2xl">
          <GiveCreditForm />
        </DialogContent>
      </Dialog>
    </>
  )
}