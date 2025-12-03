// renderengine.js — FULL WINDOWS 98 OS EXPERIENCE
// Engine boot → Real desktop → Real windows → Your game launches

(function () {
    'use strict';
    window.AVDEF = window.AVDEF || {};
    const Engine = AVDEF.Engine || {};
    window.Engine = Engine;

    // REAL Windows 98 ICONS (local assets)
    const ICONS = {
        folder: 'AntivirusDefend/ui/Win98Theme/Icons/Documents.png',
        mycomp: 'AntivirusDefend/ui/Win98Theme/Icons/My_Computer.png',
        recycle: 'AntivirusDefend/ui/Win98Theme/Icons/Recycle_Bin.ico',
        network: 'AntivirusDefend/ui/Win98Theme/Icons/Network.ico',
        ie: 'AntivirusDefend/ui/Win98Theme/Icons/IE.png',
        settings: 'AntivirusDefend/ui/Win98Theme/Icons/Settings.png',
        help: 'AntivirusDefend/ui/Win98Theme/Icons/How_To_Play.png',
        shutdown: 'AntivirusDefend/ui/Win98Theme/Icons/Documents.png',
        freeplay: 'AntivirusDefend/ui/Win98Theme/Icons/Freeplay.ico',
        towerdef: 'AntivirusDefend/ui/Win98Theme/Icons/Tower_Defense.ico'
    };

    // ==================================================================


    // ========== Freeplay Game Mode Window ==========
    Engine.launchFreeplay = function () {
        if (Engine.isAppOpen("Freeplay")) {
            Engine.showTooManyAppsDialog();
            return;
        }

        Engine.spawnWindow({
            id: "Freeplay",
            title: "Antivirus Freeplay",
            icon: "https://win98icons.alexmeub.com/icons/png/exe-1.png",
            width: 640,
            height: 480,
            resizable: true,
            content: "<canvas id='freeplayCanvas' width='640' height='480'></canvas>",
            onClose: () => {
                Engine.stopFreeplay();
            },
            onMaximize: (win) => {
                win.resize(800, 600);
            },
            onMinimize: (win) => {
                win.hide();
            }
        });

        Engine.startFreeplay("freeplayCanvas");
    };

    // 1. HACKER LOADING SCREEN (PERFECTED)
    // ==================================================================
    const loadingScreen = document.createElement('div');
    Object.assign(loadingScreen.style, {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: '#008080',
        backgroundImage: `repeating-linear-gradient(0deg, #008080, #008080 30px, #009595 30px, #009595 60px),
                      repeating-linear-gradient(90deg, #008080, #008080 30px, #009595 30px, #009595 60px)`,
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        zIndex: 999999, opacity: 1, transition: 'opacity 2s'
    });

    loadingScreen.innerHTML = `
  <style>
    .ad98-virus-overlay{
      position:fixed;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      pointer-events:auto;
    }
    .ad98-virus-dialog{
      background:linear-gradient(135deg,#f5f5f5,#d3d3d3);
      border-radius:4px;
      box-shadow:8px 8px 0 rgba(0,0,0,0.8);
      border:3px solid #ffffff;
      max-width: min(960px, 92vw);
      width: min(960px, 92vw);
      padding: clamp(8px, 1.8vh, 16px);
    }
    .ad98-virus-inner{
      display:flex;
      gap:clamp(8px, 2vw, 20px);
      align-items:stretch;
    }
    .ad98-virus-console{
      flex:0 0 38%;
      background:#000;
      border:4px solid #00ff00;
      box-shadow:0 0 18px rgba(0,255,0,0.7);
      display:flex;
      align-items:flex-start;
      justify-content:flex-start;
      padding:clamp(6px, 1vh, 10px);
      overflow:hidden;
    }
    .ad98-virus-console-inner{
      font-family:"Consolas","Courier New",monospace;
      font-size:clamp(10px, 1.5vh, 13px);
      color:#00ff00;
      line-height:1.4;
      white-space:pre-line;
    }
    .ad98-virus-content{
      flex:1 1 auto;
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      justify-content:center;
      gap:clamp(6px, 1.4vh, 12px);
      padding-inline:clamp(4px, 0.5vw, 10px);
    }
    .ad98-virus-title{
      width:100%;
      background:#000080;
      color:#ffffff;
      font-weight:bold;
      padding:clamp(4px, 0.9vh, 6px) clamp(8px, 1.4vw, 14px);
      box-shadow:0 2px 0 rgba(0,0,0,0.4);
      font-size:clamp(12px, 2vh, 16px);
    }
    .ad98-virus-message{
      font-size:clamp(11px, 1.7vh, 14px);
      color:#202020;
    }
    .ad98-virus-bar-outer{
      width:100%;
      max-width:420px;
      height:clamp(14px, 2.1vh, 18px);
      border:2px solid #000000;
      background:#000;
      padding:2px;
      box-sizing:border-box;
    }
    .ad98-virus-bar-inner{
      width:35%;
      height:100%;
      background:linear-gradient(90deg,#00ff00,#66ff66);
    }
    .ad98-virus-tip{
      font-size:clamp(10px, 1.5vh, 13px);
      color:#404040;
    }
    @media (max-width:720px){
      .ad98-virus-inner{
        flex-direction:column;
      }
      .ad98-virus-console{
        flex-basis:auto;
      }
    }
  </style>
  <div class="ad98-virus-overlay">
    <div class="ad98-virus-dialog">
      <div class="ad98-virus-inner">
        <div class="ad98-virus-console">
          <div class="ad98-virus-console-inner">
C:\>dir games*
defender@engine:~# whoami
          </div>
        </div>
        <div class="ad98-virus-content">
          <div class="ad98-virus-title">Defender Engine (Alpha) - Starting...</div>
          <div class="ad98-virus-message">
            Starting Defender Engine…
          </div>
          <div class="ad98-virus-bar-outer">
            <div class="ad98-virus-bar-inner"></div>
          </div>
          <div class="ad98-virus-tip">
            This may take a few moments. Do not close Defender Engine.
          </div>
        </div>
      </div>
    </div>
  </div>
`;

    document.body.appendChild(loadingScreen);

    const loadBar = loadingScreen.querySelector('.ad98-virus-bar-inner');
    const loadText = loadingScreen.querySelector('.ad98-virus-message');
    const logoText = loadingScreen.querySelector('.ad98-virus-title');
    const subtitle = loadingScreen.querySelector('.ad98-virus-message');
    const hackerLog = loadingScreen.querySelector('.ad98-virus-console');
    const logLines = loadingScreen.querySelector('.ad98-virus-console-inner');

    let progress = 0;
    let hacked = false;

    // Subtitle remains stable (no glitch effect)

    const hackLines = ["C:\\>dir games*", "defender@engine:~# whoami", "loading modules...", "initializing subsystems...", "engine ready", "system online."];

    const timer = setInterval(() => {
        progress += Math.random() * 14 + 8;
        if (progress >= 55 && !hacked) {
            hacked = true;
            loadText.style.color = '#000000';
            loadText.textContent = "Starting Defender Engine...";
            loadBar.style.background = '#000080'; // Defender Engine boot bar
            loadBar.style.filter = 'none';
            logoText.innerHTML = 'Starting Defender Engine';
            logoText.style.animation = 'none';
            hackerLog.style.display = 'none';
            let i = 0;
            const logInt = setInterval(() => {
                if (i < hackLines.length) {
                    logLines.innerHTML += hackLines[i++] + '<br>';
                } else clearInterval(logInt);
            }, 650);
        }

        if (progress > 100) progress = 100;
        loadBar.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(timer);
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.remove();
                    bootIntoWindows98();
                }, 2000);
            }, 2200);
        }
    }, 430);

    // Glitch filter
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.cssText = 'position:absolute;width:0;height:0;';
    svg.innerHTML = `<filter id="glitch"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="6" result="turbulence"/>
    <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="30"/></filter>`;
    document.body.appendChild(svg);

    const css = document.createElement('style');
    css.textContent = `@keyframes glitch{0%,100%{transform:translate(0)}20%{transform:translate(-15px,15px)}40%{transform:translate(15px,-15px)}60%{transform:translate(-15px,-15px)}80%{transform:translate(15px,15px)}}`;
    document.head.appendChild(css);

    // ==================================================================
    // 2. FULL WINDOWS 98 DESKTOP WITH TASKBAR + POPUP WINDOWS
    // ==================================================================
    function bootIntoWindows98() {
        const desktop = document.createElement('div');
        Object.assign(desktop.style, {
            position: 'fixed', inset: 0,
            background: '#008080',
            backgroundImage: `repeating-linear-gradient(0deg, #008080, #008080 30px, #009595 30px, #009595 60px),
                        repeating-linear-gradient(90deg, #008080, #008080 30px, #009595 30px, #009595 60px)`,
            fontFamily: '"MS Sans Serif", Arial, sans-serif',
            overflow: 'hidden'
        });
        document.body.appendChild(desktop);

        // TASKBAR
        const taskbar = document.createElement('div');
        Object.assign(taskbar.style, {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '28px',
            background: '#c0c0c0',
            borderTop: '2px solid #ffffff',
            borderBottom: '2px solid #808080',
            boxShadow: '0 -1px 0 #000000 inset',
            display: 'flex',
            alignItems: 'center',
            padding: '0 2px',
            boxSizing: 'border-box',
            gap: '4px',
            zIndex: 1000
        });


        const startBtn = document.createElement('div');
        Object.assign(startBtn.style, {
            width: '90px',
            height: '20px',
            margin: '1px 4px 3px 0px',
            padding: '0',
            backgroundColor: '#c0c0c0',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0 0',
            backgroundSize: '58px 24px',
            cursor: 'pointer',
            imageRendering: 'pixelated',
            boxSizing: 'border-box',
            display: 'block'
        });
        startBtn.setAttribute('role', 'button');
        startBtn.setAttribute('aria-label', 'Start');

        const startSprites = { normal: null, hover: null, pressed: null };

        function applyStartState(state) {
            const url = startSprites[state];
            if (url) {
                startBtn.style.backgroundImage = `url(${url})`;
            }
        }

        (function prepareStartButtonSprites() {
            const img = new Image();
            img.src = 'AntivirusDefend/ui/Win98Theme/Icons/StartButton/start9x.png';
            img.onload = () => {
                const srcW = 96, srcH = 40;
                const dstW = 58, dstH = 24;
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = dstW;
                canvas.height = dstH;
                ['normal', 'hover', 'pressed'].forEach((state, index) => {
                    ctx.clearRect(0, 0, dstW, dstH);
                    ctx.drawImage(img, 0, index * srcH, srcW, srcH, 0, 0, dstW, dstH);
                    startSprites[state] = canvas.toDataURL();
                });
                applyStartState('normal');
            };
        })();

        startBtn.addEventListener('mouseenter', () => applyStartState('hover'));
        startBtn.addEventListener('mouseleave', () => applyStartState('normal'));
        startBtn.addEventListener('mousedown', () => applyStartState('pressed'));
        startBtn.addEventListener('mouseup', () => applyStartState('hover'));

        taskbar.appendChild(startBtn);


        const clock = document.createElement('div');
        clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        Object.assign(clock.style, { marginLeft: 'auto', padding: '0 12px', fontSize: '14px', color: 'black' });
        setInterval(() => clock.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 1000);
        taskbar.appendChild(clock);

        desktop.appendChild(taskbar);


        // CREATE REAL WINDOW
        function createWin98Window(title, contentHTML, width = 600, height = 500) {
            const win = document.createElement('div');
            const id = 'win_' + Date.now();
            win.id = id;

            // Responsive sizing based on viewport
            const vw = window.innerWidth || document.documentElement.clientWidth || 800;
            const vh = window.innerHeight || document.documentElement.clientHeight || 600;

            const baseW = Math.max(260, width);
            const baseH = Math.max(180, height);

            // Compute a uniform scale so the window always fits within the viewport
            const maxScaleX = (vw - 40) / baseW;
            const maxScaleY = (vh - 80) / baseH;
            const uiScale = Math.min(1, maxScaleX, maxScaleY);

            Object.assign(win.style, {
                position: 'absolute',
                width: baseW + 'px',
                height: baseH + 'px',
                background: '#c0c0c0',
                border: '3px outset #fff',
                boxShadow: '8px 8px 0 #000',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) scale(' + uiScale + ')',
                transformOrigin: 'center center',
                zIndex: 100
            });

            // Title bar
            const titleBar = document.createElement('div');
            Object.assign(titleBar.style, {
                backgroundColor: '#000080',
                backgroundImage: "url('./Win98Theme/Window Headers/Window_Header.png')",
                backgroundRepeat: 'repeat-x',
                color: 'white',
                padding: '4px 10px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '14px',
                cursor: 'default',
                userSelect: 'none',
                boxSizing: 'border-box'
            });

            // Drag support: make windows movable by their title bar
            let isDragging = false;
            let dragInitialized = false;
            let dragOffsetX = 0;
            let dragOffsetY = 0;

            titleBar.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                isDragging = true;

                // On first drag, convert from centered transform to explicit top/left
                if (!dragInitialized) {
                    const deskRect = desktop.getBoundingClientRect();
                    const rect = win.getBoundingClientRect();
                    const left = rect.left - deskRect.left;
                    const top = rect.top - deskRect.top;
                    win.style.left = left + 'px';
                    win.style.top = top + 'px';
                    win.style.transform = 'scale(' + uiScale + ')';
                    win.style.transformOrigin = 'top left';
                    dragInitialized = true;
                }

                const rectNow = win.getBoundingClientRect();
                dragOffsetX = e.clientX - rectNow.left;
                dragOffsetY = e.clientY - rectNow.top;
                e.preventDefault();
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const deskRect = desktop.getBoundingClientRect();
                const newLeft = e.clientX - deskRect.left - dragOffsetX;
                const newTop = e.clientY - deskRect.top - dragOffsetY;
                win.style.left = newLeft + 'px';
                win.style.top = newTop + 'px';
            });

            window.addEventListener('mouseup', () => {
                isDragging = false;
            });

            const titleSpan = document.createElement('span');
            titleSpan.textContent = title;
            titleBar.appendChild(titleSpan);

            const btnRow = document.createElement('div');

            // Minimize button
            const minBtn = document.createElement('button');
            minBtn.textContent = '_';
            Object.assign(minBtn.style, {
                width: '20px',
                height: '20px',
                padding: '0',
                marginLeft: '4px',
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer'
            });
            btnRow.appendChild(minBtn);

            // Maximize button (used/overridden by ensureGameWindow for the game window)
            const maxBtn = document.createElement('button');
            maxBtn.textContent = '▢';
            Object.assign(maxBtn.style, {
                width: '20px',
                height: '20px',
                padding: '0',
                marginLeft: '4px',
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer'
            });
            btnRow.appendChild(maxBtn);

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            Object.assign(closeBtn.style, {
                width: '20px',
                height: '20px',
                padding: '0',
                marginLeft: '4px',
                background: '#c0c0c0',
                border: '2px outset #fff',
                cursor: 'pointer'
            });
            btnRow.appendChild(closeBtn);

            titleBar.appendChild(btnRow);

            // Client area
            const content = document.createElement('div');
            Object.assign(content.style, {
                padding: '20px',
                height: 'calc(100% - 40px)',
                overflow: 'auto',
                background: '#c0c0c0',
                boxSizing: 'border-box'
            });

            if (typeof contentHTML === 'string') {
                content.innerHTML = contentHTML;
            } else if (contentHTML instanceof HTMLElement) {
                content.appendChild(contentHTML);
            }

            win.appendChild(titleBar);
            win.appendChild(content);
            desktop.appendChild(win);

            // Expose internals for helpers like ensureGameWindow and menu.js
            win._titleBar = titleBar;
            win._content = content;
            win._closeBtn = closeBtn;
            win._maxBtn = maxBtn;
            win._minBtn = minBtn;

            // Default close behaviour for generic windows
            closeBtn.addEventListener('click', () => {
                if (win.parentElement === desktop) {
                    desktop.removeChild(win);
                } else if (win.parentElement) {
                    win.parentElement.removeChild(win);
                }
            });

            // Minimize / restore behaviour
            let isMinimized = false;
            let prevHeightForMin = null;
            minBtn.addEventListener('click', () => {
                if (!isMinimized) {
                    prevHeightForMin = win.style.height;
                    content.style.display = 'none';
                    win.style.height = '28px';
                    isMinimized = true;
                } else {
                    win.style.height = prevHeightForMin || (baseH + 'px');
                    content.style.display = 'block';
                    isMinimized = false;
                }
            });

            // Simple maximize / restore behaviour for generic windows
            let isMaximized = false;
            let prevRect = null;
            maxBtn.addEventListener('click', () => {
                if (!isMaximized) {
                    prevRect = {
                        width: win.style.width,
                        height: win.style.height,
                        top: win.style.top,
                        left: win.style.left,
                        transform: win.style.transform
                    };
                    // Maximizing always un-minimizes the window
                    content.style.display = 'block';
                    win.style.top = '0';
                    win.style.left = '0';
                    win.style.transform = 'none';
                    win.style.width = '100%';
                    win.style.height = 'calc(100% - 30px)';
                    isMaximized = true;
                    isMinimized = false;
                } else if (prevRect) {
                    win.style.width = prevRect.width;
                    win.style.height = prevRect.height;
                    win.style.top = prevRect.top;
                    win.style.left = prevRect.left;
                    win.style.transform = prevRect.transform;
                    isMaximized = false;
                }
            });

            return win;
        }
        window.createWin98Window = createWin98Window;


        function showWin98Download(fileName, onComplete) {
            const safeName = fileName || "antivirus_setup.exe";
            const content = `
        <div style="display:flex;gap:16px;align-items:flex-start;">
          <div style="font-size:36px;margin-top:6px;">🌐</div>
          <div style="flex:1;font-size:12px;">
            <div style="margin-bottom:10px;">Opening: <b>${safeName}</b></div>
            <div style="margin-bottom:6px;">From: www.antivirus-defend.net</div>
            <div style="margin-top:12px;border:2px inset #808080;background:#c0c0c0;height:20px;">
              <div id="dlBar" style="background:#000080;width:0;height:100%;"></div>
            </div>
            <div style="margin-top:4px;font-size:11px;line-height:1.4;">
              Estimated time left: <span id="dlEta">10 seconds</span><br/>
              Download to: Temporary Folder<br/>
              Transfer rate: 680 bytes/sec
            </div>
          </div>
          <div>
            <div style="width:40px;height:32px;background:#ffff99;border:1px solid #000;margin-bottom:4px;"></div>
            <div style="font-size:11px;">Downloading...</div>
          </div>
        </div>
        <div style="margin-top:14px;text-align:right;">
          <button id="dlCancelBtn" style="min-width:80px;">Cancel</button>
        </div>
      `;
            const win = createWin98Window("File Download", content, 480, 260);
            const bar = win.querySelector('#dlBar');
            const eta = win.querySelector('#dlEta');
            const cancelBtn = win.querySelector('#dlCancelBtn');

            let running = true;
            const totalMs = 1800;
            const start = performance.now();

            function step(now) {
                if (!running) return;
                const t = Math.min(1, (now - start) / totalMs);
                if (bar) bar.style.width = Math.round(t * 100) + '%';
                if (eta) eta.textContent = (Math.max(0, Math.round((1 - t) * 10))) + " seconds";
                if (t < 1) {
                    requestAnimationFrame(step);
                } else {
                    running = false;
                    win.remove();
                    if (typeof onComplete === 'function') onComplete();
                }
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    running = false;
                    win.remove();
                });
            }

            requestAnimationFrame(step);
        }

        // ICON CREATOR
        function icon(src, label, top, left, onclick) {
            const div = document.createElement('div');
            div.style.cssText = `position:absolute;top:${top}px;left:${left}px;width:100px;text-align:center;cursor:pointer;user-select:none;`;
            div.innerHTML = `
        <img src="${src}" width="48" height="48" style="image-rendering:pixelated;margin-bottom:6px;">
        <div style="background:rgba(0,0,139,0.9);color:white;padding:4px;font-size:12px;border:1px solid #000080;">
          ${label}
        </div>
      `;

            div.onclick = onclick;
            desktop.appendChild(div);
        }

        // GAME WINDOW MANAGEMENT
        const gameCanvas = document.getElementById('gameCanvas');
        let gameWindow = null;
        let gameWindowMaximized = false;
        let gameWindowPrevRect = null;

        function ensureGameWindow() {
            if (!gameCanvas) return null;
            if (gameWindow && gameWindow.isConnected) {
                gameWindow.style.display = 'block';
                if (Engine && typeof Engine.resizeGameCanvas === 'function') {
                    Engine.resizeGameCanvas();
                }
                return gameWindow;
            }

            const win = createWin98Window(
                'Antivirus Defend',
                '<div id="gameWindowClient" style="width:100%;height:100%;background:#000000;position:relative;"></div>',
                960,
                620
            );
            const client = win._content.querySelector('#gameWindowClient');
            if (client) {
                client.innerHTML = '';
                const wrap = document.createElement('div');
                wrap.className = 'game-wrap';
                wrap.style.position = 'absolute';
                wrap.style.inset = '0';
                wrap.style.display = 'flex';
                wrap.style.alignItems = 'center';
                wrap.style.justifyContent = 'center';
                wrap.style.padding = '6px';
                wrap.style.boxSizing = 'border-box';
                client.appendChild(wrap);

                wrap.appendChild(gameCanvas);
                gameCanvas.style.display = 'block';
                gameCanvas.style.width = '';
                gameCanvas.style.height = '';
            }

            if (Engine && typeof Engine.resizeGameCanvas === 'function') {
                Engine.resizeGameCanvas();
            }

            const titleBar = win._titleBar;
            const closeBtn = win._closeBtn;
            const maxBtn = win._maxBtn;
            gameWindowPrevRect = null;

            if (closeBtn) {
                closeBtn.onclick = () => {
                    if (window.AVDEF && AVDEF.Engine) {
                        if (typeof AVDEF.Engine.setGameMode === 'function') {
                            AVDEF.Engine.setGameMode(null);
                        }
                        if (typeof AVDEF.Engine.setGameState === 'function') {
                            AVDEF.Engine.setGameState('title');
                        }
                    }
                    win.style.display = 'none';
                };
            }

            if (maxBtn && titleBar) {
                maxBtn.onclick = () => {
                    if (!gameWindowMaximized) {
                        gameWindowPrevRect = {
                            width: win.style.width,
                            height: win.style.height,
                            top: win.style.top,
                            left: win.style.left,
                            transform: win.style.transform
                        };
                        win.style.top = '0';
                        win.style.left = '0';
                        win.style.transform = 'none';
                        win.style.width = '100%';
                        win.style.height = 'calc(100% - 30px)';
                        gameWindowMaximized = true;
                    } else if (gameWindowPrevRect) {
                        win.style.width = gameWindowPrevRect.width;
                        win.style.height = gameWindowPrevRect.height;
                        win.style.top = gameWindowPrevRect.top;
                        win.style.left = gameWindowPrevRect.left;
                        win.style.transform = gameWindowPrevRect.transform;
                        gameWindowMaximized = false;
                    }
                    if (Engine && typeof Engine.resizeGameCanvas === 'function') {
                        Engine.resizeGameCanvas();
                    }
                };

                win.addEventListener('mousemove', (ev) => {
                    if (!gameWindowMaximized) {
                        titleBar.style.opacity = '1';
                        return;
                    }
                    const rect = win.getBoundingClientRect();
                    const relY = ev.clientY - rect.top;
                    titleBar.style.opacity = relY < 28 ? '1' : '0';
                });
            }

            gameWindow = win;
            return win;
        }

        
        // DEFENDER ENGINE PROJECT HUB ICONS
        // New Project: launches Win98-style name dialog + DEFScript editor.
        icon(ICONS.freeplay, "New Project", 60, 60, () => {
            const editor = window.AVDEF && window.AVDEF.Editor;
            if (!editor || typeof editor.launchNewProjectWizard !== "function") {
                createWin98Window("New Project", `
        <p>The DEFScript editor is not available.</p>
        <p>Please check <code>editor.js</code> inclusion.</p>
      `, 440, 260);
                return;
            }
            editor.launchNewProjectWizard();
        });

        // Open Project: uses a Win98-style project picker window.
        icon(ICONS.towerdef, "Open Project", 60, 190, () => {
            const editor = window.AVDEF && window.AVDEF.Editor;
            if (!editor || typeof editor.launchOpenProjectWizard !== "function") {
                createWin98Window("Open Project", `
        <p>The DEFScript editor is not available.</p>
        <p>Please check <code>editor.js</code> inclusion.</p>
      `, 440, 260);
                return;
            }
            editor.launchOpenProjectWizard();
        });

