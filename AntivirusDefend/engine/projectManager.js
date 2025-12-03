// AntivirusDefend/engine/projectManager.js
// Simple in-browser project management for Defender Engine.
// Uses localStorage for persistence, but encodes the intended
// real filesystem layout for exports / native builds.

window.AVDEF = window.AVDEF || {};

AVDEF.ProjectManager = (function () {
  // Conceptual default path for real files on disk
  const DEFAULT_FS_ROOT = "%USER%/Documents/Defender Engine/Projects";

  // Where bundled example projects live inside the engine pack/zip
  const PACK_EXAMPLE_ROOT = "AntivirusDefend/Example Projects/";

  function slugify(name) {
    return (name || "project")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project";
  }

  function defaultPaths(name) {
    const id = slugify(name);
    const filesDir = id + "_files";
    const mainScript = "game.defscript";
    return { id, filesDir, mainScript };
  }

  function createNewProjectDescriptor(name) {
    const { id, filesDir, mainScript } = defaultPaths(name);
    return {
      name,
      id,
      engineVersion: "0.1.0",

      fsDefaultRoot: DEFAULT_FS_ROOT,
      filesDir,
      mainScript,

      isExample: false,
      sourcePackPath: null,

      createdAt: new Date().toISOString()
    };
  }

  function storageKeyForId(id) {
    return "DEFPROJECT_" + id;
  }

  function saveProject(descriptor, mainScriptText) {
    const key = storageKeyForId(descriptor.id);
    const payload = {
      descriptor,
      files: {
        [descriptor.mainScript]: mainScriptText || ""
      }
    };
    try {
      window.localStorage.setItem(key, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error("Failed to save project", e);
      return false;
    }
  }

  function loadProject(id) {
    const key = storageKeyForId(id);
    const json = window.localStorage.getItem(key);
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch (e) {
      console.error("Failed to load project", e);
      return null;
    }
  }

  function listSavedProjects() {
    const result = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("DEFPROJECT_")) {
          const json = window.localStorage.getItem(key);
          if (!json) continue;
          try {
            const payload = JSON.parse(json);
            if (payload && payload.descriptor) {
              result.push(payload.descriptor);
            }
          } catch (e) {
            console.warn("Bad project payload for key", key, e);
          }
        }
      }
    } catch (e) {
      console.error("Error while listing projects", e);
    }
    return result;
  }

  // For now, example projects are a static concept; later this can
  // be backed by a manifest in AntivirusDefend/Example Projects/.
  function getExamplePackRoot() {
    return PACK_EXAMPLE_ROOT;
  }

  return {
    DEFAULT_FS_ROOT,
    PACK_EXAMPLE_ROOT,
    slugify,
    defaultPaths,
    createNewProjectDescriptor,
    saveProject,
    loadProject,
    listSavedProjects,
    getExamplePackRoot
  };
})();
