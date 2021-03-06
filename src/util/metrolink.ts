import { parse, differenceInMinutes } from "date-fns";

interface ScheduledStop {
  TrainDesignation: string;
  RouteCode:
    | "VC LINE"
    | "91/PV Line"
    | "91PV Line"
    | "AV LINE"
    | "IE LINE"
    | "IEOC LINE"
    | "OC LINE"
    | "SB LINE"
    | "VT LINE";
  TrainDestination: string;
  PlatformName: string;
  EventType: string;
  TrainMovementTime: string;
  CalcTrainMovementTime: string;
  FormattedTrainMovementTime: string;
  FormattedCalcTrainMovementTime: string;
  FormattedTrackDesignation: string;
  CalculatedStatus: "ON TIME" | "DELAYED" | "EXTENDED DELAYED" | "CANCELLED";
  PTCStatus: string;
}

interface TrainLocation {
  delay_status: string;
  direction: string;
  lat: string;
  line: string;
  long: string;
  ptc_status: string;
  ptc_time: string;
  speed: string;
  symbol: string;
}

export interface FormattedStop {
  line: string;
  designation: string;
  destination: string;
  trackDesignation: string;
  arrivalTime: number;
  scheduled: Date;
  status: "good" | "warning" | "danger";
  lat: string;
  lon: string;
}

const trainStatus = {
  "ON TIME": "good" as "good",
  DELAYED: "warning" as "warning",
  "EXTENDED DELAYED": "danger" as "danger",
  CANCELLED: "danger" as "danger"
};

const lineShortName = {
  "VC LINE": "VT",
  "91/PV Line": "91",
  "91PV Line": "91",
  "AV LINE": "AV",
  "IE LINE": "IE",
  "IEOC LINE": "IE",
  "OC LINE": "OC",
  "SB LINE": "SB",
  "VT LINE": "VT"
};

export const metrolinkStations = {
  "ANAHEIM-CANYON": "Anaheim Canyon",
  ARTIC: "Anaheim",
  BALDWINPARK: "Baldwin Park",
  BUENAPARK: "Buena Park",
  "BURBANK-AIRPORT-NORTH": "Burbank Airport - North",
  "BURBANK-AIRPORT-SOUTH": "Burbank Airport - South",
  CALSTATE: "Cal State LA",
  CAMARILLO: "Camarillo",
  CHATSWORTH: "Chatsworth",
  CLAREMONT: "Claremont",
  COMMERCE: "Commerce",
  COVINA: "Covina",
  "DOWNTOWN BURBANK": "Burbank - Downtown",
  ELMONTE: "El Monte",
  FONTANA: "Fontana",
  FULLERTON: "Fullerton",
  GLENDALE: "Glendale",
  INDUSTRY: "Industry",
  IRVINE: "Irvine",
  "LAGUNANIGUEL-MISSIONVIEJO": "Laguna Niguel/Mission Viejo",
  LANCASTER: "Lancaster",
  LAUS: "L.A. Union Station",
  "MAIN-CORONA-NORTH": "Corona - North Main",
  MONTCLAIR: "Montclair",
  MONTEBELLO: "Montebello/Commerce",
  MOORPARK: "Moorpark",
  "MORENO-VALLEY-MARCH-FIELD": "Moreno Valley/March Field",
  NEWHALL: "Newhall",
  NORTHRIDGE: "Northridge",
  "NORWALK/SANTA FE SPRINGS": "Norwalk/Santa Fe Springs",
  "NORWALK-SANTAFESPRINGS": "Norwalk/Santa Fe Springs",
  OCEANSIDE: "Oceanside",
  "ONTARIO-EAST": "Ontario - East",
  ORANGE: "Orange",
  OXNARD: "Oxnard",
  PALMDALE: "Palmdale",
  PEDLEY: "Jurupa Valley/Pedley",
  "PERRIS-DOWNTOWN": "Perris - Downtown",
  "PERRIS-SOUTH": "Perris - South",
  "POMONA-DOWNTOWN": "Pomona - Downtown",
  "POMONA-NORTH": "Pomona - North",
  "RANCHO CUCAMONGA": "Rancho Cucamonga",
  RIALTO: "Rialto",
  "RIVERSIDE-DOWNTOWN": "Riverside - Downtown",
  "RIVERSIDE-HUNTERPARK": "Riverside - Hunter Park/UCR",
  "RIVERSIDE-LA SIERRA": "Riverside - La Sierra",
  "SAN BERNARDINO": "San Bernardino",
  SANBERNARDINOTRAN: "San Bernardino-Downtown",
  "SAN CLEMENTE": "San Clemente",
  "SAN CLEMENTE PIER": "San Clemente Pier",
  "SAN JUAN CAPISTRANO": "San Juan Capistrano",
  "SANTA ANA": "Santa Ana",
  "SANTA CLARITA": "Santa Clarita",
  SIMIVALLEY: "Simi Valley",
  "SUN VALLEY": "Sun Valley",
  "SYLMAR/SAN FERNANDO": "Sylmar/San Fernando",
  TUSTIN: "Tustin",
  UPLAND: "Upland",
  "VAN NUYS": "Van Nuys",
  "VENTURA-EAST": "Ventura - East",
  "VIA PRINCESSA": "Via Princessa",
  "VINCENT GRADE/ACTON": "Vincent Grade/Acton",
  "WEST CORONA": "Corona - West",
  "SAN BERNARDINO-DOWNTOWN": "San Bernardino - Downtown"
};

