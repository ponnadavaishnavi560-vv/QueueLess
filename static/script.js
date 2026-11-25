
const queueForm = document.getElementById("queueForm");
const tokenResult = document.getElementById("tokenResult");
const queueList = document.getElementById("queueList");
const nextBtn = document.getElementById("nextBtn");
const adminMessage = document.getElementById("adminMessage");

async function loadQueue() {
    try {
        const response = await fetch("/queue");
        const queue = await response.json();

        queueList.innerHTML = "";

        if (queue.length === 0) {
            queueList.innerHTML = "<p>No customers in the queue.</p>";
            return;
        }

        const waiting = queue.filter(item => item.status === "Waiting");

        queue.forEach((item) => {
            const ahead = waiting.filter(
                person => person.token < item.token
            ).length;

            const waitTime = ahead * 5;

            const div = document.createElement("div");
            div.className = "queue-item";

            const details = document.createElement("p");
            details.textContent =
                `Token #${item.token} | ${item.name} | ${item.service}`;

            const status = document.createElement("p");
            status.textContent = `Status: ${item.status}`;

            div.append(details, status);

            if (item.status === "Waiting") {
                const estimate = document.createElement("p");
                estimate.textContent =
                    `People ahead: ${ahead} | Estimated wait: ${waitTime} minutes`;
                div.appendChild(estimate);
            }

            if (item.status === "Serving") {
                const completeBtn = document.createElement("button");
                completeBtn.textContent = "Complete Token";
                completeBtn.onclick = () => completeToken(item.token);
                div.appendChild(completeBtn);
            }

            queueList.appendChild(div);
        });

    } catch (error) {
        queueList.textContent = "Unable to load queue.";
    }
}

queueForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const service = document.getElementById("service").value;

    try {
        const response = await fetch("/join", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, service })
        });

        const data = await response.json();

        if (!response.ok) {
            tokenResult.textContent = data.error || "Something went wrong.";
            return;
        }

        tokenResult.textContent =
            `Your token number is #${data.token}`;

        queueForm.reset();
        await loadQueue();

    } catch (error) {
        tokenResult.textContent = "Server connection failed.";
    }
});

nextBtn.addEventListener("click", async () => {
    try {
        const response = await fetch("/next", {
            method: "POST"
        });

        const data = await response.json();
        adminMessage.textContent = data.message;

        await loadQueue();

    } catch (error) {
        adminMessage.textContent = "Unable to call next token.";
    }
});

async function completeToken(token) {
    try {
        const response = await fetch(`/complete/${token}`, {
            method: "POST"
        });

        const data = await response.json();
        adminMessage.textContent = data.message;

        await loadQueue();

    } catch (error) {
        adminMessage.textContent = "Unable to complete token.";
    }
}

loadQueue();
setInterval(loadQueue, 5000);

