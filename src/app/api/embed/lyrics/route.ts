import { NextResponse } from "next/server";
import { openai } from "@/server/openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lyrics } = body;

    if (!lyrics || typeof lyrics !== "string" || lyrics.trim().length === 0) {
      return NextResponse.json(
        { error: "lyrics is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    // Generate embedding using OpenAI
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: lyrics.trim(),
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding) {
      return NextResponse.json(
        { error: "Failed to generate embedding" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      embedding,
      dimensions: embedding.length,
      model: "text-embedding-3-large",
    });
  } catch (error) {
    console.error("Lyrics embedding error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate embedding", details: errorMessage },
      { status: 500 },
    );
  }
}

