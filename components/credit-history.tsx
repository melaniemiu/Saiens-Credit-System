"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { creditApi } from "@/lib/api"
import { Loader2, User, Clock, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { triggerConfettiIfNotShown } from "@/lib/confetti"
import { useIsMobile } from "@/hooks/use-mobile"

interface Credit {
  id: string
  reason: string
  createdAt: string
  sender?: {
    id: string
    name: string
    employeeId: string
    profilePicture?: string
    Department?: { name: string }
  }
  receiver?: {
    id: string
    name: string
    employeeId: string
    profilePicture?: string
    Department?: { name: string }
  }
}

export function CreditHistory() {
  const [activeTab, setActiveTab] = useState("received")
  const [receivedCredits, setReceivedCredits] = useState<Credit[]>([])
  const [givenCredits, setGivenCredits] = useState<Credit[]>([])
  const [isLoadingReceived, setIsLoadingReceived] = useState(false)
  const [isLoadingGiven, setIsLoadingGiven] = useState(false)
  const [receivedPage, setReceivedPage] = useState(1)
  const [givenPage, setGivenPage] = useState(1)
  const [receivedTotalPages, setReceivedTotalPages] = useState(1)
  const [givenTotalPages, setGivenTotalPages] = useState(1)
  const isMobile = useIsMobile()

  const fetchReceivedCredits = async (page = 1) => {
    try {
      setIsLoadingReceived(true)
      const response = await creditApi.getReceivedCredits(page, 5) // 5 items per page
      if (response.data) {
        setReceivedCredits(response.data.credits)
        setReceivedTotalPages(response.data.totalPages)
        setReceivedPage(page)
      }
    } catch (error) {
      console.error("Failed to fetch received credits:", error)
    } finally {
      setIsLoadingReceived(false)
    }
  }

  const fetchGivenCredits = async (page = 1) => {
    try {
      setIsLoadingGiven(true)
      const response = await creditApi.getSentCredits(page, 5) // 5 items per page

      if (response.data) {
        setGivenCredits(response.data.credits)
        setGivenTotalPages(response.data.totalPages)
        setGivenPage(page)
      }
    } catch (error) {
      console.error("Failed to fetch given credits:", error)
    } finally {
      setIsLoadingGiven(false)
    }
  }

  useEffect(() => {
    fetchReceivedCredits(1)
    fetchGivenCredits(1)
  }, [])

  const handlePageChange = (type: 'received' | 'given', page: number) => {
    if (type === 'received') {
      fetchReceivedCredits(page)
    } else {
      fetchGivenCredits(page)
    }
  }

  const renderPaginationControls = (
    currentPage: number,
    totalPages: number,
    type: 'received' | 'given',
    isLoading: boolean
  ) => {
    if (totalPages <= 1) return null

    const pageNumbers = []
    const maxVisiblePages = 5
    const maxVisiblePagesMobile = 3
    const maxPages = isMobile ? maxVisiblePagesMobile : maxVisiblePages
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
    let endPage = Math.min(totalPages, startPage + maxPages - 1)
    
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    return (
      <div className="mt-6">
        {/* Mobile view - simplified layout */}
        <div className="sm:hidden space-y-3">
          {/* Current page indicator */}
          <div className="text-center text-sm text-gray-600">
            第 {currentPage} 頁，共 {totalPages} 頁
          </div>
          
          {/* Large touch-friendly navigation */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handlePageChange(type, currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="h-14 text-base font-medium shadow-soft-xl hover:shadow-soft-2xl"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              上一頁
            </Button>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(type, currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="h-14 text-base font-medium shadow-soft-xl hover:shadow-soft-2xl"
            >
              下一頁
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
          
          {/* Page numbers in a row */}
          <div className="flex justify-center items-center gap-2">
            {startPage > 1 && (
              <>
                <Button
                  variant={currentPage === 1 ? "default" : "ghost"}
                  onClick={() => handlePageChange(type, 1)}
                  disabled={isLoading}
                  className="h-10 w-10 p-0 text-sm"
                >
                  1
                </Button>
                {startPage > 2 && <span className="text-gray-400">...</span>}
              </>
            )}
            
            {pageNumbers.map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                onClick={() => handlePageChange(type, page)}
                disabled={isLoading}
                className={cn(
                  "h-10 w-10 p-0 text-sm",
                  currentPage === page && "shadow-soft-xl"
                )}
              >
                {page}
              </Button>
            ))}
            
            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <span className="text-gray-400">...</span>}
                <Button
                  variant={currentPage === totalPages ? "default" : "ghost"}
                  onClick={() => handlePageChange(type, totalPages)}
                  disabled={isLoading}
                  className="h-10 w-10 p-0 text-sm"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Desktop view */}
        <div className="hidden sm:flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(type, currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {startPage > 1 && (
            <>
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                onClick={() => handlePageChange(type, 1)}
                disabled={isLoading}
                className="h-10 min-w-[40px] px-3"
              >
                1
              </Button>
              {startPage > 2 && <span className="text-gray-400 px-1">...</span>}
            </>
          )}
          
          {pageNumbers.map(page => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              onClick={() => handlePageChange(type, page)}
              disabled={isLoading}
              className="h-10 min-w-[40px] px-3"
            >
              {page}
            </Button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-gray-400 px-1">...</span>}
              <Button
                variant={currentPage === totalPages ? "default" : "outline"}
                onClick={() => handlePageChange(type, totalPages)}
                disabled={isLoading}
                className="h-10 min-w-[40px] px-3"
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(type, currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="h-10 w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const CreditItem = ({ credit, type }: { credit: Credit; type: 'received' | 'given' }) => {
    const person = type === 'received' ? credit.sender : credit.receiver
    const action = type === 'received' ? '收到來自' : '送出給'
    const icon = type === 'received' ? ArrowDownRight : ArrowUpRight
    
    const handleCreditClick = () => {
      if (type === 'received') {
        triggerConfettiIfNotShown(credit.id)
      }
    }
    
    return (
      <div 
        className="flex items-start gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-gray-50 hover:shadow-soft-xl group cursor-pointer"
        onClick={handleCreditClick}
      >
        <Avatar className="h-10 w-10 border-2 border-white shadow-soft-xl">
          <AvatarImage src={person?.profilePicture} alt={person?.name} />
          <AvatarFallback className={cn(
            "text-white",
            type === 'received' ? "bg-gradient-success" : "bg-gradient-info"
          )}>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-700">
                {action} <span className={type === 'received' ? "text-green-600" : "text-blue-600"}>
                  {person?.name || "已刪除使用者"}
                </span>
              </p>
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                {person?.Department?.name || "未知部門"}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span className="whitespace-nowrap">
                {new Date(credit.createdAt).toLocaleDateString("zh-TW")}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3 mt-2 group-hover:bg-white transition-all duration-300">
            <p className="text-sm text-gray-700 italic">
              "{credit.reason || "無說明"}"
            </p>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant="default" 
              className={cn(
                "flex items-center gap-1 text-xs border-0 shadow-soft-xl",
                type === 'received' 
                  ? "bg-gradient-success text-white" 
                  : "bg-gradient-info text-white"
              )}
            >
              {icon && React.createElement(icon, { className: "h-3 w-3" })}
              {type === 'received' ? '收到' : '送出'} 1 Credit
            </Badge>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="received" onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 shadow-soft-xl mb-2">
        <TabsTrigger 
          value="received" 
          className="data-[state=active]:bg-gradient-success data-[state=active]:text-white data-[state=active]:shadow-soft-xl"
        >
          收到的 Credit
        </TabsTrigger>
        <TabsTrigger 
          value="given" 
          className="data-[state=active]:bg-gradient-info data-[state=active]:text-white data-[state=active]:shadow-soft-xl"
        >
          送出的 Credit
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="mt-2">
        {isLoadingReceived && receivedCredits.length === 0 ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : receivedCredits.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">您尚未收到任何 Credit</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {receivedCredits.map((credit) => (
                <CreditItem key={credit.id} credit={credit} type="received" />
              ))}
            </div>

            {renderPaginationControls(receivedPage, receivedTotalPages, 'received', isLoadingReceived)}
          </>
        )}
      </TabsContent>

      <TabsContent value="given" className="mt-2">
        {isLoadingGiven && givenCredits.length === 0 ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : givenCredits.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">您尚未送出任何 Credit</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {givenCredits.map((credit) => (
                <CreditItem key={credit.id} credit={credit} type="given" />
              ))}
            </div>

            {renderPaginationControls(givenPage, givenTotalPages, 'given', isLoadingGiven)}
          </>
        )}
      </TabsContent>
    </Tabs>
  )
}