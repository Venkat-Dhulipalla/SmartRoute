"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Apple, MapPin } from "lucide-react";

interface OptimizedRoute {
  totalDistance: string;
  totalTime: string;
  waypoints: Array<{
    order: number;
    location: string;
    type: string;
  }>;
  googleMapsUrl: string;
  appleMapsUrl: string;
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
          <ul className="space-y-2">
            {optimizedRoute.waypoints.map((waypoint, index) => (
              <li key={index} className="flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 mr-2 text-sm font-semibold text-white bg-primary rounded-full">
                  {waypoint.order}
                </span>
                {waypoint.location} ({waypoint.type})
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button
              className="flex items-center justify-center"
              onClick={() =>
                window.open(optimizedRoute.googleMapsUrl, "_blank")
              }
            >
              <MapPin className="w-4 h-4 mr-2" />
              Open in Google Maps
            </Button>
            <Button
              className="flex items-center justify-center"
              variant="outline"
              onClick={() => window.open(optimizedRoute.appleMapsUrl, "_blank")}
            >
              <Apple className="w-4 h-4 mr-2" />
              Open in Apple Maps
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
