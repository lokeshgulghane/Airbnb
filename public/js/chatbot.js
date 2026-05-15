(function () {
    const toggle = document.getElementById("chatbot-toggle");
    const panel = document.getElementById("chatbot-panel");
    const messagesEl = document.getElementById("chatbot-messages");
    const form = document.getElementById("chatbot-form");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");
    const suggestions = document.querySelectorAll(".chatbot-suggestions button");

    if (!toggle || !panel) return;

    let greeted = false;

    function renderMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/\n/g, "<br>");
    }

    function appendMessage(text, role) {
        const div = document.createElement("div");
        div.className = `chatbot-msg ${role}`;
        div.innerHTML = renderMarkdown(text);
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function setLoading(on) {
        sendBtn.disabled = on;
        input.disabled = on;
        const existing = document.getElementById("chatbot-typing");
        if (on && !existing) {
            const typing = document.createElement("div");
            typing.id = "chatbot-typing";
            typing.className = "chatbot-msg bot typing";
            typing.textContent = "Thinking...";
            messagesEl.appendChild(typing);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        } else if (!on && existing) {
            existing.remove();
        }
    }

    async function sendMessage(text) {
        const trimmed = text.trim();
        if (!trimmed) return;

        appendMessage(trimmed, "user");
        input.value = "";
        setLoading(true);

        try {
            const res = await fetch("/api/chatbot/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: trimmed }),
            });
            const data = await res.json();
            appendMessage(data.reply || "Sorry, I couldn't find an answer.", "bot");
        } catch {
            appendMessage("Something went wrong. Please try again.", "bot");
        } finally {
            setLoading(false);
        }
    }

    toggle.addEventListener("click", () => {
        panel.classList.toggle("open");
        const open = panel.classList.contains("open");
        toggle.innerHTML = open
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-comments"></i>';
        if (open && !greeted) {
            greeted = true;
            appendMessage(
                "Hi! Ask me which stay is best, cheapest options, or stays in a city.",
                "bot"
            );
        }
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        sendMessage(input.value);
    });

    suggestions.forEach((btn) => {
        btn.addEventListener("click", () => {
            panel.classList.add("open");
            toggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            sendMessage(btn.dataset.question);
        });
    });
})();
