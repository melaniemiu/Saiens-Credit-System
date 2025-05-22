"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from '@/context/auth-context'
import { creditApi } from '@/lib/api'
import { triggerConfettiIfNotShown } from '@/lib/confetti'
import { useToast } from '@/hooks/use-toast'

export const useOfflineConfetti = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    if (!user?.id || hasCheckedRef.current) return

    const checkOfflineCredits = async () => {
      try {
        console.log('Checking for offline credits...')
        
        // Get the last time we checked for offline credits
        const lastChecked = localStorage.getItem('last-offline-check')
        const checkTime = lastChecked ? new Date(lastChecked) : new Date(Date.now() - 24 * 60 * 60 * 1000) // Default to 24h ago
        
        // Fetch recent credits received
        const response = await creditApi.getReceivedCredits(1, 50) // Get more credits to catch offline ones
        
        if (response.data?.credits) {
          const recentCredits = response.data.credits.filter(credit => 
            new Date(credit.createdAt) > checkTime
          )
          
          if (recentCredits.length > 0) {
            console.log(`Found ${recentCredits.length} offline credits`)
            
            // Show a summary toast first
            if (recentCredits.length === 1) {
              const credit = recentCredits[0]
              toast({
                title: "🎉 您有新的 Credit!",
                description: `${credit.sender?.name || '某位同事'} 給了您一個 Credit: "${credit.reason}"`,
                duration: 5000,
              })
            } else {
              toast({
                title: "🎉 您有新的 Credits!",
                description: `您收到了 ${recentCredits.length} 個新的 Credits!`,
                duration: 5000,
              })
            }
            
            // Trigger confetti and individual toasts for each new credit with delays
            recentCredits.forEach((credit, index) => {
              setTimeout(() => {
                const confettiTriggered = triggerConfettiIfNotShown(credit.id)
                if (confettiTriggered) {
                  console.log('Offline confetti triggered for credit:', credit.id)
                  
                  // Show individual toast for multiple credits (after the summary)
                  if (recentCredits.length > 1) {
                    setTimeout(() => {
                      toast({
                        title: `🎊 Credit ${index + 1}/${recentCredits.length}`,
                        description: `來自 ${credit.sender?.name || '某位同事'}: "${credit.reason}"`,
                        duration: 4000,
                      })
                    }, 200) // Small delay after confetti
                  }
                }
              }, index * 1200) // 1200ms delay between each confetti burst (more time for multiple toasts)
            })
          }
        }
        
        // Update last checked time
        localStorage.setItem('last-offline-check', new Date().toISOString())
        hasCheckedRef.current = true
        
      } catch (error) {
        console.error('Error checking offline credits:', error)
      }
    }

    // Delay the check to allow for socket connection first
    const timeoutId = setTimeout(checkOfflineCredits, 2000)
    
    return () => clearTimeout(timeoutId)
  }, [user?.id, toast])
}