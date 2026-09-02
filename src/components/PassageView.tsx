import React, { useState, useRef, useEffect } from 'react';
import { PARAGRAPHS, PASSAGE_TITLE, PASSAGE_SUBTITLE } from '../data/ieltsData';
import { HighlightItem } from '../types';
import { Bookmark, Highlighter as HighlighterIcon, Copy, Trash2, Plus, Sparkles } from 'lucide-react';

interface PassageViewProps {
  fontSize: number;
  highlighterColor: 'yellow' | 'green' | 'cyan' | 'pink' | 'eraser' | null;
  highlights: HighlightItem[];
  onAddHighlight: (highlight: HighlightItem) => void;
  onRemoveHighlight: (id: string) => void;
  searchQuery: string;
  targetParagraph: number | null;
  onParagraphTargeted?: () => void;
  onAddNoteSnippet?: (text: string) => void;
}

export const PassageView: React.FC<PassageViewProps> = ({
  fontSize,
  highlighterColor,
  highlights,
  onAddHighlight,
  onRemoveHighlight,
  searchQuery,
  targetParagraph,
  onParagraphTargeted,
  onAddNoteSnippet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  
  // Floating selection menu state
  const [floatingMenu, setFloatingMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    paragraphId: number;
    startOffset: number;
    endOffset: number;
  } | null>(null);

  // Scroll to targeted paragraph if triggered by question explanation
  useEffect(() => {
    if (targetParagraph && paragraphRefs.current[targetParagraph]) {
      const el = paragraphRefs.current[targetParagraph];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-amber-400', 'bg-amber-50/70', 'transition-all', 'duration-500');
        const timeout = setTimeout(() => {
          el.classList.remove('ring-4', 'ring-amber-400', 'bg-amber-50/70');
          if (onParagraphTargeted) onParagraphTargeted();
        }, 2200);
        return () => clearTimeout(timeout);
      }
    }
  }, [targetParagraph, onParagraphTargeted]);

  // Handle text selection on mouse up
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setFloatingMenu(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text || text.length < 2) {
      setFloatingMenu(null);
      return;
    }

    // Determine which paragraph was selected
    const anchorNode = selection.anchorNode;
    let currentEl = anchorNode?.parentElement;
    let pId: number | null = null;

    while (currentEl && !pId) {
      const pAttr = currentEl.getAttribute('data-paragraph-id');
      if (pAttr) {
        pId = parseInt(pAttr, 10);
      }
      currentEl = currentEl.parentElement;
    }

    if (!pId) {
      // Fallback: Check range container
      const range = selection.getRangeAt(0);
      let container: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement;
      }
      const pAttr = container?.closest('[data-paragraph-id]')?.getAttribute('data-paragraph-id');
      if (pAttr) pId = parseInt(pAttr, 10);
    }

    if (!pId) return;

    // If a highlighter is already selected in the top bar, apply immediately
    if (highlighterColor && highlighterColor !== 'eraser') {
      const newHighlight: HighlightItem = {
        id: `hl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        targetType: 'passage',
        paragraphId: pId,
        startOffset: 0,
        endOffset: 0,
        text,
        color: highlighterColor,
      };
      onAddHighlight(newHighlight);
      selection.removeAllRanges();
      setFloatingMenu(null);
      return;
    }

    // Otherwise show floating popup
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect() || { top: 0, left: 0 };

    setFloatingMenu({
      visible: true,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 42,
      text,
      paragraphId: pId,
      startOffset: 0,
      endOffset: 0,
    });
  };

  const applyColorFromPopup = (color: 'yellow' | 'green' | 'cyan' | 'pink') => {
    if (!floatingMenu) return;
    const newHighlight: HighlightItem = {
      id: `hl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetType: 'passage',
      paragraphId: floatingMenu.paragraphId,
      startOffset: 0,
      endOffset: 0,
      text: floatingMenu.text,
      color,
    };
    onAddHighlight(newHighlight);
    setFloatingMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const copySnippetToNotes = () => {
    if (!floatingMenu || !onAddNoteSnippet) return;
    onAddNoteSnippet(`[Para ${floatingMenu.paragraphId}]: "${floatingMenu.text}"`);
    setFloatingMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  // Helper to render paragraph with highlights and search query
  const renderParagraphContent = (paragraphText: string, paragraphId: number) => {
    const paraHighlights = highlights.filter((h) => h.paragraphId === paragraphId);

    // If no highlights and no search query, return normal text
    if (paraHighlights.length === 0 && (!searchQuery || searchQuery.trim().length === 0)) {
      return <span>{paragraphText}</span>;
    }

    // We can do a string split matching approach to render highlights safely
    // 1. Highlight matches from user highlights
    let segments: { text: string; highlight?: HighlightItem; isSearch?: boolean }[] = [
      { text: paragraphText },
    ];

    // Apply user highlights
    for (const hl of paraHighlights) {
      const nextSegments: typeof segments = [];
      for (const seg of segments) {
        if (seg.highlight || seg.isSearch) {
          nextSegments.push(seg);
          continue;
        }

        const idx = seg.text.toLowerCase().indexOf(hl.text.toLowerCase());
        if (idx === -1) {
          nextSegments.push(seg);
        } else {
          const before = seg.text.substring(0, idx);
          const matched = seg.text.substring(idx, idx + hl.text.length);
          const after = seg.text.substring(idx + hl.text.length);

          if (before) nextSegments.push({ text: before });
          nextSegments.push({ text: matched, highlight: hl });
          if (after) nextSegments.push({ text: after });
        }
      }
      segments = nextSegments;
    }

    // Apply search query highlight
    if (searchQuery && searchQuery.trim().length > 0) {
      const queryLower = searchQuery.toLowerCase().trim();
      const nextSegments: typeof segments = [];
      for (const seg of segments) {
        if (seg.isSearch) {
          nextSegments.push(seg);
          continue;
        }
        const idx = seg.text.toLowerCase().indexOf(queryLower);
        if (idx === -1) {
          nextSegments.push(seg);
        } else {
          const before = seg.text.substring(0, idx);
          const matched = seg.text.substring(idx, idx + queryLower.length);
          const after = seg.text.substring(idx + queryLower.length);

          if (before) nextSegments.push({ ...seg, text: before });
          nextSegments.push({ ...seg, text: matched, isSearch: true });
          if (after) nextSegments.push({ ...seg, text: after });
        }
      }
      segments = nextSegments;
    }

    return (
      <>
        {segments.map((seg, idx) => {
          if (seg.isSearch) {
            return (
              <mark
                key={idx}
                className="bg-amber-300 text-slate-900 px-0.5 rounded-xs font-semibold ring-1 ring-amber-500"
              >
                {seg.text}
              </mark>
            );
          }

          if (seg.highlight) {
            const colorClass =
              seg.highlight.color === 'yellow'
                ? 'bg-amber-200/90 text-slate-900'
                : seg.highlight.color === 'green'
                ? 'bg-emerald-200/90 text-slate-900'
                : seg.highlight.color === 'cyan'
                ? 'bg-sky-200/90 text-slate-900'
                : 'bg-pink-200/90 text-slate-900';

            return (
              <span
                key={idx}
                className={`${colorClass} px-0.5 py-0.5 rounded cursor-pointer transition-all hover:ring-1 hover:ring-slate-400`}
                title="Click to remove highlight"
                onClick={(e) => {
                  e.stopPropagation();
                  if (seg.highlight) onRemoveHighlight(seg.highlight.id);
                }}
              >
                {seg.text}
              </span>
            );
          }

          return <span key={idx}>{seg.text}</span>;
        })}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="relative flex-1 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden select-text flex flex-col"
      style={{ minHeight: '580px', maxHeight: 'calc(100vh - 170px)' }}
    >
      {/* Sleek Top Section Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
        <h2 className="font-bold text-slate-600 uppercase text-xs tracking-wider flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-blue-600" />
          <span>Reading Passage 1</span>
        </h2>
        <span className="text-xs text-slate-400 italic">Estimated reading time: 20 mins</span>
      </div>

      {/* Floating Selection Highlighter Tooltip */}
      {floatingMenu && floatingMenu.visible && (
        <div
          className="absolute z-50 transform -translate-x-1/2 flex items-center space-x-1 bg-slate-900/95 backdrop-blur-md text-white px-2 py-1 rounded-lg shadow-xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${Math.max(120, Math.min(floatingMenu.x, (containerRef.current?.offsetWidth || 600) - 120))}px`,
            top: `${Math.max(10, floatingMenu.y)}px`,
          }}
        >
          <span className="text-[11px] text-slate-300 font-medium px-1 flex items-center space-x-1">
            <HighlighterIcon className="w-3 h-3 text-amber-400" />
            <span>Highlight:</span>
          </span>

          <button
            id="popup-hl-yellow"
            onClick={() => applyColorFromPopup('yellow')}
            className="w-5 h-5 rounded hover:scale-110 transition-transform"
            style={{ backgroundColor: '#fef08a' }}
            title="Yellow"
          />
          <button
            id="popup-hl-green"
            onClick={() => applyColorFromPopup('green')}
            className="w-5 h-5 rounded hover:scale-110 transition-transform"
            style={{ backgroundColor: '#bbf7d0' }}
            title="Green"
          />
          <button
            id="popup-hl-cyan"
            onClick={() => applyColorFromPopup('cyan')}
            className="w-5 h-5 rounded hover:scale-110 transition-transform"
            style={{ backgroundColor: '#bae6fd' }}
            title="Cyan"
          />
          <button
            id="popup-hl-pink"
            onClick={() => applyColorFromPopup('pink')}
            className="w-5 h-5 rounded hover:scale-110 transition-transform"
            style={{ backgroundColor: '#fbcfe8' }}
            title="Pink"
          />

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {onAddNoteSnippet && (
            <button
              id="popup-copy-note"
              onClick={copySnippetToNotes}
              className="flex items-center space-x-1 text-[11px] text-amber-300 hover:text-amber-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors"
              title="Add selection to Notes"
            >
              <Plus className="w-3 h-3" />
              <span>Note</span>
            </button>
          )}
        </div>
      )}

      {/* Scrollable Reading Content */}
      <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
        {/* Title Section */}
        <div className="border-b border-slate-200 pb-5 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 tracking-tight leading-tight mb-2">
            {PASSAGE_TITLE}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 italic font-serif">
            {PASSAGE_SUBTITLE}
          </p>
        </div>

        {/* Paragraphs */}
        <div
          className="space-y-5 text-slate-800 font-serif leading-relaxed"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
        >
          {PARAGRAPHS.map((p) => (
            <p
              key={p.id}
              id={`paragraph-${p.id}`}
              data-paragraph-id={p.id}
              ref={(el) => (paragraphRefs.current[p.id] = el)}
              className="rounded-md px-2 py-1.5 transition-all duration-300 hover:bg-slate-50/70 text-justify tracking-normal"
            >
              {renderParagraphContent(p.text, p.id)}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
