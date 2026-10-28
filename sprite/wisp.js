const scene = document.querySelector(".scene");
const line = document.querySelector("#line");
const buttons = document.querySelectorAll("[data-set]");
const form = document.querySelector("#paste");
const snippet = document.querySelector("#snippet");
const findings = document.querySelector("#findings");

const lines = {
  idle: "I'm here. I'm fine. Mostly.",
  reading: "Hold on. I'm looking.",
  worried: "Oh. This line... It's a little eerie.",
  relieved: "Okay. I can breathe.",
};

const rules = [
  {
    id: "eval",
    title: "This line runs a string as code.",
    safer: "result = allowedAction(input);",
    source: "MDN: eval",
    href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval",
    test: (text) => /\beval\s*\(/.test(text) || /\bnew\s+Function\s*\(/.test(text),
  },
  {
    id: "html",
    title: "This line can turn text into HTML.",
    safer: "element.textContent = text;",
    source: "MDN: Element.innerHTML",
    href: "https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML",
    test: (text) => /\.innerHTML\s*=/.test(text) || /\bdocument\.write(?:ln)?\s*\(/.test(text),
  },
  {
    id: "secret",
    title: "This line keeps a secret in the code.",
    safer: "const apiKey = process.env.API_KEY;",
    source: "OWASP: Secrets Management Cheat Sheet",
    href: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
    test: hasHardcodedSecret,
  },
  {
    id: "http-script",
    title: "This line loads a script over plain HTTP.",
    safer: (text) => text.replace(/http:\/\//gi, "https://"),
    source: "MDN: Mixed content",
    href: "https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content",
    test: (text) =>
      /src\s*=\s*['"]http:\/\//i.test(text) ||
      /<script\b[^>]*http:\/\//i.test(text) ||
      /http:\/\/\S+\.js\b/i.test(text),
  },
];

let lookToken = 0;

function setMood(mood) {
  if (!lines[mood]) return;
  scene.dataset.mood = mood;
  line.textContent = lines[mood];
  for (const button of buttons) {
    button.setAttribute("aria-pressed", button.dataset.set === mood ? "true" : "false");
  }
}

function codeOf(text) {
  const withoutBlocks = text.replace(/\/\*[\s\S]*?\*\//g, "");
  return withoutBlocks.replace(/(^|[^:])\/\/.*$/, "$1");
}

function hasHardcodedSecret(text) {
  const match = text.match(/([A-Za-z0-9_$.]+)\s*[:=]\s*(['"])([^'"]+)\2/);
  if (!match) return false;
  const name = match[1];
  const value = match[3];
  const secretName = /api[_-]?key|secret|password|passwd|token|auth/i;
  if (!secretName.test(name)) return false;
  if (value.length < 8) return false;
  if (/example|placeholder|changeme|your[-_ ]|todo|^x+$|^password$/i.test(value)) return false;
  return true;
}

function scan(source) {
  const marked = [];
  const rows = source.split(/\r?\n/);
  rows.forEach((row, index) => {
    const text = codeOf(row);
    if (!text.trim()) return;
    for (const rule of rules) {
      if (!rule.test(text)) continue;
      const safer = typeof rule.safer === "function" ? rule.safer(row.trim()) : rule.safer;
      marked.push({
        line: index + 1,
        text: row.trim(),
        title: rule.title,
        safer,
        source: rule.source,
        href: rule.href,
      });
    }
  });
  return marked;
}

function renderNote(message) {
  findings.replaceChildren();
  if (!message) return;
  const note = document.createElement("p");
  note.className = "note";
  note.textContent = message;
  findings.append(note);
}

function renderFindings(marked) {
  findings.replaceChildren();
  if (marked.length === 0) {
    const clear = document.createElement("p");
    clear.className = "clear";
    clear.textContent = "Nothing marked.";
    findings.append(clear);
    return;
  }
  const list = document.createElement("ol");
  for (const finding of marked) {
    const item = document.createElement("li");
    const title = document.createElement("p");
    title.textContent = `Line ${finding.line}. ${finding.title}`;
    const shown = document.createElement("pre");
    shown.textContent = finding.text;
    const voice = document.createElement("p");
    voice.className = "voice";
    voice.textContent = "Wisp is finding the words.";
    finding.voice = voice;
    const safer = document.createElement("p");
    safer.textContent = `Safer: ${finding.safer}`;
    const link = document.createElement("a");
    link.href = finding.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = finding.source;
    item.append(title, voice, shown, safer, link);
    list.append(item);
  }
  findings.append(list);
}

for (const button of buttons) {
  button.addEventListener("click", () => {
    lookToken += 1;
    findings.replaceChildren();
    setMood(button.dataset.set);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const source = snippet.value;
  if (!source.trim()) {
    lookToken += 1;
    renderNote("Paste a snippet first.");
    setMood("idle");
    return;
  }
  const token = ++lookToken;
  setMood("reading");
  findings.replaceChildren();
  const wait = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 700;
  window.setTimeout(() => {
    if (token !== lookToken) return;
    const marked = scan(source);
    renderFindings(marked);
    if (!marked.length) {
      setMood("relieved");
      return;
    }
    setMood("worried");
    explain(marked, token);
  }, wait);
});

const models = ["gemma4:e4b", "gemma4:e2b"];

function promptFor(finding) {
  return [
    "You are Wisp, a timid, helpful ghost. Answer in two or three short sentences.",
    "Explain only the marked line below. A check already decided it is the one to mention.",
    `Include this citation URL exactly: ${finding.href}`,
    `Do not mention any line number except ${finding.line}.`,
    "Do not describe an attack, a payload, or how someone could exploit the line.",
    "The safer code is already chosen. Explain that safer code. Do not invent a different fix.",
    "",
    `Line ${finding.line}:`,
    finding.text,
    `Check: ${finding.title}`,
    `Safer code: ${finding.safer}`,
  ].join("\n");
}

function keepsReply(reply, finding, markedLines) {
  if (!reply || !reply.includes(finding.href)) return false;
  const mentioned = [...reply.matchAll(/\bline\s+(\d+)\b/gi)].map((match) => Number(match[1]));
  return mentioned.every((number) => markedLines.has(number));
}

async function askGemma(finding) {
  let lastError;
  for (const model of models) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 90000);
    try {
      const response = await fetch("http://127.0.0.1:11434/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          think: false,
          options: { temperature: 0.2, num_predict: 160 },
          messages: [{ role: "user", content: promptFor(finding) }],
        }),
        signal: controller.signal,
      });
      if (response.status === 404) continue;
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      const content = data.message && data.message.content;
      return typeof content === "string" ? content.trim() : "";
    } catch (error) {
      lastError = error;
      if (error.name === "AbortError") break;
    } finally {
      window.clearTimeout(timer);
    }
  }
  throw lastError || new Error("Gemma did not answer");
}

async function explain(marked, token) {
  const markedLines = new Set(marked.map((finding) => finding.line));
  for (const finding of marked) {
    if (token !== lookToken) return;
    try {
      const reply = await askGemma(finding);
      if (token !== lookToken) return;
      finding.voice.textContent = keepsReply(reply, finding, markedLines)
        ? reply
        : "Wisp kept the checker's words.";
    } catch {
      if (token !== lookToken) return;
      finding.voice.textContent = "Wisp kept the checker's words. Gemma did not answer.";
    }
  }
}
