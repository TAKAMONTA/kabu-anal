import OpenAI from "openai";

// OpenAI 繧ｯ繝ｩ繧､繧｢繝ｳ繝医・蛻晄悄蛹・
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;
