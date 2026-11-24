import dotenv from "dotenv";

dotenv.config();

const BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta";

export async function generateGeminiResponse(prompt) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing.");
    }

    const models = [
        process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
        process.env.GEMINI_FALLBACK_MODEL?.trim() || "gemini-2.5-flash-lite"
    ];

    let lastError;

    for (const configuredModel of [...new Set(models)]) {
        const model = configuredModel.replace(/^models\//, "");

        try {
            console.log("REQUESTING GEMINI:", model);

            const response = await fetch(
                `${BASE_URL}/models/${model}:generateContent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    {
                                        text: prompt
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            temperature: 0.5,
                            maxOutputTokens: 2048
                        }
                    }),
                    signal: AbortSignal.timeout(20000)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(
                    data.error?.message ||
                    "Gemini request failed."
                );

                error.status = response.status;

                throw error;
            }

            const reply = data.candidates?.[0]
                ?.content?.parts
                ?.filter((part) => !part.thought)
                ?.map((part) => part.text || "")
                ?.join("")
                ?.trim();

            if (!reply) {
                throw new Error("Gemini returned an empty response.");
            }

            console.log("GEMINI SUCCESS:", model);

            return reply;

        } catch (error) {
            lastError = error;

            console.error("GEMINI ERROR:", {
                model,
                status: error.status,
                message: error.message
            });

            if ([401, 403].includes(error.status)) {
                throw error;
            }
        }
    }

    throw lastError || new Error("Gemini AI is unavailable.");
}

export default generateGeminiResponse;