import { GoogleGenAI, Type } from "@google/genai";
import { COLS, ROWS } from "../game/constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateLevel(prompt: string): Promise<string[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `スーパーマリオメーカーのような2Dプラットフォーマーゲームのステージを生成してください。
    幅${COLS}、高さ${ROWS}のグリッドです。
    以下の文字を使用してください：
    . : 空白
    X : ブロック（足場、壁）
    P : プレイヤーの初期位置（必ず1つ）
    G : ゴール（必ず1つ）
    S : トゲ（当たるとミス）

    ユーザーのリクエスト: ${prompt}
    
    必ずPとGを1つずつ含めてください。
    クリア可能な配置にしてください。
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        },
        description: `${ROWS}行の文字列配列。各文字列は${COLS}文字。`
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    // Validate
    if (Array.isArray(data) && data.length === ROWS && data[0].length === COLS) {
      return data;
    }
    throw new Error("Invalid format");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw e;
  }
}
