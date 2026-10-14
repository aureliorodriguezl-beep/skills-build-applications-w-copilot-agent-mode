import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: results }) => {
        if (isActive) setLeaderboard(results);
      })
      .catch(() => {
        if (isActive) setHasError(true);
      });
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {leaderboard === null && !hasError && <p role="status">Loading leaderboard...</p>}
        {hasError && <p role="alert">Unable to load leaderboard. Please try again.</p>}
        {leaderboard?.length === 0 && <p>No leaderboard scores yet.</p>}
        {leaderboard && leaderboard.length > 0 && (
          <ol className="list-group list-group-numbered list-group-flush">
            {leaderboard.map((entry) => (
              <li className="list-group-item d-flex justify-content-between px-0" key={`${entry.rank}-${entry.teamName}`}>
                <span>{entry.teamName}</span>
                <span>{entry.totalPoints} points</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
