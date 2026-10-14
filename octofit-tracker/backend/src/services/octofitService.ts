import { Types } from 'mongoose';
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
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Activity requires userId, teamId, type, and numeric minutes'), { status: 400 });
  }
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('Activity userId and teamId must be valid IDs'), { status: 400 });
  }
  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team does not exist'), { status: 404 });
  }
  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const teamInput = input && typeof input === 'object' && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  const { name, mascot } = teamInput;
  const rawMembers = teamInput.members ?? [];
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim()
  ) {
    throw Object.assign(new Error('Team requires a name and mascot'), { status: 400 });
  }
  if (
    !Array.isArray(rawMembers) ||
    rawMembers.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))
  ) {
    throw Object.assign(new Error('Team members must be valid user IDs'), { status: 400 });
  }
  const members = rawMembers as string[];
  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== new Set(members).size) {
      throw Object.assign(new Error('One or more team members do not exist'), { status: 404 });
    }
  }
  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, pointTotals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeamId = new Map(pointTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeamId.get(team._id.toString()) ?? 0,
    }))
    .sort((first, second) =>
      second.totalPoints - first.totalPoints || first.teamName.localeCompare(second.teamName),
    )
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const [activities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal?.trim().toLowerCase();
  const recentTypes = activities.map(({ type }) => type.trim().toLowerCase());

  return workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const matchesGoal = Boolean(goal && focus === goal);
      const matchingActivity = activities.find((activity) => activity.type.trim().toLowerCase() === focus);
      return { workout, matchesGoal, matchingActivity };
    })
    .sort((first, second) =>
      Number(second.matchesGoal) - Number(first.matchesGoal) ||
      Number(Boolean(second.matchingActivity)) - Number(Boolean(first.matchingActivity)),
    )
    .map(({ workout, matchesGoal, matchingActivity }) => {
      const reason = matchesGoal
        ? `Matches your ${user.fitnessGoal} fitness goal${recentTypes.length ? ` and recent ${activities[0].type} activity` : ''}.`
        : matchingActivity
          ? `Recommended based on your recent ${matchingActivity.type} activity.`
          : `Suggested based on your ${user.fitnessGoal} fitness goal.`;
      return { ...workout, reason };
    });
}

export { User };
