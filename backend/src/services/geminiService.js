import dotenv from "dotenv";

dotenv.config();

const BASE_URL =
    "https://generativelanguage.googleapis.com/v1beta";

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

export async function generateGeminiResponse(prompt) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing.");
    }

    const models = [
        process.env.GEMINI_MODEL || "gemini-3.8-flash",
        process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite"
    ]
        .map((model) =>
            model.trim().replace(/^models\//, "")
        )
        .filter(Boolean);

    const uniqueModels = [...new Set(models)];

    let lastError;

    for (const model of uniqueModels) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                console.log("REQUESTING GEMINI:", model);
                console.log("ATTEMPT:", attempt + 1);

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
                        signal: AbortSignal.timeout(10000)
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
                    throw new Error(
                        "Gemini returned an empty response."
                    );
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

                const retryable =
                    [500, 502, 503, 504].includes(error.status) ||
                    error.name === "TimeoutError";

                if (retryable && attempt < 2) {
                    const delay =
                        1000 * Math.pow(2, attempt) +
                        Math.floor(Math.random() * 500);

                    console.log(
                        "RETRYING GEMINI IN:",
                        delay,
                        "ms"
                    );

                    await sleep(delay);

                    continue;
                }

                break;
            }
        }

        console.log("SWITCHING GEMINI MODEL...");
    }

    throw lastError ||
        new Error("Gemini AI is temporarily unavailable.");
}

export default generateGeminiResponse;