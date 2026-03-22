export interface StudentContext {
  learning_style: string;
  pace: string;
  education_level: string;
  language_proficiency: string;
  interests: string[];
  personal_context: string | null;
  motivation: string | null;
  preferred_explanation_style: string | null;
  prior_knowledge: string | null;
}

export interface OutlineNode {
  id: string;
  title: string;
  type: string;
  order: number;
  children: OutlineNode[];
}

export interface GenerateOutlineResponse {
  version: number;
  nodes: OutlineNode[];
}

export interface ContentNode {
  id: string;
  title: string;
  type: string;
}

export interface GenerateTextResponse {
  text: string;
}

export interface GenerateAudioResponse {
  audio_url: string | null;
}

export interface GenerateVideoResponse {
  video_url: string | null;
}

export interface Question {
  question: string;
  options: string[];
  correct_index: number;
}

export interface GenerateAssessmentResponse {
  questions: Question[];
}

export interface KnowledgeState {
  p_known: number;
  p_learn: number;
  p_guess: number;
  p_slip: number;
}

export interface KnowledgeTraceUpdateResponse {
  updated_state: KnowledgeState;
  needs_adaptation: boolean;
}

export interface KnowledgeTraceBatchResponse {
  updated_state: KnowledgeState;
  needs_adaptation: boolean;
}
