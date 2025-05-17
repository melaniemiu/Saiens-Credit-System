"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { SoftCard, SoftCardHeader, SoftCardContent, SoftCardIcon, SoftCardTitle, SoftCardDescription } from "@/components/ui/soft-card";
import { CreditHistory } from "@/components/credit-history";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, User, CreditCard, TrendingUp, Wallet, GripVertical } from "lucide-react";
import { AuthError } from "@/components/auth-error";
import { GiveCreditButton } from "@/components/give-credit-button";
import { useAuth } from "@/context/auth-context";
import { userApi, setAuthToken } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Grid configuration
const GRID_COLUMNS = 8;
const GRID_ROWS = 10;
const CELL_SIZE = 80; // pixels

interface GridSection {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Default layout configuration - using exact grid positioning
const defaultLayout: GridSection[] = [
  { id: "profile", x: 0, y: 0, width: 4, height: 2 },
  { id: "received", x: 4, y: 0, width: 2, height: 1 },
  { id: "sent", x: 6, y: 0, width: 2, height: 1 },
  { id: "daily", x: 4, y: 1, width: 4, height: 1 },
  { id: "recent", x: 0, y: 2, width: 4, height: 3 },
  { id: "acquired", x: 4, y: 2, width: 4, height: 2 },
  { id: "suggested", x: 4, y: 4, width: 4, height: 2 },
];

// Draggable Section Component
function DraggableSection({ section, onMove, isLoading, userData, user }: { 
  section: GridSection; 
  onMove: (id: string, x: number, y: number) => void;
  isLoading: boolean;
  userData: any;
  user: any;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: "section",
    item: section,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Apply drag handle
  drag(ref);

  const renderContent = () => {
    switch (section.id) {
      case "profile":
        return (
          <SoftCard className="h-full">
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
                {isLoading ? (
                  <Skeleton className="h-16 w-16 rounded-full" />
                ) : (
                  <Avatar className="h-16 w-16 border-2 border-white shadow-md">
                    <AvatarImage src={userData?.profilePicture || ''} alt={userData?.name || ''} />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </SoftCardHeader>
            <SoftCardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : userData ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-size-sm">
                    <span className="text-slate-400">工號</span>
                    <span className="font-semibold text-slate-700">{userData.employeeId || "EMP001"}</span>
                  </div>
                  <div className="flex justify-between items-center text-size-sm">
                    <span className="text-slate-400">部門</span>
                    <span className="font-semibold text-slate-700">{userData.department || "工程部"}</span>
                  </div>
                  {userData.email && (
                    <div className="flex justify-between items-center text-size-sm">
                      <span className="text-slate-400">Email</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[140px]">{userData.email}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-2 text-gray-500">無法載入數據</div>
              )}
            </SoftCardContent>
          </SoftCard>
        );
      case "received":
        return (
          <SoftCard className="h-full">
            <SoftCardHeader>
              <div className="flex flex-row -mx-3">
                <div className="flex-none w-2/3 max-w-full px-3">
                  <div>
                    <SoftCardDescription>收到的 Credits</SoftCardDescription>
                    <SoftCardTitle className="text-2xl">
                      {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <>
                          {user?.creditsReceived || 0}
                          <span className="leading-normal text-size-sm font-weight-bolder text-green-600 ml-2">
                            +{user?.creditsReceived || 0}%
                          </span>
                        </>
                      )}
                    </SoftCardTitle>
                  </div>
                </div>
                <div className="px-3 text-right basis-1/3">
                  <SoftCardIcon gradient="bg-gradient-success">
                    <TrendingUp className="h-6 w-6" />
                  </SoftCardIcon>
                </div>
              </div>
            </SoftCardHeader>
          </SoftCard>
        );
      case "sent":
        return (
          <SoftCard className="h-full">
            <SoftCardHeader>
              <div className="flex flex-row -mx-3">
                <div className="flex-none w-2/3 max-w-full px-3">
                  <div>
                    <SoftCardDescription>給出的 Credits</SoftCardDescription>
                    <SoftCardTitle className="text-2xl">
                      {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <>
                          {user?.creditsSent || 0}
                          <span className="leading-normal text-size-sm font-weight-bolder text-blue-600 ml-2">
                            +{user?.creditsSent || 0}%
                          </span>
                        </>
                      )}
                    </SoftCardTitle>
                  </div>
                </div>
                <div className="px-3 text-right basis-1/3">
                  <SoftCardIcon gradient="bg-gradient-info">
                    <CreditCard className="h-6 w-6" />
                  </SoftCardIcon>
                </div>
              </div>
            </SoftCardHeader>
          </SoftCard>
        );
      case "daily":
        return (
          <SoftCard className="h-full">
            <SoftCardHeader>
              <div className="flex flex-row -mx-3">
                <div className="flex-none w-2/3 max-w-full px-3">
                  <div>
                    <SoftCardDescription>今日剩餘 Credits</SoftCardDescription>
                    <SoftCardTitle className="text-2xl">
                      {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                      ) : (
                        <>
                          {user?.remainingDailyCredits || 0}
                          <span className="leading-normal text-size-sm text-slate-400 ml-2">
                            / 5
                          </span>
                        </>
                      )}
                    </SoftCardTitle>
                  </div>
                </div>
                <div className="px-3 text-right basis-1/3">
                  <SoftCardIcon gradient="bg-gradient-secondary">
                    <Wallet className="h-6 w-6" />
                  </SoftCardIcon>
                </div>
              </div>
            </SoftCardHeader>
            <SoftCardContent>
              <div className="w-full">
                <div className="text-size-xs h-0.75 w-full m-0 flex overflow-visible rounded-lg bg-gray-200">
                  <div 
                    className="duration-600 ease-soft bg-gradient-secondary -mt-0.38 -ml-px flex h-1.5 flex-col justify-center overflow-hidden whitespace-nowrap rounded text-center text-white transition-all" 
                    role="progressbar" 
                    aria-valuenow={(user?.remainingDailyCredits || 0) * 20} 
                    aria-valuemin="0" 
                    aria-valuemax="100"
                    style={{ width: `${(user?.remainingDailyCredits || 0) * 20}%` }}
                  />
                </div>
              </div>
            </SoftCardContent>
          </SoftCard>
        );
      case "recent":
        return (
          <SoftCard className="h-full">
            <SoftCardHeader>
              <SoftCardTitle>最近的 Credit 活動</SoftCardTitle>
              <SoftCardDescription>查看您最近收到和給出的 Credits</SoftCardDescription>
            </SoftCardHeader>
            <SoftCardContent>
              <CreditHistory />
            </SoftCardContent>
          </SoftCard>
        );
      case "acquired":
        return (
          <SoftCard className="h-full">
            <SoftCardHeader>
              <SoftCardTitle>習得技能</SoftCardTitle>
              <SoftCardDescription>您已掌握的技能</SoftCardDescription>
            </SoftCardHeader>
            <SoftCardContent>
              <div className="flex flex-wrap gap-4">
                <div className="h-16 w-16 flex items-center justify-center bg-gradient-success text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                  木作
                </div>
                <div className="h-16 w-16 flex items-center justify-center bg-gradient-success text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                  油漆
                </div>
                <div className="h-16 w-16 flex items-center justify-center bg-gradient-success text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                  水電
                </div>
                <div className="h-16 w-16 flex items-center justify-center bg-gradient-success text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                  系統櫃
                </div>
              </div>
            </SoftCardContent>
          </SoftCard>
        );
      case "suggested":
        return (
          <SoftCard className="h-full">
            <SoftCardHeader>
              <SoftCardTitle>建議學習技能</SoftCardTitle>
              <SoftCardDescription>推薦您學習的技能</SoftCardDescription>
            </SoftCardHeader>
            <SoftCardContent>
              <div className="flex flex-wrap gap-4">
                <div className="h-16 w-16 flex items-center justify-center bg-gradient-warning text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                  3D設計
                </div>
                <div className="h-16 w-16 flex items-center justify-center bg-gradient-warning text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                  智能家居
                </div>
                <div className="h-16 w-16 flex items-center justify-center bg-gradient-warning text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                  綠建材
                </div>
                <div className="h-16 w-16 flex items-center justify-center bg-gradient-warning text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                  燈光設計
                </div>
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
      ref={dragPreview}
      className={`absolute transition-all duration-200 ${isDragging ? "opacity-70 z-50" : "z-10"}`}
      style={{
        left: section.x * CELL_SIZE,
        top: section.y * CELL_SIZE,
        width: section.width * CELL_SIZE - 8,
        height: section.height * CELL_SIZE - 8,
      }}
    >
      {/* Drag handle */}
      <div 
        ref={ref}
        className="absolute top-2 right-2 cursor-move p-1 bg-white/80 rounded shadow-md hover:bg-white transition-colors"
      >
        <GripVertical className="h-4 w-4 text-gray-600" />
      </div>
      {renderContent()}
    </div>
  );
}

// Grid Cell Component
function GridCell({ x, y, onDrop, layout }: { 
  x: number; 
  y: number; 
  onDrop: (item: GridSection, x: number, y: number) => void;
  layout: GridSection[];
}) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "section",
    drop: (item: GridSection) => {
      onDrop(item, x, y);
    },
    canDrop: (item: GridSection) => {
      // Check if the section can fit at this position
      if (x + item.width > GRID_COLUMNS || y + item.height > GRID_ROWS) {
        return false;
      }
      
      // Check for collisions
      const wouldCollide = layout.some((other) => {
        if (other.id === item.id) return false;
        return !(
          x + item.width <= other.x ||
          other.x + other.width <= x ||
          y + item.height <= other.y ||
          other.y + other.height <= y
        );
      });
      
      return !wouldCollide;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`border border-dashed transition-colors ${
        isOver && canDrop ? "border-primary bg-primary/5" : "border-gray-200"
      }`}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    />
  );
}

function DashboardContentGrid() {
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(!user);
  const [userData, setUserData] = useState(user ? {
    ...user,
    profilePicture: user.picture
  } : null);
  const searchParams = useSearchParams();
  
  // Grid layout state
  const [layout, setLayout] = useState<GridSection[]>(() => {
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

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if we're on desktop
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth > 768);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Auth handling logic (same as original dashboard)
  useEffect(() => {
    const authToken = searchParams?.get('auth_token');
    const liffAuth = searchParams?.get('liff_auth');
    const authBypass = searchParams?.get('auth_bypass');

    if (authToken) {
      localStorage.setItem('authToken', authToken);
      sessionStorage.setItem('authToken', authToken);
      setAuthToken(authToken);

      const url = new URL(window.location.href);
      url.searchParams.delete('auth_token');
      url.searchParams.delete('liff_auth');
      url.searchParams.delete('auth_bypass');
      window.history.replaceState({}, document.title, url.toString());
    } else if (authBypass) {
      const existingToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (existingToken) {
        setAuthToken(existingToken);
      }

      const url = new URL(window.location.href);
      url.searchParams.delete('auth_bypass');
      window.history.replaceState({}, document.title, url.toString());
      setIsLoading(true);
    }
  }, [searchParams]);

  // Fetch user data (same as original)
  useEffect(() => {
    if (user) {
      setUserData({
        ...user,
        profilePicture: user.picture
      });
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
  }, [user, searchParams]);

  const handleMove = (id: string, newX: number, newY: number) => {
    setLayout((prevLayout) => {
      const section = prevLayout.find((s) => s.id === id);
      if (!section) return prevLayout;

      // Check if the new position is valid
      const newLayout = prevLayout.map((s) =>
        s.id === id ? { ...s, x: newX, y: newY } : s
      );
      
      // Save to localStorage
      localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
      
      return newLayout;
    });
  };

  const handleManualRefresh = () => {
    window.location.reload();
  };

  const shouldShowDashboard = () => {
    return (userData && !isLoading) || (isLoading && (user || authLoading));
  };

  // Choose backend based on device
  const backend = !isDesktop ? TouchBackend : HTML5Backend;
  const backendOptions = !isDesktop 
    ? { enableMouseEvents: true, delayTouchStart: 200 } 
    : undefined;

  // Generate grid cells
  const gridCells = useMemo(() => {
    const cells = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLUMNS; x++) {
        cells.push({ x, y, key: `${x}-${y}` });
      }
    }
    return cells;
  }, []);

  return (
    <DndProvider backend={backend} options={backendOptions}>
      <div className="w-full px-6 py-6 mx-auto">
        {shouldShowDashboard() ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-slate-700">員工儀表板</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLayout(defaultLayout)}
                >
                  重置布局
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleManualRefresh}
                >
                  <RefreshCw className="h-4 w-4" />
                  重新載入
                </Button>
              </div>
            </div>

            <div 
              className="relative bg-gray-50 rounded-lg p-4 overflow-auto"
              style={{
                width: '100%',
                maxWidth: GRID_COLUMNS * CELL_SIZE + 32,
                height: GRID_ROWS * CELL_SIZE + 32,
              }}
            >
              {/* Grid background */}
              <div 
                className="absolute inset-4 grid"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
                  gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
                }}
              >
                {gridCells.map((cell) => (
                  <GridCell
                    key={cell.key}
                    x={cell.x}
                    y={cell.y}
                    onDrop={handleMove}
                    layout={layout}
                  />
                ))}
              </div>

              {/* Draggable sections */}
              {layout.map((section) => (
                <DraggableSection
                  key={section.id}
                  section={section}
                  onMove={handleMove}
                  isLoading={isLoading}
                  userData={userData}
                  user={user}
                />
              ))}
            </div>

            <GiveCreditButton />
          </>
        ) : (
          <div className="max-w-md mx-auto p-6">
            <SoftCard>
              <SoftCardContent>
                <AuthError />
              </SoftCardContent>
            </SoftCard>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default function DashboardGrid() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <DashboardContentGrid />
    </Suspense>
  );
}