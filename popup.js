let geminiApiKey = null;
document.addEventListener("DOMContentLoaded", () => {
  const resultDiv = document.getElementById("result");

  const summaryType = document.getElementById("summary-type");

  resultDiv.innerHTML = `<div clas="loader"></div>`;

  //step -1 get the api key
  chrome.storage.sync.get(["geminiApiKey"], (data) => {
    if (!data.geminiApiKey) {
      resultDiv.textContent = "NO Api key set ";
      return;
    }
    geminiApiKey = data.geminiApiKey;
  });

  document.getElementById("summarize").addEventListener("click", () => {
    if (!geminiApiKey) {
      resultDiv.textContent = "API key not loaded.";
      return;
    }
    result.textContent = "Extracting text ...";

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_ARTICLE_RES" },
        async ({ text }) => {
          if (!text) {
            resultDiv.textContent = "Couldn't extract text fron this page ";
            return;
          }

          try {
            const summary = await getGeminiSummary(
              text,
              summaryType.value,
              geminiApiKey
            );

            resultDiv.textContent = summary;
          } catch (error) {
            resultDiv.textContent = "Gemini Error" + error.message;
          }
        }
      );
    });
  });
});

async function getGeminiSummary(rawText, type, apiKey) {
  const max_limit = 20000;
  const text =
    rawText.length > max_limit ? rawText.slice(0, max_limit) + "..." : rawText;

  const promptmap = {
    brief: ` Summarize in 2-3 senetnces:\n\n${text}`,
    detailed: `Give a Detailed Summary\n\n${text}`,
    bullets: `Summarize in 5-7 bullet points (start each line with "- "):\n\n ${text}`,
  };

  const prompt = promptmap[type] || promptmap.brief;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    }
  );

  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error?.message || "Request Failed");
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "NO Summary !";
}

document.getElementById("copy-btn").addEventListener("click", () => {
  const txt = document.getElementById("result").innerText;
  if (!txt) return;

  navigator.clipboard.writeText(txt).then(() => {
    const btn = document.getElementById("copy-btn");
    const old = btn.textContent;
    btn.textContent = "Copied...";
    setTimeout(() => (btn.textContent = old), 2000);
  });
});
