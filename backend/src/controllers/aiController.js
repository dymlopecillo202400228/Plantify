import { chatWithAI} from "../services/aiService.js";

export const chat = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message."
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long."
      });
    }

    const result = await chatWithAI(message);

    return res.status(200).json(result);

  } catch (error) {
    console.error(
      "AI CONTROLLER ERROR:",
      error.message
    );

    return res.status(
      error.status === 400 ? 400 : 500
    ).json({
      success: false,
      message:
        error.status === 400
          ? error.message
          : "Unable to process your request."
    });
  }
};