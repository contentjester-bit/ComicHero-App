import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

interface ListingGeneratorRequest {
  volumeName: string;
  issueNumber: string;
  condition: string;
  coverDate?: string;
  creators?: Array<{ name: string; role: string }>;
  firstAppearances?: string[];
  description?: string;
  mode?: "listing" | "story" | "curate";
}

interface GeneratedListing {
  title: string;
  description: string;
  keywords: string[];
  bestTimeToList: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ListingGeneratorRequest = await request.json();
    const mode = body.mode || "listing";

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false, data: null,
        error: "OpenAI API not configured. Add OPENAI_API_KEY to Vercel environment variables.",
      } as ApiResponse<null>, { status: 400 });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "story") {
      systemPrompt = "You are a passionate comic book historian and expert dealer. You tell compelling stories about why comics matter, their cultural significance, and why collectors should care. You connect storylines, explain character arcs, and make people excited about comics.";
      userPrompt = `Tell me a compelling story about ${body.volumeName} #${body.issueNumber}.

Context:
- Cover Date: ${body.coverDate || "Unknown"}
- Creators: ${body.creators?.map(c => `${c.name} (${c.role})`).join(", ") || "Unknown"}
- First Appearances: ${body.firstAppearances?.join(", ") || "None"}
- Synopsis: ${body.description || "No description available"}

Write 2-3 paragraphs that:
1. Explain WHY this issue matters to collectors
2. Connect it to broader storylines and character history
3. Explain what makes it cool, collectible, and desirable
4. Note any ties to movies, TV, or pop culture

Be enthusiastic but honest. Make the reader WANT this comic.

Respond as JSON: { "title": "short title", "description": "the story text", "keywords": ["keyword1"], "bestTimeToList": "timing advice" }`;
    } else if (mode === "curate") {
      systemPrompt = "You are a comic book curator and historian. You explain reading orders, story connections, and why certain issues matter in the context of larger narratives. Think of yourself as an expert guide helping someone understand the Marvel/DC universe.";
      userPrompt = `Explain the reading order and story connections for: ${body.volumeName}

Issues covered: ${body.description}

Write 3-4 paragraphs that:
1. Set the historical context for this reading arc
2. Explain how these issues connect to each other
3. Note major story moments and why they changed comics
4. Give advice on what to look for when reading

Respond as JSON: { "title": "${body.volumeName} — Reading Guide", "description": "the full narrative guide", "keywords": [], "bestTimeToList": "" }`;
    } else {
      // Standard listing mode
      systemPrompt = "You are an expert comic book dealer who writes compelling, accurate eBay listings. Always be honest about condition and highlight what makes each book special.";
      userPrompt = `Create a professional eBay listing for:
- Title: ${body.volumeName} #${body.issueNumber}
- Condition: ${body.condition}
- Cover Date: ${body.coverDate || "Unknown"}
- Creators: ${body.creators?.map(c => `${c.name} (${c.role})`).join(", ") || "Unknown"}
- First Appearances: ${body.firstAppearances?.join(", ") || "None"}
- Description: ${body.description || "No description available"}

Generate:
1. SEO-optimized eBay title (80 chars max) — include series, issue #, key info, year, condition
2. Compelling description (300-400 words) — condition details, key appearances, creator significance, why it's desirable
3. 10 search keywords
4. Best time to list

Respond as JSON:
{
  "title": "Amazing Spider-Man #129 1st Punisher VF/NM Marvel 1974",
  "description": "Full listing description...",
  "keywords": ["spider-man", "punisher"],
  "bestTimeToList": "Thursday 7-9pm EST"
}`;
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: mode === "listing" ? 0.7 : 0.8,
        max_tokens: 1200,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.statusText} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedText = openaiData.choices[0].message.content;

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse GPT-4 response");

    const listing: GeneratedListing = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ success: true, data: listing, error: null } as ApiResponse<GeneratedListing>);
  } catch (error) {
    console.error("Listing generator error:", error);
    return NextResponse.json({
      success: false, data: null,
      error: error instanceof Error ? error.message : "Failed to generate listing",
    } as ApiResponse<null>, { status: 500 });
  }
}
