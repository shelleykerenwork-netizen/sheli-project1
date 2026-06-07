export type QuestionType = "text" | "number" | "single_choice" | "multiple_choice" | "rating" | "yes_no";

export interface QuestionOption { id?: number; text: string; order: number; }

export interface Question {
  id?: number;
  text: string;
  question_type: QuestionType;
  required: boolean;
  order: number;
  options: QuestionOption[];
}

export interface Survey {
  id: number;
  title: string;
  description: string;
  is_anonymous: boolean;
  is_active: boolean;
  created_at: string;
  slug: string;
  questions: Question[];
  response_count: number;
}

export interface AnswerCreate { question_id: number; value: string | null; }

export interface ResponseCreate {
  respondent_name?: string;
  respondent_role?: string;
  respondent_authority?: string;
  answers: AnswerCreate[];
}
