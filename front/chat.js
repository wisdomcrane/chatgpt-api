document.addEventListener("DOMContentLoaded", function () {
  const questionInput = document.getElementById("question-input");
  // const roleInput = document.getElementById("role-input");
  const chatForm = document.getElementById("chat-form");
  const conversationDiv = document.getElementById("conversation");
  // conversation history
  let conversationHistory = [];
  marked.use({
    mangle: false,
    headerIds: false,
  });

  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();

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

    fetch("http://localhost:3000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error);
        }
        const div = document.createElement("div");
        div.className = "chatgpt";
        div.innerHTML = `<strong>ChatGPT</strong><div>${marked
          .parse(data.answer)
          .trim()}</div>`;
        conversationDiv.appendChild(div);

        conversationHistory.push(
          {
            role: "user",
            content: question,
          },
          {
            role: "assistant",
            content: data.answer,
          }
        );

        // 추가 : scroll to bottom
        conversationDiv.scrollTop = conversationDiv.scrollHeight;

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
