# Hacktoberfest Week 4: Ghost in the Machine

This week's theme for the [Hacktoberfest Dev challenge is Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26). The theme is to build something spooky or something that honors the past in the spirit of Dia De Los Muertos. I'm just going to go with spooky (probably more cute spooky - don't do well with scary, lol).

Wisp is a timid ghost who looks at a short JavaScript snippet you paste. Checks in the browser mark a few kinds of risky lines. Gemma, running on this computer through Ollama, explains only those marked lines. A clean snippet never calls the model, and she does not invent a finding. She does not scan a repository or a GitHub account.

The page lives in `sprite/`. `index.html` is Wisp, the paste box, and her results. `about.html` is the same explanation with the citations. `wisp.css` and `wisp.js` are the sprite and the checks.

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

`gemma4:e2b` is about 4.6–7.5 GB ([Ollama library](https://ollama.com/library/gemma4:e2b)). On Windows the desktop app starts the server for you. It listens at `http://127.0.0.1:11434`.

Confirm the server is up:

```bash
ollama ps
```

A table, even an empty one, means Ollama is running. Gemma loads when Wisp asks it to explain a marked line. `ollama list` shows which models are pulled. If the shell says `ollama` is not recognized, open a new terminal so it picks up the install path.

## See the sprite

From this folder:

```bash
python -m http.server 8772
```

Open `http://127.0.0.1:8772/sprite/`.

The paste box sits beside Wisp. **Click Here to see what she does** opens the note. Paste a short snippet and press **Look at this**. **Clear** empties the box, drops the marked lines, and returns her to idle. The mood buttons change her face, and pressing one cancels a look that is still in progress.

An empty box leaves her idle and says “Paste a snippet first.” A clean snippet leaves her relieved, says “Nothing marked.”, and does not call Gemma. A marked line makes her worried. The check writes the line, a safer rewrite, and a citation. The page then asks `gemma4:e4b` to explain that line. If that model is missing, it tries `gemma4:e2b`.

She marks four things. Each check owns its safer line and its citation. Gemma does not choose a different fix. Comments are skipped.

- A string run as code: `eval(...)` or `new Function(...)`.
- Text turned into HTML: an assignment to `innerHTML`, or `document.write` / `document.writeln`.
- A secret kept in the code: a name such as api key, secret, password, or token, with a quoted value at least 8 characters long. Placeholder values are left alone.
- A script loaded over plain `http://`.

Her reply stays on the page only when it includes that finding’s citation URL and every “line N” she names is a line the check marked. Otherwise the page says “Wisp kept the checker’s words.” If she does not answer, it says “Wisp kept the checker’s words. Gemma did not answer.” The safer line and the citation remain either way.

If the browser blocks the call, quit Ollama, set `OLLAMA_ORIGINS` to `http://127.0.0.1:8772`, and start Ollama again.

## Demo

[Wisp](https://youtu.be/ru0efFPEZzI)

## Dev Post
[Dev.to: Wisp: A JavaScript Snippet Security Ghost in the Machine](https://youtu.be/ru0efFPEZzI)
