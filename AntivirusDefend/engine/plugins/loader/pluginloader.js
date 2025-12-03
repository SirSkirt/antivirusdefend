// pluginloader.js
// Plugin manifest + gamemode loader for Antivirus Defend

(function(){
  window.AVDEF = window.AVDEF || {};
  AVDEF.PluginLoader = AVDEF.PluginLoader || {};
  AVDEF.PluginLoader._loadedScripts = AVDEF.PluginLoader._loadedScripts || {};

  // --- Parse a .gmemde manifest ---------------------------------------
  function parseGmemde(text){
    // 1) Try JSON first
    try{
      const obj = JSON.parse(text);
      if (obj && typeof obj === 'object') {
        return obj;
      }
    }catch(e){
      // Not JSON, fall through to simple key=value parsing.
    }

    // 2) Simple key=value format
    const meta = {};
    const lines = String(text || '').split(/\r?\n/);
    for (let raw of lines){
      if (!raw) continue;
      const trimmed = raw.trim();
      if (!trimmed || trimmed[0] === '#' || trimmed[0] === ';') continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!key) continue;
      meta[key] = value.replace(/^["']|["']$/g, '');
    }
    return meta;
  }

  // --- Optional index file --------------------------------------------
  async function loadIndexFile(){
    const indexUrl = 'AntivirusDefend/engine/plugins/plugins_index.json';
    try{
      const res = await fetch(indexUrl, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data.gamemodes)) return data.gamemodes;
      if (Array.isArray(data.manifests)) return data.manifests;
      return null;
    }catch(err){
      if (window.console && console.warn){
        console.warn('[PluginLoader] Failed to load plugin index', err);
      }
      return null;
    }
  }

  // --- Public API: loadManifests --------------------------------------
  AVDEF.PluginLoader.loadManifests = async function(manifestUrls){
    let urls = null;

    if (Array.isArray(manifestUrls) && manifestUrls.length){
      urls = manifestUrls.slice();
    }else{
      const fromIndex = await loadIndexFile();
      if (Array.isArray(fromIndex) && fromIndex.length){
        urls = fromIndex.slice();
      }else{
        urls = [
          'AntivirusDefend/engine/plugins/gamemodes/Builtin/freeplay.gmemde',
          'AntivirusDefend/engine/plugins/gamemodes/Builtin/towerdef.gmemde'
        ];
      }
    }

    const results = [];
    for (const url of urls){
      try{
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok){
          if (window.console && console.warn){
            console.warn('[PluginLoader] Manifest fetch failed:', url, res.status);
          }
          continue;
        }
        const text = await res.text();
        const meta = parseGmemde(text) || {};
        if (!meta.id){
          const m = url.match(/([^\\/]+)\.gmemde$/);
          if (m) meta.id = m[1];
        }
        if (!meta.name && meta.label) meta.name = meta.label;
        results.push({ url, meta });
      }catch(err){
        if (window.console && console.warn){
          console.warn('[PluginLoader] Failed to load manifest', url, err);
        }
      }
    }

    AVDEF.PluginLoader.manifests = results;
    return results;
  };

  // --- Bootstrap: register stubs in AVDEF.GameModes -------------------
  (async function bootstrapGameModes(){
    try{
      const entries = await AVDEF.PluginLoader.loadManifests();

      window.AVDEF = window.AVDEF || {};
      AVDEF.GameModes = AVDEF.GameModes || {};

      if (Array.isArray(entries)){
        entries.forEach(function(entry){
          if (!entry || !entry.meta) return;
          const url = entry.url;
          const m = entry.meta;
          const id = m.id;
          if (!id) return;

          if (!AVDEF.GameModes[id]){
            AVDEF.GameModes[id] = {
              id: id,
              label: m.label || m.name || id,
              name: m.name || m.label || id,
              description: m.description || '',
              pluginType: m.type || m.kind || 'gamemode',
              manifestUrl: url,
              canvasLayout: m.canvasLayout || m.canvasType || null,
              canvasSize: m.canvasSize || null
            };
          }

          if (m.script && typeof document !== 'undefined') {
            const src = m.script;
            if (!AVDEF.PluginLoader._loadedScripts[src]) {
              AVDEF.PluginLoader._loadedScripts[src] = 'loading';
              const scriptEl = document.createElement('script');
              scriptEl.src = src;
              scriptEl.async = true;
              scriptEl.onload = function(){
                AVDEF.PluginLoader._loadedScripts[src] = 'loaded';
                if (window.console && console.log){
                  console.log('[PluginLoader] Loaded script for mode', id, 'from', src);
                }
              };
              scriptEl.onerror = function(e){
                AVDEF.PluginLoader._loadedScripts[src] = 'error';
                if (window.console && console.warn){
                  console.warn('[PluginLoader] Failed to load script for mode', id, 'from', src, e);
                }
              };
              (document.head || document.documentElement || document.body).appendChild(scriptEl);
            }
          }
        });
      }

      // Built-in safety net: ensure core bundled modes exist even if manifests fail.
      const builtinFallbacks = [
        {
          id: 'freeplay',
          name: 'Freeplay',
          label: 'Freeplay',
          description: 'Endless survival mode with ramsticks, waves, and upgrades.',
          manifestUrl: 'AntivirusDefend/engine/plugins/gamemodes/Builtin/freeplay.gmemde'
        },
        {
          id: 'towerdef',
          name: 'Tower Defense',
          label: 'Tower Defense',
          description: 'Prototype tower defense mode plugin (WIP).',
          manifestUrl: 'AntivirusDefend/engine/plugins/gamemodes/Builtin/towerdef.gmemde'
        }
      ];

      builtinFallbacks.forEach(function(meta){
        if (!meta || !meta.id) return;
        if (!AVDEF.GameModes[meta.id]){
          AVDEF.GameModes[meta.id] = {
            id: meta.id,
            label: meta.label,
            name: meta.name,
            description: meta.description,
            pluginType: 'gamemode',
            manifestUrl: meta.manifestUrl
          };
        }
      });

      if (window.console && console.log){
        console.log('[PluginLoader] Registered modes:', Object.keys(AVDEF.GameModes));
      }
    }catch(err){
      if (window.console && console.warn){
        console.warn('[PluginLoader] bootstrap failed', err);
      }
    }
  })();

})();
