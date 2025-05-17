"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { useDrag, useDrop } from "react-dnd";
import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardIcon, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card";
import { CreditHistory } from "@/components/credit-history";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, User, CreditCard, TrendingUp, Wallet, GripVertical } from "lucide-react";
import { GiveCreditButton } from "@/components/give-credit-button";
import { useAuth } from "@/context/auth-context";
import { userApi } from "@/lib/api";
import { Suspense } from "react";

// Grid configuration
const GRID_COLUMNS = 8;
const GRID_ROWS = 10;
const CELL_SIZE = 100; // pixels

interface GridItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// Default layout
const defaultLayout: GridItem[] = [
  { id: "profile", x: 0, y: 0, w: 4, h: 2 },
  { id: "received", x: 4, y: 0, w: 2, h: 1 },
  { id: "sent", x: 6, y: 0, w: 2, h: 1 },
  { id: "daily", x: 4, y: 1, w: 4, h: 1 },
  { id: "recent", x: 0, y: 2, w: 4, h: 3 },
  { id: "acquired", x: 4, y: 2, w: 4, h: 2 },
  { id: "suggested", x: 4, y: 4, w: 4, h: 2 },
];

function DraggableItem({ item, index, moveItem, isLoading, userData, user }: {
  item: GridItem;
  index: number;
  moveItem: (dragIndex: number, dropIndex: number) => void;
  isLoading: boolean;
  userData: any;
  user: any;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'grid-item',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'grid-item',
    drop: (dragItem: { index: number }) => {
      if (dragItem.index !== index) {
        moveItem(dragItem.index, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Apply both drag and drop refs
  drag(drop(ref));

  const renderContent = () => {
    switch (item.id) {
      case "profile":
        return (
          <SoftCard className="h-full">
            <div 
              className="absolute top-2 right-2 cursor-move z-10 p-1.5 bg-white/90 rounded-md shadow-sm hover:bg-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>
            <SoftCardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <SoftCardDescription>個人資料</SoftCardDescription>
                  <SoftCardTitle className="text-xl">
                    {isLoading ? (
                      <Skeleton className="h-6 w-24" />
                    ) : (
                      userData?.name || "于小明"
                    )}
                  </SoftCardTitle>
                </div>
                <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                  <AvatarImage src={userData?.profilePicture || ''} alt={userData?.name || ''} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </SoftCardHeader>
            <SoftCardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-size-sm">
                  <span className="text-slate-400">工號</span>
                  <span className="font-semibold text-slate-700">{userData?.employeeId || "EMP001"}</span>
                </div>
                <div className="flex justify-between items-center text-size-sm">
                  <span className="text-slate-400">部門</span>
                  <span className="font-semibold text-slate-700">{userData?.department || "工程部"}</span>
                </div>
              </div>
            </SoftCardContent>
          </SoftCard>
        );
      case "received":
        return (
          <SoftCard className="h-full relative">
            <div className="absolute top-2 right-2 cursor-move z-10 p-1.5 bg-white/90 rounded-md shadow-sm hover:bg-white transition-colors">
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>
            <SoftCardHeader>
              <SoftCardDescription>收到的 Credits</SoftCardDescription>
              <SoftCardTitle className="text-2xl">
                {user?.creditsReceived || 0}
              </SoftCardTitle>
            </SoftCardHeader>
          </SoftCard>
        );
      case "sent":
        return (
          <SoftCard className="h-full relative">
            <div className="absolute top-2 right-2 cursor-move z-10 p-1.5 bg-white/90 rounded-md shadow-sm hover:bg-white transition-colors">
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>
            <SoftCardHeader>
              <SoftCardDescription>給出的 Credits</SoftCardDescription>
              <SoftCardTitle className="text-2xl">
                {user?.creditsSent || 0}
              </SoftCardTitle>
            </SoftCardHeader>
          </SoftCard>
        );
      case "daily":
        return (
          <SoftCard className="h-full relative">
            <div className="absolute top-2 right-2 cursor-move z-10 p-1.5 bg-white/90 rounded-md shadow-sm hover:bg-white transition-colors">
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>
            <SoftCardHeader>
              <SoftCardDescription>今日剩餘 Credits</SoftCardDescription>
              <SoftCardTitle className="text-2xl">
                {user?.remainingDailyCredits || 0} / 5
              </SoftCardTitle>
            </SoftCardHeader>
          </SoftCard>
        );
      case "recent":
        return (
          <SoftCard className="h-full relative">
            <div className="absolute top-2 right-2 cursor-move z-10 p-1.5 bg-white/90 rounded-md shadow-sm hover:bg-white transition-colors">
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>
            <SoftCardHeader>
              <SoftCardTitle>最近的 Credit 活動</SoftCardTitle>
            </SoftCardHeader>
            <SoftCardContent>
              <CreditHistory />
            </SoftCardContent>
          </SoftCard>
        );
      case "acquired":
        return (
          <SoftCard className="h-full relative">
            <div className="absolute top-2 right-2 cursor-move z-10 p-1.5 bg-white/90 rounded-md shadow-sm hover:bg-white transition-colors">
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>
            <SoftCardHeader>
              <SoftCardTitle>習得技能</SoftCardTitle>
            </SoftCardHeader>
            <SoftCardContent>
              <div className="grid grid-cols-2 gap-3">
                {["木作", "油漆", "水電", "系統櫃"].map((skill) => (
                  <div key={skill} className="h-16 w-16 flex items-center justify-center bg-gradient-success text-white rounded-2xl shadow-soft-xl text-xs font-semibold">
                    {skill}
                  </div>
                ))}
              </div>
            </SoftCardContent>
          </SoftCard>
        );
      case "suggested":
        return (
          <SoftCard className="h-full relative">
            <div className="absolute top-2 right-2 cursor-move z-10 p-1.5 bg-white/90 rounded-md shadow-sm hover:bg-white transition-colors">
              <GripVertical className="h-4 w-4 text-gray-600" />
            </div>
            <SoftCardHeader>
              <SoftCardTitle>建議學習技能</SoftCardTitle>
            </SoftCardHeader>
            <SoftCardContent>
              <div className="grid grid-cols-2 gap-3">
                {["3D設計", "智能家居", "綠建材", "燈光設計"].map((skill) => (
                  <div key={skill} className="h-16 w-16 flex items-center justify-center bg-gradient-warning text-white rounded-2xl shadow-soft-xl text-xs font-semibold">
                    {skill}
                  </div>
                ))}
              </div>
            </SoftCardContent>
          </SoftCard>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={ref}
      className={`absolute transition-all duration-300 ${isDragging ? "opacity-50 z-50" : "z-10"} ${isOver ? "ring-2 ring-primary" : ""}`}
      style={{
        left: item.x * CELL_SIZE,
        top: item.y * CELL_SIZE,
        width: item.w * CELL_SIZE - 8,
        height: item.h * CELL_SIZE - 8,
      }}
    >
      {renderContent()}
    </div>
  );
}

function SimpleGridDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(!user);
  const [userData, setUserData] = useState(user ? { ...user, profilePicture: user.picture } : null);
  const [layout, setLayout] = useState<GridItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardLayout');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved layout:', e);
        }
      }
    }
    return defaultLayout;
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Fetch user data
  useEffect(() => {
    if (user) {
      setUserData({ ...user, profilePicture: user.picture });
      setIsLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await userApi.getCurrentUser();
        if (response.data?.user) {
          const fetchedUser = {
            name: response.data.user.name,
            employeeId: response.data.user.employeeId,
            department: response.data.user.Department?.name,
            email: response.data.user.email,
            id: response.data.user.id,
            role: response.data.user.role,
            profilePicture: response.data.user.profilePicture,
          };
          setUserData(fetchedUser);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const moveItem = (dragIndex: number, dropIndex: number) => {
    if (dragIndex === dropIndex) return;
    
    const dragItem = layout[dragIndex];
    const dropItem = layout[dropIndex];
    
    // Swap positions
    const newLayout = [...layout];
    newLayout[dragIndex] = { ...dragItem, x: dropItem.x, y: dropItem.y };
    newLayout[dropIndex] = { ...dropItem, x: dragItem.x, y: dragItem.y };
    
    setLayout(newLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem('dashboardLayout');
  };

  // Choose backend based on device
  const DndBackend = isMobile ? TouchBackend : HTML5Backend;
  const backendOptions = isMobile 
    ? { enableMouseEvents: true, enableTouchEvents: true, delayTouchStart: 200 } 
    : {};

  return (
    <DndProvider backend={DndBackend} options={backendOptions}>
      <div className="w-full px-6 py-6 mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-700">員工儀表板</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetLayout}
            >
              重置布局
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              重新載入
            </Button>
          </div>
        </div>

        <div 
          className="relative bg-gray-50 rounded-lg p-4 overflow-auto border border-gray-200"
          style={{
            width: '100%',
            maxWidth: GRID_COLUMNS * CELL_SIZE + 32,
            height: GRID_ROWS * CELL_SIZE + 32,
          }}
        >
          {/* Grid background */}
          <div 
            className="absolute inset-4"
            style={{
              backgroundImage: `
                repeating-linear-gradient(
                  0deg,
                  #e5e7eb,
                  #e5e7eb 1px,
                  transparent 1px,
                  transparent ${CELL_SIZE}px
                ),
                repeating-linear-gradient(
                  90deg,
                  #e5e7eb,
                  #e5e7eb 1px,
                  transparent 1px,
                  transparent ${CELL_SIZE}px
                )
              `,
            }}
          />

          {/* Draggable items */}
          {layout.map((item, index) => (
            <DraggableItem
              key={item.id}
              item={item}
              index={index}
              moveItem={moveItem}
              isLoading={isLoading}
              userData={userData}
              user={user}
            />
          ))}
        </div>

        <GiveCreditButton />
      </div>
    </DndProvider>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
      </div>
    }>
      <SimpleGridDashboard />
    </Suspense>
  );
}