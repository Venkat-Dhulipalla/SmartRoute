import { Client } from "@googlemaps/google-maps-services-js";

const client = new Client({});

function extractPlaceInfoFromURL(url: string): {
  placeId?: string;
  name?: string;
} {
  try {
    const urlObj = new URL(url);

    // Extract place ID from URL path
    const placeMatch = url.match(/place\/([^\/]+)/);
    if (placeMatch) {
      const placePath = placeMatch[1];

      // Extract place ID if it exists in the format "name:placeId"
      const placeIdMatch = placePath.match(/:([^:]+)$/);
      if (placeIdMatch) {
        return { placeId: placeIdMatch[1] };
      }

      // If no place ID, try to get the place name
      const name = placePath.split("/")[0];
      return { name: decodeURIComponent(name) };
    }

    // Try to get from search params
    const placeId = urlObj.searchParams.get("place_id");
    if (placeId) {
      return { placeId };
    }

    return {};
  } catch (error) {
    console.error("Error parsing URL:", error);
    return {};
  }
}

export async function getAddressFromShortUrl(
  shortUrl: string
): Promise<string | null> {
  try {
    // First, get the expanded URL
    const response = await fetch(shortUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const expandedUrl = response.url;
    console.log("Expanded URL:", expandedUrl);

    // Extract place info from the expanded URL
    const { placeId, name } = extractPlaceInfoFromURL(expandedUrl);
    console.log("Extracted place info:", { placeId, name });

    if (placeId) {
      // Use place ID to get details
      const placeResponse = await client.placeDetails({
        params: {
          place_id: placeId,
          fields: ["formatted_address"],
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      if (placeResponse.data.result?.formatted_address) {
        return placeResponse.data.result.formatted_address;
      }
    }

    if (name) {
      // Search for place by name
      const searchResponse = await client.findPlaceFromText({
        params: {
          input: name,
          inputtype: "textquery",
          fields: ["formatted_address"],
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      if (searchResponse.data.candidates?.[0]?.formatted_address) {
        return searchResponse.data.candidates[0].formatted_address;
      }
    }

    // If all else fails, try to extract coordinates and reverse geocode
    const coordsMatch = expandedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordsMatch) {
      const [, lat, lng] = coordsMatch;
      const geocodeResponse = await client.reverseGeocode({
        params: {
          latlng: { lat: parseFloat(lat), lng: parseFloat(lng) },
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      if (geocodeResponse.data.results?.[0]?.formatted_address) {
        return geocodeResponse.data.results[0].formatted_address;
      }
    }

    return null;
  } catch (error) {
    console.error("Error processing short URL:", error);
    return null;
  }
}
