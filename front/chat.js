document.addEventListener("DOMContentLoaded", function () {
  const questionInput = document.getElementById("question-input");
  // const roleInput = document.getElementById("role-input");
  const chatForm = document.getElementById("chat-form");
  const conversationDiv = document.getElementById("conversation");
  const p = document.createElement("p");
  p.style = "color: gray;";
  p.innerHTML = `기업가 챗봇입니다. 인사를 하거나 여러분의 사업 아이디어를 알려주세요. 추가적인 대화를 통해 아이디어를 발전시켜 보세요.`;
  p.id = "intro";
  conversationDiv.appendChild(p);
  // conversation history
  let conversationHistory = [];
  marked.use({
    mangle: false,
    headerIds: false,
  });

  let atBottom = true;

  conversationDiv.addEventListener("scroll", () => {
    // 사용자가 스크롤을 올리면 atBottom을 false로 설정
    if (
      conversationDiv.scrollTop + conversationDiv.clientHeight <
      conversationDiv.scrollHeight
    ) {
      atBottom = false;
    } else {
      atBottom = true;
    }
  });

  const textarea = document.getElementById("question-input");

  textarea.addEventListener("input", (event) => {
    textarea.style.height = "auto";
    const newHeight = textarea.scrollHeight;
    textarea.style.height = newHeight + "px";
  });

  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const intro = document.getElementById("intro");
    if (intro) document.getElementById("intro").remove();

    const question = questionInput.value;
    // const role = roleInput.value;

    if (!question) {
      alert("질문을 입력해주세요.");
      return;
    }

    const div = document.createElement("div");
    div.className = "user";
    div.innerHTML = `<strong>User</strong><div><p>${question}</p></div>`;
    conversationDiv.appendChild(div);

    // 추가 : scroll to bottom
    conversationDiv.scrollTop = conversationDiv.scrollHeight;

    questionInput.value = "";
    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;

    let payload = {
      question,
      // role,
    };

    if (conversationHistory.length > 0) {
      payload.conversationHistory = conversationHistory;
    }
    // http://localhost:3000/ask
    fetch(`https://chatgpt-api-chatbot.fly.dev/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Connection: "keep-alive",
        "Response-Type": "stream",
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }

        const div = document.createElement("div");
        div.className = "chatgpt";
        div.innerHTML = `<strong>ChatGPT</strong><div id="conversation-content"></div>`;
        conversationDiv.appendChild(div);

        // stream
        if (!res || !res.body) {
          throw new Error("No response body");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let result = "";
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          const chunkValue = decoder.decode(value);
          result += chunkValue;
          done = doneReading;
          // add to conversation
          div.querySelector("#conversation-content").innerHTML = marked
            .parse(result)
            .trim();

          if (atBottom) {
            conversationDiv.scrollTop = conversationDiv.scrollHeight;
          }
        }

        conversationHistory.push(
          {
            role: "user",
            content: question,
          },
          {
            role: "assistant",
            content: result,
          }
        );

        submitBtn.disabled = false;
      })
      .catch((error) => {
        if (error) {
          alert(error);
        } else {
          alert("에러가 발생했습니다.");
        }
        submitBtn.disabled = false;
      });
  });
});

function setVH() {
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

window.addEventListener("resize", setVH);
window.addEventListener("load", setVH);
