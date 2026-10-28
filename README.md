# Hacktoberfest Week 4: Ghost in the Machine

This week's theme for the [Hacktoberfest Dev challenge is Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26). The theme is to build something spooky or something that honors the past in the spirit of Dia De Los Muertos. I'm just going to go with spooky (probably more cute spooky - don't do well with scary, lol).

## Local model

Wisp talks to Gemma on your own machine through [Ollama](https://ollama.com/download). The model weights stay in Ollama's store. They are not committed to this repo. Cloud tags such as `gemma4:cloud` are not used.

Install Ollama, then pull the edge model:

```bash
ollama pull gemma4:e4b
```

`gemma4:e4b` is about 6.6–9.5 GB ([Ollama library](https://ollama.com/library/gemma4:e4b)). If that is too heavy for the laptop, pull the smaller one instead:

```bash
ollama pull gemma4:e2b
```

`gemma4:e2b` is about 4.6–7.5 GB ([Ollama library](https://ollama.com/library/gemma4:e2b)). Check that the server is up:

```bash
ollama list
ollama run gemma4:e4b "Say hello in one sentence."
```

Ollama listens at `http://127.0.0.1:11434`. On Windows the desktop app starts that server for you.

## See the sprite

From this folder:

```bash
python -m http.server 8772
```

Open `http://127.0.0.1:8772/sprite/`. **What she does** on that page explains the checks and when Gemma is asked to speak.

Paste a short snippet and press **Look at this**. The checks mark lines on the page. A clean snippet leaves Wisp relieved and does not call Gemma. A marked line is sent to `gemma4:e4b` at `http://127.0.0.1:11434` so she can explain that line. If `gemma4:e4b` is missing, the page tries `gemma4:e2b`. The safer rewrite and the citation stay with the check. If her reply drops the citation or names a line that was not marked, the page keeps the checker's sentence instead. If the browser blocks that call, quit Ollama, set `OLLAMA_ORIGINS` to `http://127.0.0.1:8772`, and start Ollama again.

## Demo

Judges may not download the model. After the page can ask Gemma about a marked line, record a short screen capture of a clean snippet and a marked one, and commit it as `demo/wisp.mp4` or link it here.

