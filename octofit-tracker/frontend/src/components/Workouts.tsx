import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  _id?: string;
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;
    const userEmail = 'mona@example.com';
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then(({ suggestions: results }) => {
        if (isActive) setSuggestions(results);
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
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {suggestions === null && !hasError && <p role="status">Loading workout suggestions...</p>}
        {hasError && <p role="alert">Unable to load workout suggestions. Please try again.</p>}
        {suggestions?.length === 0 && <p>No workout suggestions found.</p>}
        {suggestions && suggestions.length > 0 && (
          <ul className="list-group list-group-flush">
            {suggestions.map((suggestion, index) => (
              <li className="list-group-item px-0" key={suggestion._id ?? `${suggestion.title}-${index}`}>
                <strong>{suggestion.title}</strong>
                {suggestion.focus && <> · {suggestion.focus}</>}
                {suggestion.minutes !== undefined && <> · {suggestion.minutes} min</>}
                {suggestion.difficulty && <> · {suggestion.difficulty}</>}
                {suggestion.reason && <span className="d-block text-body-secondary">{suggestion.reason}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
