import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type TeamRecord = {
  _id?: string;
  name: string;
  mascot?: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;
    getJson<{ teams: TeamRecord[] }>('/api/teams')
      .then(({ teams: results }) => {
        if (isActive) setTeams(results);
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
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {teams === null && !hasError && <p role="status">Loading teams...</p>}
        {hasError && <p role="alert">Unable to load teams. Please try again.</p>}
        {teams?.length === 0 && <p>No teams found.</p>}
        {teams && teams.length > 0 && (
          <ul className="list-group list-group-flush">
            {teams.map((team, index) => (
              <li className="list-group-item px-0" key={team._id ?? `${team.name}-${index}`}>
                <strong>{team.name}</strong>
                {team.mascot && <> · {team.mascot}</>}
                <span className="d-block text-body-secondary">{team.members.length} members</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
