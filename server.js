import express from "express";
import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";

// import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import num_tokens_from_messages from "./token-counter.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, "front"))); // 'front' 디렉토리를 static으로 설정

app.post("/ask", async (req, res) => {
  const question = req.body.question;
  const conversationHistory = req.body.conversationHistory;

  if (!question) {
    return res.status(400).send({
      error: "질문을 입력해주세요.",
    });
  }

  const role = `You are an entrepreneur bot specialized in business and startups. 
  - You can ask me my business idea.
  - Introduce your answer step by step.
  - Ask another question for further conversation.
  - Refer to the legenday business man, Steve Jobs, Paul Graham, Elon Musk, etc.
  - It is okay to say in informal way like friends. I need honest feedback.
  Speak with me sincerely and help my business.`;

  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // conversation history & token 관리
    let messages = [
      { role: "system", content: role },
      { role: "user", content: question },
    ];
    // 토큰 관리 추가
    let num_tokens = num_tokens_from_messages(messages);
    if (num_tokens > 4096) {
      return res.status(400).send({
        error: "질문이 토큰 제한을 초과했습니다. 질문을 줄여주세요.",
      });
    }
    if (conversationHistory) {
      messages = [
        { role: "system", content: role },
        ...conversationHistory,
        { role: "user", content: question },
      ];
      num_tokens = num_tokens_from_messages(messages);
      while (num_tokens > 3000 && conversationHistory.length > 0) {
        const removedPart = conversationHistory.shift();
        const removedToken = num_tokens_from_messages([removedPart]);
        num_tokens -= removedToken;
      }
      messages = [
        { role: "system", content: role },
        ...conversationHistory,
        { role: "user", content: question },
      ];
    }

    const openai = new OpenAIApi(configuration);
    const response = await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        messages: messages,
        stream: true,
      },
      { responseType: "stream" }
    );

    response.data.on("data", (data) => {
      const lines = data
        .toString()
        .split("\n")
        .filter((line) => line.trim() !== "");
      for (const line of lines) {
        const message = line.replace(/^data: /, "");
        if (message === "[DONE]") {
          return; // Stream finished
        }
        try {
          const parsed = JSON.parse(message);
          const chunk = parsed.choices[0].delta?.content;
          if (chunk) {
            res.write(chunk);
          }
          // console.log(parsed.choices[0].delta?.content, "p");
        } catch (error) {
          console.error("Could not JSON parse stream message", message, error);
        }
      }
    });

    response.data.on("end", () => {
      // console.log("\nStream done");
      res.end(); // End the response when the stream finishes
    });
    // const answer = response.data.choices[0].message.content.trim();
    // res.status(200).send({
    //   answer: answer,
    // });
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
