// Margaret River Ultra Marathon — official course breakdown.
// Source: https://margaretriver.rapidascent.com.au/event-details/the-race/course-description-and-maps/

export type Leg = {
  index: number;
  name: string;
  from: string;
  to: string;
  distanceKm: number;
  cumulativeKm: number;
  gainM: number;
  lossM: number;
  terrain: string;
  expectedSoloTime: string;
};

export const TOTAL_DISTANCE_KM = 80;
export const TOTAL_GAIN_M = 1730;
export const TOTAL_LOSS_M = 1675;

export const LEGS: Leg[] = [
  {
    index: 1,
    name: "Karri & heathland",
    from: "Hamelin Bay",
    to: "Boranup Campsite",
    distanceKm: 11.5,
    cumulativeKm: 11.5,
    gainM: 370,
    lossM: 190,
    terrain: "Firm 4WD tracks and singletrack. Minimal sand. Climby.",
    expectedSoloTime: "1h 00",
  },
  {
    index: 2,
    name: "Boranup forest",
    from: "Boranup Campsite",
    to: "Contos Campground",
    distanceKm: 16.0,
    cumulativeKm: 27.5,
    gainM: 350,
    lossM: 440,
    terrain: "Hard‑packed trails through towering karri. No sand. Undulating.",
    expectedSoloTime: "1h 30",
  },
  {
    index: 3,
    name: "Cape to Cape granite",
    from: "Contos Campground",
    to: "Riflebutts Reserve",
    distanceKm: 19.5,
    cumulativeKm: 47.0,
    gainM: 380,
    lossM: 485,
    terrain:
      "Rock‑hopping at Cape Freycinet. Long Cape‑to‑Cape singletrack. Brutal 4km soft‑sand beach finish.",
    expectedSoloTime: "2h 10",
  },
  {
    index: 4,
    name: "Coast and Ellensbrook",
    from: "Riflebutts Reserve",
    to: "Gracetown",
    distanceKm: 18.5,
    cumulativeKm: 65.5,
    gainM: 280,
    lossM: 290,
    terrain:
      "Margaret River mouth, Cape Mentelle, Joeys Nose, then hinterland into Ellensbrook.",
    expectedSoloTime: "2h 00",
  },
  {
    index: 5,
    name: "North Point to the vines",
    from: "Gracetown",
    to: "Howard Park Wines",
    distanceKm: 13.1,
    cumulativeKm: 78.5,
    gainM: 250,
    lossM: 150,
    terrain:
      "Rocky North Point, then sandy 4WD, then fast farm dirt to the finish through the vines.",
    expectedSoloTime: "1h 10",
  },
];

// Race start coordinates (Hamelin Bay) for sunrise calculations.
export const START_LAT = -34.22142;
export const START_LON = 115.02720;

// Western Australia is UTC+8, no DST.
export const TIMEZONE_OFFSET_HOURS = 8;
