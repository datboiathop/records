import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface AlbumData {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  releaseDate: string;
  tracks: string[];
}

export async function searchAlbum(query: string): Promise<AlbumData | null> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Search for the music album: "${query}". Provide detailed information in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique slug for the album" },
          title: { type: Type.STRING },
          artist: { type: Type.STRING },
          coverUrl: { type: Type.STRING, description: "A high-quality cover image URL (use picsum if unknown)" },
          releaseDate: { type: Type.STRING },
          tracks: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["id", "title", "artist", "coverUrl", "tracks"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return data as AlbumData;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return null;
  }
}
