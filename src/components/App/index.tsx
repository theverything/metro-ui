import React, { useState, useEffect } from "react";
import qs from "qs";
import {
  getStationScheduleList,
  metrolinkStations,
  FormattedStop,
  needsUpdate
} from "../../util/metrolink";
import s from "./App.module.css";

const App: React.FC = () => {
  const [station, setStation] = useState(() => {
    const query: Record<string, string> = qs.parse(window.location.search, {
      ignoreQueryPrefix: true
    });

    return query.s || "fullerton";
  });
  const [list, setList] = useState<FormattedStop[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  useEffect(() => {
    getStationScheduleList(station)
      .then(l => setList(l))
      .catch(err => console.error(err));
  }, [station]);
  useEffect(() => {
    const i = setInterval(() => {
      needsUpdate()
        .then(([update, ok]) => {
          if (ok) {
            setLastUpdate(update);
            return getStationScheduleList(station).then(l => setList(l));
          }
        })
        .catch(err => console.error(err));
    }, 10000);

    return () => {
      clearInterval(i);
    };
  }, [list, station]);

  return (
    <div className={s.container}>
      <h3>Select you station</h3>
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
      <div className={s.lastUpdate}>Last Updated {lastUpdate.toString()}</div>
      <table>
        <caption>Trains</caption>
        <thead>
          <tr>
            <th scope="col">Line</th>
            <th scope="col">Train Number</th>
            <th scope="col">Destination</th>
            <th scope="col">Track Number</th>
            <th scope="col">Minutes Late</th>
          </tr>
        </thead>
        <tbody>
          {list.map(stop => (
            <tr key={stop.line + stop.designation} className={s[stop.status]}>
              <td data-label="Line">{stop.line}</td>
              <td data-label="Train Number">{stop.designation}</td>
              <td data-label="Destination">{stop.destination}</td>
              <td data-label="Track Number">{stop.trackDesignation}</td>
              <td data-label="Minutes Late">{stop.arrivalTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;
