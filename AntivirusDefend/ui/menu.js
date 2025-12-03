// menu.js — AntivirusDefend menu & game-specific Windows 98 UI
(function () {
  'use strict';

  // Global namespace hookup
  window.AVDEF = window.AVDEF || {};
  const AVDEF = window.AVDEF;
  const Engine = AVDEF.Engine || {};
  window.Engine = Engine;

  AVDEF.Menu = AVDEF.Menu || {};

  /**
   * Initialize the Windows 98 desktop with AntivirusDefend-specific menus.
   * Called by renderengine.js once the OS shell is ready.
   *
   * @param {Object} ctx - Render context from renderengine.js
   *   desktop      : DOM element for the Win98 desktop
   *   taskbar      : DOM element for the taskbar
   *   startButton  : Start button element
   *   createWindow : function(title, html, width, height) -> window element
   *   showDownload : function(filename, onComplete)
   *   createIcon   : function(iconUrl, label, top, left, onDblClick)
   *   icons        : ICONS dictionary
   *   ensureGameWindow : function() -> main game window element
   */
  AVDEF.Menu.initDesktop = function initDesktop(ctx) {
    if (!ctx || !ctx.desktop || !ctx.createWindow || !ctx.createIcon) {
      console.warn("[Menu] Missing render context; cannot initialize desktop menus.");
      return;
    }

    const desktop         = ctx.desktop;
    const startBtn        = ctx.startButton || null;
    const createWindow    = ctx.createWindow;
    const showDownload    = ctx.showDownload || function (name, cb) { if (cb) cb(); };
    const icon            = ctx.createIcon;
    const ICONS           = ctx.icons || {};
    const ensureGameWindow = ctx.ensureGameWindow || function () { return null; };


    // --------------------------------------------------------------
    // Start menu: acts as a "ribbon" of editor-style commands
    // --------------------------------------------------------------
    const START_MENU_HEADINGS = [
      "File","Edit","View","Project","Build","Debug",
      "Test","Analyze","Tools","Extensions","Window","Help"
    ];

    let startMenuPanel = null;
    let startMenuVisible = false;

    
    function buildStartMenuPanel() {
      if (!desktop) return null;
      if (startMenuPanel) return startMenuPanel;

      const panel = document.createElement("div");
      panel.setAttribute("data-win98-startmenu", "1");
      Object.assign(panel.style, {
        position: "absolute",
        left: "0px",
        bottom: "26px", // just above taskbar (26px tall)
        width: "270px",
        backgroundColor: "#c0c0c0",
        borderTop: "2px solid #ffffff",
        borderLeft: "2px solid #ffffff",
        borderRight: "2px solid #404040",
        borderBottom: "2px solid #404040",
        boxShadow: "2px 2px 0 #000000",
        fontFamily: "MS Sans Serif, Tahoma, Verdana, sans-serif",
        fontSize: "12px",
        zIndex: "2000"
      });

      // Outer layout: sidebar + menu area
      const chrome = document.createElement("div");
      Object.assign(chrome.style, {
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        boxSizing: "border-box"
      });

      // Win9x style sidebar with vertical product name
      const sidebar = document.createElement("div");
      Object.assign(sidebar.style, {
        width: "28px",
        backgroundColor: "#000080",
        color: "#ffffff",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "4px 2px",
        boxSizing: "border-box"
      });

      const sideLabel = document.createElement("div");
      sideLabel.textContent = "Defender Game Engine";
      Object.assign(sideLabel.style, {
        writingMode: "vertical-rl",
        textOrientation: "mixed",
        fontWeight: "bold",
        fontSize: "12px",
        letterSpacing: "1px"
      });
      sidebar.appendChild(sideLabel);

      // Right-hand menu section
      const menuArea = document.createElement("div");
      Object.assign(menuArea.style, {
        flex: "1 1 auto",
        backgroundColor: "#c0c0c0",
        padding: "4px 0",
        boxSizing: "border-box"
      });

      chrome.appendChild(sidebar);
      chrome.appendChild(menuArea);
      panel.appendChild(chrome);

      // Container for items
      const list = document.createElement("div");
      Object.assign(list.style, {
        padding: "2px 0"
      });
      menuArea.appendChild(list);

      const START_MENU_ICON_PATHS = {
        File: 'AntivirusDefend/ui/Win98Theme/Icons/Documents.png',
        Edit: 'AntivirusDefend/ui/Win98Theme/Icons/Settings.png',
        View: 'AntivirusDefend/ui/Win98Theme/Icons/IE.png',
        Project: 'AntivirusDefend/ui/Win98Theme/Icons/My_Computer.png',
        Build: 'AntivirusDefend/ui/Win98Theme/Icons/Network.ico',
        Debug: 'AntivirusDefend/ui/Win98Theme/Icons/How_To_Play.png',
        Test: 'AntivirusDefend/ui/Win98Theme/Icons/Settings.png',
        Analyze: 'AntivirusDefend/ui/Win98Theme/Icons/Documents.png',
        Tools: 'AntivirusDefend/ui/Win98Theme/Icons/Settings.png',
        Extensions: 'AntivirusDefend/ui/Win98Theme/Icons/IE.png',
        Window: 'AntivirusDefend/ui/Win98Theme/Icons/My_Computer.png',
        Help: 'AntivirusDefend/ui/Win98Theme/Icons/How_To_Play.png'
      };

      START_MENU_HEADINGS.forEach(name => {
        const item = document.createElement("div");
        Object.assign(item.style, {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2px 8px 2px 6px",
          cursor: "default"
        });

        const left = document.createElement("div");
        Object.assign(left.style, {
          display: "flex",
          alignItems: "center",
          gap: "6px"
        });

        const iconPath = START_MENU_ICON_PATHS[name];
        if (iconPath) {
          const icon = document.createElement("img");
          icon.src = iconPath;
          Object.assign(icon.style, {
            width: "16px",
            height: "16px"
          });
          left.appendChild(icon);
        }

        const label = document.createElement("span");
        label.textContent = name;
        left.appendChild(label);

        const arrow = document.createElement("span");
        arrow.textContent = "\u25B6"; // right-pointing triangle
        Object.assign(arrow.style, {
          fontSize: "11px"
        });

        item.appendChild(left);
        item.appendChild(arrow);

        item.addEventListener("mouseenter", () => {
          item.style.backgroundColor = "#000080";
          item.style.color = "#ffffff";
          label.style.color = "#ffffff";
          arrow.style.color = "#ffffff";
        });
        item.addEventListener("mouseleave", () => {
          item.style.backgroundColor = "";
          item.style.color = "#000000";
          label.style.color = "#000000";
          arrow.style.color = "#000000";
        });

        item.addEventListener("click", () => {
          createWindow(
            name + " Menu",
            "<p>The <b>" + name + "</b> commands will live here.</p>" +
            "<p>This Start menu is the main ribbon for Defender Game Engine.</p>",
            420,
            260
          );
        });

        list.appendChild(item);
      });

      desktop.appendChild(panel);
      startMenuPanel = panel;
      startMenuVisible = true;
      return panel;
    }
function toggleStartMenuPanel() {
      const panel = buildStartMenuPanel();
      if (!panel) return;
      startMenuVisible = !startMenuVisible;
      panel.style.display = startMenuVisible ? "block" : "none";
    }

    let selectedHeroId  = 'defender';
    let selectedStageId = 'computer';

    // --------------------------------------------------------------
    // Helper: Start the actual game using current hero & stage
    // --------------------------------------------------------------
    function startGameInternal() {
      const gameWin = ensureGameWindow();

      if (Engine.setHero)  Engine.setHero(selectedHeroId);
      if (Engine.setStage) Engine.setStage(selectedStageId);
      if (Engine.startRun) Engine.startRun();

      if (gameWin && gameWin.parentNode) {
        // Close every other Win98 window but keep the desktop
        const allWins = desktop.querySelectorAll('[data-win98-window="1"]');
        allWins.forEach(w => {
          if (w !== gameWin) {
            w.remove();
          }
        });
      }
    }

    // Expose for legacy/global code that expects this symbol
    window.startGame = startGameInternal;

    // --------------------------------------------------------------
    // Helper: Build hero selection grid in a given window
    // --------------------------------------------------------------
    function buildHeroGridInWindow(winEl) {
      const grid = winEl.querySelector('#heroGrid');
      if (!grid || !AVDEF.Heroes || typeof AVDEF.Heroes.getAll !== 'function') return;

      grid.innerHTML = '';
      const heroes = AVDEF.Heroes.getAll();

      heroes.forEach(h => {
        const card = document.createElement('div');
        card.style.border = h.id === selectedHeroId ? '4px solid #000080' : '2px solid #808080';
        card.style.padding = '15px';
        card.style.cursor = 'pointer';
        card.style.textAlign = 'center';
        card.style.background = h.id === selectedHeroId ? '#000080' : '#c0c0c0';
        card.style.color = h.id === selectedHeroId ? 'white' : 'black';
        card.style.borderRadius = '4px';
        card.style.boxShadow = 'inset 2px 2px #ffffff, inset -2px -2px #808080';

        const logo = document.createElement('div');
        logo.style.width = '96px';
        logo.style.height = '96px';
        logo.style.margin = '0 auto 10px';
        logo.style.display = 'flex';
        logo.style.alignItems = 'center';
        logo.style.justifyContent = 'center';
        logo.style.fontSize = '48px';
        logo.style.background = '#000000';
        logo.style.color = '#00ff00';
        logo.style.border = '2px solid #808080';

        if (h.logoUrl) {
          const img = document.createElement('img');
          img.src = h.logoUrl;
          img.alt = h.name || h.id;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          logo.appendChild(img);
        } else {
          logo.textContent = (h.short || h.name || h.id || '?').slice(0, 2).toUpperCase();
        }

        const nameEl = document.createElement('div');
        nameEl.style.fontWeight = 'bold';
        nameEl.style.marginBottom = '4px';
        nameEl.textContent = h.name || h.id;

        const roleEl = document.createElement('div');
        roleEl.style.fontSize = '12px';
        roleEl.textContent = h.role || '';

        card.appendChild(logo);
        card.appendChild(nameEl);
        card.appendChild(roleEl);

        card.onclick = () => {
          selectedHeroId = h.id;
          window.selectedHeroId = selectedHeroId;
          if (Engine.setHero) Engine.setHero(selectedHeroId);

          // Update selection styling
          const cards = grid.querySelectorAll('div');
          cards.forEach(child => {
            if (child === card) {
              child.style.border = '4px solid #000080';
              child.style.background = '#000080';
              child.style.color = 'white';
            } else {
              // Only reset styling roughly for "card" containers
              child.style.border = '2px solid #808080';
              child.style.background = '#c0c0c0';
              child.style.color = 'black';
            }
          });
        };

        grid.appendChild(card);
      });
    }

    // Backwards-compatible global shim
    window.buildHeroGridInCurrentWindow = function () {
      const winEl = desktop.querySelector('.ad98-window:last-of-type #heroGrid')
        ? desktop.querySelector('.ad98-window:last-of-type').closest('.ad98-window')
        : null;
      if (winEl) buildHeroGridInWindow(winEl);
    };

    // --------------------------------------------------------------
    // Helper: Build stage grid in a given window
    // --------------------------------------------------------------
    function buildStageGridInWindow(winEl) {
      const grid = winEl.querySelector('#stageGrid');
      if (!grid || !AVDEF.Stages || typeof AVDEF.Stages.list !== 'function') return;

      grid.innerHTML = '';
      const stages = AVDEF.Stages.list();

      stages.forEach(s => {
        const locked = !s.unlocked;
        const card = document.createElement('div');
        card.style.border = '2px solid #808080';
        card.style.padding = '10px';
        card.style.cursor = locked ? 'default' : 'pointer';
        card.style.background = locked ? '#a0a0a0' : '#c0c0c0';
        card.style.color = 'black';
        card.style.borderRadius = '4px';
        card.style.boxShadow = 'inset 2px 2px #ffffff, inset -2px -2px #808080';
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '10px';

        const iconEl = document.createElement('div');
        iconEl.style.width = '32px';
        iconEl.style.height = '32px';
        iconEl.style.display = 'flex';
        iconEl.style.alignItems = 'center';
        iconEl.style.justifyContent = 'center';
        iconEl.style.fontSize = '20px';
        iconEl.style.marginBottom = '0';
        iconEl.textContent = locked ? '🔒' : '📁';

        const nameEl = document.createElement('div');
        nameEl.innerHTML = '<b>' + (s.name || s.id) + '</b><br><small>' + (locked ? 'Locked' : (s.desc || '')) + '</small>';

        card.appendChild(iconEl);
        card.appendChild(nameEl);

        if (!locked) {
          card.onclick = () => {
            selectedStageId = s.id;
            window.selectedStageId = selectedStageId;
            if (Engine.setStage) Engine.setStage(selectedStageId);

            const cards = grid.querySelectorAll('div');
            cards.forEach(child => {
              if (child === card) {
                child.style.border = '4px solid #000080';
              } else {
                child.style.border = '2px solid #808080';
              }
            });
          };
        }

        grid.appendChild(card);
      });
    }

    // Backwards-compatible global shim
    window.buildStageGridInCurrentWindow = function () {
      const winEl = desktop.querySelector('.ad98-window:last-of-type #stageGrid')
        ? desktop.querySelector('.ad98-window:last-of-type').closest('.ad98-window')
        : null;
      if (winEl) buildStageGridInWindow(winEl);
    };

    // --------------------------------------------------------------
    // Helper: Create the stage selection window for a mode
    // --------------------------------------------------------------
    function createStageWindow(modeId) {
      const label = (AVDEF.GameModes && AVDEF.GameModes[modeId] && AVDEF.GameModes[modeId].label) || modeId || 'Stage';

      const stageWin = createWindow(
        'Select Stage - ' + label,
        '<div id=\"stageGrid\" style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;\"></div>' +
        '<div style=\"margin-top:24px;text-align:center;\">' +
        '  <button id=\"stageStartBtn\">Start Game</button>' +
        '</div>',
        750,
        600
      );

      setTimeout(() => {
        buildStageGridInWindow(stageWin);
        const startBtnEl = stageWin.querySelector('#stageStartBtn');
        if (startBtnEl) {
          startBtnEl.onclick = () => {
            stageWin.remove();
            startGameInternal();
          };
        }
      }, 50);
    }

    // --------------------------------------------------------------
    // GAME MODES AS DESKTOP ICONS
    // --------------------------------------------------------------
      const modes = []; // Defender Engine: hide per-gamemode desktop icons for now
    let y = 60;

    modes.forEach(mode => {
      const label = mode.label || mode.id || 'Mode';
      icon(ICONS.folder || ICONS.mycomp || '', label, y, 80, () => {
        if (Engine.setGameMode) Engine.setGameMode(mode.id);

        // Create hero selection window
        const heroWin = createWindow(
          'Select Hero - ' + label,
          '<div id=\"heroGrid\" style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:20px;\"></div>' +
          '<div style=\"margin-top:30px;text-align:center;\">' +
          '  <button id=\"heroNextBtn\">Next &gt;&gt;</button>' +
          '</div>',
          700,
          600
        );

        // Populate hero grid once the DOM is ready
        setTimeout(() => {
          buildHeroGridInWindow(heroWin);
          const btn = heroWin.querySelector('#heroNextBtn');
          if (btn) {
            btn.onclick = () => {
              heroWin.remove();
              const filename = (mode && mode.label ? mode.label + '_setup.exe' : 'antivirus_setup.exe');
              showDownload(filename, () => {
                createStageWindow(mode.id);
              });
            };
          }
        }, 50);
      });

      y += 90;
    });

    // Start button: toggles the Defender Engine "ribbon" start menu
    if (startBtn && !startBtn.hasAttribute('data-menu-wired')) {
      startBtn.setAttribute('data-menu-wired', '1');
      startBtn.onclick = () => {
        toggleStartMenuPanel();
      };
    }
  };

})();
