import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  FileText, 
  X, 
  Copy, 
  Trash2, 
  Check, 
  Tag, 
  Minimize2, 
  Maximize2,
  GripHorizontal,
  RotateCcw,
  Move
} from 'lucide-react';

interface NotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}

const MIN_WIDTH = 300;
const MIN_HEIGHT = 260;
const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 480;

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onNotesChange,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Position and Size
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  }>({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const resizeRef = useRef<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    startPosX: number;
    startPosY: number;
  }>({
    handle: 'se',
    startX: 0,
    startY: 0,
    startWidth: DEFAULT_WIDTH,
    startHeight: DEFAULT_HEIGHT,
    startPosX: 0,
    startPosY: 0,
  });

  // Calculate default position at bottom-right
  const getDefaultPosition = useCallback((w: number, h: number) => {
    if (typeof window === 'undefined') return { x: 20, y: 20 };
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const targetW = Math.min(w, winWidth - 32);
    const targetH = Math.min(h, winHeight - 32);
    return {
      x: Math.max(16, winWidth - targetW - 24),
      y: Math.max(16, winHeight - targetH - 24),
    };
  }, []);

  // Initialize position on open or window resize
  useEffect(() => {
    if (isOpen && position === null) {
      const initialSize = {
        width: Math.min(DEFAULT_WIDTH, window.innerWidth - 32),
        height: Math.min(DEFAULT_HEIGHT, window.innerHeight - 32),
      };
      setSize(initialSize);
      setPosition(getDefaultPosition(initialSize.width, initialSize.height));
    }
  }, [isOpen, position, getDefaultPosition]);

  // Handle window resizing to keep notepad in bounds
  useEffect(() => {
    const handleWindowResize = () => {
      if (!position) return;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      setSize((prevSize) => ({
        width: Math.min(prevSize.width, winW - 24),
        height: Math.min(prevSize.height, winH - 24),
      }));

      setPosition((prevPos) => {
        if (!prevPos) return null;
        const currentW = Math.min(size.width, winW - 24);
        const currentH = Math.min(size.height, winH - 24);
        return {
          x: Math.max(8, Math.min(prevPos.x, winW - currentW - 8)),
          y: Math.max(8, Math.min(prevPos.y, winH - currentH - 8)),
        };
      });
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [position, size]);

  // Reset to default bottom-right docked position
  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    const defaultW = Math.min(DEFAULT_WIDTH, window.innerWidth - 32);
    const defaultH = Math.min(DEFAULT_HEIGHT, window.innerHeight - 32);
    setSize({ width: defaultW, height: defaultH });
    setPosition(getDefaultPosition(defaultW, defaultH));
  };

  // --- DRAG LOGIC ---
  const handlePointerDownDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    // Don't drag if clicking buttons inside the header
    if ((e.target as HTMLElement).closest('button')) return;

    const currentPos = position || getDefaultPosition(size.width, size.height);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: currentPos.x,
      startPosY: currentPos.y,
    };

    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || isExpanded) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const newX = Math.max(8, Math.min(winW - size.width - 8, dragRef.current.startPosX + dx));
    const newY = Math.max(8, Math.min(winH - size.height - 8, dragRef.current.startPosY + dy));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUpDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // --- RESIZE LOGIC ---
  const handlePointerDownResize = (handle: ResizeHandle, e: React.PointerEvent<HTMLDivElement>) => {
    if (isExpanded) return;
    e.stopPropagation();
    e.preventDefault();

    const currentPos = position || getDefaultPosition(size.width, size.height);

    resizeRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
      startPosX: currentPos.x,
      startPosY: currentPos.y,
    };

    setIsResizing(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing || isExpanded) return;
    e.preventDefault();

    const { handle, startX, startY, startWidth, startHeight, startPosX, startPosY } =
      resizeRef.current;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    let newWidth = startWidth;
    let newHeight = startHeight;
    let newX = startPosX;
    let newY = startPosY;

    // Horizontal adjustments
    if (handle.includes('e')) {
      newWidth = Math.max(MIN_WIDTH, Math.min(winW - startPosX - 8, startWidth + dx));
    } else if (handle.includes('w')) {
      const maxPossibleWidth = startPosX + startWidth - 8;
      newWidth = Math.max(MIN_WIDTH, Math.min(maxPossibleWidth, startWidth - dx));
      newX = startPosX + (startWidth - newWidth);
    }

    // Vertical adjustments
    if (handle.includes('s')) {
      newHeight = Math.max(MIN_HEIGHT, Math.min(winH - startPosY - 8, startHeight + dy));
    } else if (handle.includes('n')) {
      const maxPossibleHeight = startPosY + startHeight - 8;
      newHeight = Math.max(MIN_HEIGHT, Math.min(maxPossibleHeight, startHeight - dy));
      newY = startPosY + (startHeight - newHeight);
    }

    setSize({ width: newWidth, height: newHeight });
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUpResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isResizing) {
      setIsResizing(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleClear = () => {
    onNotesChange('');
    setShowClearConfirm(false);
  };

  const insertTag = (tag: string) => {
    const updated = notes ? `${notes}\n\n${tag}: ` : `${tag}: `;
    onNotesChange(updated);
  };

  if (!isOpen) return null;

  const currentPos = position || getDefaultPosition(size.width, size.height);

  return (
    <div
      id="notes-drawer-container"
      style={
        isExpanded
          ? {
              top: '16px',
              left: '16px',
              right: '16px',
              bottom: '16px',
              width: 'auto',
              height: 'auto',
            }
          : {
              top: `${currentPos.y}px`,
              left: `${currentPos.x}px`,
              width: `${size.width}px`,
              height: `${size.height}px`,
            }
      }
      className={`fixed z-40 bg-white border border-slate-300 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-[box-shadow,opacity] duration-150 ${
        isDragging || isResizing ? 'shadow-2xl ring-2 ring-blue-500/40 select-none' : ''
      }`}
    >
      {/* Resizing Handles (All edges & corners when not expanded) */}
      {!isExpanded && (
        <>
          {/* Top Edge */}
          <div
            onPointerDown={(e) => handlePointerDownResize('n', e)}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            className="absolute top-0 left-3 right-3 h-2 cursor-n-resize z-50 hover:bg-blue-500/20 transition-colors"
          />
          {/* Bottom Edge */}
          <div
            onPointerDown={(e) => handlePointerDownResize('s', e)}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            className="absolute bottom-0 left-3 right-3 h-2 cursor-s-resize z-50 hover:bg-blue-500/20 transition-colors"
          />
          {/* Left Edge */}
          <div
            onPointerDown={(e) => handlePointerDownResize('w', e)}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            className="absolute left-0 top-3 bottom-3 w-2 cursor-w-resize z-50 hover:bg-blue-500/20 transition-colors"
          />
          {/* Right Edge */}
          <div
            onPointerDown={(e) => handlePointerDownResize('e', e)}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            className="absolute right-0 top-3 bottom-3 w-2 cursor-e-resize z-50 hover:bg-blue-500/20 transition-colors"
          />
          {/* Top-Left Corner */}
          <div
            onPointerDown={(e) => handlePointerDownResize('nw', e)}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nwse-resize z-50 hover:bg-blue-500/30"
          />
          {/* Top-Right Corner */}
          <div
            onPointerDown={(e) => handlePointerDownResize('ne', e)}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            className="absolute top-0 right-0 w-3.5 h-3.5 cursor-nesw-resize z-50 hover:bg-blue-500/30"
          />
          {/* Bottom-Left Corner */}
          <div
            onPointerDown={(e) => handlePointerDownResize('sw', e)}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize z-50 hover:bg-blue-500/30"
          />
          {/* Bottom-Right Corner */}
          <div
            onPointerDown={(e) => handlePointerDownResize('se', e)}
            onPointerMove={handlePointerMoveResize}
            onPointerUp={handlePointerUpResize}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize z-50 flex items-center justify-center group"
          >
            <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-slate-400 group-hover:border-blue-600 transition-colors mb-0.5 mr-0.5" />
          </div>
        </>
      )}

      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDownDrag}
        onPointerMove={handlePointerMoveDrag}
        onPointerUp={handlePointerUpDrag}
        className={`flex items-center justify-between px-3.5 py-2.5 bg-[#0F172A] text-white rounded-t-2xl select-none shrink-0 ${
          !isExpanded ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <div className="flex items-center space-x-2">
          {!isExpanded && (
            <GripHorizontal className="w-4 h-4 text-slate-400 opacity-70 hover:opacity-100" />
          )}
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs sm:text-sm tracking-tight">Exam Scratchpad</span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Reset position & size button */}
          {!isExpanded && (
            <button
              id="notes-reset-pos-btn"
              onClick={handleResetPosition}
              title="Reset position & size"
              className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Expand / Minimize */}
          <button
            id="notes-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore window' : 'Maximize window'}
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Close */}
          <button
            id="notes-close-btn"
            onClick={onClose}
            title="Close notepad"
            className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tag Insertion Quick Bar */}
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center space-x-1 overflow-x-auto text-[11px] scrollbar-none shrink-0">
        <span className="text-slate-600 font-semibold flex items-center space-x-1 mr-1">
          <Tag className="w-3 h-3 text-slate-500" />
          <span>Quick Tags:</span>
        </span>
        <button
          onClick={() => insertTag('[Paragraph 1]')}
          className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors"
        >
          + Para 1
        </button>
        <button
          onClick={() => insertTag('[Paragraph 3]')}
          className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors"
        >
          + Para 3
        </button>
        <button
          onClick={() => insertTag('[Paragraph 6]')}
          className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors"
        >
          + Para 6
        </button>
        <button
          onClick={() => insertTag('[Keywords / Synonyms]')}
          className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors"
        >
          + Synonyms
        </button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-2.5 sm:p-3 flex flex-col min-h-0 bg-white">
        <textarea
          id="notes-textarea"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Type notes, summarize paragraphs, or track keyword synonyms here..."
          className="flex-1 w-full p-3 text-xs sm:text-sm font-mono leading-relaxed bg-slate-50/60 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 resize-none text-slate-800 placeholder:text-slate-400"
        />
      </div>

      {/* Footer Controls */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-[11px] text-slate-600">
            {notes.trim().split(/\s+/).filter(Boolean).length} words · {notes.length} chars
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {showClearConfirm ? (
            <div className="flex items-center space-x-1.5 animate-in fade-in">
              <span className="text-[10px] font-semibold text-rose-600">Clear all?</span>
              <button
                onClick={handleClear}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
              >
                Yes
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px]"
              >
                No
              </button>
            </div>
          ) : (
            notes.trim().length > 0 && (
              <button
                id="clear-notes-btn"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center space-x-1 text-slate-500 hover:text-rose-600 px-2 py-1 rounded transition-colors text-[11px]"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )
          )}

          <button
            id="copy-notes-btn"
            onClick={handleCopy}
            className="flex items-center space-x-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded transition-colors text-[11px] font-semibold shadow-xs"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

