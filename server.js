import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import hpp from "hpp";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import OpenAI from "openai";
// import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

import num_tokens_from_messages from "./token-counter.js";

dotenv.config();

const app = express();
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 60,
  handler: function (req, res) {
    res
      .status(429)
      .send({ error: "Too many requests, please try again later." });
  },
});
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, "front"))); // 'front' 디렉토리를 static으로 설정
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
  app.use(helmet());
  app.use(hpp());
} else {
  app.use(morgan("dev"));
}

app.use("/ask", limiter); // ask 경로에 대해서 rate limiter 적용
app.post("/ask", async (req, res) => {
  const question = req.body.question;
  const conversationHistory = req.body.conversationHistory;

  if (!question) {
    return res.status(400).send({
      error: "질문을 입력해주세요.",
    });
  }

  const role = `You are an entrepreneur bot specialized in business and startups. 

  - You ask me my business idea.
  - Introduce your answer or advice step by step.
  - Ask another question for further conversation.
  - Refer to the legenday business man, Steve Jobs, Paul Graham, Elon Musk, etc.
  - It is okay to say in informal way like friends. I need honest feedback.

  Speak with me sincerely and help my business.`;

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    // conversation history & token 관리
    let messages = [{ role: "system", content: role }];
    if (conversationHistory) {
      messages.push(...conversationHistory);
    }
    messages.push({ role: "user", content: question });

    // 토큰 관리 추가
    let { num_tokens, token_map } = num_tokens_from_messages(messages);
    const roleToken = token_map[0].num_token;
    const userToken = token_map[token_map.length - 1].num_token;
    const TOKEN_LIMIT = 4096;
    const TOKEN_LIMIT_CONVERSATION = 300;

    if (roleToken + userToken > TOKEN_LIMIT) {
      return res.status(400).send({
        error: "질문이 토큰 제한을 초과했습니다. 질문을 줄여주세요.",
      });
    }
    if (
      num_tokens > TOKEN_LIMIT_CONVERSATION &&
      conversationHistory.length > 0
    ) {
      // token map would like [ {system: 2}, {user: 3}, {assistant: 20}, {user, 4}, ... ]
      // first system message 와 last user message는 지우지 않는다.
      // find cut point, messages의 num_tokens에서 message의 숫자를 빼면서 잘라낼 배열의 포인트를 찾는다.
      let cut_point = 0;
      for (let i = 1; i < token_map.length - 1; i++) {
        const token = token_map[i];
        let num_token = token.num_token;
        num_tokens -= num_token;
        if (num_tokens < TOKEN_LIMIT_CONVERSATION) {
          cut_point = i;
          break;
        }
      }
      if (cut_point > 0) {
        messages = messages.slice(cut_point + 1);
        messages = [{ role: "system", content: role }].concat(messages);
      } else {
        messages = [
          { role: "system", content: role },
          {
            role: "user",
            content: question,
          },
        ];
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      stream: true,
    });

    async function processStream(response, res) {
      try {
        for await (const chunk of response.iterator()) {
          try {
            const content = chunk.choices[0].delta.content;
            if (content) {
              res.write(content); // 클라이언트에게 content 내용 전송
            }
          } catch (error) {
            console.error("Error processing chunk:", error);
          }
        }
      } catch (error) {
        console.error("Stream error:", error);
        res.status(500).end();
      }
      res.end(); // 스트림 처리 완료 후 연결 종료
    }

    processStream(response, res);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      error: "서버 오류가 발생했습니다.",
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
