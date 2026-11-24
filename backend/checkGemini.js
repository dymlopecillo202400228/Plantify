import dotenv from "dotenv";

import {
  generateGeminiResponse
} from "./src/services/geminiService.js";

dotenv.config();

async function checkGemini() {
  console.log("==========================");
  console.log("TESTING PLANTIFY GEMINI AI");
  console.log("==========================");

  if (!process.env.GEMINI_API_KEY) {
    console.error("API KEY IS MISSING.");
    return;
  }

  console.log("API KEY IS CONFIGURED.");

  console.log(
    "PRIMARY MODEL:",
    process.env.GEMINI_MODEL
  );

  console.log(
    "FALLBACK MODEL:",
    process.env.GEMINI_FALLBACK_MODEL
  );

  try {
    const reply = await generateGeminiResponse(
      "Recommend three beginner-friendly indoor plants."
    );

    console.log("==========================");
    console.log("GEMINI IS WORKING!");
    console.log("==========================");

    console.log(reply);

  } catch (error) {
    console.error("==========================");
    console.error("GEMINI TEST FAILED");

    console.error(
      "STATUS:",
      error.status || "Unknown"
    );

    console.error(
      "MESSAGE:",
      error.message
    );

    console.error("==========================");

    if (error.status === 503) {
      console.log(
        "Gemini is temporarily unavailable."
      );

      console.log(
        "Please try again later."
      );
    }
  }
}

checkGemini();