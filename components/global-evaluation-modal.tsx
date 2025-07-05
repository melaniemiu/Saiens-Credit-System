"use client"

import { useEffect } from "react"
import { useEvaluation } from "@/context/evaluation-context"
import { EvaluationModal } from "@/components/evaluation-modal"

export function GlobalEvaluationModal() {
  const { currentEvaluationRequest, isEvaluationModalOpen, closeEvaluationModal, openEvaluationModal } = useEvaluation()

  useEffect(() => {
    const handleOpenEvaluationModal = (event: CustomEvent) => {
      const evaluationRequest = event.detail
      openEvaluationModal(evaluationRequest)
    }

    // Listen for custom event from socket context
    window.addEventListener('openEvaluationModal', handleOpenEvaluationModal as EventListener)
    
    return () => {
      window.removeEventListener('openEvaluationModal', handleOpenEvaluationModal as EventListener)
    }
  }, [openEvaluationModal])

  return (
    <EvaluationModal
      isOpen={isEvaluationModalOpen}
      onClose={closeEvaluationModal}
      evaluationRequest={currentEvaluationRequest}
    />
  )
}