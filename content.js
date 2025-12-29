function getArticleRes() {
  const article = document.querySelector("article");
  if (article) return article.innerText;

  const paragraph = Array.from(document.querySelectorAll("p"));

  return paragraph.map((p) => p.innerText).join("\n");
}

chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_ARTICLE_RES") {
    const text = getArticleRes();
    sendResponse({ text });
  }
});
