import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const activity = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const { userId, teamId, type, minutes } = activity;
  if (
    typeof userId !== 'string' || !userId.trim() ||
    typeof teamId !== 'string' || !teamId.trim() ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes)
  ) {
    throw Object.assign(new Error('Activity requires userId, teamId, type, and numeric minutes'), { status: 400 });
  }
  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team does not exist'), { status: 404 });
  }
  throw Object.assign(new Error('Activity validation is not implemented yet'), { status: 501 });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
