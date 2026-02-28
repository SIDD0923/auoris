import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === "your-groq-api-key-here") {
      return NextResponse.json(
        {
          error:
            "Groq API key not configured. Get a free key at https://console.groq.com/keys and add it to .env.local",
        },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const { messages, fileContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    // Build system prompt with optional file context
    const systemParts = [
      "You are an expert AI coding assistant embedded in a VS Code-style IDE called Auris IDE.",
      "Your capabilities:",
      "- Debug code and identify issues",
      "- Explain errors clearly with fixes",
      "- Suggest improvements and optimizations",
      "- Generate code snippets",
      "- Refactor code following best practices",
      "",
      "Rules:",
      "- Be concise but thorough",
      "- Use markdown formatting with code blocks (specify language)",
      "- When showing code fixes, use diff-style or show the corrected code",
      "- Always explain WHY something is wrong, not just what to fix",
    ];

    if (fileContext) {
      systemParts.push(
        "",
        `The user currently has this file open: **${fileContext.fileName}** (${fileContext.language})`,
        "",
        "```" + fileContext.language,
        fileContext.content,
        "```",
        "",
        "Reference this file when relevant to the user's question."
      );
    }

    const apiMessages = [
      { role: "system" as const, content: systemParts.join("\n") },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: apiMessages,
      temperature: 0.4,
      max_tokens: 2048,
    });

    const reply =
      completion.choices[0]?.message?.content ?? "No response generated.";

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error("Groq API error:", error);

    const errMsg =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    if (errMsg.includes("Invalid API Key") || errMsg.includes("401")) {
      return NextResponse.json(
        { error: "Invalid API key. Check your GROQ_API_KEY in .env.local" },
        { status: 401 }
      );
    }
    if (errMsg.includes("429") || errMsg.includes("rate_limit")) {
      return NextResponse.json(
        { error: "Rate limited. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
