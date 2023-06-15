document.addEventListener("DOMContentLoaded", function () {
  const questionInput = document.getElementById("question-input");
  const roleInput = document.getElementById("role-input");
  const chatForm = document.getElementById("chat-form");
  const conversationDiv = document.getElementById("conversation");

  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const question = questionInput.value;
    const role = roleInput.value;

    if (!question) {
      alert("질문을 입력해주세요.");
      return;
    }
    // conversation history
    let conversationHistory = [];
    const messages = conversationDiv.getElementsByTagName("p");
    if (messages.length > 0) {
      for (let message of messages) {
        const senderName = message.className;
        conversationHistory.push({
          role: senderName === "user" ? "user" : "assistant",
          content: message.innerText.split(":")[1].trim(),
        });
      }
    }

    const p = document.createElement("p");
    p.className = "user";
    p.innerHTML = `<strong>user</strong>: ${question}`;
    conversationDiv.appendChild(p);

    // 추가 : scroll to bottom
    conversationDiv.scrollTop = conversationDiv.scrollHeight;

    questionInput.value = "";
    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;

    let payload = {
      question,
      role,
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
        const p = document.createElement("p");
        p.className = "chatgpt";
        p.innerHTML = `<strong>ChatGPT</strong>: ${data.answer}`;
        conversationDiv.appendChild(p);

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
