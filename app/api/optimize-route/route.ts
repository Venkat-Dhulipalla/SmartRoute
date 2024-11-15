import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const data = await request.json();

  // Here you would typically call the Google Maps API to optimize the route
  // For this example, we'll just return a mock response

  const mockOptimizedRoute = {
    totalDistance: "50 km",
    totalTime: "1 hour 30 minutes",
    waypoints: data.passengers
      .map((passenger: any, index: number) => ({
        order: index + 1,
        location: passenger.pickup,
        type: "pickup",
      }))
      .concat(
        data.passengers.map((passenger: any, index: number) => ({
          order: data.passengers.length + index + 1,
          location: passenger.dropoff,
          type: "dropoff",
        }))
      ),
    googleMapsUrl: `https://www.google.com/maps/dir/${encodeURIComponent(
      data.currentLocation
    )}/${data.passengers
      .map((p: any) => encodeURIComponent(p.pickup))
      .join("/")}/${data.passengers
      .map((p: any) => encodeURIComponent(p.dropoff))
      .join("/")}`,
  };

  return NextResponse.json(mockOptimizedRoute);
}
