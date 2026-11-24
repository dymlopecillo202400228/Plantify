import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY?.trim();

async function checkGemini() {
    try {
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing.");
        }

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models",
            {
                headers: {
                    "x-goog-api-key": apiKey
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message || "Request failed."
            );
        }

        const models = (data.models || [])
            .filter((model) =>
                model.supportedGenerationMethods?.includes(
                    "generateContent"
                )
            );

        console.log("GEMINI CONNECTION SUCCESSFUL");
        console.log("AVAILABLE MODELS:");

        models.forEach((model) => {
            console.log(
                model.name.replace(/^models\//, "")
            );
        });

    } catch (error) {
        console.error("GEMINI ERROR:", error.message);
    }
}

checkGemini();