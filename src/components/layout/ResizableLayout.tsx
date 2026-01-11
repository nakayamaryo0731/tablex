import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MainPanel } from "./MainPanel";

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 500;
const DEFAULT_SIDEBAR_WIDTH = 240;

export function ResizableLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const newWidth = Math.min(
        Math.max(e.clientX, MIN_SIDEBAR_WIDTH),
        MAX_SIDEBAR_WIDTH
      );
      setSidebarWidth(newWidth);
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar width={sidebarWidth} />
      <div
        onMouseDown={handleMouseDown}
        className={`w-1 cursor-col-resize bg-gray-200 hover:bg-blue-400 dark:bg-gray-700 dark:hover:bg-blue-500 ${
          isDragging ? "bg-blue-500 dark:bg-blue-500" : ""
        }`}
      />
      <MainPanel />
    </div>
  );
}
