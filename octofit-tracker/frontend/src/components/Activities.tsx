import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ActivityRecord = {
  _id?: string;
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;
    getJson<{ activities: ActivityRecord[] }>('/api/activities')
      .then(({ activities: results }) => {
        if (isActive) setActivities(results);
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
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {activities === null && !hasError && <p role="status">Loading activities...</p>}
        {hasError && <p role="alert">Unable to load activities. Please try again.</p>}
        {activities?.length === 0 && <p>No activities found.</p>}
        {activities && activities.length > 0 && (
          <ul className="list-group list-group-flush">
            {activities.map((activity, index) => (
              <li className="list-group-item px-0" key={activity._id ?? `${activity.type}-${activity.minutes}-${index}`}>
                <span>{activity.type}</span> · {activity.minutes} min · {activity.points} points
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
