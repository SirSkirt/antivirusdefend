(function (global) {
  "use strict";

  global.AVDEF = global.AVDEF || {};

  const Editor = {};

  function openEditorWindow(descriptor, initialSource) {
    if (typeof createWin98Window !== "function") {
      console.error("createWin98Window is not available");
      alert("Editor cannot open: window system not ready.");
      return null;
    }

    const projectName = descriptor && (descriptor.name || descriptor.id) || "Untitled";
    const title = 'DEFScript Editor - ' + projectName;

    const contentHTML = [
      '<div class="defeditor-root" style="display:flex;flex-direction:column;height:100%;font-family:\'Lucida Console\',monospace;font-size:11px;">',
        '<div class="defeditor-toolbar" style="padding:2px;border-bottom:1px solid #808080;background:#c0c0c0;">',
          '<button type="button" class="defeditor-btn-save" style="font-family:inherit;font-size:11px;padding:2px 8px;margin-right:4px;">Save</button>',
          '<span style="font-family:\'MS Sans Serif\',system-ui;font-size:11px;">Project: ' + escapeHtml(projectName) + '</span>',
        '</div>',
        '<div class="defeditor-main" style="flex:1;padding:2px 2px 0 2px;">',
          '<textarea class="defeditor-textarea" spellcheck="false" ',
            'style="width:100%;height:100%;box-sizing:border-box;resize:none;',
                   'border:1px solid #808080;background:#ffffff;color:#000000;',
                   'font-family:\'Lucida Console\',monospace;font-size:11px;',
                   'line-height:1.3;"></textarea>',
        '</div>',
        '<div class="defeditor-status" style="padding:2px;border-top:1px solid #808080;background:#c0c0c0;',
             'font-family:\'MS Sans Serif\',system-ui;font-size:11px;">',
          'Ready.',
        '</div>',
      '</div>'
    ].join("");

    const win = createWin98Window(title, contentHTML, 720, 520);
    if (!win) return null;

    const textarea = win.querySelector(".defeditor-textarea");
    const btnSave = win.querySelector(".defeditor-btn-save");
    const statusBar = win.querySelector(".defeditor-status");

    if (textarea) {
      textarea.value = initialSource || "";
    }

    function setStatus(text) {
      if (statusBar) {
        statusBar.textContent = text;
      }
    }

    if (btnSave && textarea && descriptor) {
      btnSave.addEventListener("click", function () {
        const pm = global.AVDEF && global.AVDEF.ProjectManager;
        if (!pm) {
          console.error("ProjectManager not available for save");
          setStatus("Cannot save: ProjectManager not loaded.");
          return;
        }
        const ok = pm.saveProject(descriptor, textarea.value);
        if (ok) {
          setStatus("Saved at " + new Date().toLocaleTimeString());
        } else {
          setStatus("Failed to save project (localStorage may be full/disabled).");
        }
      });
    }

    return win;
  }

  function openForNewProject(descriptor, initialSource) {
    return openEditorWindow(descriptor, initialSource || "");
  }

  function openForExistingProject(projectPayload) {
    if (!projectPayload || !projectPayload.descriptor) {
      console.error("Invalid project payload for editor");
      return;
    }
    const descriptor = projectPayload.descriptor;
    const mainScript = descriptor.mainScript || "game.defscript";
    const files = projectPayload.files || {};
    const src = files[mainScript] || "";
    return openEditorWindow(descriptor, src);
  }

  function launchNewProjectWizard() {
    const pm = global.AVDEF && global.AVDEF.ProjectManager;
    if (!pm) {
      console.error("ProjectManager not available for new project");
      if (typeof global.createWin98Window === "function") {
        global.createWin98Window("New Project", "<p>Project system is not ready.</p>", 360, 200);
      }
      return;
    }

    const winFactory = global.createWin98Window;
    if (typeof winFactory !== "function") {
      console.error("createWin98Window not available for new project");
      return;
    }

    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      fontFamily: "'MS Sans Serif', system-ui, sans-serif",
      fontSize: "12px"
    });

    const label = document.createElement("div");
    label.textContent = "Project name:";
    const input = document.createElement("input");
    Object.assign(input.style, {
      width: "100%",
      boxSizing: "border-box",
      border: "1px solid #808080",
      padding: "2px"
    });
    input.value = "Untitled Game";

    const buttons = document.createElement("div");
    Object.assign(buttons.style, {
      display: "flex",
      justifyContent: "flex-end",
      gap: "6px",
      marginTop: "10px"
    });

    const btnOk = document.createElement("button");
    btnOk.textContent = "Create";
    Object.assign(btnOk.style, {
      padding: "2px 10px",
      border: "2px outset #fff",
      backgroundColor: "#c0c0c0",
      cursor: "pointer"
    });

    const btnCancel = document.createElement("button");
    btnCancel.textContent = "Cancel";
    Object.assign(btnCancel.style, {
      padding: "2px 10px",
      border: "2px outset #fff",
      backgroundColor: "#c0c0c0",
      cursor: "pointer"
    });

    buttons.appendChild(btnOk);
    buttons.appendChild(btnCancel);

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    wrapper.appendChild(buttons);

    const win = winFactory("New Project", wrapper, 360, 180);

    function closeWin() {
      if (win && win.parentElement) {
        win.parentElement.removeChild(win);
      }
    }

    btnCancel.addEventListener("click", () => {
      closeWin();
    });

    btnOk.addEventListener("click", () => {
      const rawName = input.value && input.value.trim() ? input.value.trim() : "Untitled Game";
      const descriptor = pm.createNewProjectDescriptor(rawName);
      const defaultScript = "// " + descriptor.name + "\n// main game script\n\n" +
        "on start:\n  print \"Hello from DEFScript!\"\n";
      pm.saveProject(descriptor, defaultScript);
      closeWin();
      openEditorWindow(descriptor, defaultScript);
    });

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        ev.preventDefault();
        btnOk.click();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        btnCancel.click();
      }
    });

    setTimeout(() => {
      try { input.focus(); input.select(); } catch (e) {}
    }, 0);
  }

  function launchOpenProjectWizard() {
    const pm = global.AVDEF && global.AVDEF.ProjectManager;
    if (!pm) {
      console.error("ProjectManager not available for open project");
      if (typeof global.createWin98Window === "function") {
        global.createWin98Window("Open Project", "<p>Project system is not ready.</p>", 360, 200);
      }
      return;
    }

    const projects = pm.listSavedProjects();
    if (!projects || !projects.length) {
      if (typeof global.createWin98Window === "function") {
        global.createWin98Window("Open Project", "<p>No saved projects were found.</p><p>Create one via <b>New Project</b> first.</p>", 420, 260);
      }
      return;
    }

    const winFactory = global.createWin98Window;
    if (typeof winFactory !== "function") {
      console.error("createWin98Window not available for open project");
      return;
    }

    const wrapper = document.createElement("div");
    Object.assign(wrapper.style, {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      fontFamily: "'MS Sans Serif', system-ui, sans-serif",
      fontSize: "12px"
    });

    const label = document.createElement("div");
    label.textContent = "Select a project to open:";
    wrapper.appendChild(label);

    const list = document.createElement("div");
    Object.assign(list.style, {
      maxHeight: "220px",
      overflowY: "auto",
      border: "1px inset #808080",
      padding: "4px",
      backgroundColor: "#ffffff"
    });

    projects.forEach((p) => {
      const btn = document.createElement("button");
      const name = p.name || p.id || "Project";
      btn.textContent = name + " (" + p.id + ")";
      Object.assign(btn.style, {
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "2px 6px",
        marginBottom: "2px",
        border: "1px solid #808080",
        backgroundColor: "#e0e0e0",
        cursor: "pointer",
        fontSize: "12px"
      });
      btn.addEventListener("click", () => {
        const payload = pm.loadProject(p.id);
        if (payload) {
          closeWin();
          openEditorWindow(payload.descriptor, (payload.files && payload.files[p.mainScript || "game.defscript"]) || "");
        }
      });
      list.appendChild(btn);
    });

    wrapper.appendChild(list);

    const closeRow = document.createElement("div");
    Object.assign(closeRow.style, {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "8px"
    });

    const btnClose = document.createElement("button");
    btnClose.textContent = "Close";
    Object.assign(btnClose.style, {
      padding: "2px 10px",
      border: "2px outset #fff",
      backgroundColor: "#c0c0c0",
      cursor: "pointer"
    });
    closeRow.appendChild(btnClose);
    wrapper.appendChild(closeRow);

    const win = winFactory("Open Project", wrapper, 420, 320);

    function closeWin() {
      if (win && win.parentElement) {
        win.parentElement.removeChild(win);
      }
    }

    btnClose.addEventListener("click", () => {
      closeWin();
    });
  }
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  Editor.openForNewProject = openForNewProject;
  Editor.openForExistingProject = openForExistingProject;
  Editor.launchNewProjectWizard = launchNewProjectWizard;
  Editor.launchOpenProjectWizard = launchOpenProjectWizard;

  global.AVDEF.Editor = Editor;

})(typeof window !== "undefined" ? window : this);
