"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OptimizedRoute {
  totalDistance: string;
  totalTime: string;
  waypoints: Array<{
    order: number;
    location: string;
    type: string;
  }>;
  googleMapsUrl: string;
}

export default function ResultsClient() {
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(
    null
  );
  const searchParams = useSearchParams();

  useEffect(() => {
    const routeData = searchParams.get("routeData");
    if (routeData) {
      setOptimizedRoute(JSON.parse(routeData));
    }
  }, [searchParams]);

  if (!optimizedRoute) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Optimized Route</h1>
      <Card>
        <CardHeader>
          <CardTitle>Route Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total Distance: {optimizedRoute.totalDistance}</p>
          <p>Total Time: {optimizedRoute.totalTime}</p>
          <h2 className="text-xl font-semibold mt-4 mb-2">Waypoints:</h2>
          <ul>
            {optimizedRoute.waypoints.map((waypoint, index) => (
              <li key={index}>
                {waypoint.order}. {waypoint.location} ({waypoint.type})
              </li>
            ))}
          </ul>
          <Button
            className="mt-4"
            onClick={() => window.open(optimizedRoute.googleMapsUrl, "_blank")}
          >
            Open in Google Maps
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
