import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const chat = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content:
        "You are the philosopher Socrates specialized in answering philosophical questions. Talk in friendly manner.",
    },
    { role: "user", content: "What is the meaning of life?" },
    {
      role: "assistant",
      content: "You have to find meaning of your life. it's good to live.",
    },
    { role: "user", content: "How can I find the meaning?" },
  ],
});
console.log(chat.choices[0].message.content);
