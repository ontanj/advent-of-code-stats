interface LeaderboardData {
  owner_id: number;
  event: string;
  members: Record<string, MemberData>;
}

interface MemberData {
  stars: number;
  last_star_ts: number;
  id: number;
  global_score: number;
  name: string;
  local_score: number;
  completion_day_level: Record<number, Record<number, Completion>>;
}

interface Completion {
  star_index: number;
  get_star_ts: number;
}

interface Update {
  name: string;
  parts: { part: number; time: number }[];
}

interface Config {
  dataPath: string;
  boardId: string;
  basePath: string;
  slackHook: string;
  sessionId: string;
}
