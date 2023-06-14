import express from "express";
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import cors from "cors";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.post("/ask", async (req, res) => {
  const question = req.body.question;

  let role = req.body.role;
  if (!role) {
    role = "You are a helpful assistant chatbot.";
  }

  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages = [
      { role: "system", content: role },
      { role: "user", content: question },
    ];

    const openai = new OpenAIApi(configuration);
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });
    const answer = response.data.choices[0].message.content.trim();
    res.status(200).send({
      answer: answer,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({
      error: "ChatGPT 통신 중 에러가 발생했습니다.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
