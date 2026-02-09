import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/requireAuth";

export const ocrRouter = Router();

// Extract amount from receipt image using Google Cloud Vision
ocrRouter.post("/extract", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { imageUrl } = req.body as { imageUrl?: string };

    if (!imageUrl) {
      return res.status(400).json({ error: "Missing imageUrl" });
    }

    // Use Google Cloud Vision API
    const { ImageAnnotatorClient } = require("@google-cloud/vision");
    const client = new ImageAnnotatorClient();

    const [result] = await client.textDetection(imageUrl);
    const detections = result.textAnnotations;

    if (!detections || detections.length === 0) {
      return res.json({ amount: null, rawText: "", message: "No text detected" });
    }

    const rawText = detections[0].description || "";

    // Parse for amount patterns (Nigerian Naira)
    // Matches patterns like: ₦1,500.00, NGN 1500, N1,500, 1,500.00, Total: 1500
    const amountPatterns = [
      /(?:₦|NGN|N)\s*([\d,]+(?:\.\d{2})?)/gi,
      /(?:total|amount|sum|grand\s*total|subtotal)\s*:?\s*(?:₦|NGN|N)?\s*([\d,]+(?:\.\d{2})?)/gi,
      /(?:₦|NGN|N)\s*([\d,]+)/gi,
    ];

    let largestAmount = 0;

    for (const pattern of amountPatterns) {
      let match;
      while ((match = pattern.exec(rawText)) !== null) {
        const amountStr = match[1].replace(/,/g, "");
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > largestAmount) {
          largestAmount = amount;
        }
      }
    }

    // Fallback: find the largest number in text that could be an amount
    if (largestAmount === 0) {
      const numberPattern = /\b([\d,]+(?:\.\d{2})?)\b/g;
      let match;
      while ((match = numberPattern.exec(rawText)) !== null) {
        const amountStr = match[1].replace(/,/g, "");
        const amount = parseFloat(amountStr);
        // Only consider amounts in a reasonable range (100 - 10,000,000)
        if (!isNaN(amount) && amount >= 100 && amount <= 10000000 && amount > largestAmount) {
          largestAmount = amount;
        }
      }
    }

    return res.json({
      amount: largestAmount > 0 ? largestAmount : null,
      rawText: rawText.substring(0, 500),
    });
  } catch (error) {
    console.error("OCR error:", error);
    return res.status(500).json({ error: "OCR processing failed" });
  }
});
