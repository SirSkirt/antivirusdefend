// pluginloader.js
// Plugin manifest + gamemode loader for Antivirus Defend
// - Reads .gmemde manifest files (JSON or simple key=value)
// - Optionally uses plugins_index.json to discover available gamemodes
// - Populates AVDEF.PluginLoader.manifests and AVDEF.GameModes stubs.

(function(){
  window.AVDEF = window.AVDEF || {};
  AVDEF.PluginLoader = AVDEF.PluginLoader || {};

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

    // 2) Simple INI-style: key = value
    const meta = {};
    text.split(/\r?\n/).forEach(function(line){
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!key) return;
      // Strip surrounding quotes if present
      meta[key] = value.replace(/^["']|["']$/g, '');
    });
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

  // --- Public API: loadManifests -------------------------------------
  AVDEF.PluginLoader.loadManifests = async function(manifestUrls){
    let urls = null;

    if (manifestUrls && manifestUrls.length){
      urls = manifestUrls;
    }else{
      urls = await loadIndexFile();
    }

    // Fallback if the index is missing or empty
    if (!urls || !urls.length){
      urls = [
        'AntivirusDefend/engine/plugins/gamemodes/freeplay.gmemde'
      ];
    }

    const results = [];
    for (const url of urls){
      try{
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const text = await res.text();
        const meta = parseGmemde(text) || {};
        meta.__url = url;

        // Derive id from filename if the manifest didn't specify one
        if (!meta.id){
          const m = url.match(/([^\\/]+)\.gmemde$/);
          if (m) meta.id = m[1];
        }
        // Normalise naming fields
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
      if (!entries || !entries.length) return;

      window.AVDEF = window.AVDEF || {};
      AVDEF.GameModes = AVDEF.GameModes || {};

      entries.forEach(function(entry){
        const m = entry.meta || entry;
        if (!m) return;
        const id = m.id || m.name;
        if (!id) return;

        // Don’t overwrite an existing JS-defined mode (like Freeplay)
        if (!AVDEF.GameModes[id]){
          AVDEF.GameModes[id] = {
            id: id,
            label: m.label || m.name || id,
            name: m.name || m.label || id,
            description: m.description || '',
            pluginType: m.type || m.kind || 'gamemode',
            manifestUrl: entry.url
          };
        }

      // Built-in safety net: ensure core bundled modes exist even if manifests fail.
      const builtinFallbacks = [
        {
          id: 'freeplay',
          name: 'Freeplay',
          label: 'Freeplay',
          description: 'Endless survival mode with ramsticks, waves, and upgrades.',
          manifestUrl: 'AntivirusDefend/engine/plugins/gamemodes/freeplay.gmemde'
        },
        {
          id: 'towerdef',
          name: 'Tower Defense',
          label: 'Tower Defense',
          description: 'Prototype tower defense mode plugin (WIP).',
          manifestUrl: 'AntivirusDefend/engine/plugins/gamemodes/TowerDefense/towerdef.gmemde'
        }
      ];
      builtinFallbacks.forEach(meta => {
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

      // Debug helper: log what the loader actually registered so we can inspect in the console.
      if (window.console && console.log){
        console.log('[PluginLoader] Registered modes:', Object.keys(AVDEF.GameModes));
      }
      });
    }catch(err){
      if (window.console && console.warn){
        console.warn('[PluginLoader] bootstrap failed', err);
      }
    }
  })();

})();