import { NextResponse } from "next/server";
import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shortenedUrl = searchParams.get("url");

    console.log("Received shortened URL:", shortenedUrl);

    if (!shortenedUrl) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // First, resolve the shortened URL
    const fullUrl = `https://maps.app.goo.gl/${shortenedUrl}`;
    console.log("Attempting to resolve:", fullUrl);

    const response = await fetch(fullUrl, {
      method: "GET",
      redirect: "follow",
    });

    const resolvedUrl = response.url;
    console.log("Resolved to:", resolvedUrl);

    // Parse the resolved URL to extract place_id
    const urlObj = new URL(resolvedUrl);
    let placeId = urlObj.searchParams.get("place_id");

    // If no place_id in params, try to extract from path
    if (!placeId) {
      const matches = resolvedUrl.match(/place\/([^\/]+)/);
      if (matches && matches[1]) {
        placeId = matches[1];
      }
    }

    console.log("Extracted place_id:", placeId);

    if (!placeId) {
      return NextResponse.json(
        { error: "Could not extract place ID" },
        { status: 400 }
      );
    }

    // Get place details using Places API
    const placeDetails = await client.placeDetails({
      params: {
        place_id: placeId,
        fields: ["formatted_address", "geometry"],
        key: process.env.GOOGLE_MAPS_API_KEY!,
      },
    });

    console.log("Place details retrieved:", placeDetails.data.result);

    return NextResponse.json({
      formatted_address: placeDetails.data.result.formatted_address,
      location: placeDetails.data.result.geometry?.location,
    });
  } catch (error) {
    console.error("Error resolving place:", error);
    return NextResponse.json(
      {
        error: "Failed to resolve place",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
