import { generateResponse } from "@/lib/services/species-chat";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    // Validate input
    if (
      !body ||
      typeof body !== "object" ||
      !("message" in body) ||
      typeof (body as { message: unknown }).message !== "string" ||
      (body as { message: string }).message.trim() === ""
    ) {
      return NextResponse.json({ error: "Invalid or missing message in request body." }, { status: 400 });
    }

    const { message } = body as { message: string };

    const response = await generateResponse(message.trim());
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to get response from AI provider." }, { status: 502 });
  }
}
