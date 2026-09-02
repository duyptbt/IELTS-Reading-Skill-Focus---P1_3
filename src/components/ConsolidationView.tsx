import React, { useState } from 'react';
import {
  CONSOLIDATION_VOCABULARY,
  CONSOLIDATION_GRAMMAR,
  CONSOLIDATION_PARAPHRASES,
  MATCHING_TASKS,
  GAP_FILL_TASKS,
  REFERENCE_TASKS,
  TRANSFORMATION_TASKS,
} from '../data/consolidationData';
import {
  BookOpen,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  ExternalLink,
  Layers,
  FileCheck2,
  Target,
  BrainCircuit,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Columns,
  CheckSquare,
  ListFilter,
  Languages,
} from 'lucide-react';

interface ConsolidationViewProps {
  onJumpToParagraph: (paragraphId: number) => void;
  isUnlockedAfterTest?: boolean;
  onSwitchToPractice?: () => void;
  isFullWidth?: boolean;
  onToggleLayout?: () => void;
}

type ConsolidationTab = 'vocabulary' | 'grammar' | 'paraphrases' | 'activities';
type ActivitySubTab = 'all' | 'matching' | 'gapfill' | 'reference' | 'transformation';

export const ConsolidationView: React.FC<ConsolidationViewProps> = ({
  onJumpToParagraph,
  isUnlockedAfterTest = false,
  onSwitchToPractice,
  isFullWidth = true,
  onToggleLayout,
}) => {
  const [activeTab, setActiveTab] = useState<ConsolidationTab>('vocabulary');
  const [activeActivityTab, setActiveActivityTab] = useState<ActivitySubTab>('all');
  const [languageMode, setLanguageMode] = useState<'bilingual' | 'vi' | 'en'>('bilingual');

  // Search & Filter for Vocabulary
  const [vocabSearch, setVocabSearch] = useState('');
  const [selectedBand, setSelectedBand] = useState<string>('all');

  // Activity 1: Matching Game State
  const [matchingSelectedTerm, setMatchingSelectedTerm] = useState<string | null>(null);
  const [matchingPairs, setMatchingPairs] = useState<{ [termId: string]: string }>({});
  const [matchingFeedback, setMatchingFeedback] = useState<{ [termId: string]: boolean }>({});
  const [matchingSubmitted, setMatchingSubmitted] = useState(false);

  // Activity 2: Gap Fill State
  const [gapFillAnswers, setGapFillAnswers] = useState<{ [taskId: string]: string }>({});
  const [gapFillSubmitted, setGapFillSubmitted] = useState<{ [taskId: string]: boolean }>({});
  const [gapFillHints, setGapFillHints] = useState<{ [taskId: string]: boolean }>({});

  // Activity 3: Reference Hunt State
  const [refAnswers, setRefAnswers] = useState<{ [taskId: string]: number }>({});
  const [refSubmitted, setRefSubmitted] = useState<{ [taskId: string]: boolean }>({});

  // Activity 4: Transformation State
  const [transAnswers, setTransAnswers] = useState<{ [taskId: string]: number }>({});
  const [transSubmitted, setTransSubmitted] = useState<{ [taskId: string]: boolean }>({});

  // Expanded Grammar: default to expanding all structures so all items are fully visible
  const [expandedGrammar, setExpandedGrammar] = useState<{ [id: string]: boolean }>(() => {
    const initial: { [id: string]: boolean } = {};
    CONSOLIDATION_GRAMMAR.forEach((g) => {
      initial[g.id] = true;
    });
    return initial;
  });

  const isAllGrammarOpen = CONSOLIDATION_GRAMMAR.every((g) => expandedGrammar[g.id]);

  const toggleAllGrammar = () => {
    const nextState: { [id: string]: boolean } = {};
    CONSOLIDATION_GRAMMAR.forEach((g) => {
      nextState[g.id] = !isAllGrammarOpen;
    });
    setExpandedGrammar(nextState);
  };

  // Audio pronunciation helper using Web Speech API if supported
  const playPronunciation = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-GB';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Activity 1 Handlers (Matching)
  const handleTermClick = (termId: string) => {
    if (matchingSubmitted) return;
    setMatchingSelectedTerm(termId);
  };

  const handleDefClick = (defId: string) => {
    if (matchingSubmitted || !matchingSelectedTerm) return;
    setMatchingPairs((prev) => ({
      ...prev,
      [matchingSelectedTerm]: defId,
    }));
    setMatchingSelectedTerm(null);
  };

  const handleCheckMatching = () => {
    const feedback: { [termId: string]: boolean } = {};
    MATCHING_TASKS.forEach((task) => {
      feedback[task.id] = matchingPairs[task.id] === task.id;
    });
    setMatchingFeedback(feedback);
    setMatchingSubmitted(true);
  };

  const handleResetMatching = () => {
    setMatchingPairs({});
    setMatchingFeedback({});
    setMatchingSubmitted(false);
    setMatchingSelectedTerm(null);
  };

  // Filtered Vocabulary
  const filteredVocab = CONSOLIDATION_VOCABULARY.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(vocabSearch.toLowerCase()) ||
      item.definition.toLowerCase().includes(vocabSearch.toLowerCase()) ||
      (item.definitionVi && item.definitionVi.toLowerCase().includes(vocabSearch.toLowerCase())) ||
      item.synonyms.some((s) => s.toLowerCase().includes(vocabSearch.toLowerCase()));
    const matchesBand = selectedBand === 'all' || item.ieltsBand.includes(selectedBand);
    return matchesSearch && matchesBand;
  });

  // Calculate stats for activities
  const matchingCorrectCount = Object.values(matchingFeedback).filter(Boolean).length;
  const gapFillCorrectCount = Object.keys(gapFillSubmitted).filter(
    (id) => gapFillAnswers[id] === GAP_FILL_TASKS.find((t) => t.id === id)?.targetWord
  ).length;
  const refCorrectCount = Object.keys(refSubmitted).filter(
    (id) => refAnswers[id] === REFERENCE_TASKS.find((t) => t.id === id)?.correctIndex
  ).length;
  const transCorrectCount = Object.keys(transSubmitted).filter(
    (id) => transAnswers[id] === TRANSFORMATION_TASKS.find((t) => t.id === id)?.correctIndex
  ).length;

  const totalTasks =
    MATCHING_TASKS.length +
    GAP_FILL_TASKS.length +
    REFERENCE_TASKS.length +
    TRANSFORMATION_TASKS.length;

  const totalCorrectTasks =
    matchingCorrectCount + gapFillCorrectCount + refCorrectCount + transCorrectCount;

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col w-full"
      style={{ minHeight: '620px', maxHeight: 'calc(100vh - 170px)' }}
    >
      {/* Top Banner Header */}
      <div className="bg-[#0F172A] text-white p-4 sm:p-5 border-b border-slate-800 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3 fill-current" />
                <span>Post-Reading Language & Skill Consolidation</span>
              </span>
              {isUnlockedAfterTest && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Unlocked from Practice
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Deep Linguistic Analysis & Skills Extension</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Consolidate high-frequency academic vocabulary, decode complex IELTS sentence structures, analyze exam paraphrase patterns, and complete targeted skill drills.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Mode Toggle */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs shadow-xs">
              <span className="px-1.5 text-slate-400 flex items-center gap-1 font-medium">
                <Languages className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline text-[11px]">Bilingual:</span>
              </span>
              <button
                id="consolidation-lang-bilingual"
                onClick={() => setLanguageMode('bilingual')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  languageMode === 'bilingual'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Song ngữ (English & Tiếng Việt)"
              >
                Song ngữ
              </button>
              <button
                id="consolidation-lang-vi"
                onClick={() => setLanguageMode('vi')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  languageMode === 'vi'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Tiếng Việt (Vietnamese focus)"
              >
                Tiếng Việt
              </button>
              <button
                id="consolidation-lang-en"
                onClick={() => setLanguageMode('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  languageMode === 'en'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="English only"
              >
                English
              </button>
            </div>

            {/* Layout Toggle Button */}
            {onToggleLayout && (
              <button
                id="consolidation-layout-toggle-btn"
                onClick={onToggleLayout}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isFullWidth ? 'Switch to Split-Screen (Passage + Consolidation)' : 'Switch to Full-Width View'}
              >
                {isFullWidth ? (
                  <>
                    <Columns className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Split View</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Full Width</span>
                  </>
                )}
              </button>
            )}

            {onSwitchToPractice && (
              <button
                id="consolidation-back-to-practice-btn"
                onClick={onSwitchToPractice}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Return to Questions</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Main Module Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto pb-1 scrollbar-none">
          <button
            id="tab-consolidation-vocab"
            onClick={() => setActiveTab('vocabulary')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'vocabulary'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Key Vocabulary ({CONSOLIDATION_VOCABULARY.length})</span>
          </button>

          <button
            id="tab-consolidation-grammar"
            onClick={() => setActiveTab('grammar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'grammar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Academic Structures ({CONSOLIDATION_GRAMMAR.length})</span>
          </button>

          <button
            id="tab-consolidation-paraphrase"
            onClick={() => setActiveTab('paraphrases')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'paraphrases'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>IELTS Paraphrase Matrix ({CONSOLIDATION_PARAPHRASES.length})</span>
          </button>

          <button
            id="tab-consolidation-activities"
            onClick={() => setActiveTab('activities')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 relative cursor-pointer ${
              activeTab === 'activities'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                : 'text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Practice Tasks ({totalTasks})</span>
            {totalCorrectTasks > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-white font-mono">
                {totalCorrectTasks}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content with internal scrolling */}
      <div className="flex-1 overflow-y-auto bg-slate-100/80 p-4 sm:p-6 w-full">
        <div className={`mx-auto w-full ${isFullWidth ? 'max-w-6xl' : 'max-w-4xl'}`}>
          {/* TAB 1: VOCABULARY */}
          {activeTab === 'vocabulary' && (
            <div className="space-y-4">
              {/* Search & Band Filter Bar */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <input
                    id="vocab-search-input"
                    type="text"
                    placeholder="Search vocabulary, definition, or synonyms..."
                    value={vocabSearch}
                    onChange={(e) => setVocabSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                  />
                  {vocabSearch && (
                    <button
                      onClick={() => setVocabSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
                  <span className="text-slate-500 font-semibold mr-1 shrink-0">IELTS Level:</span>
                  {['all', '6.5', '7.0', '7.5', '8.0'].map((band) => (
                    <button
                      key={band}
                      onClick={() => setSelectedBand(band)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                        selectedBand === band
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {band === 'all' ? 'All Bands' : `Band ${band}+`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter feedback & count */}
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
                <span>
                  Showing <strong className="text-slate-800">{filteredVocab.length}</strong> of{' '}
                  <strong className="text-slate-800">{CONSOLIDATION_VOCABULARY.length}</strong> high-frequency academic items
                </span>
                {(vocabSearch || selectedBand !== 'all') && (
                  <button
                    onClick={() => {
                      setVocabSearch('');
                      setSelectedBand('all');
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {/* Vocabulary Grid */}
              <div className={`grid grid-cols-1 ${isFullWidth ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {filteredVocab.map((item) => (
                  <div
                    key={item.id}
                    id={`vocab-card-${item.id}`}
                    className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between space-y-3.5"
                  >
                    <div>
                      {/* Word, Phonetic & Audio */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">{item.word}</h3>
                            <button
                              onClick={() => playPronunciation(item.word)}
                              title="Listen to British pronunciation"
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-xs text-slate-500">{item.phonetic}</span>
                            <span className="text-xs text-slate-400 font-medium italic">· {item.partOfSpeech}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          {item.ieltsBand}
                        </span>
                      </div>

                      {/* English Definition */}
                      {(languageMode === 'en' || languageMode === 'bilingual') && (
                        <p className="text-xs sm:text-sm text-slate-700 mt-2.5 leading-relaxed font-medium">
                          {item.definition}
                        </p>
                      )}

                      {/* Vietnamese Definition */}
                      {(languageMode === 'vi' || languageMode === 'bilingual') && item.definitionVi && (
                        <div className="mt-1.5 p-2 rounded-md bg-blue-50/60 border border-blue-100 text-xs text-blue-950 font-sans leading-relaxed">
                          <span className="font-bold text-blue-900">🇻🇳 Nghĩa tiếng Việt: </span>
                          <span>{item.definitionVi}</span>
                        </div>
                      )}

                      {/* Passage Context Quote - Always kept in English as instructed */}
                      <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
                          <span>Original In-Text Context:</span>
                          <button
                            onClick={() => onJumpToParagraph(item.paragraphRef)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 hover:underline font-bold cursor-pointer"
                          >
                            <span>[Paragraph {item.paragraphRef}]</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <p className="text-slate-800 italic font-serif leading-relaxed">
                          "{item.passageContext}"
                        </p>
                      </div>
                    </div>

                    {/* Collocations & Synonyms */}
                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-600 block text-[11px] mb-1">Collocations & Phrases:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.collocations.map((col, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium"
                            >
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-slate-600 block text-[11px] mb-1">Academic Synonyms:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.synonyms.map((syn, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium"
                            >
                              {syn}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredVocab.length === 0 && (
                <div className="p-8 bg-white rounded-xl border border-slate-200 text-center space-y-2">
                  <p className="text-slate-600 font-medium">No vocabulary items match your search filter.</p>
                  <button
                    onClick={() => {
                      setVocabSearch('');
                      setSelectedBand('all');
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GRAMMAR STRUCTURES */}
          {activeTab === 'grammar' && (
            <div className="space-y-4">
              {/* Header control: Expand/Collapse All */}
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-xs">
                <div className="text-slate-600 font-medium">
                  Showing <strong>{CONSOLIDATION_GRAMMAR.length}</strong> Complex Grammatical Structures from the passage
                </div>
                <button
                  onClick={toggleAllGrammar}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isAllGrammarOpen ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Expand All</span>
                    </>
                  )}
                </button>
              </div>

              {CONSOLIDATION_GRAMMAR.map((item) => {
                const isOpen = expandedGrammar[item.id] ?? true;
                return (
                  <div
                    key={item.id}
                    id={`grammar-card-${item.id}`}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    {/* Card Header */}
                    <button
                      onClick={() =>
                        setExpandedGrammar((prev) => ({
                          ...prev,
                          [item.id]: !isOpen,
                        }))
                      }
                      className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {item.category}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onJumpToParagraph(item.paragraphRef);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                          >
                            <span>Paragraph {item.paragraphRef}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">{item.name}</h3>
                      </div>

                      <div className="p-1 rounded-md text-slate-400 hover:text-slate-600">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>

                    {/* Card Body */}
                    {isOpen && (
                      <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/30 space-y-4 text-xs sm:text-sm">
                        {/* Formula & Rule */}
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Structure Formula
                          </div>
                          <div className="font-mono text-xs text-blue-700 font-semibold bg-blue-50/60 p-2 rounded border border-blue-100">
                            {item.formula}
                          </div>
                        </div>

                        {/* Passage Example - original English extract */}
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Authentic Passage Extract (Para {item.paragraphRef})
                          </div>
                          <p className="font-serif italic text-slate-800 text-xs sm:text-sm leading-relaxed">
                            "{item.passageExample}"
                          </p>
                        </div>

                        {/* Linguistic Analysis (English & Vietnamese) */}
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                            Linguistic Analysis
                          </div>
                          {(languageMode === 'en' || languageMode === 'bilingual') && (
                            <p className="text-slate-700 leading-relaxed">{item.explanation}</p>
                          )}
                          {(languageMode === 'vi' || languageMode === 'bilingual') && item.explanationVi && (
                            <div className="p-2.5 rounded-md bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 leading-relaxed">
                              <span className="font-bold text-indigo-900">🇻🇳 Phân tích ngữ pháp: </span>
                              <span>{item.explanationVi}</span>
                            </div>
                          )}
                        </div>

                        {/* IELTS Test Application & Writing Tip */}
                        <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            <span>IELTS Reading & Writing Application</span>
                          </div>
                          
                          {(languageMode === 'en' || languageMode === 'bilingual') && (
                            <p className="text-xs text-amber-900/90 leading-relaxed">{item.ieltsApplication}</p>
                          )}

                          {(languageMode === 'vi' || languageMode === 'bilingual') && item.ieltsApplicationVi && (
                            <p className="text-xs text-amber-950/90 pt-1 border-t border-amber-200/60">
                              <span className="font-bold">🇻🇳 Ứng dụng thi: </span>
                              <span>{item.ieltsApplicationVi}</span>
                            </p>
                          )}
                          
                          <div className="mt-2 pt-2 border-t border-amber-200/60 text-xs text-amber-950 font-medium">
                            <span className="font-bold">Model Task 2 Sentence: </span>
                            <span className="italic font-serif">"{item.practiceExample}"</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: PARAPHRASES */}
          {activeTab === 'paraphrases' && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs mb-4 text-xs sm:text-sm text-slate-700">
                <div className="flex items-center gap-2 text-blue-700 font-bold mb-1">
                  <BookmarkCheck className="w-4 h-4" />
                  <span>The Core IELTS Reading Skill: Paraphrase Decoding</span>
                </div>
                <p className="leading-relaxed">
                  IELTS Reading questions never copy the exact phrasing from the passage for correct answers. Instead, they test your ability to connect transformed sentences through synonym replacement, nominalization, and syntax shifts.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {CONSOLIDATION_PARAPHRASES.map((pair) => (
                  <div
                    key={pair.id}
                    id={`paraphrase-card-${pair.id}`}
                    className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {pair.technique}
                        </span>
                        {languageMode !== 'en' && pair.techniqueVi && (
                          <span className="text-xs text-slate-500 italic">
                            ({pair.techniqueVi})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onJumpToParagraph(pair.paragraphRef)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                      >
                        <span>Paragraph {pair.paragraphRef}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                      {/* Original in text */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Passage Phrasing
                        </div>
                        <p className="font-serif italic text-slate-800 leading-relaxed">
                          "{pair.originalText}"
                        </p>
                      </div>

                      {/* Paraphrased in Question/Option */}
                      <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200">
                        <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide mb-1">
                          IELTS Paraphrased Target
                        </div>
                        <p className="font-sans font-medium text-emerald-950 leading-relaxed">
                          "{pair.paraphrasedText}"
                        </p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-200/60 space-y-1">
                      {(languageMode === 'en' || languageMode === 'bilingual') && (
                        <div>
                          <span className="font-bold text-slate-800">Exam Strategy Note: </span>
                          <span>{pair.explanation}</span>
                        </div>
                      )}
                      {(languageMode === 'vi' || languageMode === 'bilingual') && pair.explanationVi && (
                        <div className="pt-1 text-slate-600 border-t border-slate-200/50">
                          <span className="font-bold text-blue-900">🇻🇳 Ghi chú chiến lược: </span>
                          <span>{pair.explanationVi}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: INTERACTIVE ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-5">
              {/* Activity Switcher Sub-tabs */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  id="activity-tab-all"
                  onClick={() => setActiveActivityTab('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activeActivityTab === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>All Tasks ({totalTasks})</span>
                </button>

                <button
                  id="activity-tab-matching"
                  onClick={() => setActiveActivityTab('matching')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activeActivityTab === 'matching'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>1. Collocation Matcher</span>
                  {matchingSubmitted && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono">
                      {matchingCorrectCount}/{MATCHING_TASKS.length}
                    </span>
                  )}
                </button>

                <button
                  id="activity-tab-gapfill"
                  onClick={() => setActiveActivityTab('gapfill')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activeActivityTab === 'gapfill'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>2. Lexical Gap-Fill</span>
                  {Object.keys(gapFillSubmitted).length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono">
                      {gapFillCorrectCount}/{GAP_FILL_TASKS.length}
                    </span>
                  )}
                </button>

                <button
                  id="activity-tab-reference"
                  onClick={() => setActiveActivityTab('reference')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activeActivityTab === 'reference'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>3. Reference Hunt</span>
                  {Object.keys(refSubmitted).length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono">
                      {refCorrectCount}/{REFERENCE_TASKS.length}
                    </span>
                  )}
                </button>

                <button
                  id="activity-tab-trans"
                  onClick={() => setActiveActivityTab('transformation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    activeActivityTab === 'transformation'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>4. Sentence Transformation</span>
                  {Object.keys(transSubmitted).length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono">
                      {transCorrectCount}/{TRANSFORMATION_TASKS.length}
                    </span>
                  )}
                </button>
              </div>

              {/* ACTIVITY 1: MATCHING */}
              {(activeActivityTab === 'matching' || activeActivityTab === 'all') && (
                <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Activity 1: Vocabulary & Meaning Matching
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        Select an academic term on the left, then click its corresponding definition on the right.
                      </p>
                      {languageMode !== 'en' && (
                        <p className="text-xs text-blue-700 italic mt-0.5">
                          Ghép từ vựng học thuật với định nghĩa phù hợp theo ngữ cảnh bài đọc.
                        </p>
                      )}
                    </div>
                    {activeActivityTab === 'all' && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                        Task 1 of 4
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Column: Terms */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Academic Terms ({MATCHING_TASKS.length})
                      </span>
                      {MATCHING_TASKS.map((task) => {
                        const isSelected = matchingSelectedTerm === task.id;
                        const hasPaired = matchingPairs[task.id] !== undefined;
                        const isCorrect = matchingFeedback[task.id];

                        return (
                          <button
                            key={task.id}
                            onClick={() => handleTermClick(task.id)}
                            disabled={matchingSubmitted}
                            className={`w-full p-3 rounded-lg border text-left text-xs sm:text-sm font-bold transition-all flex items-center justify-between cursor-pointer ${
                              matchingSubmitted
                                ? isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-rose-50 border-rose-300 text-rose-900'
                                : isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : hasPaired
                                ? 'bg-slate-100 border-slate-300 text-slate-800'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400 hover:bg-slate-50'
                            }`}
                          >
                            <span>{task.term}</span>
                            {matchingSubmitted && (
                              <span>{isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column: Definitions */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Definitions & Contexts
                      </span>
                      {MATCHING_TASKS.map((task) => {
                        const pairedTermId = Object.keys(matchingPairs).find(
                          (tId) => matchingPairs[tId] === task.id
                        );
                        const isPaired = pairedTermId !== undefined;
                        const isCorrect = matchingSubmitted && pairedTermId === task.id;

                        return (
                          <button
                            key={task.id}
                            onClick={() => handleDefClick(task.id)}
                            disabled={matchingSubmitted}
                            className={`w-full p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                              matchingSubmitted
                                ? isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                                  : 'bg-rose-50/60 border-rose-200 text-slate-800'
                                : isPaired
                                ? 'bg-slate-100 border-slate-300 text-slate-800 font-medium'
                                : matchingSelectedTerm
                                ? 'bg-white border-blue-300 text-slate-800 hover:bg-blue-50/50 ring-1 ring-blue-200'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <div className="font-semibold text-slate-900">{task.definition}</div>
                            {languageMode !== 'en' && task.definitionVi && (
                              <div className="text-[11px] text-blue-700 font-normal mt-0.5">
                                🇻🇳 {task.definitionVi}
                              </div>
                            )}
                            <div className="text-[11px] text-slate-500 mt-1 italic">Context: {task.context}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="text-xs text-slate-600 font-medium">
                      {matchingSubmitted ? (
                        <span className="font-bold text-slate-900">
                          Score: {matchingCorrectCount} of {MATCHING_TASKS.length} correct ({((matchingCorrectCount / MATCHING_TASKS.length) * 100).toFixed(0)}%)
                        </span>
                      ) : (
                        <span>{Object.keys(matchingPairs).length} of {MATCHING_TASKS.length} terms matched</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {matchingSubmitted ? (
                        <button
                          onClick={handleResetMatching}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Try Again</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleCheckMatching}
                          disabled={Object.keys(matchingPairs).length === 0}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                        >
                          Check Matches
                        </button>
                      )}

                      {activeActivityTab === 'matching' && (
                        <button
                          onClick={() => setActiveActivityTab('gapfill')}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Next: Gap-Fill</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ACTIVITY 2: GAP-FILL */}
              {(activeActivityTab === 'gapfill' || activeActivityTab === 'all') && (
                <div className="space-y-4">
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Activity 2: Contextual Vocabulary Gap-Fill
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        Select the precise academic target word that fits the grammatical and contextual meaning of each sentence.
                      </p>
                    </div>
                    {activeActivityTab === 'all' && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md shrink-0">
                        Task 2 of 4
                      </span>
                    )}
                  </div>

                  {GAP_FILL_TASKS.map((task, index) => {
                    const selectedAnswer = gapFillAnswers[task.id] || '';
                    const isChecked = gapFillSubmitted[task.id] || false;
                    const isCorrect = selectedAnswer === task.targetWord;
                    const showHint = gapFillHints[task.id] || false;

                    return (
                      <div
                        key={task.id}
                        id={`gapfill-card-${task.id}`}
                        className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Sentence {index + 1} of {GAP_FILL_TASKS.length}
                          </span>
                          <button
                            onClick={() =>
                              setGapFillHints((prev) => ({
                                ...prev,
                                [task.id]: !showHint,
                              }))
                            }
                            className="text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
                          </button>
                        </div>

                        {showHint && (
                          <div className="p-2.5 rounded-lg bg-amber-50 text-xs text-amber-900 border border-amber-200 space-y-1">
                            <div><span className="font-bold">Clue: </span>{task.hint}</div>
                            {languageMode !== 'en' && task.hintVi && (
                              <div className="pt-1 border-t border-amber-200/60 text-amber-950 font-normal">
                                <span className="font-bold">🇻🇳 Gợi ý: </span>{task.hintVi}
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-xs sm:text-sm text-slate-900 font-medium leading-relaxed font-serif">
                          {task.sentence}
                        </p>

                        {/* Options */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          {task.options.map((opt) => {
                            const isOptionSelected = selectedAnswer === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() => {
                                  setGapFillAnswers((prev) => ({
                                    ...prev,
                                    [task.id]: opt,
                                  }));
                                  setGapFillSubmitted((prev) => ({
                                    ...prev,
                                    [task.id]: false,
                                  }));
                                }}
                                disabled={isChecked && isCorrect}
                                className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer ${
                                  isChecked
                                    ? opt === task.targetWord
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                      : isOptionSelected
                                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                                      : 'bg-white border-slate-200 text-slate-500'
                                    : isOptionSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {/* Feedback and Check Button */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div>
                            {isChecked && (
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  isCorrect ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" /> Correct!
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" /> Incorrect. Correct word is: <em>{task.targetWord}</em>
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              setGapFillSubmitted((prev) => ({
                                ...prev,
                                [task.id]: true,
                              }))
                            }
                            disabled={!selectedAnswer}
                            className="px-3 py-1 rounded-md text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            Check
                          </button>
                        </div>

                        {isChecked && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                            <div>
                              <span className="font-bold text-slate-800">Why this works: </span>
                              {task.explanation}
                            </div>
                            {languageMode !== 'en' && task.explanationVi && (
                              <div className="pt-1 border-t border-slate-200/60 text-slate-600">
                                <span className="font-bold text-blue-900">🇻🇳 Giải thích chi tiết: </span>
                                {task.explanationVi}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {activeActivityTab === 'gapfill' && (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setActiveActivityTab('matching')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous: Matching</span>
                      </button>
                      <button
                        onClick={() => setActiveActivityTab('reference')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next: Reference Hunt</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVITY 3: REFERENCE & COHESION */}
              {(activeActivityTab === 'reference' || activeActivityTab === 'all') && (
                <div className="space-y-4">
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Activity 3: Cohesion & Pronoun Reference Hunt
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        IELTS passages rely on demonstrative pronouns (<em>this goal, the same, these measures</em>) to connect arguments across paragraphs.
                      </p>
                    </div>
                    {activeActivityTab === 'all' && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md shrink-0">
                        Task 3 of 4
                      </span>
                    )}
                  </div>

                  {REFERENCE_TASKS.map((task, index) => {
                    const selectedOpt = refAnswers[task.id];
                    const isChecked = refSubmitted[task.id] || false;
                    const isCorrect = selectedOpt === task.correctIndex;

                    return (
                      <div
                        key={task.id}
                        id={`ref-card-${task.id}`}
                        className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Question {index + 1} of {REFERENCE_TASKS.length}
                          </span>
                          <button
                            onClick={() => onJumpToParagraph(task.paragraphRef)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
                          >
                            <span>Paragraph {task.paragraphRef}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-serif italic text-slate-800">
                          {task.quote}
                        </div>

                        <p className="text-xs sm:text-sm font-bold text-slate-900">{task.question}</p>

                        {/* Options */}
                        <div className="space-y-2 pt-1">
                          {task.options.map((opt, optIdx) => {
                            const isOptSelected = selectedOpt === optIdx;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => {
                                  setRefAnswers((prev) => ({
                                    ...prev,
                                    [task.id]: optIdx,
                                  }));
                                  setRefSubmitted((prev) => ({
                                    ...prev,
                                    [task.id]: false,
                                  }));
                                }}
                                className={`w-full p-3 rounded-lg border text-left text-xs sm:text-sm transition-all flex items-start gap-2.5 cursor-pointer ${
                                  isChecked
                                    ? optIdx === task.correctIndex
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                                      : isOptSelected
                                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                                      : 'bg-white border-slate-200 text-slate-500'
                                    : isOptSelected
                                    ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold ring-1 ring-blue-500'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className="font-mono text-xs font-bold text-slate-400">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div>
                            {isChecked && (
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  isCorrect ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" /> Correct Analysis!
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" /> Not quite. Check explanation below.
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              setRefSubmitted((prev) => ({
                                ...prev,
                                [task.id]: true,
                              }))
                            }
                            disabled={selectedOpt === undefined}
                            className="px-3 py-1 rounded-md text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            Check Answer
                          </button>
                        </div>

                        {isChecked && (
                          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs text-slate-800 space-y-1">
                            <div>
                              <span className="font-bold text-blue-900">Cohesion Breakdown: </span>
                              {task.explanation}
                            </div>
                            {languageMode !== 'en' && task.explanationVi && (
                              <div className="pt-1 border-t border-blue-200/60 text-slate-700">
                                <span className="font-bold text-blue-900">🇻🇳 Phân tích liên kết câu: </span>
                                {task.explanationVi}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {activeActivityTab === 'reference' && (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setActiveActivityTab('gapfill')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous: Gap-Fill</span>
                      </button>
                      <button
                        onClick={() => setActiveActivityTab('transformation')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next: Transformation</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIVITY 4: SENTENCE TRANSFORMATION */}
              {(activeActivityTab === 'transformation' || activeActivityTab === 'all') && (
                <div className="space-y-4">
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Activity 4: Academic Sentence Transformation
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        Transform basic sentences into high-scoring IELTS Band 8/9 academic structures.
                      </p>
                    </div>
                    {activeActivityTab === 'all' && (
                      <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md shrink-0">
                        Task 4 of 4
                      </span>
                    )}
                  </div>

                  {TRANSFORMATION_TASKS.map((task, index) => {
                    const selectedOpt = transAnswers[task.id];
                    const isChecked = transSubmitted[task.id] || false;
                    const isCorrect = selectedOpt === task.correctIndex;

                    return (
                      <div
                        key={task.id}
                        id={`trans-card-${task.id}`}
                        className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                            Task {index + 1} of {TRANSFORMATION_TASKS.length}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {task.targetGrammar}
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs sm:text-sm">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">
                            Standard Phrasing
                          </div>
                          <p className="text-slate-800 italic">"{task.original}"</p>
                        </div>

                        <p className="text-xs sm:text-sm font-bold text-slate-900">{task.prompt}</p>

                        {/* Options */}
                        <div className="space-y-2 pt-1">
                          {task.options.map((opt, optIdx) => {
                            const isOptSelected = selectedOpt === optIdx;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => {
                                  setTransAnswers((prev) => ({
                                    ...prev,
                                    [task.id]: optIdx,
                                  }));
                                  setTransSubmitted((prev) => ({
                                    ...prev,
                                    [task.id]: false,
                                  }));
                                }}
                                className={`w-full p-3 rounded-lg border text-left text-xs sm:text-sm transition-all flex items-start gap-2.5 cursor-pointer ${
                                  isChecked
                                    ? optIdx === task.correctIndex
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                                      : isOptSelected
                                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                                      : 'bg-white border-slate-200 text-slate-500'
                                    : isOptSelected
                                    ? 'bg-blue-50 border-blue-600 text-blue-950 font-semibold ring-1 ring-blue-500'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className="font-mono text-xs font-bold text-slate-400">
                                  {String.fromCharCode(65 + optIdx)}.
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div>
                            {isChecked && (
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  isCorrect ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {isCorrect ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" /> Perfect Academic Style!
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" /> Check the grammar analysis below.
                                  </>
                                )}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() =>
                              setTransSubmitted((prev) => ({
                                ...prev,
                                [task.id]: true,
                              }))
                            }
                            disabled={selectedOpt === undefined}
                            className="px-3 py-1 rounded-md text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            Check Structure
                          </button>
                        </div>

                        {isChecked && (
                          <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200 text-xs text-slate-800 space-y-1">
                            <div>
                              <span className="font-bold text-purple-900">Grammatical Explanation: </span>
                              {task.explanation}
                            </div>
                            {languageMode !== 'en' && task.explanationVi && (
                              <div className="pt-1 border-t border-purple-200/60 text-slate-700">
                                <span className="font-bold text-purple-900">🇻🇳 Phân tích ngữ pháp chuyên sâu: </span>
                                {task.explanationVi}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {activeActivityTab === 'transformation' && (
                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => setActiveActivityTab('reference')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Previous: Reference Hunt</span>
                      </button>
                      <button
                        onClick={() => setActiveActivityTab('all')}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                      >
                        <span>View All Tasks</span>
                        <ListFilter className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
