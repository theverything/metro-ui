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

export interface FormattedStop {
  line: string;
  designation: string;
  destination: string;
  trackDesignation: string;
  arrivalTime: number;
  status: "good" | "warning" | "danger";
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

function formatArrivalTime(stop: ScheduledStop) {
  const scheduledTime = stop.FormattedTrainMovementTime;
  const scheduledDateTime = parse(scheduledTime, "h:mm a", new Date());

  const expectedTime = stop.FormattedCalcTrainMovementTime;
  const expectedDateTime = parse(expectedTime, "h:mm a", new Date());

  const scheduleDiff = differenceInMinutes(expectedDateTime, scheduledDateTime);

  return scheduleDiff;
}

function processStation(station: string, stationScheduleList: ScheduledStop[]) {
  const trains: FormattedStop[] = stationScheduleList
    .filter(stop => stop.PlatformName.toLowerCase() === station.toLowerCase())
    .map(stop => {
      return {
        line: lineShortName[stop.RouteCode],
        designation: stop.TrainDesignation,
        destination: stop.TrainDestination,
        trackDesignation: stop.FormattedTrackDesignation,
        arrivalTime: formatArrivalTime(stop),
        status: trainStatus[stop.CalculatedStatus]
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

  return fetch("/CIS/LiveTrainMap/JSON/StationScheduleList.json", {
    method: "GET"
  })
    .then(res => {
      if (res.status !== 200) {
        throw new Error(`Recieved status code ${res.status}`);
      }

      return res.json();
    })
    .then((json: ScheduledStop[]) => {
      return processStation(station, json);
    });
}
