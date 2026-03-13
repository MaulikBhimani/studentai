import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function askGemini(question, context) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const systemPrompt = `You are a helpful university portal assistant. Answer the student's question only using the provided portal data context. If the information does not exist in the dataset, clearly say it was not found. Keep answers concise and helpful.`;
  
  const prompt = `${systemPrompt}\n\nContext:\n${context}\n\nQuestion: ${question}\nAnswer:`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
