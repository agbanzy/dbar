import * as functions from "firebase-functions";
import { createApp } from "./app";

const app = createApp();

// Export as Firebase Cloud Function
export const api = functions.https.onRequest(app);