// Example Projects: describe where packed examples live.
        icon(ICONS.mycomp, "Example Projects", 60, 320, () => {
            const pm = window.AVDEF && window.AVDEF.ProjectManager;
            const root = pm ? pm.PACK_EXAMPLE_ROOT : "AntivirusDefend/Example Projects/";

            createWin98Window("Example Projects", `
        <p>Bundled example projects will live inside the engine pack at:</p>
        <code>${root}</code>
        <p>They can be opened as templates and saved into your projects folder:</p>
        <code>%USER%/Documents/Defender Engine/Projects</code>
        <p>(Next phase: wire this to a manifest of .defproject examples.)</p>
      `, 560, 360);
        });

        // Tutorial: simple engine intro for now.
        icon(ICONS.help, "Tutorial", 60, 450, () => {
            createWin98Window("Tutorial", `
        <p>Welcome to <b>Defender Engine</b>.</p>
        <p>This environment lets you create game projects using a simple DEFScript language.</p>
        <p>Start by creating a project from the desktop icon, then later you&apos;ll be able to edit and run it from an integrated editor.</p>
      `, 520, 340);
        });

// CLASSIC ICONS (temporarily disabled during Defender Engine development)

        // WINDOWS FOR HERO/STAGE SELECT
        function createStageWindow(modeId) {
            createWin98Window(`Select Stage - ${modeId}`, `
        <div id="stageGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:20px;"></div>
        <div style="margin-top:30px;text-align:center;">
          <button onclick="startGame()">Start Game</button>
        </div>
      `, 750, 600);
            setTimeout(buildStageGridInCurrentWindow, 100);
        }



        // Hook up Start button and hand off to menu layer
        const renderContext = {
            desktop,
            taskbar,
            startButton: startBtn,
            createWindow: createWin98Window,
            showDownload: showWin98Download,
            createIcon: icon,
            icons: ICONS,
            ensureGameWindow
        };

        if (window.AVDEF && AVDEF.Menu && typeof AVDEF.Menu.initDesktop === 'function') {
            AVDEF.Menu.initDesktop(renderContext);
        } else {
            startBtn.onclick = () => alert("Start menu not available yet — use desktop icons if present.");
        }
    }

    // ==================================================================
    // 3. RENDER BRIDGE
    // ==================================================================
    AVDEF.Render = AVDEF.Render || {};
    AVDEF.Render.draw = function () {
        if (AVDEF.Engine && typeof AVDEF.Engine._internalDraw === 'function') {
            AVDEF.Engine._internalDraw();
        }
    };

})();