function formatArrivalTime(stop: ScheduledStop): [Date, number] {
  const scheduledTime = stop.FormattedTrainMovementTime;
  const scheduledDateTime = parse(scheduledTime, "h:mm a", new Date());

  const expectedTime = stop.FormattedCalcTrainMovementTime;
  const expectedDateTime = parse(expectedTime, "h:mm a", new Date());

  const scheduleDiff = differenceInMinutes(expectedDateTime, scheduledDateTime);

  return [scheduledDateTime, Math.max(scheduleDiff, 0)];
}

function dmsToDD(loc: string) {
  const [d, m, s] = loc.split(":");
  let deg = Number(d);
  const min = Number(m);
  const sec = Number(s);

  const sign = Math.sign(deg);

  deg = Math.abs(deg);

  const dd = deg + min / 60 + sec / 60 / 60;

  return String(dd * sign);
}

function processStation(
  station: string,
  stationScheduleList: ScheduledStop[],
  trainLocations: TrainLocation[]
) {
  const symbols = trainLocations.reduce<Record<string, TrainLocation>>(
    (m, t) => {
      m[t.symbol.toLowerCase()] = t;
      return m;
    },
    {}
  );
  const trains: FormattedStop[] = stationScheduleList
    .filter(stop => stop.PlatformName.toLowerCase() === station.toLowerCase())
    .map(stop => {
      const loc = symbols[stop.TrainDesignation.toLowerCase()];
      const [scheduled, arrivalTime] = formatArrivalTime(stop);
      return {
        line: lineShortName[stop.RouteCode],
        designation: stop.TrainDesignation,
        destination: stop.TrainDestination,
        trackDesignation: stop.FormattedTrackDesignation,
        scheduled,
        arrivalTime,
        status: trainStatus[stop.CalculatedStatus],
        lat: loc ? dmsToDD(loc.lat) : "",
        lon: loc ? dmsToDD(loc.long) : ""
      };
    });

  return trains;
}

export function needsUpdate(): Promise<[Date, boolean]> {
  return fetch("/CIS/LiveTrainMap/JSON/UpdateTime.json")
    .then(res => {
      if (res.status !== 200) {
        throw new Error(`Recieved status code ${res.status}`);
      }

      return res.json();
    })
    .then((json: { UpdateTime: string }[]) => {
      if (json.length > 0) {
        const val = json[0].UpdateTime;
        const updated = new Date(
          Number(val.replace("/Date(", "").replace(")/", ""))
        );
        const curr = window.localStorage.getItem("UpdateTime");
        const next = val;

        if (curr !== next) {
          window.localStorage.setItem("UpdateTime", val);
          return [updated, true];
        }
      }

      return [new Date(), false];
    });
}

export function getStationScheduleList(station: string) {
  if (station === "") {
    return Promise.resolve([]);
  }

  return Promise.all([
    fetch("/CIS/LiveTrainMap/JSON/StationScheduleList.json", {
      method: "GET"
    }),
    fetch("/CIS/LiveTrainMap/JSON/Trainlist.json", {
      method: "GET"
    })
  ])
    .then(([resSched, resList]) => {
      if (resSched.status !== 200 || resList.status !== 200) {
        throw new Error(`Recieved non 200 status code`);
      }

      return Promise.all<ScheduledStop[], TrainLocation[]>([
        resSched.json(),
        resList.json()
      ]);
    })
    .then(([jsonSched, jsonList]) => {
      return processStation(station, jsonSched, jsonList);
    });
}
