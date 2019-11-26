import React, { useState, useEffect, useCallback } from "react";
import qs from "qs";
import { formatDistance, format } from "date-fns";
import {
  getStationScheduleList,
  metrolinkStations,
  FormattedStop,
  needsUpdate
} from "../../util/metrolink";
import s from "./App.module.css";

function TimeAgo({ time }: { time: Date }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date());
    }, 10000);

    return () => {
      clearInterval(t);
    };
  }, []);

  return (
    <span className={s.lastUpdate}>
      Updated {formatDistance(time, now, { addSuffix: true })}
    </span>
  );
}

function App() {
  const [station, setStation] = useState(() => {
    const query: Record<string, string> = qs.parse(window.location.search, {
      ignoreQueryPrefix: true
    });

    return query.s || "fullerton";
  });
  const [list, setList] = useState<FormattedStop[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const refresh = useCallback(() => {
    needsUpdate()
      .then(([update, ok]) => {
        if (ok) {
          setLastUpdate(update);
          return getStationScheduleList(station).then(l => setList(l));
        }
      })
      .catch(err => console.error(err));
  }, [station]);
  useEffect(() => {
    getStationScheduleList(station)
      .then(l => setList(l))
      .catch(err => console.error(err));
  }, [station]);

  return (
    <div className={s.container}>
      <h3>Select your station</h3>
      <select
        name="station-list"
        id="station-list"
        onChange={e => setStation(e.target.value)}
        value={station}
      >
        {Object.keys(metrolinkStations).map(s => (
          <option key={s} value={s.toLowerCase()}>
            {s}
          </option>
        ))}
      </select>
      <button className={s.refresh} onClick={refresh}>
        <span role="img" aria-label="refresh">
          🔄
        </span>{" "}
        <TimeAgo time={lastUpdate} />
      </button>

      <table>
        <caption>Trains</caption>
        <thead>
          <tr>
            <th scope="col">Line</th>
            <th scope="col">Train Number</th>
            <th scope="col">Destination</th>
            <th scope="col">Track Number</th>
            <th scope="col">Scheduled Arrival</th>
            <th scope="col">Minutes Late</th>
            <th scope="col">Location</th>
          </tr>
        </thead>
        <tbody>
          {list.map(stop => (
            <tr key={stop.line + stop.designation} className={s[stop.status]}>
              <td data-label="Line">{stop.line}</td>
              <td data-label="Train Number">{stop.designation}</td>
              <td data-label="Destination">{stop.destination}</td>
              <td data-label="Track Number">{stop.trackDesignation}</td>
              <td data-label="Scheduled Arrival">
                {format(stop.scheduled, "h:mm a")}
              </td>
              <td data-label="Minutes Late">{stop.arrivalTime}</td>
              <td data-label="Location">
                {stop.lat !== "" ? (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lon}`}
                  >
                    Click Here
                  </a>
                ) : (
                  "Unknown"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
