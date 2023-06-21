import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";

export default function num_tokens_from_messages(
  messages,
  model = "gpt-3.5-turbo-0301"
) {
  let encoding;
  try {
    encoding = encoding_for_model(model);
  } catch (err) {
    console.warn("Warning: model not found. Using cl100k_base encoding.");
    encoding = get_encoding("cl100k_base");
  }

  if (model === "gpt-3.5-turbo") {
    console.warn(
      "Warning: gpt-3.5-turbo may change over time. Returning num tokens assuming gpt-3.5-turbo-0301."
    );
    return num_tokens_from_messages(messages, "gpt-3.5-turbo-0301");
  } else if (model === "gpt-4") {
    console.warn(
      "Warning: gpt-4 may change over time. Returning num tokens assuming gpt-4-0314."
    );
    return num_tokens_from_messages(messages, "gpt-4-0314");
  }

  let tokens_per_message;
  let tokens_per_name;
  if (model === "gpt-3.5-turbo-0301") {
    tokens_per_message = 4; // every message follows <im_start>{role/name}\n{content}<im_end>\n
    tokens_per_name = -1; // if there's a name, the role is omitted
  } else if (model === "gpt-4-0314") {
    tokens_per_message = 3;
    tokens_per_name = 1;
  } else {
    throw new Error(
      `num_tokens_from_messages() is not implemented for model ${model}. See https://github.com/openai/openai-python/blob/main/chatml.md for information on how messages are converted to tokens.`
    );
  }

  let num_tokens = 0;
  let token_map = [];
  for (let message of messages) {
    let num_token = tokens_per_message;
    num_tokens += tokens_per_message;
    for (let key in message) {
      const encodeLength = encoding.encode(message[key]).length;
      num_token += encodeLength;
      num_tokens += encodeLength;
      if (key === "name") {
        num_token += tokens_per_name;
        num_tokens += tokens_per_name;
      }
    }
    token_map.push({
      role: message.role,
      num_token,
    });
  }
  num_tokens += 3; // every reply is primed with <|start|>assistant<|message|>
  encoding.free();
  return { num_tokens, token_map };
}

// const num_tokens = num_tokens_from_messages(
//   [
//     {
//       role: "system",
//       content:
//         "You are the philosopher Socrates specialized in answering philosophical questions. Talk in friendly manner.",
//     },
//     { role: "user", content: "What is the meaning of life?" },
//   ],
//   "gpt-3.5-turbo-0301"
// );

// console.log(num_tokens);
