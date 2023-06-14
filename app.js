import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);
const chat = await openai.createChatCompletion({
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
console.log(chat.data.choices[0].message.content);
