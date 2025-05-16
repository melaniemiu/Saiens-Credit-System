"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { creditApi } from "@/lib/api"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Credit {
  id: string
  reason: string
  createdAt: string
  sender?: {
    id: string
    name: string
    employeeId: string
    Department?: { name: string }
  }
  receiver?: {
    id: string
    name: string
    employeeId: string
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

  const fetchReceivedCredits = async (page = 1) => {
    try {
      setIsLoadingReceived(true)
      const response = await creditApi.getReceivedCredits(page)
      if (response.data) {
        if (page === 1) {
          setReceivedCredits(response.data.credits)
        } else {
          setReceivedCredits(prev => [...prev, ...response.data.credits])
        }
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
      const response = await creditApi.getSentCredits(page)

      if (response.data) {
        if (page === 1) {
          setGivenCredits(response.data.credits)
        } else {
          setGivenCredits(prev => [...prev, ...response.data.credits])
        }
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
    // Load initial data
    fetchReceivedCredits(1)
    fetchGivenCredits(1)
  }, [])

  const handleLoadMore = (type: 'received' | 'given') => {
    if (type === 'received') {
      if (receivedPage < receivedTotalPages) {
        fetchReceivedCredits(receivedPage + 1)
      }
    } else {
      if (givenPage < givenTotalPages) {
        fetchGivenCredits(givenPage + 1)
      }
    }
  }

  return (
    <Card className="border-none shadow-lg bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 overflow-hidden group p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader className="px-0 pt-0 relative z-10">
        <CardTitle className="text-lg font-semibold text-gray-800">最近 Credit 活動</CardTitle>
        <CardDescription className="text-sm text-gray-600">您最近的 Credit 收發記錄</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0 relative z-10">
        <Tabs defaultValue="received" onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="received">收到的 Credit</TabsTrigger>
            <TabsTrigger value="given">送出的 Credit</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
        {isLoadingReceived && receivedCredits.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : receivedCredits.length === 0 ? (
          <p className="text-center text-gray-500 py-6">您尚未收到任何 Credit</p>
        ) : (
          <>
            {receivedCredits.map((credit) => (
              <div key={credit.id} className="rounded-lg bg-gray-50/50 border border-gray-100 p-4 mb-3 hover:bg-gray-50 transition-colors duration-200 hover:border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-start sm:items-center flex-wrap sm:flex-nowrap gap-2">
                    <Badge className="bg-green-600 text-white hover:bg-green-700 shrink-0">收到</Badge>
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="font-medium text-gray-900 whitespace-nowrap">{credit.sender?.name || "已刪除使用者"}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">({credit.sender?.Department?.name || "未知部門"})</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">{new Date(credit.createdAt || "2023/6/5").toLocaleString("zh-TW")}</span>
                </div>
                <p className="mt-3 text-gray-700 italic">"{credit.reason || "協助解決系統問題，快速且有效率"}"</p>
              </div>
            ))}

            {receivedPage < receivedTotalPages && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleLoadMore('received')}
                  disabled={isLoadingReceived}
                >
                  {isLoadingReceived ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 載入中...
                    </>
                  ) : (
                    "載入更多"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="given" className="space-y-4">
        {isLoadingGiven && givenCredits.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : givenCredits.length === 0 ? (
          <p className="text-center text-gray-500 py-6">您尚未送出任何 Credit</p>
        ) : (
          <>
            {givenCredits.map((credit) => (
              <div key={credit.id} className="rounded-lg bg-gray-50/50 border border-gray-100 p-4 mb-3 hover:bg-gray-50 transition-colors duration-200 hover:border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-start sm:items-center flex-wrap sm:flex-nowrap gap-2">
                    <Badge variant="outline" className="border-blue-600 text-blue-600 shrink-0">送出</Badge>
                    <div className="flex items-baseline gap-1 flex-wrap">
                      <span className="font-medium text-gray-900 whitespace-nowrap">{credit.receiver?.name || "已刪除使用者"}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">({credit.receiver?.Department?.name || "未知部門"})</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">{new Date(credit.createdAt || "2023/6/14").toLocaleString("zh-TW")}</span>
                </div>
                <p className="mt-3 text-gray-700 italic">"{credit.reason || "主動協助新同仁適應工作環境"}"</p>
              </div>
            ))}

            {givenPage < givenTotalPages && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleLoadMore('given')}
                  disabled={isLoadingGiven}
                >
                  {isLoadingGiven ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 載入中...
                    </>
                  ) : (
                    "載入更多"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
