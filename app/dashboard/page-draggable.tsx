"use client";

import { useState, useMemo } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { ProfileSoftCard } from "@/components/profile-soft-card";
import { StatsGrid } from "@/components/stats-grid";
import { RecentCredits } from "@/components/recent-credits";
import { GiveCreditButton } from "@/components/give-credit-button";
import { DailyCreditsCard } from "@/components/daily-credits-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUser } from "@/hooks/use-user";
import { useMediaQuery } from "@/hooks/use-media-query";

// Grid configuration
const GRID_COLUMNS = 8;
const GRID_ROWS = 10;
const CELL_SIZE = 100; // pixels

interface GridSection {
  id: string;
  component: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Default layout configuration
const defaultLayout: GridSection[] = [
  { id: "profile", component: "ProfileCard", x: 0, y: 0, width: 4, height: 2 },
  { id: "received", component: "ReceivedCredits", x: 4, y: 0, width: 2, height: 1 },
  { id: "sent", component: "SentCredits", x: 6, y: 0, width: 2, height: 1 },
  { id: "daily", component: "DailyCredits", x: 4, y: 1, width: 2, height: 1 },
  { id: "give", component: "GiveCredit", x: 6, y: 1, width: 2, height: 1 },
  { id: "recent", component: "RecentActivity", x: 0, y: 2, width: 4, height: 3 },
  { id: "acquired", component: "AcquiredSkills", x: 4, y: 2, width: 4, height: 2 },
  { id: "suggested", component: "SuggestedSkills", x: 4, y: 4, width: 4, height: 2 },
];

// Draggable Section Component
function DraggableSection({ section, onMove }: { section: GridSection; onMove: (id: string, x: number, y: number) => void }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "section",
    item: section,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`absolute cursor-move transition-all duration-200 ${isDragging ? "opacity-70 z-50" : "z-10"}`}
      style={{
        left: section.x * CELL_SIZE,
        top: section.y * CELL_SIZE,
        width: section.width * CELL_SIZE - 8,
        height: section.height * CELL_SIZE - 8,
      }}
    >
      {renderComponent(section.component)}
    </div>
  );
}

// Grid Cell Component
function GridCell({ x, y, onDrop }: { x: number; y: number; onDrop: (item: GridSection, x: number, y: number) => void }) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: "section",
    drop: (item: GridSection) => {
      onDrop(item, x, y);
    },
    canDrop: (item: GridSection) => {
      // Check if the section can fit at this position
      return x + item.width <= GRID_COLUMNS && y + item.height <= GRID_ROWS;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`border border-dashed ${
        isOver && canDrop ? "border-primary bg-primary/5" : "border-gray-200"
      }`}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    />
  );
}

// Component renderer
function renderComponent(component: string) {
  const { user, loading } = useUser();

  switch (component) {
    case "ProfileCard":
      return (
        <ProfileSoftCard 
          loading={loading} 
          user={user} 
          className="h-full"
        />
      );
    case "ReceivedCredits":
      return (
        <Card className="p-6 h-full bg-success/10 border-success/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">收到的 credit</h3>
            <div className="text-3xl font-bold text-success">{user?.creditsReceived || 0}</div>
          </div>
        </Card>
      );
    case "SentCredits":
      return (
        <Card className="p-6 h-full bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">送出的 credit</h3>
            <div className="text-3xl font-bold text-blue-600">{user?.creditsSent || 0}</div>
          </div>
        </Card>
      );
    case "DailyCredits":
      return <DailyCreditsCard user={user} />;
    case "GiveCredit":
      return <GiveCreditButton />;
    case "RecentActivity":
      return <RecentCredits />;
    case "AcquiredSkills":
      return (
        <Card className="p-6 h-full">
          <h3 className="text-xl font-semibold mb-4">習得技能</h3>
          <div className="grid grid-cols-2 gap-3">
            {["木作", "油漆", "水電", "系統櫃"].map((skill) => (
              <div key={skill} className="h-16 w-16 flex items-center justify-center bg-gradient-success text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                {skill}
              </div>
            ))}
          </div>
        </Card>
      );
    case "SuggestedSkills":
      return (
        <Card className="p-6 h-full">
          <h3 className="text-xl font-semibold mb-4">建議學習技能</h3>
          <div className="grid grid-cols-2 gap-3">
            {["3D設計", "智能家居", "綠建材", "燈光設計"].map((skill) => (
              <div key={skill} className="h-16 w-16 flex items-center justify-center bg-gradient-info text-white rounded-2xl shadow-soft-xl text-xs font-semibold text-center p-2 leading-tight">
                {skill}
              </div>
            ))}
          </div>
        </Card>
      );
    default:
      return null;
  }
}

export default function DraggableDashboardPage() {
  const [layout, setLayout] = useState<GridSection[]>(defaultLayout);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Choose backend based on device
  const backend = isMobile ? TouchBackend : HTML5Backend;
  const backendOptions = isMobile 
    ? { enableMouseEvents: true, delayTouchStart: 200 } 
    : undefined;

  const handleMove = (id: string, newX: number, newY: number) => {
    setLayout((prevLayout) => {
      const section = prevLayout.find((s) => s.id === id);
      if (!section) return prevLayout;

      // Check for collisions
      const wouldCollide = prevLayout.some((other) => {
        if (other.id === id) return false;
        return !(
          newX + section.width <= other.x ||
          other.x + other.width <= newX ||
          newY + section.height <= other.y ||
          other.y + other.height <= newY
        );
      });

      if (wouldCollide || newX + section.width > GRID_COLUMNS || newY + section.height > GRID_ROWS) {
        return prevLayout;
      }

      return prevLayout.map((s) =>
        s.id === id ? { ...s, x: newX, y: newY } : s
      );
    });
  };

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
      <div className="max-w-[1200px] mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div 
          className="relative bg-gray-50 rounded-lg p-4 overflow-auto"
          style={{
            width: GRID_COLUMNS * CELL_SIZE + 32,
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
              />
            ))}
          </div>

          {/* Draggable sections */}
          {layout.map((section) => (
            <DraggableSection
              key={section.id}
              section={section}
              onMove={handleMove}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setLayout(defaultLayout)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            重置布局
          </button>
          <button
            onClick={() => localStorage.setItem("dashboardLayout", JSON.stringify(layout))}
            className="px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors"
          >
            保存布局
          </button>
        </div>
      </div>
    </DndProvider>
  );
}