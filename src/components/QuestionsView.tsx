import React, { useState, useEffect, useRef } from 'react';
import { 
  QuestionItem, 
  Mode, 
  UserAnswerState,
  HighlightItem
} from '../types';
import { 
  QUESTIONS, 
  TIP_STRIP_PART1, 
  TIP_STRIP_PART2, 
  checkAnswerCorrectness 
} from '../data/ieltsData';
import { 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  ExternalLink, 
  Flag,
  Info,
  BookOpen,
  Sparkles,
  ArrowRight,
  Highlighter as HighlighterIcon,
  Plus,
  Languages
} from 'lucide-react';

interface QuestionsViewProps {
  mode: Mode;
  userAnswers: UserAnswerState;
  onAnswerChange: (questionId: number, answer: string) => void;
  onJumpToParagraph: (paragraphId: number) => void;
  flaggedQuestions: Set<number>;
  onToggleFlag: (questionId: number) => void;
  isSubmitted: boolean;
  onGoToConsolidation?: () => void;
  highlighterColor?: 'yellow' | 'green' | 'cyan' | 'pink' | 'eraser' | null;
  highlights?: HighlightItem[];
  onAddHighlight?: (highlight: HighlightItem) => void;
  onRemoveHighlight?: (id: string) => void;
  onAddNoteSnippet?: (text: string) => void;
}

