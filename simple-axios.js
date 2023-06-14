const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

axios
  .post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "안녕 AI",
        },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    }
  )
  .then((response) => {
    console.log(response.data.choices[0].message.content);
  })
  .catch((error) => {
    console.error(error.resonse);
  });
