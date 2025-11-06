
import { GoogleGenAI, Modality } from "@google/genai";
import type { AspectRatio } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an image using the Imagen model based on a text prompt.
 * @param prompt The text prompt to generate the image from.
 * @param aspectRatio The desired aspect ratio of the generated image.
 * @returns A promise that resolves to the base64 encoded image string.
 */
export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      if (base64ImageBytes) {
        return base64ImageBytes;
      }
    }
    throw new Error('No image was generated. The response might have been blocked.');
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image. Please check the prompt or try again later.');
  }
};

/**
 * Edits an existing image based on a text prompt.
 * @param prompt The editing instruction.
 * @param imageDataBase64 The base64 encoded string of the image to edit.
 * @param mimeType The MIME type of the image (e.g., 'image/png', 'image/jpeg').
 * @returns A promise that resolves to the base64 encoded string of the edited image.
 */
export const editImage = async (prompt: string, imageDataBase64: string, mimeType: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: imageDataBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error('No edited image was returned. The response might have been blocked.');
  } catch (error) {
    console.error('Error editing image:', error);
    throw new Error('Failed to edit image. Please check your instructions or try again later.');
  }
};
