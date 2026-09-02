import React, { useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Highlighter, 
  FileText, 
  RotateCcw, 
  CheckCircle2, 
  Search, 
  Type, 
  Trash2, 
  Play, 
  Pause,
  Lightbulb,
  Award,
  Sparkles
} from 'lucide-react';
import { Mode } from '../types';

interface HeaderProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  isConsolidationUnlocked?: boolean;
  // Timer props
  timeRemaining: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  // Highlighter props
  highlighterColor: 'yellow' | 'green' | 'cyan' | 'pink' | 'eraser' | null;
  onSelectHighlighter: (color: 'yellow' | 'green' | 'cyan' | 'pink' | 'eraser' | null) => void;
  onClearAllHighlights: () => void;
  highlightCount: number;
  // Notes props
  isNotesOpen: boolean;
  onToggleNotes: () => void;
  // Font size
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  // Search
  searchQuery: string;
  onSearchChange: (q: string) => void;
  // Submit
  onSubmitTest: () => void;
  answeredCount: number;
  totalQuestions: number;
  isSubmitted: boolean;
  onRetake: () => void;
  onShowResults?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  isConsolidationUnlocked = false,
  timeRemaining,
  isTimerRunning,
  onToggleTimer,
  onResetTimer,
  highlighterColor,
  onSelectHighlighter,
  onClearAllHighlights,
  highlightCount,
  isNotesOpen,
  onToggleNotes,
  fontSize,
  onFontSizeChange,
  searchQuery,
  onSearchChange,
  onSubmitTest,
  answeredCount,
  totalQuestions,
  isSubmitted,
  onRetake,
  onShowResults,
}) => {
  const [showSearch, setShowSearch] = useState(false);

  // Format timer seconds into mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeLow = timeRemaining <= 300 && timeRemaining > 0; // Under 5 minutes

  return (
    <header className="sticky top-0 z-30 shadow-md">
      {/* Top Main Navigation Bar (#0F172A) */}
      <nav className="h-16 bg-[#0F172A] text-white flex items-center justify-between px-4 sm:px-6">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white flex items-center justify-center shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-white">
                IELTS Reading <span className="text-blue-400">Focus</span>
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Academic & GT
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs md:max-w-md">
              Reducing electricity consumption on the Isle of Eigg
            </p>
          </div>
        </div>

        {/* Center: Mode Selector Pills */}
        <div className="flex bg-slate-800 rounded-full p-1 border border-slate-700 overflow-x-auto scrollbar-none">
          <button
            id="mode-practice-btn"
            onClick={() => onModeChange('practice')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              mode === 'practice'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${mode === 'practice' ? 'text-white' : 'text-slate-400'}`} />
            <span>Practice Mode</span>
          </button>
          <button
            id="mode-test-btn"
            onClick={() => onModeChange('test')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              mode === 'test'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${mode === 'test' ? 'text-white' : 'text-slate-400'}`} />
            <span>Test Mode</span>
          </button>
          <button
            id="mode-consolidation-btn"
            onClick={() => onModeChange('consolidation')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 relative ${
              mode === 'consolidation'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : isConsolidationUnlocked
                ? 'text-amber-300 hover:text-amber-200 hover:bg-slate-700/60 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${mode === 'consolidation' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>Consolidation</span>
            {isConsolidationUnlocked && mode !== 'consolidation' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Right: Test Timer & Primary Action Button */}
        <div className="flex items-center gap-2 sm:gap-4">
          {mode === 'test' ? (
            <div
              id="test-timer-badge"
              className={`flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded border border-slate-700 font-mono text-xs sm:text-sm font-semibold transition-all ${
                timeRemaining === 0
                  ? 'border-rose-500 text-rose-400'
                  : isTimeLow
                  ? 'border-amber-500 text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  timeRemaining === 0
                    ? 'bg-rose-400 animate-pulse'
                    : isTimeLow
                    ? 'bg-amber-400 animate-pulse'
                    : isTimerRunning
                    ? 'bg-emerald-400 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span>Timer: {formatTime(timeRemaining)}</span>
              {!isSubmitted && (
                <button
                  id="timer-play-pause-btn"
                  onClick={onToggleTimer}
                  title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
                  className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 ml-1"
                >
                  {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
              )}
            </div>
          ) : mode === 'consolidation' ? (
            <div className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Language & Skills</span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded border border-slate-700 text-slate-300 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="font-mono text-emerald-400">Timer: OFF</span>
            </div>
          )}

          {mode === 'test' && !isSubmitted && (
            <button
              id="submit-test-header-btn"
              onClick={onSubmitTest}
              className="bg-white text-slate-900 px-4 sm:px-5 py-1.5 sm:py-2 rounded-md font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Finish Session</span>
            </button>
          )}

          {isSubmitted && mode === 'test' && (
            <div className="flex items-center gap-2">
              {onShowResults && (
                <button
                  id="view-results-header-btn"
                  onClick={onShowResults}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-bold text-xs sm:text-sm transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>View Score</span>
                </button>
              )}
              <button
                id="retake-test-btn"
                onClick={onRetake}
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Retake</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Sub-toolbar: Highlighters, Tools, Notes & Progress */}
      <div className="h-12 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Left: Highlighter and Notes tools */}
        <div className="flex items-center gap-3">
          {/* Highlighter Color Group */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span className="text-slate-500 text-xs font-bold flex items-center gap-1.5 mr-1">
              <span className="w-3 h-3 bg-yellow-300 rounded-xs ring-1 ring-yellow-400 inline-block"></span>
              <span className="hidden sm:inline">Highlighter</span>
            </span>

            <button
              id="hl-yellow"
              onClick={() => onSelectHighlighter(highlighterColor === 'yellow' ? null : 'yellow')}
              title="Yellow highlight"
              className={`w-4 h-4 rounded-xs transition-all ${
                highlighterColor === 'yellow' ? 'ring-2 ring-blue-600 scale-110' : 'hover:opacity-80'
              }`}
              style={{ backgroundColor: '#fef08a' }}
            />

            <button
              id="hl-green"
              onClick={() => onSelectHighlighter(highlighterColor === 'green' ? null : 'green')}
              title="Green highlight"
              className={`w-4 h-4 rounded-xs transition-all ${
                highlighterColor === 'green' ? 'ring-2 ring-blue-600 scale-110' : 'hover:opacity-80'
              }`}
              style={{ backgroundColor: '#bbf7d0' }}
            />

            <button
              id="hl-cyan"
              onClick={() => onSelectHighlighter(highlighterColor === 'cyan' ? null : 'cyan')}
              title="Cyan highlight"
              className={`w-4 h-4 rounded-xs transition-all ${
                highlighterColor === 'cyan' ? 'ring-2 ring-blue-600 scale-110' : 'hover:opacity-80'
              }`}
              style={{ backgroundColor: '#bae6fd' }}
            />

            <button
              id="hl-pink"
              onClick={() => onSelectHighlighter(highlighterColor === 'pink' ? null : 'pink')}
              title="Pink highlight"
              className={`w-4 h-4 rounded-xs transition-all ${
                highlighterColor === 'pink' ? 'ring-2 ring-blue-600 scale-110' : 'hover:opacity-80'
              }`}
              style={{ backgroundColor: '#fbcfe8' }}
            />

            <button
              id="hl-eraser"
              onClick={() => onSelectHighlighter(highlighterColor === 'eraser' ? null : 'eraser')}
              title="Eraser tool"
              className={`px-1.5 py-0.5 text-[11px] rounded font-semibold transition-all ${
                highlighterColor === 'eraser'
                  ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Eraser
            </button>
          </div>

          {highlightCount > 0 && (
            <button
              id="clear-highlights-btn"
              onClick={onClearAllHighlights}
              title="Clear all highlights"
              className="flex items-center gap-1 text-slate-500 hover:text-rose-600 px-2 py-1 rounded bg-slate-50 border border-slate-200 transition-colors text-xs font-semibold"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear ({highlightCount})</span>
            </button>
          )}

          {/* Notes Toggle Button */}
          <button
            id="toggle-notes-btn"
            onClick={onToggleNotes}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded border transition-colors ${
              isNotesOpen
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>
        </div>

        {/* Center/Right: Progress & Display tools */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Progress Indicator */}
          <div className="hidden sm:flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest">
              Progress
            </span>
            <div className="flex gap-1 items-center">
              {Array.from({ length: 4 }).map((_, idx) => {
                const filledCount = Math.floor((answeredCount / totalQuestions) * 4);
                const isFilled = idx < filledCount;
                return (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isFilled ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-xs font-semibold text-slate-600 font-mono">
              {answeredCount}/{totalQuestions}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          {/* Search tool */}
          <div className="relative flex items-center">
            {showSearch ? (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-300 rounded px-2 py-0.5 shadow-xs">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  id="passage-search-input"
                  type="text"
                  placeholder="Find in passage..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-28 sm:w-36 text-xs outline-none bg-transparent text-slate-800"
                  autoFocus
                />
                <button
                  onClick={() => {
                    onSearchChange('');
                    setShowSearch(false);
                  }}
                  className="text-slate-400 hover:text-slate-700 font-bold px-1"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                id="open-search-btn"
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 bg-slate-50 px-3 py-1 rounded border border-slate-200 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            )}
          </div>

          {/* Font Size controls */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs">
            <span className="text-slate-400 px-0.5">
              <Type className="w-3 h-3" />
            </span>
            <button
              id="font-decrease-btn"
              onClick={() => onFontSizeChange(Math.max(14, fontSize - 1))}
              title="Decrease font size"
              className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded"
            >
              -
            </button>
            <span className="text-[11px] font-mono text-slate-700 font-bold w-6 text-center">
              {fontSize}px
            </span>
            <button
              id="font-increase-btn"
              onClick={() => onFontSizeChange(Math.min(22, fontSize + 1))}
              title="Increase font size"
              className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
