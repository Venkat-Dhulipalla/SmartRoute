import { NextResponse } from "next/server";
import { getAddressFromShortUrl } from "@/lib/utils/mapUrlParser";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    console.log("Processing URL:", url);

    const address = await getAddressFromShortUrl(url);

    if (address) {
      return NextResponse.json({ address });
    }

    return NextResponse.json(
      { error: "Could not extract address from URL" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Failed to process URL" },
      { status: 500 }
    );
  }
}