export const QuestionsView: React.FC<QuestionsViewProps> = ({
  mode,
  userAnswers,
  onAnswerChange,
  onJumpToParagraph,
  flaggedQuestions,
  onToggleFlag,
  isSubmitted,
  onGoToConsolidation,
  highlighterColor = null,
  highlights = [],
  onAddHighlight,
  onRemoveHighlight,
  onAddNoteSnippet,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Practice mode state: which questions have their explanation open or checked
  const [checkedQuestions, setCheckedQuestions] = useState<{ [key: number]: boolean }>({});
  const [openExplanations, setOpenExplanations] = useState<{ [key: number]: boolean }>({});
  const [openTips, setOpenTips] = useState<{ [key: number]: boolean }>({});

  // Language display mode: 'bilingual' (English + Vietnamese), 'vi' (Vietnamese priority), 'en' (English only)
  const [explanationLanguage, setExplanationLanguage] = useState<'bilingual' | 'vi' | 'en'>('bilingual');
  
  // Floating selection menu state for questions
  const [floatingMenu, setFloatingMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
    questionId: number;
  } | null>(null);

  // When test is not submitted and answers are empty (retake / reset), clear checked states
  useEffect(() => {
    if (!isSubmitted && Object.keys(userAnswers).length === 0) {
      setCheckedQuestions({});
      setOpenExplanations({});
    }
  }, [isSubmitted, userAnswers]);

  // Tip strip collapse state
  const [isTipStrip1Open, setIsTipStrip1Open] = useState(true);
  const [isTipStrip2Open, setIsTipStrip2Open] = useState(true);

  // Active question filter tab (All, 1-7 Short Answer, 8-13 T/F/NG)
  const [activeFilter, setActiveFilter] = useState<'all' | 'part1' | 'part2'>('all');

  // Handle text selection in questions
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

    // Determine which question card (if any) was selected
    const anchorNode = selection.anchorNode;
    let currentEl = anchorNode?.parentElement;
    let qId: number | null = null;

    while (currentEl && !qId) {
      const qAttr = currentEl.getAttribute('data-question-id');
      if (qAttr) {
        qId = parseInt(qAttr, 10);
      }
      currentEl = currentEl.parentElement;
    }

    if (!qId) {
      const range = selection.getRangeAt(0);
      let container: HTMLElement | null = range.commonAncestorContainer as HTMLElement;
      if (container.nodeType === Node.TEXT_NODE) {
        container = container.parentElement;
      }
      const qAttr = container?.closest('[data-question-id]')?.getAttribute('data-question-id');
      if (qAttr) qId = parseInt(qAttr, 10);
    }

    const targetQId = qId || 0;

    // If top bar highlighter is actively selected (and not eraser), apply immediately
    if (highlighterColor && highlighterColor !== 'eraser' && onAddHighlight) {
      const newHighlight: HighlightItem = {
        id: `hl-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        targetType: 'question',
        questionId: targetQId,
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
      questionId: targetQId,
    });
  };

  const applyColorFromPopup = (color: 'yellow' | 'green' | 'cyan' | 'pink') => {
    if (!floatingMenu || !onAddHighlight) return;
    const newHighlight: HighlightItem = {
      id: `hl-q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      targetType: 'question',
      questionId: floatingMenu.questionId,
      text: floatingMenu.text,
      color,
    };
    onAddHighlight(newHighlight);
    setFloatingMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  const copySnippetToNotes = () => {
    if (!floatingMenu || !onAddNoteSnippet) return;
    const label = floatingMenu.questionId ? `[Question ${floatingMenu.questionId}]` : '[Questions Section]';
    onAddNoteSnippet(`${label}: "${floatingMenu.text}"`);
    setFloatingMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  // Helper to render text with highlights
  const renderHighlightedText = (textToRender: string, qId?: number) => {
    // Find highlights relevant to questions
    const questionHighlights = highlights.filter(
      (h) => h.targetType === 'question' || (!h.paragraphId && h.text)
    );

    if (questionHighlights.length === 0) {
      return <span>{textToRender}</span>;
    }

    let segments: { text: string; highlight?: HighlightItem }[] = [{ text: textToRender }];

    for (const hl of questionHighlights) {
      if (hl.questionId && qId && hl.questionId !== qId) continue;

      const nextSegments: typeof segments = [];
      for (const seg of segments) {
        if (seg.highlight) {
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

    return (
      <>
        {segments.map((seg, idx) => {
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
                  if (seg.highlight && onRemoveHighlight) {
                    onRemoveHighlight(seg.highlight.id);
                  }
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

  const handleCheckQuestion = (qId: number) => {
    setCheckedQuestions((prev) => ({ ...prev, [qId]: true }));
    setOpenExplanations((prev) => ({ ...prev, [qId]: true }));
  };

  const toggleExplanation = (qId: number) => {
    setOpenExplanations((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const toggleTip = (qId: number) => {
    setOpenTips((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const getWordCount = (str: string) => {
    return str.trim().split(/\s+/).filter(Boolean).length;
  };

  const part1Questions = QUESTIONS.filter((q) => q.questionNumber <= 7);
  const part2Questions = QUESTIONS.filter((q) => q.questionNumber >= 8);

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="relative flex-1 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden select-text flex flex-col"
      style={{ minHeight: '580px', maxHeight: 'calc(100vh - 170px)' }}
    >
      {/* Sleek Top Header with Language Preference Toggle */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-2 shrink-0">
        <div className="flex items-center space-x-2">
          <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">
            Questions 1–13
          </h2>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 font-medium bg-slate-200/70 px-1.5 py-0.5 rounded">
            Highlighter Active
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language preference for explanations & tips */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs text-[11px]">
            <span className="px-1.5 text-slate-400 flex items-center gap-1 font-medium">
              <Languages className="w-3 h-3 text-blue-600" />
              <span className="hidden md:inline">Language:</span>
            </span>
            <button
              id="lang-bilingual-btn"
              onClick={() => setExplanationLanguage('bilingual')}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                explanationLanguage === 'bilingual'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Song ngữ (Bilingual English & Vietnamese)"
            >
              Song ngữ
            </button>
            <button
              id="lang-vi-btn"
              onClick={() => setExplanationLanguage('vi')}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                explanationLanguage === 'vi'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tiếng Việt (Vietnamese focus)"
            >
              Tiếng Việt
            </button>
            <button
              id="lang-en-btn"
              onClick={() => setExplanationLanguage('en')}
              className={`px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                explanationLanguage === 'en'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="English only"
            >
              English
            </button>
          </div>

          <div className="text-xs font-medium text-slate-500">
            Answered:{' '}
            <span className="font-bold text-slate-900">
              {Object.values(userAnswers).filter((ans): ans is string => typeof ans === 'string' && ans.trim().length > 0).length}
            </span>
            {' '}/ 13
          </div>
        </div>
      </div>

      {/* Floating Selection Highlighter Tooltip for Questions */}
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
            id="popup-q-hl-yellow"
            onClick={() => applyColorFromPopup('yellow')}
            className="w-5 h-5 rounded hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: '#fef08a' }}
            title="Yellow"
          />
          <button
            id="popup-q-hl-green"
            onClick={() => applyColorFromPopup('green')}
            className="w-5 h-5 rounded hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: '#bbf7d0' }}
            title="Green"
          />
          <button
            id="popup-q-hl-cyan"
            onClick={() => applyColorFromPopup('cyan')}
            className="w-5 h-5 rounded hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: '#bae6fd' }}
            title="Cyan"
          />
          <button
            id="popup-q-hl-pink"
            onClick={() => applyColorFromPopup('pink')}
            className="w-5 h-5 rounded hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: '#fbcfe8' }}
            title="Pink"
          />

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {onAddNoteSnippet && (
            <button
              id="popup-q-copy-note"
              onClick={copySnippetToNotes}
              className="flex items-center space-x-1 text-[11px] text-amber-300 hover:text-amber-200 px-1.5 py-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Add question excerpt to Notes"
            >
              <Plus className="w-3 h-3" />
              <span>Note</span>
            </button>
          )}
        </div>
      )}

      {/* Navigator, Filters and Quick Jump */}
      <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 bg-white shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-1.5">
            <button
              id="filter-all-btn"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All (1–13)
            </button>
            <button
              id="filter-part1-btn"
              onClick={() => setActiveFilter('part1')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'part1'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Q 1–7 (Short Answer)
            </button>
            <button
              id="filter-part2-btn"
              onClick={() => setActiveFilter('part2')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeFilter === 'part2'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              Q 8–13 (T/F/NG)
            </button>
          </div>
        </div>

        {/* Quick Jump Bar */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {QUESTIONS.map((q) => {
            const hasAnswer = Boolean(userAnswers[q.id]?.trim());
            const isFlagged = flaggedQuestions.has(q.id);
            const isChecked = checkedQuestions[q.id] || (isSubmitted && mode === 'test');
            const isCorrect = isChecked ? checkAnswerCorrectness(q, userAnswers[q.id] || '') : false;

            let badgeColor = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
            if (isChecked) {
              badgeColor = isCorrect
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-rose-600 text-white border-rose-700';
            } else if (hasAnswer) {
              badgeColor = 'bg-blue-600 text-white border-blue-700 shadow-xs';
            }

            return (
              <a
                key={q.id}
                href={`#question-card-${q.id}`}
                id={`quick-jump-q-${q.id}`}
                className={`relative shrink-0 w-7 h-7 sm:w-7.5 sm:h-7.5 rounded text-xs font-bold flex items-center justify-center border transition-all ${badgeColor}`}
                title={`Jump to Question ${q.questionNumber}`}
              >
                {q.questionNumber}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                )}
              </a>
            );
          })}
        </div>
      </div>

      {/* Scrollable Questions Content */}
      <div className="p-4 sm:p-6 overflow-y-auto space-y-8 flex-1">
        {/* SECTION 1: Questions 1-7 */}
        {(activeFilter === 'all' || activeFilter === 'part1') && (
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-blue-400 border border-slate-700">
                  Part 1: Questions 1–7
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  Short-answer Questions
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mt-2">
                {renderHighlightedText('Answer the questions below.')}
              </h3>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Choose <span className="underline font-bold text-amber-300">NO MORE THAN TWO WORDS AND/OR A NUMBER</span> from the passage for each answer.
              </p>
              {explanationLanguage !== 'en' && (
                <p className="text-[11px] text-blue-300/90 mt-1.5 italic">
                  Hướng dẫn: Chọn không quá hai từ và/hoặc một số từ bài đọc cho mỗi câu trả lời.
                </p>
              )}
            </div>

            {/* TIP STRIP: Questions 1-7 */}
            {mode === 'practice' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span>IELTS Tip: Scanning & Strategy</span>
                  </div>
                  <button
                    id="toggle-tipstrip-1"
                    onClick={() => setIsTipStrip1Open(!isTipStrip1Open)}
                    className="text-blue-700 hover:text-blue-900 text-xs font-semibold cursor-pointer"
                  >
                    {isTipStrip1Open ? 'Hide' : 'Show'}
                  </button>
                </div>

                {isTipStrip1Open && (
                  <div className="text-xs text-blue-900 leading-relaxed space-y-2">
                    <ul className="space-y-2 list-disc list-inside">
                      {TIP_STRIP_PART1.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="leading-snug">
                          {renderHighlightedText(bullet)}
                          {explanationLanguage !== 'en' && TIP_STRIP_PART1.bulletsVi?.[bIdx] && (
                            <p className="pl-4 text-[11px] text-blue-700 italic font-normal mt-0.5">
                              🇻🇳 {TIP_STRIP_PART1.bulletsVi[bIdx]}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Questions 1-7 Items */}
            <div className="space-y-4">
              {part1Questions.map((q) => {
                const answer = userAnswers[q.id] || '';
                const wordCount = getWordCount(answer);
                const isOverLimit = wordCount > 2;
                const isChecked = checkedQuestions[q.id] || (isSubmitted && mode === 'test');
                const isCorrect = isChecked ? checkAnswerCorrectness(q, answer) : false;
                const isFlagged = flaggedQuestions.has(q.id);
                const showExplanation = openExplanations[q.id] || (isSubmitted && mode === 'test');
                const showTip = openTips[q.id];

                return (
                  <div
                    key={q.id}
                    id={`question-card-${q.id}`}
                    data-question-id={q.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all ${
                      isChecked
                        ? isCorrect
                          ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200'
                          : 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Card Header: Number, Prompt, and Flag */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="shrink-0 w-6 h-6 rounded bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                          {q.questionNumber}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 leading-snug">
                            {renderHighlightedText(q.prompt, q.id)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          id={`flag-q-${q.id}`}
                          onClick={() => onToggleFlag(q.id)}
                          title={isFlagged ? 'Remove flag' : 'Flag question for review'}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isFlagged
                              ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Question Specific Tip (Practice Mode) */}
                    {mode === 'practice' && q.tip && (
                      <div className="mt-2.5">
                        <button
                          id={`tip-btn-q-${q.id}`}
                          onClick={() => toggleTip(q.id)}
                          className="flex items-center space-x-1.5 text-xs text-blue-700 hover:text-blue-900 font-medium py-0.5 px-2 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>{showTip ? 'Hide Question Tip' : 'Show Question Tip'}</span>
                        </button>
                        {showTip && (
                          <div className="mt-1.5 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-950 leading-relaxed animate-in fade-in space-y-1">
                            <p>
                              <strong className="text-blue-900">Tip (English): </strong>
                              {renderHighlightedText(q.tip, q.id)}
                            </p>
                            {explanationLanguage !== 'en' && q.tipVi && (
                              <p className="text-[11px] text-blue-800 pt-1 border-t border-blue-100/80">
                                <strong className="text-blue-900">🇻🇳 Mẹo làm bài: </strong>
                                {q.tipVi}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Input Field */}
                    <div className="mt-3">
                      <div className="relative">
                        <input
                          id={`input-q-${q.id}`}
                          type="text"
                          disabled={isSubmitted && mode === 'test'}
                          value={answer}
                          onChange={(e) => onAnswerChange(q.id, e.target.value)}
                          placeholder="Type your answer here..."
                          className={`w-full px-3.5 py-2 text-sm rounded-lg border outline-none transition-all ${
                            isChecked
                              ? isCorrect
                                ? 'border-emerald-500 bg-emerald-50/30 text-emerald-950 font-medium'
                                : 'border-rose-500 bg-rose-50/30 text-rose-950 font-medium'
                              : 'border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 hover:bg-white text-slate-900'
                          }`}
                        />
                      </div>

                      {/* Word count feedback */}
                      <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500">
                        <span>
                          Word count: <strong className={isOverLimit ? 'text-rose-600 font-bold' : 'text-slate-800'}>{wordCount}</strong> / 2 max
                        </span>
                        {isOverLimit && (
                          <span className="text-rose-600 font-semibold flex items-center space-x-1">
                            <Info className="w-3 h-3" />
                            <span>Warning: Exceeds 2-word limit!</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Practice Mode Controls & Feedback */}
                    {mode === 'practice' && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                        <button
                          id={`check-btn-q-${q.id}`}
                          onClick={() => handleCheckQuestion(q.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Check Answer</span>
                        </button>

                        <button
                          id={`explain-btn-q-${q.id}`}
                          onClick={() => toggleExplanation(q.id)}
                          className="flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-900 font-semibold py-1 px-2 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <span>{showExplanation ? 'Hide Explanation' : 'Show Explanation'}</span>
                          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {/* Detailed Explanation & Paragraph Evidence Box */}
                    {showExplanation && (
                      <div className="mt-3 p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-slate-800 space-y-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/70">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">Official Answer:</span>
                            <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300">
                              {q.officialAnswer}
                            </span>
                          </div>

                          <button
                            id={`locate-passage-q-${q.id}`}
                            onClick={() => onJumpToParagraph(q.paragraphRef)}
                            className="flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-semibold px-2 py-0.5 rounded bg-white hover:bg-blue-100/50 border border-blue-200 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3 text-blue-600" />
                            <span>Paragraph {q.paragraphRef}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">Passage Evidence: </span>
                          <span className="italic bg-yellow-100 px-1 py-0.5 rounded text-slate-900 font-serif">
                            "{renderHighlightedText(q.paragraphQuote, q.id)}"
                          </span>
                        </div>

                        {/* English Explanation */}
                        {(explanationLanguage === 'en' || explanationLanguage === 'bilingual') && (
                          <div className="text-slate-700 leading-relaxed font-sans pt-1">
                            <strong className="text-slate-900">Explanation (EN): </strong>
                            {renderHighlightedText(q.explanation, q.id)}
                          </div>
                        )}

                        {/* Vietnamese Explanation */}
                        {(explanationLanguage === 'vi' || explanationLanguage === 'bilingual') && q.explanationVi && (
                          <div className="p-2.5 rounded-md bg-white border border-blue-200/80 text-slate-800 leading-relaxed">
                            <span className="font-bold text-blue-900 flex items-center gap-1 mb-1">
                              <span>🇻🇳 Giải thích chi tiết:</span>
                            </span>
                            <p className="text-[12px] text-slate-700">
                              {renderHighlightedText(q.explanationVi, q.id)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 2: Questions 8-13 */}
        {(activeFilter === 'all' || activeFilter === 'part2') && (
          <div className="space-y-6 pt-2">
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-blue-400 border border-slate-700">
                  Part 2: Questions 8–13
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  TRUE / FALSE / NOT GIVEN
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mt-2">
                {renderHighlightedText('Do the following statements agree with the information given in Reading Passage 1?')}
              </h3>
              <div className="text-xs text-slate-300 mt-2.5 space-y-1.5 font-medium bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <p>
                  <strong className="text-emerald-400 font-bold">TRUE</strong> — if the statement agrees with the information
                  {explanationLanguage !== 'en' && <span className="text-slate-400 italic ml-1">(thông tin trùng khớp với bài đọc)</span>}
                </p>
                <p>
                  <strong className="text-rose-400 font-bold">FALSE</strong> — if the statement contradicts the information
                  {explanationLanguage !== 'en' && <span className="text-slate-400 italic ml-1">(thông tin mâu thuẫn/trái ngược với bài đọc)</span>}
                </p>
                <p>
                  <strong className="text-amber-400 font-bold">NOT GIVEN</strong> — if there is no information on this
                  {explanationLanguage !== 'en' && <span className="text-slate-400 italic ml-1">(không có thông tin để xác thực)</span>}
                </p>
              </div>
            </div>

            {/* TIP STRIP: Questions 8-13 */}
            {mode === 'practice' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                    <span>IELTS Tip: TRUE / FALSE / NOT GIVEN Strategy</span>
                  </div>
                  <button
                    id="toggle-tipstrip-2"
                    onClick={() => setIsTipStrip2Open(!isTipStrip2Open)}
                    className="text-blue-700 hover:text-blue-900 text-xs font-semibold cursor-pointer"
                  >
                    {isTipStrip2Open ? 'Hide' : 'Show'}
                  </button>
                </div>

                {isTipStrip2Open && (
                  <div className="text-xs text-blue-900 leading-relaxed space-y-2">
                    <ul className="space-y-2 list-disc list-inside">
                      {TIP_STRIP_PART2.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="leading-snug">
                          {renderHighlightedText(bullet)}
                          {explanationLanguage !== 'en' && TIP_STRIP_PART2.bulletsVi?.[bIdx] && (
                            <p className="pl-4 text-[11px] text-blue-700 italic font-normal mt-0.5">
                              🇻🇳 {TIP_STRIP_PART2.bulletsVi[bIdx]}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Questions 8-13 Items */}
            <div className="space-y-4">
              {part2Questions.map((q) => {
                const answer = userAnswers[q.id] || '';
                const isChecked = checkedQuestions[q.id] || (isSubmitted && mode === 'test');
                const isCorrect = isChecked ? checkAnswerCorrectness(q, answer) : false;
                const isFlagged = flaggedQuestions.has(q.id);
                const showExplanation = openExplanations[q.id] || (isSubmitted && mode === 'test');
                const showTip = openTips[q.id];

                return (
                  <div
                    key={q.id}
                    id={`question-card-${q.id}`}
                    data-question-id={q.id}
                    className={`p-4 sm:p-5 rounded-xl border transition-all ${
                      isChecked
                        ? isCorrect
                          ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200'
                          : 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Card Header: Number, Prompt, and Flag */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <span className="shrink-0 w-6 h-6 rounded bg-[#0F172A] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                          {q.questionNumber}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900 leading-snug">
                            {renderHighlightedText(q.prompt, q.id)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          id={`flag-q-${q.id}`}
                          onClick={() => onToggleFlag(q.id)}
                          title={isFlagged ? 'Remove flag' : 'Flag question for review'}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isFlagged
                              ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Flag className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Question Specific Tip (Practice Mode) */}
                    {mode === 'practice' && q.tip && (
                      <div className="mt-2.5">
                        <button
                          id={`tip-btn-q-${q.id}`}
                          onClick={() => toggleTip(q.id)}
                          className="flex items-center space-x-1.5 text-xs text-blue-700 hover:text-blue-900 font-medium py-0.5 px-2 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          <span>{showTip ? 'Hide Question Tip' : 'Show Question Tip'}</span>
                        </button>
                        {showTip && (
                          <div className="mt-1.5 p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-950 leading-relaxed animate-in fade-in space-y-1">
                            <p>
                              <strong className="text-blue-900">Tip (English): </strong>
                              {renderHighlightedText(q.tip, q.id)}
                            </p>
                            {explanationLanguage !== 'en' && q.tipVi && (
                              <p className="text-[11px] text-blue-800 pt-1 border-t border-blue-100/80">
                                <strong className="text-blue-900">🇻🇳 Mẹo làm bài: </strong>
                                {q.tipVi}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Segmented Radio Options */}
                    <div className="mt-3.5 flex gap-2">
                      {(['TRUE', 'FALSE', 'NOT GIVEN'] as const).map((option) => {
                        const isSelected = answer.toUpperCase() === option;
                        return (
                          <button
                            key={option}
                            id={`option-q-${q.id}-${option.replace(/\s+/g, '')}`}
                            disabled={isSubmitted && mode === 'test'}
                            onClick={() => onAnswerChange(q.id, option)}
                            className={`flex-1 py-2 px-3 rounded border text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Practice Mode Controls & Feedback */}
                    {mode === 'practice' && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                        <button
                          id={`check-btn-q-${q.id}`}
                          onClick={() => handleCheckQuestion(q.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Check Answer</span>
                        </button>

                        <button
                          id={`explain-btn-q-${q.id}`}
                          onClick={() => toggleExplanation(q.id)}
                          className="flex items-center space-x-1 text-xs text-blue-700 hover:text-blue-900 font-semibold py-1 px-2 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <span>{showExplanation ? 'Hide Explanation' : 'Show Explanation'}</span>
                          {showExplanation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {/* Detailed Explanation & Paragraph Evidence Box */}
                    {showExplanation && (
                      <div className="mt-3 p-3.5 rounded-lg bg-blue-50/60 border border-blue-200 text-xs text-slate-800 space-y-2.5 animate-in fade-in">
                        <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/70">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900">Official Answer:</span>
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${
                                q.officialAnswer === 'TRUE'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : q.officialAnswer === 'FALSE'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {q.officialAnswer}
                            </span>
                          </div>

                          <button
                            id={`locate-passage-q-${q.id}`}
                            onClick={() => onJumpToParagraph(q.paragraphRef)}
                            className="flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-semibold px-2 py-0.5 rounded bg-white hover:bg-blue-100/50 border border-blue-200 transition-colors cursor-pointer"
                          >
                            <BookOpen className="w-3 h-3 text-blue-600" />
                            <span>Paragraph {q.paragraphRef}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div>
                          <span className="font-semibold text-slate-700">Passage Evidence: </span>
                          <span className="italic bg-yellow-100 px-1 py-0.5 rounded text-slate-900 font-serif">
                            "{renderHighlightedText(q.paragraphQuote, q.id)}"
                          </span>
                        </div>

                        {/* English Explanation */}
                        {(explanationLanguage === 'en' || explanationLanguage === 'bilingual') && (
                          <div className="text-slate-700 leading-relaxed font-sans pt-1">
                            <strong className="text-slate-900">Explanation (EN): </strong>
                            {renderHighlightedText(q.explanation, q.id)}
                          </div>
                        )}

                        {/* Vietnamese Explanation */}
                        {(explanationLanguage === 'vi' || explanationLanguage === 'bilingual') && q.explanationVi && (
                          <div className="p-2.5 rounded-md bg-white border border-blue-200/80 text-slate-800 leading-relaxed">
                            <span className="font-bold text-blue-900 flex items-center gap-1 mb-1">
                              <span>🇻🇳 Giải thích chi tiết:</span>
                            </span>
                            <p className="text-[12px] text-slate-700">
                              {renderHighlightedText(q.explanationVi, q.id)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Post-Questions Consolidation Callout */}
        {onGoToConsolidation && (
          <div className="p-5 rounded-2xl bg-linear-to-br from-[#0F172A] to-slate-900 text-white shadow-lg border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Language & Reading Consolidation</span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Ready to Master Key Vocabulary & Grammar?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consolidate your learning with academic word lists, IELTS sentence structures, paraphrase analyses, and 4 interactive tasks based on this passage.
            </p>
            <button
              id="questions-go-to-consolidation-btn"
              onClick={onGoToConsolidation}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <span>Explore Consolidation Tab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
