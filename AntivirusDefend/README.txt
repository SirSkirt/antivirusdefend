Antivirus Defend – Alpha 0.4.1 (Freeplay)
===============================================

This folder contains a split version of the game:

- index.html  → HTML + CSS + UI overlays
- game.js     → All game logic and rendering code
- README.txt  → This file

How to run locally
------------------

1. Extract this zip into a folder.
2. Open `index.html` in a modern browser (Chrome, Edge, Firefox).
   - You can usually just double–click `index.html`.
3. The game should load with the title screen, hero select, and Freeplay mode.

If the game does not start:
- Make sure `index.html` and `game.js` are in the same folder.
- Try a different browser if you’re on something very old.

How to host on a webpage / your site
------------------------------------

### Option 1 – Simple standalone page

1. Upload **both** `index.html` and `game.js` to the same folder on your web host, e.g.:

   /public_html/antivirus-defend/
     ├─ index.html
     └─ game.js

2. Visit the URL, for example:

   https://your-domain.com/antivirus-defend/index.html

That’s it – this page is the full game.

---

### Option 2 – Embed into an existing site via `<iframe>`

If you already have a website and you want to embed the game inside one of your pages:

1. Upload `index.html` and `game.js` to a folder on your server, e.g.:

   /public_html/games/antivirus-defend/

2. On your *main* page (for example `main.html`), add an iframe like this:

```html
<iframe
  src="games/antivirus-defend/index.html"
  width="1280"
  height="720"
  style="border:none; max-width:100%; aspect-ratio:16/9;">
</iframe>
```

- `src` should point to where `index.html` lives relative to the page.
- You can tweak the width/height or rely on CSS to make it responsive.

---

### Option 3 – Integrate the canvas + scripts directly

If you don’t want to use an iframe and instead want the canvas to live directly in your page:

1. Open `index.html`.
2. Copy all the HTML inside `<body>...</body>` into your own page’s `<body>`, or at least:

   - The top bar
   - The `.game-wrap` div
   - The `<canvas id="gameCanvas"></canvas>`
   - All the overlay divs

3. Ensure you keep the `<script src="game.js"></script>` tag at the bottom of your `<body>`:

```html
<script src="game.js"></script>
</body>
</html>
```

4. Upload `game.js` next to that page on the server, so the script path is correct.

As long as:
- The IDs on the HTML elements stay the same (e.g. `gameCanvas`, `heroSelectOverlay`, etc.)
- `game.js` is loaded after those elements exist in the DOM

…the game will initialize and run.

---

Notes
-----

- This is still the **Freeplay alpha** build: one playable stage (“Computer”) with hero selection, upgrades, and the animated computer-case background.
- For mobile, the game includes a virtual joystick and scales the canvas to fit the page while keeping a 16:9 aspect ratio.

To tweak or extend the game later, edit `game.js`. To restyle menus or overlays, edit the CSS inside `index.html`.
