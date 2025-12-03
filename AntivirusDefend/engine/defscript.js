(function (global) {
  "use strict";

  const DefScript = {};

  function tokenize(source) {
    const tokens = [];
    let i = 0;
    const len = source.length;

    function isAlpha(ch) {
      return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
    }
    function isDigit(ch) {
      return ch >= '0' && ch <= '9';
    }

    while (i < len) {
      let ch = source[i];

      // whitespace
      if (ch === ' ' || ch === '\\t' || ch === '\\r' || ch === '\\n') {
        i++;
        continue;
      }

      // comments
      if (ch === '#') {
        while (i < len && source[i] !== '\\n') i++;
        continue;
      }

      // strings
      if (ch === '"') {
        let value = "";
        i++;
        while (i < len && source[i] !== '"') {
          if (source[i] === '\\\\' && i + 1 < len) {
            const next = source[i + 1];
            if (next === '"' || next === '\\\\' || next === 'n' || next === 't') {
              if (next === 'n') value += '\\n';
              else if (next === 't') value += '\\t';
              else value += next;
              i += 2;
              continue;
            }
          }
          value += source[i++];
        }
        if (i < len && source[i] === '"') i++;
        tokens.push({ type: "STRING", value });
        continue;
      }

      // numbers
      if (isDigit(ch) || (ch === '.' && i + 1 < len && isDigit(source[i + 1]))) {
        let numStr = "";
        if (ch === '.') {
          numStr += '.';
          i++;
        }
        while (i < len && (isDigit(source[i]) || source[i] === '.')) {
          numStr += source[i++];
        }
        tokens.push({ type: "NUMBER", value: parseFloat(numStr) });
        continue;
      }

      // identifiers
      if (isAlpha(ch)) {
        let ident = "";
        while (i < len && (isAlpha(source[i]) || isDigit(source[i]))) {
          ident += source[i++];
        }
        tokens.push({ type: "IDENT", value: ident });
        continue;
      }

      // symbols
      if ("{}[](),.".includes(ch)) {
        tokens.push({ type: ch, value: ch });
        i++;
        continue;
      }

      // unknown
      i++;
    }

    return tokens;
  }

  function Parser(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  Parser.prototype.peek = function(offset = 0) {
    return this.tokens[this.pos + offset] || null;
  };

  Parser.prototype.advance = function() {
    return this.tokens[this.pos++] || null;
  };

  Parser.prototype.match = function(type, value) {
    const t = this.peek();
    if (!t) return false;
    if (t.type !== type) return false;
    if (value !== undefined && t.value !== value) return false;
    this.pos++;
    return true;
  };

  Parser.prototype.expect = function(type, value) {
    const t = this.advance();
    if (!t || t.type !== type || (value !== undefined && t.value !== value)) {
      throw new Error("DefScript parse error");
    }
    return t;
  };

  function createEmptyAST() {
    return {
      game: null,
      entities: {},
      startEntities: [],
      nameMappings: {}
    };
  }

  function parse(source) {
    const tokens = tokenize(source);
    const p = new Parser(tokens);
    const ast = createEmptyAST();

    while (p.peek()) {
      const t = p.peek();

      if (t.type === "IDENT" && t.value === "game") {
        parseGameBlock(p, ast);
      } else if (t.type === "IDENT" && t.value === "entity") {
        parseEntityBlock(p, ast);
      } else if (t.type === "IDENT" && t.value === "start_entity") {
        parseStartEntityLine(p, ast);
      } else if (t.type === "IDENT" && looksLikeNameMapping(p)) {
        parseNameMapping(p, ast);
      } else {
        p.advance();
      }
    }

    return ast;
  }

  function parseGameBlock(p, ast) {
    p.expect("IDENT", "game");
    const titleTok = p.expect("STRING");
    const game = {
      title: titleTok.value,
      startEntities: []
    };

    p.expect("{");
    while (!p.match("}", "}")) {
      const t = p.peek();
      if (!t) break;
      if (t.type === "IDENT" && t.value === "start_entity") {
        parseStartEntityLine(p, game);
      } else {
        p.advance();
      }
    }

    ast.game = game;
    ast.startEntities.push.apply(ast.startEntities, game.startEntities);
  }

  function parseStartEntityLine(p, target) {
    p.expect("IDENT", "start_entity");
    const typeTok = p.expect("IDENT");
    let count = 1;
    const next = p.peek();
    if (next && next.type === "[") {
      p.advance();
      const numTok = p.expect("NUMBER");
      count = numTok.value | 0;
      p.expect("]", "]");
    }
    if (!target.startEntities) target.startEntities = [];
    target.startEntities.push({ type: typeTok.value, count });
  }

  function parseEntityBlock(p, ast) {
    p.expect("IDENT", "entity");
    const nameTok = p.expect("IDENT");
    const entityName = nameTok.value;

    p.expect("{");
    let depth = 1;
    const bodyTokens = [];
    while (p.peek() && depth > 0) {
      const t = p.advance();
      if (t.type === "{") depth++;
      else if (t.type === "}") {
        depth--;
        if (depth === 0) break;
      }
      if (depth > 0) bodyTokens.push(t);
    }

    const bodyText = tokensToText(bodyTokens);
    ast.entities[entityName] = {
      name: entityName,
      bodyText
    };
  }

  function tokensToText(tokens) {
    return tokens.map(t => {
      if (t.type === "STRING") {
        return '"' + String(t.value).replace(/"/g, '\\"') + '"';
      }
      if (t.type === "NUMBER") {
        return String(t.value);
      }
      return t.value || "";
    }).join(" ");
  }

  function looksLikeNameMapping(p) {
    const t0 = p.peek(0);
    const t1 = p.peek(1);
    const t2 = p.peek(2);
    return t0 && t1 && t2 &&
      t0.type === "IDENT" &&
      t1.type === "." &&
      t2.type === "IDENT" &&
      t2.value === "name";
  }

  function parseNameMapping(p, ast) {
    const baseTypeTok = p.expect("IDENT");
    const baseType = baseTypeTok.value;

    p.expect(".", ".");
    p.expect("IDENT", "name");

    if (!ast.nameMappings[baseType]) {
      ast.nameMappings[baseType] = [];
    }
    const list = ast.nameMappings[baseType];

    while (true) {
      const next = p.peek();
      if (!next || next.type !== "[") break;

      p.advance(); // '['
      const indexTok = p.expect("NUMBER");
      p.expect(",");
      const nameTok = p.expect("STRING");
      p.expect("]");

      list.push({ index: indexTok.value | 0, name: nameTok.value });
    }
  }

  DefScript.tokenize = tokenize;
  DefScript.parse = parse;

  global.AVDEF = global.AVDEF || {};
  global.AVDEF.DefScript = DefScript;

})(typeof window !== "undefined" ? window : this);
