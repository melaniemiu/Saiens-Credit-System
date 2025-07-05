"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { triggerConfettiIfNotShown, cleanupConfettiRecords, triggerPromotionConfettiIfNotShown } from '@/lib/confetti'
import { skillApi } from '@/lib/api'

interface CreditNotification {
  id: string
  senderId: string
  senderName: string
  senderDepartment?: string
  reason: string
  createdAt: string
}

interface PromotionNotification {
  id: string
  userId: string
  userName: string
  employeeId: string
  previousJob: string
  newJob: string
  department?: string
  promotedAt: string
}

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected'
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!user?.id) return

    // Get backend URL with smart fallback
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    
    // If no env var, try to construct from API URL
    if (!backendUrl && process.env.NEXT_PUBLIC_API_URL) {
      backendUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
    }
    
    // Final fallback
    if (!backendUrl) {
      backendUrl = process.env.NEXT_PUBLIC_SOCKET_URL_FALLBACK || 'https://ss-backend.unayung.cc'
    }
    
    console.log(`🔗 [CLIENT] Attempting to connect to: ${backendUrl}`)
    console.log(`🔗 [CLIENT] Environment variables:`, {
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL
    })
    
    // Detect LIFF environment
    const isLiff = typeof window !== 'undefined' && (
      window.location.href.includes('liff') || 
      navigator.userAgent.includes('Line') ||
      window.location.hostname.includes('liff')
    )
    
    console.log(`📱 [CLIENT] LIFF environment: ${isLiff}`)
    
    // Use different config for LIFF vs regular browser
    const socketConfig = isLiff ? {
      // LIFF-optimized configuration
      transports: ['polling'], // Only use polling in LIFF
      withCredentials: false, // LIFF may have issues with credentials
      timeout: 30000,
      forceNew: true,
      autoConnect: true,
      upgrade: false, // Don't try to upgrade to websocket in LIFF
      rememberUpgrade: false
    } : {
      // Desktop browser configuration
      withCredentials: true,
      transports: ['polling', 'websocket'],
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      upgrade: true,
      rememberUpgrade: false
    }
    
    console.log(`⚙️ [CLIENT] Socket config:`, socketConfig)
    
    // Set connecting status
    setConnectionStatus('connecting')
    
    // Connect to socket.io server
    const socketInstance = io(backendUrl, socketConfig)

    socketInstance.on('connect', () => {
      console.log(`🔌 [CLIENT] Connected to socket server (socket: ${socketInstance.id})`)
      setIsConnected(true)
      setConnectionStatus('connected')
      
      // Join user's personal room for targeted notifications
      socketInstance.emit('join-user-room', user.id)
      console.log(`👤 [CLIENT] Requested to join room: user-${user.id}`)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log(`❌ [CLIENT] Disconnected from socket server (reason: ${reason})`)
      setIsConnected(false)
      setConnectionStatus('disconnected')
    })

    socketInstance.on('connect_error', (error) => {
      console.error(`🚫 [CLIENT] Socket connection error:`, error)
      console.error(`🚫 [CLIENT] Error type: ${error.type}, Description: ${error.description}`)
      setConnectionStatus('error')
      
      // Check if we're in LIFF environment
      const isLiff = typeof window !== 'undefined' && window.location.href.includes('liff')
      if (isLiff) {
        console.log(`📱 [CLIENT] LIFF environment detected, connection issues may be due to LIFF restrictions`)
      }
    })

    // Additional error event listeners for debugging
    socketInstance.on('error', (error) => {
      console.error(`❌ [CLIENT] Socket generic error:`, error)
    })

    socketInstance.on('reconnect_error', (error) => {
      console.error(`🔄 [CLIENT] Socket reconnect error:`, error)
    })

    socketInstance.on('reconnect_failed', () => {
      console.error(`💥 [CLIENT] Socket reconnect failed - giving up`)
    })

    // Listen for credit notifications
    socketInstance.on('credit-received', (data: CreditNotification) => {
      console.log(`🎉 [CLIENT] Credit notification received:`, data)
      
      // Show toast notification
      toast({
        title: "🎉 收到新的 Credit!",
        description: `${data.senderName} 給了您一個 Credit: "${data.reason}"`,
        duration: 5000,
      })
      console.log(`📬 [CLIENT] Toast notification shown for credit from ${data.senderName}`)
      
      // Trigger confetti if not shown before (with built-in deduplication)
      setTimeout(() => {
        const confettiTriggered = triggerConfettiIfNotShown(data.id)
        if (confettiTriggered) {
          console.log(`🎊 [CLIENT] Confetti triggered for credit: ${data.id}`)
        } else {
          console.log(`⏭️ [CLIENT] Confetti skipped (already shown) for credit: ${data.id}`)
        }
      }, 500)
    })

    // Listen for promotion notifications
    socketInstance.on('user-promoted', (data: PromotionNotification) => {
      console.log(`🚀 [CLIENT] Promotion notification received:`, data)
      
      // Show celebration toast notification
      toast({
        title: "🎉 恭喜升職！",
        description: `您已從 ${data.previousJob} 升職至 ${data.newJob}！`,
        duration: 8000,
      })
      console.log(`🎖️ [CLIENT] Promotion toast notification shown for ${data.userName}`)
      
      // Trigger promotion confetti with built-in deduplication
      setTimeout(() => {
        const confettiTriggered = triggerPromotionConfettiIfNotShown(data.id)
        if (confettiTriggered) {
          console.log(`🎊 [CLIENT] Promotion confetti triggered for: ${data.id}`)
        } else {
          console.log(`⏭️ [CLIENT] Promotion confetti skipped (already shown) for: ${data.id}`)
        }
      }, 1000) // Slightly longer delay for promotion celebration
    })

    // Listen for evaluation request notifications (for evaluators)
    socketInstance.on('evaluation-requested', (data) => {
      console.log(`🎯 [CLIENT] Evaluation request received:`, data)
      
      // Show clickable toast notification with userSkillId
      toast({
        title: "📚 新的技能評估申請",
        description: `${data.userName} 申請 "${data.skillName}" 技能評估，點擊查看詳細資訊`,
        duration: 10000,
        action: (
          <Button 
            size="sm"
            onClick={() => {
              // Dispatch custom event with userSkillId for simple data retrieval
              const event = new CustomEvent('openEvaluationModal', { 
                detail: { 
                  userSkillId: data.userSkillId,
                  skillName: data.skillName,
                  userName: data.userName
                }
              })
              window.dispatchEvent(event)
            }}
          >
            查看評估
          </Button>
        )
      })
    })

    // Listen for evaluation request confirmations (for requesters)
    socketInstance.on('evaluation-request-submitted', (data) => {
      console.log(`✅ [CLIENT] Evaluation request submitted:`, data)
      
      toast({
        title: "📤 評估申請已送出",
        description: `您的 "${data.skillName}" 技能評估申請已送出，共有 ${data.evaluatorCount} 位評估員將收到通知`,
        duration: 6000,
      })
    })

    // Listen for evaluation completion notifications (for skill owners)
    socketInstance.on('evaluation-completed', (data) => {
      console.log(`🎓 [CLIENT] Evaluation completed:`, data)
      
      const isPass = data.result === 'pass'
      toast({
        title: isPass ? "🎉 評估通過！" : "📝 評估結果",
        description: isPass 
          ? `恭喜！您的 "${data.skillName}" 技能評估已通過 (${data.score} 分)`
          : `您的 "${data.skillName}" 技能評估未通過，請查看評估員回饋並繼續學習`,
        duration: 8000,
      })

      // Trigger a custom event to refresh roadmap data
      const refreshEvent = new CustomEvent('refreshSkillRoadmap', { 
        detail: { 
          skillId: data.skillId,
          result: data.result,
          score: data.score
        }
      })
      window.dispatchEvent(refreshEvent)
      
      // Trigger confetti if passed
      if (isPass) {
        setTimeout(() => {
          const creditId = `evaluation-pass-${data.skillId}-${Date.now()}`
          const confettiTriggered = triggerConfettiIfNotShown(creditId)
          if (confettiTriggered) {
            console.log(`🎊 [CLIENT] Evaluation pass confetti triggered for: ${data.skillName}`)
          }
        }, 500)
      }
    })

    // Clean up old confetti records on connection
    cleanupConfettiRecords()

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      setSocket(null)
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [user?.id, toast])

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionStatus }}>
      {children}
    </SocketContext.Provider>
  )
}