// Simple in-page debugger overlay.
// Shows JS errors and custom logs even on mobile (no devtools needed).

(function () {
  // Create global DEBUG namespace
  window.DEBUG = window.DEBUG || {};

  // --- Create debug panel in DOM ---
  var panel = document.createElement('div');
  panel.id = 'debugPanel';
  panel.style.position = 'fixed';
  panel.style.bottom = '0';
  panel.style.left = '0';
  panel.style.right = '0';
  panel.style.maxHeight = '40vh';
  panel.style.background = 'rgba(15,23,42,0.95)'; // slate-ish
  panel.style.color = '#e5e7eb';
  panel.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  panel.style.fontSize = '11px';
  panel.style.overflowY = 'auto';
  panel.style.borderTop = '1px solid rgba(148,163,184,0.5)';
  panel.style.zIndex = '9999';
  panel.style.display = 'none'; // hidden by default
  panel.style.padding = '4px 6px';

  var header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '4px';

  var title = document.createElement('div');
  title.textContent = 'Debug Console';
  title.style.fontWeight = '600';

  var controls = document.createElement('div');

  var toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'Show';
  toggleBtn.style.fontSize = '10px';
  toggleBtn.style.marginRight = '4px';

  var clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear';
  clearBtn.style.fontSize = '10px';

  [toggleBtn, clearBtn].forEach(function (btn) {
    btn.style.border = '1px solid rgba(148,163,184,0.6)';
    btn.style.background = 'rgba(15,23,42,0.9)';
    btn.style.color = '#e5e7eb';
    btn.style.borderRadius = '3px';
    btn.style.padding = '2px 6px';
  });

  controls.appendChild(toggleBtn);
  controls.appendChild(clearBtn);
  header.appendChild(title);
  header.appendChild(controls);

  var body = document.createElement('div');
  body.id = 'debugPanelBody';

  panel.appendChild(header);
  panel.appendChild(body);
  document.body.appendChild(panel);

  var visible = false;

  toggleBtn.addEventListener('click', function () {
    visible = !visible;
    panel.style.display = visible ? 'block' : 'none';
    toggleBtn.textContent = visible ? 'Hide' : 'Show';
  });

  clearBtn.addEventListener('click', function () {
    body.innerHTML = '';
  });

  function addLine(level, message, meta) {
    // auto-show panel on first error
    if (!visible && level === 'error') {
      visible = true;
      panel.style.display = 'block';
      toggleBtn.textContent = 'Hide';
    }

    var line = document.createElement('div');
    line.style.marginBottom = '2px';

    var tag = '[' + level.toUpperCase() + ']';
    var text = tag + ' ' + message;

    if (meta && (meta.source || meta.lineno)) {
      text += ' (' +
        (meta.source || 'unknown') +
        (meta.lineno ? ':' + meta.lineno : '') +
        (meta.colno ? ':' + meta.colno : '') +
        ')';
    }

    line.textContent = text;

    if (level === 'error') {
      line.style.color = '#fecaca'; // light red
    } else if (level === 'warn') {
      line.style.color = '#fde68a'; // amber
    } else {
      line.style.color = '#a5b4fc'; // indigo-ish
    }

    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  // Expose a manual log helper
  window.DEBUG.log = function (msg, level, meta) {
    addLine(level || 'info', msg, meta || {});
  };

  // --- Global error handlers ---

  window.addEventListener('error', function (event) {
    addLine('error', event.message, {
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    if (event.error && event.error.stack) {
      addLine('error', 'Stack: ' + event.error.stack.substring(0, 200), {});
    }
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    var msg = 'Unhandled promise rejection';
    if (reason && typeof reason === 'object') {
      if (reason.message) msg += ': ' + reason.message;
    } else if (reason) {
      msg += ': ' + String(reason);
    }
    addLine('error', msg, { source: 'promise' });
  });

  // --- Optional module sanity checks after load ---

  window.addEventListener('load', function () {
    try {
      if (!window.AVDEF) {
        addLine('warn', 'AVDEF namespace is not defined', { source: 'modules' });
        return;
      }
      if (!AVDEF.Heroes) {
        addLine('warn', 'AVDEF.Heroes is missing', { source: 'heroes.js' });
      } else {
        var heroes = AVDEF.Heroes.getAll ? AVDEF.Heroes.getAll() : [];
        addLine('info', 'Heroes module loaded (' + heroes.length + ' heroes)', { source: 'heroes.js' });
      }

      if (!AVDEF.Enemies) {
        addLine('warn', 'AVDEF.Enemies is missing', { source: 'enemies.js' });
      } else {
        addLine('info', 'Enemies module loaded', { source: 'enemies.js' });
      }

      if (!AVDEF.Stages) {
        addLine('warn', 'AVDEF.Stages is missing', { source: 'stages.js' });
      } else {
        var stages = AVDEF.Stages.list ? AVDEF.Stages.list() : [];
        addLine('info', 'Stages module loaded (' + stages.length + ' stages)', { source: 'stages.js' });
      }

      if (!AVDEF.Upgrades) {
        addLine('warn', 'AVDEF.Upgrades is missing', { source: 'upgrades.js' });
      } else {
        addLine('info', 'Upgrades module loaded', { source: 'upgrades.js' });
      }
    } catch (err) {
      addLine('error', 'Module sanity check failed: ' + err.message, { source: 'debug.js' });
    }
  });
})();
