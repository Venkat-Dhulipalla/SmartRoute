import { NextResponse } from "next/server";
import { optimizeRoute } from "@/lib/services/routeOptimizer";

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key is not configured");
    }

    const data = await request.json();

    if (!data.currentLocation || !data.passengers || !data.passengers.length) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const optimizedRoute = await optimizeRoute(data);
    return NextResponse.json(optimizedRoute);
  } catch (error) {
    console.error("API route error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to optimize route";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
