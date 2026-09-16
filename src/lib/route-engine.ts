export type TransportMode =
  | "bus"
  | "auto"
  | "walk";

export interface RouteOption {
  mode: TransportMode;
  title: string;
  eta: number;
  cost: number;
  crowd: number;
  traffic: number;
  reliability: number;
  score: number;
  delayRisk: "Low" | "Medium" | "High";
  description: string;
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function hashString(value: string) {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash =
      (hash << 5) -
      hash +
      value.charCodeAt(i);

    hash |= 0;
  }

  return Math.abs(hash);
}

function getDelayRisk(
  traffic: number,
  reliability: number
): "Low" | "Medium" | "High" {
  if (
    traffic > 75 ||
    reliability < 65
  ) {
    return "High";
  }

  if (
    traffic > 50 ||
    reliability < 80
  ) {
    return "Medium";
  }

  return "Low";
}

export function generateRoutes(
  from: string,
  to: string
): RouteOption[] {
  const seed = hashString(
    `${from.trim().toLowerCase()}-${to
      .trim()
      .toLowerCase()}`
  );

  /*
  |--------------------------------------------------------------------------
  | Deterministic demo factors
  |--------------------------------------------------------------------------
  */

  const trafficFactor =
    0.85 + (seed % 35) / 100;

  const crowdFactor =
    0.8 + ((seed >> 3) % 30) / 100;

  const distanceFactor =
    0.9 + ((seed >> 5) % 30) / 100;

  /*
  |--------------------------------------------------------------------------
  | BUS + WALK
  |--------------------------------------------------------------------------
  */

  const busEta = Math.round(
    30 *
      trafficFactor *
      distanceFactor
  );

  const busCrowd = Math.round(
    clamp(
      55 * crowdFactor,
      20,
      95
    )
  );

  const busTraffic = Math.round(
    clamp(
      62 * trafficFactor,
      20,
      95
    )
  );

  const busReliability = Math.round(
    clamp(
      94 - busTraffic * 0.15,
      60,
      95
    )
  );

  /*
  |--------------------------------------------------------------------------
  | AUTO
  |--------------------------------------------------------------------------
  */

  const autoEta = Math.round(
    23 *
      trafficFactor *
      distanceFactor
  );

  const autoCrowd = Math.round(
    clamp(
      18 * crowdFactor,
      5,
      60
    )
  );

  const autoTraffic = Math.round(
    clamp(
      55 * trafficFactor,
      15,
      95
    )
  );

  const autoReliability = Math.round(
    clamp(
      91 - autoTraffic * 0.12,
      60,
      95
    )
  );

  /*
  |--------------------------------------------------------------------------
  | WALK
  |--------------------------------------------------------------------------
  |
  | Walking is intentionally given a much stronger time penalty.
  |
  */

  const walkEta = Math.round(
    55 * distanceFactor
  );

  const walkCrowd = 0;
  const walkTraffic = 0;
  const walkReliability = 97;

  /*
  |--------------------------------------------------------------------------
  | Create route options
  |--------------------------------------------------------------------------
  */

  const routes: RouteOption[] = [
    {
      mode: "bus",

      title: "Bus + Walk",

      eta: busEta,

      cost: 20,

      crowd: busCrowd,

      traffic: busTraffic,

      reliability: busReliability,

      score: 0,

      delayRisk: getDelayRisk(
        busTraffic,
        busReliability
      ),

      description:
        "Best balance of affordability, travel time and reliability.",
    },

    {
      mode: "auto",

      title: "Auto",

      eta: autoEta,

      cost: 85,

      crowd: autoCrowd,

      traffic: autoTraffic,

      reliability: autoReliability,

      score: 0,

      delayRisk: getDelayRisk(
        autoTraffic,
        autoReliability
      ),

      description:
        "Faster door-to-door travel with a higher estimated cost.",
    },

    {
      mode: "walk",

      title: "Walk",

      eta: walkEta,

      cost: 0,

      crowd: walkCrowd,

      traffic: walkTraffic,

      reliability: walkReliability,

      score: 0,

      delayRisk: "Low",

      description:
        "Zero-cost option suitable mainly for shorter journeys.",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | AI ROUTE SCORING
  |--------------------------------------------------------------------------
  |
  | Weighting:
  |
  | Travel Time  -> 40%
  | Traffic      -> 20%
  | Cost         -> 15%
  | Crowd        -> 10%
  | Reliability  -> 15%
  |
  */

  for (const route of routes) {
    /*
     * Travel time
     */

    const timeScore = clamp(
      100 - route.eta * 1.7,
      5,
      100
    );

    /*
     * Cost
     */

    const costScore =
      route.cost === 0
        ? 100
        : clamp(
            100 -
              route.cost * 0.75,
            15,
            100
          );

    /*
     * Crowd
     */

    const crowdScore =
      100 - route.crowd;

    /*
     * Traffic
     */

    const trafficScore =
      100 - route.traffic;

    /*
     * Reliability
     */

    const reliabilityScore =
      route.reliability;

    /*
     * Weighted AI score
     */

    route.score = Math.round(
      timeScore * 0.4 +
        trafficScore * 0.2 +
        costScore * 0.15 +
        crowdScore * 0.1 +
        reliabilityScore * 0.15
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Prevent unrealistic walking recommendations
  |--------------------------------------------------------------------------
  |
  | For longer journeys, walking should remain an available alternative
  | but should not beat practical motorized transport merely because
  | it is free.
  |
  */

  const practicalRoute = routes.find(
    (route) =>
      route.mode === "bus"
  );

  const walkRoute = routes.find(
    (route) =>
      route.mode === "walk"
  );

  if (
    practicalRoute &&
    walkRoute &&
    walkRoute.eta > 45
  ) {
    walkRoute.score = Math.min(
      walkRoute.score,
      practicalRoute.score - 5
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Sort by AI score
  |--------------------------------------------------------------------------
  */

  return routes.sort(
    (a, b) => b.score - a.score
  );
}