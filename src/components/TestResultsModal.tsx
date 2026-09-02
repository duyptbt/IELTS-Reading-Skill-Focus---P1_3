import React from 'react';
import { TestResult } from '../types';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  BookOpen, 
  Sparkles, 
  X,
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { calculateEstimatedBandScore } from '../data/ieltsData';

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult | null;
  onRetake: () => void;
  onSwitchToPractice: () => void;
  onGoToConsolidation?: () => void;
  onReviewQuestion: (qId: number) => void;
}

export const TestResultsModal: React.FC<TestResultsModalProps> = ({
  isOpen,
  onClose,
  result,
  onRetake,
  onSwitchToPractice,
  onGoToConsolidation,
  onReviewQuestion,
}) => {
  if (!isOpen || !result) return null;

  const bandInfo = calculateEstimatedBandScore(result.score);
  const timeMins = Math.floor(result.timeSpentSeconds / 60);
  const timeSecs = result.timeSpentSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div
        id="test-results-modal-card"
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-6 relative border-b border-slate-800">
          <button
            id="close-results-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span>IELTS Reading Test Report</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Test Performance Summary
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Passage 1: Reducing electricity consumption on the Isle of Eigg
          </p>
        </div>

        {/* Top Score Cards */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Score */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-xl">
              {result.score}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Raw Score</p>
              <p className="text-xl font-bold text-slate-900">
                {result.score} <span className="text-xs text-slate-400 font-normal">/ {result.total}</span>
              </p>
              <p className="text-[11px] text-blue-600 font-medium">{result.percentage.toFixed(0)}% Accuracy</p>
            </div>
          </div>

          {/* Estimated Band */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-extrabold text-lg">
              {bandInfo.band}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Estimated Band</p>
              <p className="text-lg font-bold text-slate-900">Band {bandInfo.band}</p>
              <p className="text-[11px] text-slate-500 line-clamp-1">{bandInfo.description}</p>
            </div>
          </div>

          {/* Time Taken */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-lg">
              <Clock className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time Spent</p>
              <p className="text-lg font-bold text-slate-900">
                {timeMins}m {timeSecs.toString().padStart(2, '0')}s
              </p>
              <p className="text-[11px] text-slate-500">Target: 20 min max</p>
            </div>
          </div>
        </div>

        {/* Consolidation Activation Callout */}
        {onGoToConsolidation && (
          <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-950 font-medium">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Consolidation Unlocked:</strong> Study key vocabulary, academic grammar structures, and complete skill tasks from Passage 1.
              </span>
            </div>
            <button
              id="modal-consolidation-cta-btn"
              onClick={() => {
                onClose();
                onGoToConsolidation();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors shrink-0 flex items-center gap-1 shadow-xs"
            >
              <span>Explore Consolidation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Detailed Breakdown List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center justify-between mb-2">
            <span>Question Breakdown</span>
            <span className="text-xs font-normal text-slate-500">
              Click any question to review full passage evidence
            </span>
          </h3>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {result.answers.map((item) => (
              <div
                key={item.questionId}
                className={`p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors hover:bg-slate-50 ${
                  item.isCorrect ? 'bg-emerald-50/20' : 'bg-rose-50/20'
                }`}
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="shrink-0 mt-0.5">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">Q{item.questionNumber}</span>
                      <span className="text-slate-600 font-medium line-clamp-1">{item.questionText}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                      <span className="text-slate-500">
                        Your answer:{' '}
                        <strong className={item.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                          {item.userAnswer || '(No answer provided)'}
                        </strong>
                      </span>
                      <span className="text-slate-500">
                        Correct: <strong className="text-slate-800 font-mono">{item.correctAnswer}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id={`review-item-q-${item.questionId}`}
                  onClick={() => {
                    onClose();
                    onReviewQuestion(item.questionId);
                  }}
                  className="shrink-0 flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-semibold px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors self-end sm:self-center"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Review Evidence</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            id="modal-retake-btn"
            onClick={onRetake}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Test</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              id="modal-switch-practice-btn"
              onClick={onSwitchToPractice}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Practice Mode with Tips</span>
            </button>

            <button
              id="modal-close-review-btn"
              onClick={onClose}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              <span>Review on Screen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
