// Auth
export interface UserRead {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  xp: number
  level: number
}

export interface StreakInfo {
  current_streak: number
  longest_streak: number
  last_activity: string | null
}

export interface AchievementRead {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  xp_reward: number
  trigger_type: string
  trigger_value: number
  earned_at: string | null
}

export interface UserProfile extends UserRead {
  streak: StreakInfo
  recent_achievements: AchievementRead[]
}

export interface UserStats {
  total_xp: number
  level: number
  lessons_completed: number
  exercises_completed: number
  completion_percent: number
}

// Curriculum
export interface Module {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  order_index: number
  lesson_count: number
  completion_percent: number
}

export interface LessonSummary {
  id: string
  slug: string
  title: string
  eli5_summary: string
  estimated_min: number
  xp_reward: number
  order_index: number
  status: 'not_started' | 'in_progress' | 'completed'
}

export interface ModuleDetail extends Module {
  lessons: LessonSummary[]
}

export type ExerciseType = 'fill_blank' | 'debug' | 'mcq' | 'mini_project'
export type ExerciseStatus = 'not_started' | 'attempted' | 'passed'

export interface ExerciseSummary {
  id: string
  type: ExerciseType
  title: string
  xp_reward: number
  order_index: number
  status: ExerciseStatus
}

export interface MCQOption {
  label: string
  is_correct?: boolean
}

export interface ExerciseDetail extends ExerciseSummary {
  instructions: string
  starter_code: string | null
  hints: string[]
  options: MCQOption[] | null
}

export interface DiagramData {
  type: 'mermaid' | 'svg'
  code: string
}

export interface LessonDetail {
  id: string
  module_id: string
  slug: string
  title: string
  eli5_summary: string
  content_html: string
  analogy: string
  diagram_data: DiagramData | null
  estimated_min: number
  xp_reward: number
  order_index: number
  exercises: ExerciseDetail[]
  status: 'not_started' | 'in_progress' | 'completed'
  next_lesson_id: string | null
  next_lesson_title: string | null
}

// Exercise submission
export interface SubmitResponse {
  passed: boolean
  feedback: string
  xp_gained: number
  stdout: string | null
  stderr: string | null
  new_achievements: AchievementRead[]
  level_up: boolean
  new_level: number | null
}

// Progress
export interface WeeklyActivity {
  date: string
  xp_earned: number
  lessons_completed: number
  exercises_completed: number
}

export interface WeakArea {
  module_id: string
  module_title: string
  completion_percent: number
  suggested_lessons: LessonSummary[]
}

export interface ProgressSummary {
  total_lessons: number
  completed_lessons: number
  total_exercises: number
  completed_exercises: number
  overall_percent: number
}

// AI
export interface LineExplanation {
  line_no: number
  code: string
  explanation: string
  concept_tag: string | null
}

export interface ReviewResponse {
  score: number
  feedback: string[]
  suggestions: string[]
  strengths: string[]
}

// Code execution
export interface ExecutionResult {
  stdout: string
  stderr: string
  exit_code: number
  execution_time: number
  timed_out: boolean
}
