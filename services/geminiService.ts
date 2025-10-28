import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates or edits an image based on a text prompt and an optional source image.
 * @param prompt The text prompt to generate or edit an image from.
 * @param image Optional image data for editing.
 * @returns A data URL string of the generated image.
 */
export const generateOrEditImage = async (
  prompt: string,
  image?: { data: string; mimeType: string }
): Promise<string> => {
  try {
    // Case 1: Image Editing with gemini-2.5-flash-image
    if (image) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: image.data, mimeType: image.mimeType } },
            { text: prompt },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      // Find the image part in the response
      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart?.inlineData) {
        const base64ImageBytes = imagePart.inlineData.data;
        return `data:${imagePart.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
      throw new Error("API did not return an edited image.");
    }
    // Case 2: Text-to-Image Generation with imagen-4.0-generate-001
    else {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("API did not return any images.");
      }

      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      if (!base64ImageBytes) {
        throw new Error("Generated image data is empty.");
      }

      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
  } catch (error) {
    console.error("Error generating content with Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the content.");
  }
};