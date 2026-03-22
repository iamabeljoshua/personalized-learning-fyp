// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface StudentProfile {
  learningStyle: string;
  pace: string;
  educationLevel: string;
  languageProficiency: string;
  interests: string[];
  personalContext: string | null;
}

export interface Student {
  id: string;
  email: string;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
  profile: StudentProfile | null;
}

export interface AuthResponse {
  accessToken: string;
  user: Student;
}

// Onboarding
export interface OnboardRequest {
  learningStyle: string;
  pace: string;
  educationLevel: string;
  languageProficiency: string;
  interests: string[];
  personalContext?: string;
}

export interface UpdateProfileRequest {
  learningStyle?: string;
  pace?: string;
  educationLevel?: string;
  languageProficiency?: string;
  interests?: string[];
  personalContext?: string;
}

export interface ProfileResponse {
  learningStyle: string;
  pace: string;
  educationLevel: string;
  languageProficiency: string;
  interests: string[];
  personalContext: string | null;
  createdAt: string;
  updatedAt: string;
}

// Goals
export interface CreateGoalRequest {
  topic: string;
  motivation: string;
  preferredExplanationStyle: string;
  priorKnowledge?: string;
}

export interface Goal {
  id: string;
  topic: string;
  motivation: string;
  preferredExplanationStyle: string;
  priorKnowledge: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalListResponse {
  data: Goal[];
}

// Outline
export interface OutlineNode {
  id: string;
  title: string;
  type: string;
  order: number;
}

export interface Outline {
  id: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  nodes: OutlineNode[];
}

// Content
export interface ContentItem {
  id: string;
  nodeId: string;
  text: string | null;
  audioUrl: string | null;
  videoUrl: string | null;
  textStatus: string;
  audioStatus: string;
  videoStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentStatus {
  textStatus: string;
  audioStatus: string;
  videoStatus: string;
}

// Quiz
export interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  order: number;
}

export interface Quiz {
  id: string;
  nodeId: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface SubmitAttemptRequest {
  answers: number[];
}

export interface AttemptQuestionResult {
  questionId: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
}

export interface KnowledgeState {
  pKnown: number;
  pLearn: number;
  pGuess: number;
  pSlip: number;
}

export interface AttemptResult {
  score: number;
  total: number;
  results: AttemptQuestionResult[];
  knowledgeState: KnowledgeState;
  needsAdaptation: boolean;
  nextNodeId: string | null;
}

// Progress
export interface NodeProgress {
  nodeId: string;
  title: string;
  type: string;
  order: number;
  textStatus: string;
  audioStatus: string;
  videoStatus: string;
  quizAttempted: boolean;
  lastScore: number | null;
  lastTotal: number | null;
  pKnown: number | null;
}

export interface ProgressSummary {
  totalNodes: number;
  nodesWithContent: number;
  nodesQuizzed: number;
  averagePKnown: number | null;
}

export interface GoalProgress {
  goalId: string;
  topic: string;
  nodes: NodeProgress[];
  summary: ProgressSummary;
}
