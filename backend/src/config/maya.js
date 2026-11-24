import dotenv from "dotenv";

dotenv.config();

export const mayaConfig = {
  baseUrl:
    process.env.MAYA_BASE_URL ||
    "https://pg-sandbox.paymaya.com",

  publicKey: process.env.MAYA_PUBLIC_KEY,

  secretKey: process.env.MAYA_SECRET_KEY,

  frontendUrl:
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
};