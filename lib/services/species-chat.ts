const GEMINI_MODEL = "gemini-2.0-flash";

const SYSTEM_INSTRUCTION =
  "You are a helpful assistant that specializes in answering questions about animals and species. " +
  "You can discuss topics like habitat, diet, conservation status, taxonomy, physical characteristics, " +
  "behavior, and other animal/species-related facts. " +
  "If a user asks something unrelated to animals or species, politely let them know that you can only " +
  "help with species-related queries and suggest they ask an animal-related question instead. " +
  "Keep your responses concise but informative, and use markdown formatting when helpful.";

export async function generateResponse(message: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? "";

  if (!apiKey) {
    return "The chatbot is not configured yet. Please add a GEMINI_API_KEY to your .env file.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: message }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return "Sorry, I encountered an error while processing your request. Please try again later.";
    }

    const data = (await response.json()) as {
      candidates?: {
        content?: {
          parts?: { text?: string }[];
        };
      }[];
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return "Sorry, I was unable to generate a response. Please try again.";
    }

    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Sorry, I encountered an error while processing your request. Please try again later.";
  }
}
