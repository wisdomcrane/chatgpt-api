document.addEventListener("DOMContentLoaded", function () {
  const questionInput = document.getElementById("question-input");
  const roleInput = document.getElementById("role-input");
  const chatForm = document.getElementById("chat-form");
  const conversationDiv = document.getElementById("conversation");

  chatForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const question = questionInput.value;
    const role = roleInput.value;

    const p = document.createElement("p");
    p.className = "user";
    p.innerHTML = `<strong>user</strong>: ${question}`;
    conversationDiv.appendChild(p);

    questionInput.value = "";
    const submitBtn = document.getElementById("submit-btn");
    submitBtn.disabled = true;

    fetch("http://localhost:3000/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        role,
      }),
    })
      .then(async (res) => {
        const data = await res.json();

        const p = document.createElement("p");
        p.className = "chatgpt";
        p.innerHTML = `<strong>ChatGPT</strong>: ${data.answer}`;
        conversationDiv.appendChild(p);

        submitBtn.disabled = false;
      })
      .catch((error) => {
        console.error(error);
      });
  });
});
