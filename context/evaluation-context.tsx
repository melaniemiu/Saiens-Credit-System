"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

export interface EvaluationRequest {
  id: string
  skillId: string
  skillName: string
  userId: string
  userName: string
  requestedAt: string
  evaluatorId: string
  evaluatorName: string
  skillDetails?: {
    category: string
    assessmentMethod: string
    learningMethod: string
    syllabus?: string
  }
  userProgress?: {
    startedAt: string
    completedAt: string
    attempts: number
    notes?: string
  }
}

interface EvaluationContextType {
  currentEvaluationRequest: EvaluationRequest | null
  isEvaluationModalOpen: boolean
  openEvaluationModal: (request: EvaluationRequest) => void
  closeEvaluationModal: () => void
  setEvaluationRequest: (request: EvaluationRequest | null) => void
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined)

export function EvaluationProvider({ children }: { children: ReactNode }) {
  const [currentEvaluationRequest, setCurrentEvaluationRequest] = useState<EvaluationRequest | null>(null)
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false)

  const openEvaluationModal = (request: EvaluationRequest) => {
    setCurrentEvaluationRequest(request)
    setIsEvaluationModalOpen(true)
  }

  const closeEvaluationModal = () => {
    setIsEvaluationModalOpen(false)
    setCurrentEvaluationRequest(null)
  }

  const setEvaluationRequest = (request: EvaluationRequest | null) => {
    setCurrentEvaluationRequest(request)
  }

  return (
    <EvaluationContext.Provider value={{
      currentEvaluationRequest,
      isEvaluationModalOpen,
      openEvaluationModal,
      closeEvaluationModal,
      setEvaluationRequest
    }}>
      {children}
    </EvaluationContext.Provider>
  )
}

export function useEvaluation() {
  const context = useContext(EvaluationContext)
  if (context === undefined) {
    throw new Error('useEvaluation must be used within an EvaluationProvider')
  }
  return context
}