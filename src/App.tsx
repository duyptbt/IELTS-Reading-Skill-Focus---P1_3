import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mode, HighlightItem, UserAnswerState, TestResult } from './types';
import { QUESTIONS, checkAnswerCorrectness } from './data/ieltsData';
import { Header } from './components/Header';
import { PassageView } from './components/PassageView';
import { QuestionsView } from './components/QuestionsView';
import { ConsolidationView } from './components/ConsolidationView';
import { NotesDrawer } from './components/NotesDrawer';
import { TestResultsModal } from './components/TestResultsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { BookOpen, HelpCircle, Columns, LayoutList, Sparkles } from 'lucide-react';

const STORAGE_KEY_NOTES = 'ielts_reading_notes_p1';
const STORAGE_KEY_HIGHLIGHTS = 'ielts_reading_highlights_p1';
const INITIAL_TIMER_SECONDS = 20 * 60; // 20 minutes = 1200 seconds

export default function App() {
  // Application Mode
  const [mode, setMode] = useState<Mode>('practice');

  // Test Mode Timer
  const [timeRemaining, setTimeRemaining] = useState<number>(INITIAL_TIMER_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);

  // User answers & flags
  const [userAnswers, setUserAnswers] = useState<UserAnswerState>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    isDestructive: false,
    onConfirm: () => {},
  });

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Highlighter state
  const [highlighterColor, setHighlighterColor] = useState<
    'yellow' | 'green' | 'cyan' | 'pink' | 'eraser' | null
  >(null);
  const [highlights, setHighlights] = useState<HighlightItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Notes state
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_NOTES) || '';
    } catch {
      return '';
    }
  });

  // Display tools
  const [fontSize, setFontSize] = useState<number>(16);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [targetParagraph, setTargetParagraph] = useState<number | null>(null);

  // Mobile layout switch (Passage / Questions)
  const [mobileTab, setMobileTab] = useState<'split' | 'passage' | 'questions'>('split');
  // Consolidation layout mode ('full' for full masterclass width, 'split' for parallel text)
  const [consolidationLayout, setConsolidationLayout] = useState<'full' | 'split'>('full');

  // Sync highlights to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HIGHLIGHTS, JSON.stringify(highlights));
    } catch {
      // Ignore
    }
  }, [highlights]);

  // Sync notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, notes);
    } catch {
      // Ignore
    }
  }, [notes]);

  // Timer interval for Test Mode
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (mode === 'test' && isTimerRunning && !isSubmitted) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Auto submit when timer reaches 0
            clearInterval(interval!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, isTimerRunning, isSubmitted]);

  // Handle Mode Change
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode === 'test') {
      if (!isSubmitted) {
        setIsTimerRunning(true);
      }
    } else {
      setIsTimerRunning(false);
    }
  };

  // Toggle Timer Play/Pause
  const handleToggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  // Reset Timer
  const handleResetTimer = () => {
    setTimeRemaining(INITIAL_TIMER_SECONDS);
    setIsTimerRunning(true);
  };

  // Handle user answer change
  const handleAnswerChange = (questionId: number, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Toggle question flag
  const handleToggleFlag = (questionId: number) => {
    setFlaggedQuestions((prev) => {
      const updated = new Set(prev);
      if (updated.has(questionId)) {
        updated.delete(questionId);
      } else {
        updated.add(questionId);
      }
      return updated;
    });
  };

  // Highlighter handlers
  const handleAddHighlight = (hl: HighlightItem) => {
    setHighlights((prev) => [...prev, hl]);
  };

  const handleRemoveHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearAllHighlights = () => {
    if (highlights.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Highlights?',
      message: 'Are you sure you want to remove all highlighted passages from the text?',
      confirmLabel: 'Clear All',
      cancelLabel: 'Cancel',
      isDestructive: true,
      onConfirm: () => {
        setHighlights([]);
        closeConfirmModal();
      },
    });
  };

  // Jump to paragraph
  const handleJumpToParagraph = (pId: number) => {
    setTargetParagraph(pId);
    if (mode === 'consolidation' && consolidationLayout === 'full') {
      setConsolidationLayout('split');
    }
    if (mobileTab === 'questions') {
      setMobileTab('passage');
    }
  };

  // Add selected text snippet to notes
  const handleAddNoteSnippet = (snippet: string) => {
    setIsNotesOpen(true);
    setNotes((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
  };

  // Calculate results on submission
  const generateTestResult = useCallback(() => {
    let score = 0;
    const answersList = QUESTIONS.map((q) => {
      const uAns = userAnswers[q.id] || '';
      const isCorrect = checkAnswerCorrectness(q, uAns);
      if (isCorrect) score += 1;

      return {
        questionId: q.id,
        questionNumber: q.questionNumber,
        questionText: q.prompt,
        type: q.type,
        userAnswer: uAns,
        correctAnswer: q.officialAnswer,
        isCorrect,
        explanation: q.explanation,
        paragraphRef: q.paragraphRef,
        paragraphQuote: q.paragraphQuote,
      };
    });

    const timeSpent = INITIAL_TIMER_SECONDS - timeRemaining;

    const result: TestResult = {
      score,
      total: QUESTIONS.length,
      percentage: (score / QUESTIONS.length) * 100,
      estimatedBand: score >= 12 ? '8.5' : score >= 10 ? '7.5' : score >= 8 ? '6.5' : score >= 6 ? '5.5' : '4.5',
      timeSpentSeconds: Math.max(0, timeSpent),
      completedAt: new Date().toISOString(),
      answers: answersList,
    };

    return result;
  }, [userAnswers, timeRemaining]);

  const executeSubmitTest = () => {
    const result = generateTestResult();
    setTestResult(result);
    setIsSubmitted(true);
    setIsTimerRunning(false);
    setShowResultsModal(true);
    closeConfirmModal();
  };

  const handleSubmitTest = () => {
    const answered = Object.values(userAnswers).filter((ans): ans is string => typeof ans === 'string' && ans.trim().length > 0).length;
    const unansweredCount = QUESTIONS.length - answered;

    if (unansweredCount > 0) {
      setConfirmModal({
        isOpen: true,
        title: 'Finish & Submit Test?',
        message: `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to finish the session and view your band score?`,
        confirmLabel: 'Submit Now',
        cancelLabel: 'Keep Answering',
        isDestructive: false,
        onConfirm: executeSubmitTest,
      });
    } else {
      executeSubmitTest();
    }
  };

  const handleAutoSubmit = () => {
    const result = generateTestResult();
    setTestResult(result);
    setIsSubmitted(true);
    setIsTimerRunning(false);
    setShowResultsModal(true);
  };

  const executeRetake = () => {
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setTimeRemaining(INITIAL_TIMER_SECONDS);
    setIsSubmitted(false);
    setIsTimerRunning(true);
    setTestResult(null);
    setShowResultsModal(false);
    closeConfirmModal();
  };

  const handleRetake = () => {
    const hasAnyAnswers = Object.values(userAnswers).some((ans) => typeof ans === 'string' && ans.trim().length > 0);
    if (hasAnyAnswers || isSubmitted) {
      setConfirmModal({
        isOpen: true,
        title: 'Retake IELTS Reading Test?',
        message: 'This will reset all your answers, question flags, and restart the 20-minute timer from the beginning.',
        confirmLabel: 'Retake Test',
        cancelLabel: 'Cancel',
        isDestructive: true,
        onConfirm: executeRetake,
      });
    } else {
      executeRetake();
    }
  };

  const answeredCount = Object.values(userAnswers).filter((ans): ans is string => typeof ans === 'string' && ans.trim().length > 0).length;
  const isConsolidationUnlocked = isSubmitted || answeredCount > 0;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        isConsolidationUnlocked={isConsolidationUnlocked}
        timeRemaining={timeRemaining}
        isTimerRunning={isTimerRunning}
        onToggleTimer={handleToggleTimer}
        onResetTimer={handleResetTimer}
        highlighterColor={highlighterColor}
        onSelectHighlighter={setHighlighterColor}
        onClearAllHighlights={handleClearAllHighlights}
        highlightCount={highlights.length}
        isNotesOpen={isNotesOpen}
        onToggleNotes={() => setIsNotesOpen(!isNotesOpen)}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSubmitTest={handleSubmitTest}
        answeredCount={answeredCount}
        totalQuestions={QUESTIONS.length}
        isSubmitted={isSubmitted}
        onRetake={handleRetake}
        onShowResults={() => setShowResultsModal(true)}
      />

      {/* Mobile / Tablet Tab Switcher */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-center space-x-2">
        <button
          onClick={() => setMobileTab('passage')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
            mobileTab === 'passage'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Passage</span>
        </button>

        {mode === 'consolidation' ? (
          <button
            onClick={() => setMobileTab('questions')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
              mobileTab === 'questions'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Consolidation</span>
          </button>
        ) : (
          <button
            onClick={() => setMobileTab('questions')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
              mobileTab === 'questions'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Questions ({answeredCount}/13)</span>
          </button>
        )}

        <button
          onClick={() => setMobileTab('split')}
          className={`py-1.5 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1 ${
            mobileTab === 'split'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title="Side by Side view"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Split</span>
        </button>
      </div>

      {/* Main Dual-Pane / Masterclass Workspace */}
      <main className="flex-1 w-full max-w-none px-2 sm:px-3 lg:px-4 py-2 sm:py-3 flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch">
        {/* Left: Passage View (Hidden when consolidation is in full width mode) */}
        {!(mode === 'consolidation' && consolidationLayout === 'full') && (
          <div
            className={`w-full ${
              mode === 'consolidation' ? 'lg:w-1/2' : 'lg:w-1/2 flex-1 min-w-0'
            } flex flex-col ${
              mobileTab === 'questions' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <PassageView
              fontSize={fontSize}
              highlighterColor={highlighterColor}
              highlights={highlights}
              onAddHighlight={handleAddHighlight}
              onRemoveHighlight={handleRemoveHighlight}
              searchQuery={searchQuery}
              targetParagraph={targetParagraph}
              onParagraphTargeted={() => setTargetParagraph(null)}
              onAddNoteSnippet={handleAddNoteSnippet}
            />
          </div>
        )}

        {/* Right: Questions or Consolidation View */}
        <div
          className={`w-full ${
            mode === 'consolidation' && consolidationLayout === 'full'
              ? 'lg:w-full'
              : mode === 'consolidation'
              ? 'lg:w-1/2'
              : 'lg:w-1/2 flex-1 min-w-0'
          } flex flex-col ${
            mobileTab === 'passage' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {mode === 'consolidation' ? (
            <ConsolidationView
              onJumpToParagraph={handleJumpToParagraph}
              isUnlockedAfterTest={isSubmitted}
              onSwitchToPractice={() => setMode('practice')}
              isFullWidth={consolidationLayout === 'full'}
              onToggleLayout={() => setConsolidationLayout((prev) => (prev === 'full' ? 'split' : 'full'))}
            />
          ) : (
            <QuestionsView
              mode={mode}
              userAnswers={userAnswers}
              onAnswerChange={handleAnswerChange}
              onJumpToParagraph={handleJumpToParagraph}
              flaggedQuestions={flaggedQuestions}
              onToggleFlag={handleToggleFlag}
              isSubmitted={isSubmitted}
              onGoToConsolidation={() => setMode('consolidation')}
            />
          )}
        </div>
      </main>

      {/* Collapsible Notes Drawer */}
      <NotesDrawer
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        notes={notes}
        onNotesChange={setNotes}
      />

      {/* Test Results Modal */}
      <TestResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        result={testResult}
        onRetake={handleRetake}
        onSwitchToPractice={() => {
          setShowResultsModal(false);
          setMode('practice');
        }}
        onGoToConsolidation={() => {
          setShowResultsModal(false);
          setMode('consolidation');
        }}
        onReviewQuestion={(qId) => {
          const q = QUESTIONS.find((item) => item.id === qId);
          if (q) {
            handleJumpToParagraph(q.paragraphRef);
          }
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={confirmModal.cancelLabel}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
}
