// Export the API_BASE_URL so it can be imported by other components
export const API_BASE_URL = 'http://localhost:3000/api';

// Group types
export interface Group {
  id: number;
  group_name: string;
  word_count: number;
}

export interface GroupsResponse {
  groups: Group[];
  total_pages: number;
  current_page: number;
}

// Word types
export interface WordGroup {
  id: number;
  name: string;
}

export interface Word {
  id: number;
  kanji: string;
  romaji: string;
  english: string;
  correct_count: number;
  wrong_count: number;
  groups: WordGroup[];
}

export interface WordResponse {
  word: Word;
}

export interface WordsResponse {
  words: Word[];
  total_pages: number;
  current_page: number;
  total_words: number;
}

// Study Session types
export interface StudySession {
  id: number;
  group_id: number;
  group_name: string;
  activity_id: number;
  activity_name: string;
  start_time: string;
  end_time: string;
  review_items_count: number;
}

export interface WordReview {
  word_id: number;
  is_correct: boolean;
}

// Dashboard types
export interface RecentSession {
  id: number;
  group_id: number;
  activity_name: string;
  created_at: string;
  correct_count: number;
  wrong_count: number;
}

export interface StudyStats {
  total_vocabulary: number;
  total_words_studied: number;
  mastered_words: number;
  success_rate: number;
  total_sessions: number;
  active_groups: number;
  current_streak: number;
}

// Add ActivityCard type and fetch function
export type ActivityCard = {
  id: number
  preview_url: string
  title: string
  launch_url: string
}

// Add proper types for study activities
export interface StudyActivity {
    id: number;
    title: string;
    description: string;
    preview_url: string;
    launch_url: string;
}

export const fetchStudyActivities = async (): Promise<StudyActivity[]> => {
    const response = await fetch(`${API_BASE_URL}/study-activities`);
    if (!response.ok) {
        throw new Error('Failed to fetch study activities');
    }
    return response.json();
};

// Group API
export const fetchGroups = async (
  page: number = 1,
  sortBy: string = 'name',
  order: 'asc' | 'desc' = 'asc'
): Promise<GroupsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/groups?page=${page}&sort_by=${sortBy}&order=${order}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }
  return response.json();
};

export interface GroupDetails {
  id: number;
  group_name: string;
  word_count: number;
}

export interface GroupWordsResponse {
  words: Word[];
  total_pages: number;
  current_page: number;
}

export const fetchGroupDetails = async (
  groupId: number,
  page: number = 1,
  sortBy: string = 'kanji',
  order: 'asc' | 'desc' = 'asc'
): Promise<GroupDetails> => {
  const response = await fetch(`${API_BASE_URL}/groups/${groupId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch group details');
  }
  return response.json();
};

export const fetchGroupWords = async (
  groupId: number,
  page: number = 1,
  sortBy: string = 'kanji',
  order: 'asc' | 'desc' = 'asc'
): Promise<GroupWordsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/groups/${groupId}/words?page=${page}&sort_by=${sortBy}&order=${order}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch group words');
  }
  return response.json();
};

// Word API
export const fetchWords = async (
  page: number = 1,
  sortBy: string = 'kanji',
  order: 'asc' | 'desc' = 'asc'
): Promise<WordsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/words?page=${page}&sort_by=${sortBy}&order=${order}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch words');
  }
  return response.json();
};

export const fetchWordDetails = async (wordId: number): Promise<Word> => {
  const response = await fetch(`${API_BASE_URL}/words/${wordId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch word details');
  }
  const data: WordResponse = await response.json();
  return data.word;
};

// Study Session API
export const createStudySession = async (
  groupId: number,
  studyActivityId: number
): Promise<{ session_id: number }> => {
  const response = await fetch(`${API_BASE_URL}/study_sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      group_id: groupId,
      study_activity_id: studyActivityId,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to create study session');
  }
  return response.json();
};

export const submitStudySessionReview = async (
  sessionId: number,
  reviews: WordReview[]
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/study_sessions/${sessionId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reviews }),
  });
  if (!response.ok) {
    throw new Error('Failed to submit study session review');
  }
};

export interface StudySessionsResponse {
  items: StudySession[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export const fetchStudySessions = async (
  page: number = 1,
  perPage: number = 10,
  filters?: { groupId?: number }
): Promise<StudySessionsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  })

  if (filters?.groupId) {
    params.append('group_id', filters.groupId.toString())
  }

  const response = await fetch(`${API_BASE_URL}/study-sessions?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch study sessions');
  }
  return response.json();
};

// Dashboard API
export const fetchDashboardStats = async (): Promise<{
    total_words_studied: number;
    total_available_words: number;
    success_rate: number;
    total_study_sessions: number;
    total_active_groups: number;
    study_streak_days: number;
}> => {
    const [progress, stats] = await Promise.all([
        fetch(`${API_BASE_URL}/dashboard/study_progress`).then(res => res.json()),
        fetch(`${API_BASE_URL}/dashboard/quick-stats`).then(res => res.json())
    ]);

    return {
        ...progress,
        ...stats
    };
};

export const fetchRecentSession = async (): Promise<RecentSession | null> => {
    const response = await fetch(`${API_BASE_URL}/dashboard/last_study_session`);
    if (!response.ok) {
        throw new Error('Failed to fetch recent session');
    }
    return response.json();
};

// Add error handling utility
export class APIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public data?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// Add request helper with error handling
export async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new APIError(
            error.message || 'An error occurred',
            response.status,
            error
        );
    }

    return response.json();
}
