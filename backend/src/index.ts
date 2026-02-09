import dotenv from "dotenv";
import { createApp } from "./app";

dotenv.config();

const port = Number(process.env.PORT || 4000);
const app = createApp();

app.listen(port, "127.0.0.1", () => {
  console.log(`✅ DigiBar API running on http://localhost:${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔥 Using Firebase for auth and data`);
});
