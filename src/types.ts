export type Mode = 'practice' | 'test' | 'consolidation';

export interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  definitionVi: string;
  passageContext: string;
  paragraphRef: number;
  collocations: string[];
  synonyms: string[];
  ieltsBand: string;
}

export interface GrammarStructureItem {
  id: string;
  name: string;
  category: string;
  formula: string;
  passageExample: string;
  paragraphRef: number;
  explanation: string;
  explanationVi?: string;
  ieltsApplication: string;
  ieltsApplicationVi?: string;
  practiceExample: string;
}

export interface ParaphrasePair {
  id: string;
  originalText: string;
  paraphrasedText: string;
  technique: string;
  techniqueVi?: string;
  explanation: string;
  explanationVi?: string;
  paragraphRef: number;
}

export interface MatchingTaskItem {
  id: string;
  term: string;
  definition: string;
  definitionVi?: string;
  context: string;
}

export interface GapFillTaskItem {
  id: string;
  sentence: string;
  targetWord: string;
  options: string[];
  hint: string;
  hintVi?: string;
  explanation: string;
  explanationVi?: string;
}

export interface ReferenceTaskItem {
  id: string;
  question: string;
  quote: string;
  paragraphRef: number;
  options: string[];
  correctIndex: number;
  explanation: string;
  explanationVi?: string;
}

export interface TransformationTaskItem {
  id: string;
  original: string;
  targetGrammar: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  explanationVi?: string;
}

export interface ParagraphData {
  id: number;
  sectionTitle?: string;
  text: string;
}

export interface QuestionTip {
  text: string;
  textVi?: string;
}

export interface QuestionItem {
  id: number;
  questionNumber: number;
  type: 'short_answer' | 'true_false_not_given';
  prompt: string;
  instruction?: string;
  maxWords?: number;
  tip?: string;
  tipVi?: string;
  officialAnswer: string;
  acceptedAnswers: string[];
  paragraphRef: number;
  paragraphQuote: string;
  explanation: string;
  explanationVi?: string;
}

export interface TipStrip {
  title: string;
  questionRange: string;
  bullets: string[];
  bulletsVi?: string[];
}

export interface HighlightItem {
  id: string;
  targetType?: 'passage' | 'question';
  paragraphId?: number;
  questionId?: number;
  startOffset?: number;
  endOffset?: number;
  text: string;
  color: 'yellow' | 'green' | 'cyan' | 'pink';
}

export interface UserAnswerState {
  [questionId: number]: string;
}

export interface QuestionFeedback {
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  paragraphRef: number;
  paragraphQuote: string;
}

export interface TestResult {
  score: number;
  total: number;
  percentage: number;
  estimatedBand: string;
  timeSpentSeconds: number;
  completedAt: string;
  answers: {
    questionId: number;
    questionNumber: number;
    questionText: string;
    type: 'short_answer' | 'true_false_not_given';
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
    paragraphRef: number;
    paragraphQuote: string;
  }[];
}
