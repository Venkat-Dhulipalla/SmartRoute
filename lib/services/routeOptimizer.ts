import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

interface Location {
  pickup: string;
  dropoff: string;
  priority: number;
}

interface OptimizationRequest {
  currentLocation: string;
  passengers: Location[];
}

interface Waypoint {
  location: string;
  type: "start" | "pickup" | "dropoff";
  passengerId?: number;
  priority?: number;
}

function calculateTotalDistance(
  route: Waypoint[],
  matrixRows: google.maps.DistanceMatrixResponse["rows"]
): number {
  let totalDistance = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const element = matrixRows[i].elements[i + 1];
    if (element.status === "OK") {
      totalDistance += element.distance.value;
    }
  }

  return totalDistance;
}

function calculateTotalDuration(
  route: Waypoint[],
  matrixRows: google.maps.DistanceMatrixResponse["rows"]
): number {
  let totalDuration = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const element = matrixRows[i].elements[i + 1];
    if (element.status === "OK") {
      totalDuration += element.duration.value;

      // Add stop duration based on type
      if (route[i].type === "pickup") {
        totalDuration += 3 * 60; // 3 minutes for pickup
      } else if (route[i].type === "dropoff") {
        totalDuration += 2 * 60; // 2 minutes for dropoff
      }
    }
  }

  return totalDuration;
}

export async function optimizeRoute(data: OptimizationRequest) {
  try {
    // Create waypoints array with priorities
    const waypoints: Waypoint[] = [
      { location: data.currentLocation, type: "start" },
      ...data.passengers.flatMap((passenger, index) => [
        {
          location: passenger.pickup,
          type: "pickup",
          passengerId: index,
          priority: passenger.priority,
        },
        {
          location: passenger.dropoff,
          type: "dropoff",
          passengerId: index,
          priority: passenger.priority,
        },
      ]),
    ];

    // Get distance matrix
    const matrix = await client.distancematrix({
      params: {
        origins: waypoints.map((wp) => wp.location),
        destinations: waypoints.map((wp) => wp.location),
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    // Optimize route considering priorities
    const optimizedRoute = optimizeRouteOrder(waypoints, matrix.data.rows);

    // Calculate total distance and duration
    const totalDistance = calculateTotalDistance(
      optimizedRoute,
      matrix.data.rows
    );
    const totalDuration = calculateTotalDuration(
      optimizedRoute,
      matrix.data.rows
    );

    // Generate map URLs
    const googleMapsUrl = generateGoogleMapsUrl(optimizedRoute);
    const appleMapsUrl = generateAppleMapsUrl(optimizedRoute);

    return {
      waypoints: optimizedRoute.map((wp, index) => ({
        order: index + 1,
        location: wp.location,
        type: wp.type,
      })),
      totalDistance: formatDistance(totalDistance),
      totalTime: formatDuration(totalDuration),
      googleMapsUrl,
      appleMapsUrl,
    };
  } catch (error) {
    console.error("Route optimization failed:", error);
    throw error;
  }
}

function optimizeRouteOrder(
  waypoints: Waypoint[],
  distanceMatrix: google.maps.DistanceMatrixResponse["rows"]
) {
  const optimized = [...waypoints];
  let improved = true;

  while (improved) {
    improved = false;
    for (let i = 1; i < optimized.length - 1; i++) {
      for (let j = i + 1; j < optimized.length; j++) {
        if (isValidSwap(optimized, i, j)) {
          const currentCost = calculateSwapCost(
            optimized,
            distanceMatrix,
            i,
            j
          );

          // Temporarily swap positions
          [optimized[i], optimized[j]] = [optimized[j], optimized[i]];
          const newCost = calculateSwapCost(optimized, distanceMatrix, i, j);

          // If new cost is worse, swap back
          if (newCost > currentCost) {
            [optimized[i], optimized[j]] = [optimized[j], optimized[i]];
          } else {
            improved = true;
          }
        }
      }
    }
  }

  return optimized;
}

function isValidSwap(route: Waypoint[], i: number, j: number): boolean {
  const a = route[i];
  const b = route[j];

  // Don't swap start point
  if (a.type === "start" || b.type === "start") return false;

  // Check priority constraints
  if (a.priority !== b.priority) {
    return a.priority! >= b.priority!;
  }

  // Ensure pickup comes before dropoff for same passenger
  if (a.passengerId === b.passengerId) {
    if (a.type === "pickup" && b.type === "dropoff") return false;
  }

  return true;
}

function calculateSwapCost(
  route: Waypoint[],
  matrix: google.maps.DistanceMatrixResponse["rows"],
  i: number,
  j: number
): number {
  let cost = 0;
  const start = Math.max(0, i - 1);
  const end = Math.min(route.length - 1, j + 1);

  for (let k = start; k < end; k++) {
    const element = matrix[k].elements[k + 1];
    cost += element.distance.value + (route[k].priority || 1) * 1000;
  }

  return cost;
}

function formatDistance(meters: number): string {
  const miles = meters * 0.000621371;
  return `${miles.toFixed(1)} miles`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
}

function generateGoogleMapsUrl(waypoints: Waypoint[]): string {
  const origin = encodeURIComponent(waypoints[0].location);
  const destination = encodeURIComponent(
    waypoints[waypoints.length - 1].location
  );
  const waypointsParam = waypoints
    .slice(1, -1)
    .map((wp) => encodeURIComponent(wp.location))
    .join("|");

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypointsParam}&travelmode=driving`;
}

function generateAppleMapsUrl(waypoints: Waypoint[]): string {
  return `http://maps.apple.com/?saddr=${encodeURIComponent(
    waypoints[0].location
  )}&daddr=${waypoints
    .slice(1)
    .map((wp) => encodeURIComponent(wp.location))
    .join("+")}`;
}
