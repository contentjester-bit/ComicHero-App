import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

interface ConditionGradingRequest {
  imageData: string; // Base64 encoded image
}

interface ConditionGrade {
  grade: string; // "NM", "VF/NM", "VF", "FN", "VG", "G", "P"
  numericGrade: number; // 9.8, 9.4, 8.0, etc.
  confidence: number; // 0-100
  issues: string[]; // ["Spine wear", "Corner crease", etc.]
  positives: string[]; // ["Clean cover", "No tears", etc.]
  gradingNotes: string;
  cgcEquivalent: string; // "CGC 9.4 equivalent"
  estimatedValue: string; // "Mid-grade example"
}

const GRADING_SCALE = {
  "10.0": "Gem Mint (GM)",
  "9.9": "Mint (MT)",
  "9.8": "Near Mint/Mint (NM/MT)",
  "9.6": "Near Mint+ (NM+)",
  "9.4": "Near Mint (NM)",
  "9.2": "Near Mint- (NM-)",
  "9.0": "Very Fine/Near Mint (VF/NM)",
  "8.5": "Very Fine+ (VF+)",
  "8.0": "Very Fine (VF)",
  "7.5": "Very Fine- (VF-)",
  "7.0": "Fine/Very Fine (FN/VF)",
  "6.5": "Fine+ (FN+)",
  "6.0": "Fine (FN)",
  "5.5": "Fine- (FN-)",
  "5.0": "Very Good/Fine (VG/FN)",
  "4.5": "Very Good+ (VG+)",
  "4.0": "Very Good (VG)",
  "3.5": "Very Good- (VG-)",
  "3.0": "Good/Very Good (G/VG)",
  "2.5": "Good+ (G+)",
  "2.0": "Good (G)",
  "1.5": "Fair/Good (FR/G)",
  "1.0": "Fair (FR)",
  "0.5": "Poor (P)",
};

export async function POST(request: NextRequest) {
  try {
    const { imageData }: ConditionGradingRequest = await request.json();

    if (!imageData) {
      throw new Error("No image data provided");
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "OpenAI API not configured. Add OPENAI_API_KEY to environment variables.",
      } as ApiResponse<null>, { status: 400 });
    }

    const prompt = `You are a professional comic book grader trained in CGC/CBCS standards. Analyze this comic book cover image and provide a detailed condition assessment.

Look for:
- Cover condition (tears, creases, color breaks)
- Spine condition (stress lines, splits, tears)
- Corners (wear, bends, creases)
- Surface quality (gloss, dirt, staining)
- Edge wear
- Any restoration or tape

Grade on CGC scale (0.5 to 10.0). Be conservative and realistic.

Respond in this JSON format:
{
  "numericGrade": 8.0,
  "grade": "VF",
  "confidence": 85,
  "issues": ["Minor spine stress", "Light corner wear"],
  "positives": ["Vibrant colors", "No tears", "Clean interior"],
  "gradingNotes": "Nice mid-grade copy with typical minor wear for age. Would likely grade CGC 8.0.",
  "cgcEquivalent": "CGC 8.0",
  "estimatedValue": "Mid to high grade example"
}`;

    // Call OpenAI Vision API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert comic book grader with 20 years experience. You grade conservatively and accurately following CGC standards."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent grading
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${openaiResponse.statusText} - ${errorData}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedText = openaiData.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse GPT-4 Vision response");
    }
    
    const gradeData: ConditionGrade = JSON.parse(jsonMatch[0]);

    // Add human-readable grade from scale
    const gradeKey = gradeData.numericGrade.toFixed(1);
    gradeData.grade = GRADING_SCALE[gradeKey as keyof typeof GRADING_SCALE] || gradeData.grade;

    const response: ApiResponse<ConditionGrade> = {
      success: true,
      data: gradeData,
      error: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Condition grading error:", error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to grade condition",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
