const vt = Symbol("multipleValues"), At = {
  contains(t, e) {
    return t >= this.l && t < this.l + this.w && e >= this.t && e < this.t + this.h;
  },
  stroke(t) {
    t.strokeRect(this.l, this.t, this.w, this.h);
  },
  fill(t) {
    t.fillRect(this.l, this.t, this.w, this.h);
  },
  offset(t, e) {
    return R(this.l + t, this.t + e, this.w, this.h);
  },
  equals(t) {
    return this.l === t.l && this.t === t.t && this.w === t.w && this.h === t.h;
  },
  center() {
    return { x: this.l + this.w / 2, y: this.t + this.h / 2 };
  }
};
function R(t, e, n, s) {
  return Object.create(At, {
    l: { value: t },
    t: { value: e },
    w: { value: n },
    h: { value: s },
    r: { value: t + n },
    b: { value: e + s }
  });
}
function ct() {
  const t = [], e = (n) => {
    t.push(n);
  };
  return e.fire = (...n) => {
    t.forEach((s) => s(...n));
  }, e;
}
function G(t, e) {
  const n = {};
  return Object.keys(e).forEach((s) => {
    n[s] = { value: e[s] };
  }), Object.create(t, n);
}
const Ht = {
  /**
   * Get children of this node (default: empty array)
   */
  children() {
    return [];
  },
  /**
   * Get parent of this node (default: null)
   */
  parent() {
    return null;
  },
  /**
   * Get the first child of this node
   */
  first() {
    return this.children()[0];
  },
  /**
   * Get the last child of this node
   */
  last() {
    const t = this.children();
    return t[t.length - 1];
  },
  /**
   * Get the next node in document order (depth-first traversal)
   */
  next() {
    let t = this;
    for (; ; ) {
      const e = t.parent();
      if (!e)
        return null;
      const n = e.children(), s = n.indexOf(t) + 1, i = n[s];
      if (i) {
        let r = i;
        for (; ; ) {
          const l = r.first();
          if (!l)
            break;
          r = l;
        }
        return r;
      }
      t = e;
    }
  },
  /**
   * Get the previous node in document order
   */
  previous() {
    const t = this.parent();
    if (!t)
      return null;
    const e = t.children(), n = e[e.indexOf(this) - 1];
    if (n)
      return n;
    const s = t.previous();
    return s && s.last() || null;
  },
  /**
   * Find a descendant by ordinal (character index)
   */
  byOrdinal(t) {
    let e = null;
    const n = this.children();
    for (const s of n)
      if (t >= s.ordinal && t < s.ordinal + s.length && (e = s.byOrdinal(t), e))
        break;
    return e || this;
  },
  /**
   * Find a descendant by coordinate (x, y position)
   */
  byCoordinate(t, e) {
    let n;
    for (const s of this.children()) {
      const i = s.bounds();
      if (i.l <= t && t < i.r && i.t <= e && e < i.b && (n = s.byCoordinate(t, e), n))
        break;
    }
    if (!n) {
      for (n = this.last(); n; ) {
        const s = n.last();
        if (!s)
          break;
        n = s;
      }
      if (n) {
        const s = n.next();
        s && s.block && (n = s);
      }
    }
    return n || this;
  },
  /**
   * Draw this node and its children
   */
  draw(t, e) {
    for (const n of this.children())
      n.draw(t, e);
  },
  /**
   * Get the bounds of this node (bounding box of children)
   */
  bounds() {
    const t = this;
    let e = t._left, n = t._top, s = 0, i = 0;
    for (const r of this.children()) {
      const l = r.bounds();
      e = Math.min(e, l.l), n = Math.min(n, l.t), s = Math.max(s, l.l + l.w), i = Math.max(i, l.t + l.h);
    }
    return R(e, n, s - e, i - n);
  }
};
function xt(t, e) {
  const n = t.parent();
  return n ? n.type === e ? n : xt(n, e) : null;
}
function H(t) {
  return G(Ht, t);
}
const Pt = H({
  children() {
    return this._children;
  },
  parent() {
    return this._parent;
  },
  /**
   * Finalize the node by computing ordinal and length from children
   */
  finalize(t, e) {
    let n = Number.MAX_VALUE, s = 0;
    for (const i of this._children)
      n = Math.min(n, i.ordinal), s = Math.max(s, i.ordinal + i.length);
    Object.defineProperty(this, "ordinal", { value: n - (t || 0) }), Object.defineProperty(this, "length", { value: (e || 0) + s - n });
  }
});
function ht(t, e, n, s) {
  return Object.create(Pt, {
    type: { value: t },
    _children: { value: [] },
    _parent: { value: e },
    _left: { value: typeof n == "number" ? n : Number.MAX_VALUE },
    _top: { value: typeof s == "number" ? s : Number.MAX_VALUE }
  });
}
class Vt {
  constructor() {
    this.handlers = /* @__PURE__ */ new Map();
  }
  /**
   * Subscribe to an event
   *
   * @param event - The event name
   * @param handler - The handler function
   */
  on(e, n) {
    this.handlers.has(e) || this.handlers.set(e, /* @__PURE__ */ new Set()), this.handlers.get(e).add(n);
  }
  /**
   * Unsubscribe from an event
   *
   * @param event - The event name
   * @param handler - The handler function to remove
   */
  off(e, n) {
    const s = this.handlers.get(e);
    s && s.delete(n);
  }
  /**
   * Emit an event to all subscribers
   *
   * @param event - The event name
   * @param args - Arguments to pass to handlers
   */
  emit(e, ...n) {
    const s = this.handlers.get(e);
    if (s)
      for (const i of s)
        i(...n);
  }
  /**
   * Check if an event has any subscribers
   *
   * @param event - The event name (optional, checks all events if not provided)
   * @returns True if the event has subscribers
   */
  hasListeners(e) {
    if (e !== void 0) {
      const n = this.handlers.get(e);
      return n ? n.size > 0 : !1;
    }
    for (const n of this.handlers.values())
      if (n.size > 0) return !0;
    return !1;
  }
  /**
   * Remove all listeners for an event or all events
   *
   * @param event - The event name (optional, removes all if not provided)
   */
  removeAllListeners(e) {
    e !== void 0 ? this.handlers.delete(e) : this.handlers.clear();
  }
  /**
   * Get the number of listeners for an event
   *
   * @param event - The event name
   * @returns The number of listeners
   */
  listenerCount(e) {
    const n = this.handlers.get(e);
    return n ? n.size : 0;
  }
}
const X = [
  "bold",
  "italic",
  "underline",
  "strikeout",
  "color",
  "font",
  "size",
  "align",
  "script"
], I = {
  size: 10,
  font: "sans-serif",
  color: "black",
  bold: !1,
  italic: !1,
  underline: !1,
  strikeout: !1,
  align: "left",
  script: "normal"
};
function It(t, e) {
  return X.every((n) => t[n] === e[n]);
}
function zt(t) {
  const e = { text: t.text };
  return X.forEach((n) => {
    const s = t[n];
    s !== void 0 && s !== I[n] && (e[n] = s);
  }), e;
}
function Bt(...t) {
  if (t.length === 0)
    return {};
  if (t.length === 1) {
    const e = {};
    return X.forEach((n) => {
      const s = t[0][n];
      s !== void 0 && (e[n] = s);
    }), e;
  }
  return t.reduce((e, n) => {
    const s = {};
    return X.forEach((i) => {
      const r = e[i], l = n[i];
      (i in e || l !== void 0) && (r === l ? s[i] = r : r === void 0 ? s[i] = l : l === void 0 ? s[i] = r : s[i] = vt);
    }), s;
  }, {});
}
function Ut(t, e) {
  (Array.isArray(t) ? t : [t]).forEach((s) => {
    Object.keys(e).forEach((i) => {
      const r = e[i];
      r !== vt && r !== void 0 && (s[i] = r);
    });
  });
}
function* tt(t) {
  let e = null;
  for (const n of t)
    !e || !It(e, n) || typeof e.text != "string" || typeof n.text != "string" ? (e && (yield e), e = zt(n)) : e.text += n.text;
  e && (yield e);
}
function Dt(t) {
  return typeof t.text == "string" ? t.text : Array.isArray(t.text) ? t.text.map((e) => Y(e)).join("") : "_";
}
function J(t) {
  return typeof t == "string" ? t.length : 1;
}
function Y(t) {
  return typeof t == "string" ? t : "_";
}
function et(t) {
  return typeof t == "string" ? t.length : Array.isArray(t) ? t.reduce((e, n) => e + J(n), 0) : 1;
}
function _t(t, e, n, s) {
  if (s !== 0) {
    if (typeof e == "string") {
      t(e.substr(n, s));
      return;
    }
    if (Array.isArray(e)) {
      let i = 0, r = s;
      for (const l of e) {
        if (r <= 0)
          break;
        const a = J(l);
        if (i + a > n)
          if (a === 1)
            t(l), r -= 1;
          else {
            const o = Math.max(0, n - i), h = l.substr(o, r);
            t(h), r -= h.length;
          }
        i += a;
      }
      return;
    }
    t(e);
  }
}
function $t(t, e) {
  let n = "";
  return _t(
    (s) => {
      n = s;
    },
    t,
    e,
    1
  ), n;
}
function ut(t, e) {
  if (typeof e == "string")
    for (let n = 0; n < e.length; n++)
      t(e[n]);
  else
    t(e);
}
function Te(t) {
  return t !== null && typeof t == "object" && "$" in t && typeof t.$ == "string";
}
function dt(t, e) {
  if (t._runs !== e._runs)
    throw new Error("Characters for different documents");
}
const qt = {
  /**
   * Check if this character equals another
   */
  equals(t) {
    return dt(this, t), this._run === t._run && this._offset === t._offset;
  },
  /**
   * Create a function that cuts runs between this character and another.
   * The returned function calls eachRun for each piece of run in the range.
   */
  cut(t) {
    dt(this, t);
    const e = this;
    return function(s) {
      for (let i = e._run; i <= t._run; i++) {
        const r = e._runs[i];
        if (r) {
          const l = i === e._run ? e._offset : 0, a = i === t._run ? t._offset : et(r.text);
          l < a && _t(
            (o) => {
              const h = Object.create(r);
              h.text = o, s(h);
            },
            r.text,
            l,
            a - l
          );
        }
      }
    };
  }
};
function Q(t, e, n) {
  const s = e >= t.length ? null : $t(t[e].text, n);
  return Object.create(qt, {
    _runs: { value: t },
    _run: { value: e },
    _offset: { value: n },
    char: { value: s }
  });
}
function ft(t, e) {
  for (let n = e; n < t.length; n++)
    if (et(t[n].text) !== 0)
      return Q(t, n, 0);
  return Q(t, t.length, 0);
}
function* gt(t) {
  let e = ft(t, 0);
  for (; e.char !== null; ) {
    yield e;
    const n = e;
    n._offset + 1 < et(t[n._run].text) ? e = Q(t, n._run, n._offset + 1) : e = ft(t, n._run + 1);
  }
  yield e;
}
function* pt(t, e) {
  let n = null, s = null, i = !0;
  for (const r of t) {
    let l = !1;
    if (r.char === null)
      l = !0;
    else if (i && (l = !0, i = !1), typeof r.char == "string")
      switch (r.char) {
        case " ":
          s || (s = r);
          break;
        case `
`:
          l = !0, i = !0;
          break;
        default:
          s && (l = !0);
      }
    else {
      const a = e(r.char);
      a && (a.block || a.eof) && (l = !0, i = !0);
    }
    l && (n && !n.equals(r) && (yield {
      text: n,
      spaces: s || r,
      end: r
    }, s = null), n = r);
  }
  n && n.char === null && (yield null);
}
const nt = " ", Ct = nt;
function kt(t) {
  let e = t && t.size || I.size;
  if (t)
    switch (t.script) {
      case "super":
      case "sub":
        e *= 0.8;
        break;
    }
  return (t && t.italic ? "italic " : "") + (t && t.bold ? "bold " : "") + " " + e + "pt " + (t && t.font || I.font);
}
function Xt(t, e) {
  t.fillStyle = e && e.color || I.color, t.font = kt(e);
}
function Jt(t) {
  t.textAlign = "left", t.textBaseline = "alphabetic";
}
function Gt(t) {
  const e = [
    "font: ",
    kt(t),
    "; color: ",
    t && t.color || I.color
  ];
  if (t)
    switch (t.script) {
      case "super":
        e.push("; vertical-align: super");
        break;
      case "sub":
        e.push("; vertical-align: sub");
        break;
    }
  return e.join("");
}
function Kt(t, e) {
  if (typeof document > "u")
    return console.error("[measureText] ERROR: document is undefined - not in browser environment"), { width: 0, height: 0, ascent: 0, descent: 0 };
  if (!document.body)
    return console.error("[measureText] ERROR: document.body is null - DOM not ready"), { width: 0, height: 0, ascent: 0, descent: 0 };
  const n = document.createElement("span"), s = document.createElement("div"), i = document.createElement("div");
  s.style.display = "inline-block", s.style.width = "1px", s.style.height = "0", i.style.visibility = "hidden", i.style.position = "absolute", i.style.top = "0", i.style.left = "0", i.style.width = "500px", i.style.height = "200px", i.appendChild(n), i.appendChild(s), document.body.appendChild(i);
  let r;
  try {
    n.setAttribute("style", e), n.innerHTML = "", n.appendChild(document.createTextNode(t.replace(/\s/g, nt))), s.style.verticalAlign = "baseline";
    const l = s.offsetTop - n.offsetTop;
    s.style.verticalAlign = "bottom";
    const a = s.offsetTop - n.offsetTop;
    r = {
      ascent: l,
      descent: a - l,
      height: a,
      width: n.offsetWidth
    };
  } finally {
    i.parentNode && i.parentNode.removeChild(i);
  }
  return r;
}
function Yt() {
  const t = {};
  return function(n, s) {
    const i = s + "<>!&%" + n;
    let r = t[i];
    return r || (t[i] = r = Kt(n, s)), r;
  };
}
const Qt = Yt();
function K(t, e) {
  return Qt(t, Gt(e));
}
function Ot(t, e, n, s, i, r, l, a) {
  Jt(t), Xt(t, n);
  let o = i;
  switch (n.script) {
    case "super":
      o -= l * (1 / 3);
      break;
    case "sub":
      o += a / 2;
      break;
  }
  t.fillText(e === `
` ? Ct : e, s, o), n.underline && t.fillRect(s, 1 + o, r, 1), n.strikeout && t.fillRect(s, 1 + o - l / 2, r, 1);
}
const Zt = {
  measure(t) {
    const e = K("?", t);
    return {
      width: e.width + 4,
      ascent: e.width + 2,
      descent: e.width + 2
    };
  },
  draw(t, e, n, s, i, r) {
    t.fillStyle = "silver", t.fillRect(e, n - i, s, i + r), t.strokeRect(e, n - i, s, i + r), t.fillStyle = "black", t.fillText("?", e + 2, n);
  }
}, te = {
  /**
   * Draw this part on a canvas context
   *
   * @param ctx - Canvas 2D rendering context
   * @param x - X coordinate
   * @param y - Y coordinate (baseline)
   */
  draw(t, e, n) {
    typeof this.run.text == "string" ? Ot(t, this.run.text, this.run, e, n, this.width, this.ascent, this.descent) : this.code && this.code.draw && (t.save(), this.code.draw(t, e, n, this.width, this.ascent, this.descent, this.run), t.restore());
  }
};
function Tt(t, e) {
  let n, s = !1, i;
  typeof t.text == "string" ? (s = t.text.length === 1 && t.text[0] === `
`, n = K(s ? nt : t.text, t)) : Array.isArray(t.text) ? n = { width: 0, ascent: 0, descent: 0 } : (i = e(t.text) || Zt, n = i.measure ? i.measure(t) : {
    width: 0,
    ascent: 0,
    descent: 0
  });
  const r = Object.create(te, {
    run: { value: t },
    isNewLine: { value: s },
    width: { value: s ? 0 : n.width },
    ascent: { value: n.ascent },
    descent: { value: n.descent }
  });
  return i && Object.defineProperty(r, "code", { value: i }), r;
}
const ee = {
  /**
   * Check if this word is a newline
   */
  isNewLine() {
    return this.text.parts.length === 1 && this.text.parts[0].isNewLine;
  },
  /**
   * Get the code object if this word is a code (block element)
   */
  code() {
    if (this.text.parts.length === 1 && this.text.parts[0].code)
      return this.text.parts[0].code;
  },
  /**
   * Get the formatting of a code word
   */
  codeFormatting() {
    if (this.text.parts.length === 1)
      return this.text.parts[0].run;
  },
  /**
   * Draw the word on a canvas
   */
  draw(t, e, n) {
    const s = [...this.text.parts, ...this.space.parts];
    let i = e;
    for (const r of s)
      r.draw(t, i, n), i += r.width;
  },
  /**
   * Get plain text of the word (including trailing space)
   */
  plainText() {
    return this.text.plainText + this.space.plainText;
  },
  /**
   * Get the alignment of the word (from first part)
   */
  align() {
    const t = this.text.parts[0];
    return t && t.run.align || "left";
  },
  /**
   * Iterate over runs within a range of the word
   */
  runs(t, e) {
    let n = (e == null ? void 0 : e.start) ?? 0, s = (e == null ? void 0 : e.end) ?? Number.MAX_VALUE;
    const i = [this.text, this.space];
    for (const r of i)
      for (const l of r.parts) {
        if (n >= s || s <= 0)
          return;
        const a = l.run, o = a.text;
        if (typeof o == "string") {
          if (n <= 0 && s >= o.length)
            t(a);
          else if (n < o.length) {
            const h = Object.create(a), u = Math.max(0, n);
            h.text = o.substr(u, Math.min(o.length, s - u)), t(h);
          }
          n -= o.length, s -= o.length;
        } else
          n <= 0 && s >= 1 && t(a), n--, s--;
      }
  }
};
function bt(t, e) {
  const n = [];
  t((o) => {
    n.push(Tt(o, e));
  });
  let s = 0, i = 0, r = 0, l = 0, a = "";
  for (const o of n) {
    s = Math.max(s, o.ascent), i = Math.max(i, o.descent), r += o.width;
    const h = o.run.text;
    if (Array.isArray(h))
      for (const u of h)
        l += J(u), a += Y(u);
    else
      l += J(h), a += Y(h);
  }
  return { parts: n, ascent: s, descent: i, width: r, length: l, plainText: a };
}
function mt(t, e) {
  let n, s;
  t ? (n = t.text.cut(t.spaces), s = t.spaces.cut(t.end)) : (n = (a) => a({ text: `
` }), s = () => {
  });
  const i = bt(n, e), r = bt(s, e), l = Object.create(ee, {
    text: { value: i },
    space: { value: r },
    ascent: { value: Math.max(i.ascent, r.ascent) },
    descent: { value: Math.max(i.descent, r.descent) },
    width: { value: i.width + r.width, configurable: !0 },
    length: { value: i.length + r.length }
  });
  return t || Object.defineProperty(l, "eof", { value: !0 }), l;
}
function St(t) {
  return K(Ct, t).width;
}
const ne = H({
  type: "character",
  bounds() {
    const t = this.word.bounds(), e = this.word.word.isNewLine() ? St(this.word.word.codeFormatting()) : this.width || this.part.width;
    return R(t.l + this.left, t.t, e, t.h);
  },
  parent() {
    return this.word;
  },
  byOrdinal() {
    return this;
  },
  byCoordinate(t) {
    return t <= this.bounds().center().x ? this : this.next() || this;
  }
}), se = H({
  type: "word",
  draw(t) {
    this.word.draw(t, this.line.left + this.left, this.line.baseline);
  },
  bounds() {
    return R(
      this.line.left + this.left,
      this.line.baseline - this.line.ascent,
      this.word.isNewLine() ? St(this.word.codeFormatting()) : this.width,
      this.line.ascent + this.line.descent
    );
  },
  parts(t) {
    for (const e of this.word.text.parts)
      if (t(e) === !0) return;
    for (const e of this.word.space.parts)
      if (t(e) === !0) return;
  },
  realiseCharacters() {
    if (this._characters) return;
    const t = [];
    let e = 0, n = this.ordinal;
    const s = xt(this, "document"), i = s ? s.codes || (() => {
    }) : () => {
    };
    this.parts((l) => {
      const a = l.run.text, o = (h) => {
        const u = Object.create(l.run);
        u.text = h;
        const g = Tt(u, i), d = Object.create(ne, {
          left: { value: e },
          part: { value: g },
          word: { value: this },
          ordinal: { value: n },
          length: { value: 1 }
        });
        t.push(d), e += g.width, n++;
      };
      if (Array.isArray(a))
        for (const h of a)
          ut(o, h);
      else
        ut(o, a);
    });
    const r = t[t.length - 1];
    if (r) {
      Object.defineProperty(r, "width", {
        value: this.width - r.left
      });
      const l = this.word.code();
      (this.word.isNewLine() || l && l.eof) && Object.defineProperty(r, "newLine", { value: !0 });
    }
    this._characters = t;
  },
  children() {
    return this.realiseCharacters(), this._characters || [];
  },
  parent() {
    return this.line;
  }
});
function ie(t, e, n, s, i) {
  return Object.create(se, {
    word: { value: t },
    line: { value: e },
    left: { value: n },
    width: { value: i },
    ordinal: { value: s },
    length: { value: t.text.length + t.space.length }
  });
}
const re = H({
  type: "line",
  /**
   * Get the bounding rectangle for this line
   *
   * @param minimal - If true, use actual word boundaries instead of full width
   */
  bounds(t) {
    var e, n;
    if (t) {
      const s = (e = this.first()) == null ? void 0 : e.bounds(), i = (n = this.last()) == null ? void 0 : n.bounds();
      if (s && i)
        return R(
          s.l,
          this.baseline - this.ascent,
          i.l + i.w - s.l,
          this.ascent + this.descent
        );
    }
    return R(
      this.left,
      this.baseline - this.ascent,
      this.width,
      this.ascent + this.descent
    );
  },
  parent() {
    return this.doc;
  },
  children() {
    return this.positionedWords;
  }
});
function oe(t, e, n, s, i, r, l, a) {
  var O;
  const o = ((O = l[0]) == null ? void 0 : O.align()) || "left", h = Object.create(re, {
    doc: { value: t },
    left: { value: e },
    width: { value: n },
    baseline: { value: s },
    ascent: { value: i },
    descent: { value: r },
    ordinal: { value: a },
    align: { value: o }
  });
  let u = 0;
  for (const T of l)
    u += T.width;
  u -= l[l.length - 1].space.width;
  let g = 0, d = 0;
  if (u < n)
    switch (o) {
      case "right":
        g = n - u;
        break;
      case "center":
        g = (n - u) / 2;
        break;
      case "justify":
        l.length > 1 && !l[l.length - 1].isNewLine() && (d = (n - u) / (l.length - 1));
        break;
    }
  let b = a;
  const x = l.map((T) => {
    const S = g;
    g += T.width + d;
    const M = b;
    return b += T.text.length + T.space.length, ie(T, h, S, M, T.width + d);
  });
  return Object.defineProperty(h, "positionedWords", { value: x }), Object.defineProperty(h, "actualWidth", { value: u }), Object.defineProperty(h, "length", { value: b - a }), h;
}
function le(t, e, n, s, i, r, l, a) {
  const o = [];
  let h = 0, u = l || 0, g = a || 0, d = !1, b = 0, x = e, O = s, T = null;
  function S(k, w) {
    o.push(k), h += k.width, u = Math.max(u, k.ascent), g = Math.max(g, k.descent), k.isNewLine() && (M(w), b = k.ascent + k.descent);
  }
  function M(k) {
    if (d || o.length === 0)
      return;
    const w = oe(
      i,
      t,
      n,
      x + u,
      u,
      g,
      o,
      O
    );
    O += w.length, k(w) === !0 && (d = !0), x += u + g, o.length = 0, h = 0, u = 0, g = 0;
  }
  return function(w, C) {
    var F;
    if (T) {
      b = 0;
      const _ = T(C);
      _ && (T = null, O += _.length, x += _.bounds().h, Object.defineProperty(_, "block", { value: !0 }), w(_));
    } else {
      const _ = C.code();
      if (_ && _.block) {
        o.length ? M(w) : x += b;
        const j = (F = _.block) == null ? void 0 : F.call(
          _,
          t,
          x,
          n,
          O,
          i,
          C.codeFormatting() || {}
        );
        j && (T = j), b = 0;
      } else _ && _.eof || C.eof ? ((!_ || r && r(_)) && S(C, w), o.length ? (M(w), w(x - e)) : w(x + b - e), d = !0) : (b = 0, o.length && h + C.text.width > n && M(w), S(C, w));
    }
    return d;
  };
}
let Z = null;
function ae(t) {
  Z = t;
}
const ce = H({
  parent() {
    return this._parent;
  },
  draw(t) {
    this.inline.draw(
      t,
      this.left,
      this.baseline,
      this.measured.width,
      this.measured.ascent,
      this.measured.descent,
      this.formatting
    );
  },
  position(t, e, n) {
    this.left = t, this.baseline = e, n && (this._bounds = n);
  },
  bounds() {
    return this._bounds || R(
      this.left,
      this.baseline - this.measured.ascent,
      this.measured.width,
      this.measured.ascent + this.measured.descent
    );
  },
  byCoordinate(t) {
    return t <= this.bounds().center().x ? this : this.next() || this;
  }
});
function he(t, e, n, s, i) {
  if (!t.draw || !t.measure)
    throw new Error("Inline code must have draw and measure methods");
  return Object.create(ce, {
    inline: { value: t },
    _parent: { value: e },
    ordinal: { value: n },
    length: { value: s },
    formatting: { value: i },
    measured: { value: t.measure(i) },
    left: { value: 0, writable: !0 },
    baseline: { value: 0, writable: !0 }
  });
}
const B = {};
B.number = function(t, e) {
  const s = (typeof e == "number" ? e : 0) + 1 + ".";
  return {
    measure(i) {
      return K(s, i);
    },
    draw(i, r, l, a, o, h, u) {
      Ot(i, s, u, r, l, a, o, h);
    }
  };
};
function Et(t) {
  return G(t, {
    eof: !0,
    measure() {
      return { width: 18, ascent: 0, descent: 0 };
    },
    draw() {
    }
  });
}
B.listNext = Et;
B.listEnd = Et;
B.listStart = function(t, e, n) {
  return G(t, {
    block(s, i, r, l, a, o) {
      if (!Z) {
        console.warn("Frame factory not initialized");
        return;
      }
      const h = ht("list", a, s, i);
      let u = null, g = null, d = null, b = l, x = i;
      const O = 50, T = 10, S = (M, k) => {
        u = ht("item", h);
        const w = M.marker || { $: "number" }, C = n == null ? void 0 : n(w, h.children().length);
        C && (d = he(C, u, b, 1, k), d.block = !0), g = Z(
          s + O,
          x,
          r - O,
          b + 1,
          u,
          (F) => F.$ === "listEnd",
          d == null ? void 0 : d.measured.ascent
        );
      };
      return S(t, o), function(k) {
        if (g && u && d ? g((w) => {
          b = w.ordinal + w.length;
          const C = w.bounds(), F = w.first(), _ = s + O - T - d.measured.width, j = R(s, x, O, C.h);
          F && "baseline" in F && F.baseline !== void 0 ? (d.left = _, d.baseline = F.baseline, d._bounds = j) : (d.left = _, d.baseline = x + d.measured.ascent, d._bounds = j), x = C.t + C.h, u._children.push(d), u._children.push(w), u.finalize(), h._children.push(u), u = null, g = null, d = null;
        }, k) : b++, !g) {
          const w = k.code();
          if (w) {
            const C = w.$;
            if (C === "listEnd")
              return h.finalize(), h;
            C === "listNext" && S(w, k.codeFormatting() || {});
          }
        }
      };
    }
  });
};
function ue(t, e, n) {
  const s = B[t.$];
  return s ? s(t, e, n) : void 0;
}
function Rt(t) {
  let e = 0;
  const n = t.words;
  let s = !1;
  for (let i = 0; i < n.length; i++) {
    const r = n[i], l = r.code();
    if (l) {
      switch (l.$) {
        case "listStart":
          e++;
          break;
        case "listNext":
          if (e === 0) {
            const o = r.codeFormatting() || {};
            t.spliceWordsWithRuns(i, 1, [
              G(o, {
                text: {
                  $: "listStart",
                  marker: l.marker
                }
              })
            ]), s = !0;
            break;
          }
          break;
        case "listEnd":
          e === 0 && (t.spliceWordsWithRuns(i, 1, []), i--), e--;
          break;
      }
      if (s)
        break;
    }
  }
  if (s) {
    Rt(t);
    return;
  }
  if (e > 0) {
    const i = [];
    for (; e > 0; )
      e--, i.push({ text: { $: "listEnd" } });
    t.spliceWordsWithRuns(t.words.length - 1, 0, i);
  }
}
const de = H({
  type: "frame",
  bounds() {
    if (!this._bounds) {
      let t = 0, e = 0, n = 0, s = 0;
      if (this.lines.length) {
        const i = this.lines[0].bounds();
        t = i.l, e = i.t;
        for (const r of this.lines) {
          const l = r.bounds();
          n = Math.max(n, l.l + l.w), s = Math.max(s, l.t + l.h);
        }
      }
      this._bounds = R(t, e, n - t, this.height || s - e);
    }
    return this._bounds;
  },
  actualWidth() {
    if (this._actualWidth === void 0) {
      let t = 0;
      for (const e of this.lines) {
        const n = e.actualWidth;
        typeof n == "number" && (t = Math.max(t, n));
      }
      this._actualWidth = t;
    }
    return this._actualWidth;
  },
  children() {
    return this.lines;
  },
  parent() {
    return this._parent;
  },
  draw(t, e) {
    const n = e ? e.t : 0, s = e ? e.t + e.h : Number.MAX_VALUE;
    for (const i of this.lines) {
      const r = i.bounds();
      if (!(r.t + r.h < n)) {
        if (r.t > s)
          break;
        i.draw(t, e);
      }
    }
  }
});
function Lt(t, e, n, s, i, r, l, a) {
  const o = [], h = Object.create(de, {
    lines: { value: o },
    _parent: { value: i },
    ordinal: { value: s }
  }), u = le(
    t,
    e,
    n,
    s,
    h,
    r,
    l,
    a
  );
  let g = 0, d = 0;
  return function(x, O) {
    return u(
      (S) => {
        typeof S == "number" ? d = S : (g = S.ordinal + S.length - s, o.push(S));
      },
      O
    ) ? (Object.defineProperty(h, "length", { value: g }), Object.defineProperty(h, "height", { value: d }), x(h), !0) : !1;
  };
}
ae(Lt);
class fe {
  /**
   * Create a new Range
   *
   * @param doc - The document this range belongs to
   * @param start - Start ordinal (character index)
   * @param end - End ordinal (character index)
   */
  constructor(e, n, s) {
    this.doc = e, this.start = n, this.end = s, n > s && (this.start = s, this.end = n);
  }
  /**
   * Iterate over document parts (nodes) within this range
   *
   * @param emit - Callback function for each part
   * @param list - Optional list of nodes to search (defaults to document children)
   */
  parts(e, n) {
    const s = n || this.doc.children();
    for (const i of s)
      if (!(i.ordinal + i.length <= this.start)) {
        if (i.ordinal >= this.end)
          break;
        i.ordinal >= this.start && i.ordinal + i.length <= this.end ? e(i) : this.parts(e, i.children());
      }
  }
  /**
   * Clear the range (delete its content)
   *
   * @returns Change in document length
   */
  clear() {
    return this.setText([]);
  }
  /**
   * Set the text content of this range
   *
   * @param text - The new text (runs array or string)
   * @returns Change in document length
   */
  setText(e) {
    return this.doc.splice(this.start, this.end, e);
  }
  /**
   * Iterate over runs within this range
   *
   * @param emit - Callback function for each run
   */
  runs(e) {
    this.doc.runs(e, { start: this.start, end: this.end });
  }
  /**
   * Get the plain text content of this range
   *
   * @returns Plain text string
   */
  plainText() {
    const e = [];
    return this.runs((n) => e.push(Dt(n))), e.join("");
  }
  /**
   * Save the runs in this range (consolidated)
   *
   * @returns Array of consolidated runs
   */
  save() {
    const e = [];
    return this.runs((n) => e.push(n)), [...tt(e)];
  }
  /**
   * Get the merged formatting for this range
   *
   * For collapsed selections (start === end), this returns the formatting
   * of the character before the cursor (since that's where inserted text
   * picks up formatting).
   *
   * @returns Merged formatting object
   */
  getFormatting() {
    let e = this.start, n = this.end;
    if (e === n) {
      let i = e;
      i > 0 && i--, e = i, n = i + 1;
    }
    const s = [];
    return this.doc.runs((i) => s.push(i), { start: e, end: n }), s.length === 0 ? I : Bt(...s);
  }
  /**
   * Set a formatting attribute on this range
   *
   * For alignment, the range is expanded to surrounding paragraphs.
   * For collapsed selections, the formatting is stored for the next insert.
   *
   * @param attribute - The formatting attribute name
   * @param value - The value to set
   */
  setFormatting(e, n) {
    let s = this;
    if (e === "align" && (s = this.doc.paragraphRange(this.start, this.end)), s.start === s.end)
      this.doc.modifyInsertFormatting(e, n);
    else {
      const i = s.save(), r = {};
      r[e] = n, Ut(i, r), s.setText(i);
    }
  }
}
function ge(t, e, n) {
  return new fe(t, e, n);
}
function V(t) {
  if (t.isNewLine())
    return !0;
  const e = t.code();
  return !!(e && (e.block || e.eof));
}
function Mt(t, e, n, s) {
  const i = t.selection.start, r = t.selection.end;
  return function(l) {
    t._wordOrdinals = [];
    const a = t.words.splice(e, n, ...s);
    l(Mt(t, e, s.length, a)), t._nextSelection = { start: i, end: r };
  };
}
function pe(t) {
  const e = (n) => {
    t.push(n), e.length = t.length;
  };
  return Object.defineProperty(e, "length", {
    value: 0,
    writable: !0,
    enumerable: !0,
    configurable: !0
  }), e;
}
function Wt(t) {
  const e = [], n = pe(e);
  return t(n), function(s) {
    s(
      Wt(function(i) {
        for (; e.length; ) {
          const r = e.pop();
          r && r(i);
        }
      })
    );
  };
}
const be = H({
  type: "document",
  /**
   * Load content from an array of runs
   */
  load(t, e) {
    this._undoStack = [], this._redoStack = [], this._wordOrdinals = [];
    const n = gt(t), s = pt(n, this.codes);
    this.words = [];
    for (const i of s)
      this.words.push(mt(i, this.codes));
    this.layout(), this.emitChange(), this.select(0, 0, e);
  },
  /**
   * Perform document layout
   */
  layout() {
    this.frame = null;
    try {
      const t = Lt(0, 0, this._width, 0, this);
      for (const e of this.words)
        if (t((n) => {
          this.frame = n;
        }, e))
          break;
    } catch (t) {
      console.error(t);
    }
    if (!this.frame)
      console.error("[Document.layout] BUG: frame is null - rolling back"), console.error("[Document.layout] words count:", this.words.length), this.performUndo();
    else if (this._nextSelection) {
      const t = this._nextSelection;
      delete this._nextSelection, this.select(t.start, t.end);
    }
  },
  /**
   * Create a range within this document
   */
  range(t, e) {
    return ge(this, t, e);
  },
  /**
   * Get a range covering the entire document
   */
  documentRange() {
    return this.range(0, this.frame.length - 1);
  },
  /**
   * Get the currently selected range
   */
  selectedRange() {
    return this.range(this.selection.start, this.selection.end);
  },
  /**
   * Save the document as an array of runs
   */
  save() {
    return this.documentRange().save();
  },
  /**
   * Get a range covering the paragraph(s) containing the given range
   */
  paragraphRange(t, e) {
    const n = this.wordContainingOrdinal(t);
    let s = 0;
    if (n && !V(n.word)) {
      for (let l = n.index; l > 0; l--)
        if (V(this.words[l - 1])) {
          s = this.wordOrdinal(l);
          break;
        }
    }
    const i = this.wordContainingOrdinal(e);
    let r = this.frame.length - 1;
    if (i && !V(i.word)) {
      for (let l = i.index; l < this.words.length; l++)
        if (V(this.words[l])) {
          r = this.wordOrdinal(l);
          break;
        }
    }
    return this.range(s, r);
  },
  /**
   * Insert text at the current selection
   */
  insert(t, e) {
    const n = this.selectedRange().setText(t);
    this.select(this.selection.end + n, void 0, e);
  },
  /**
   * Modify the formatting that will be applied to the next insert
   */
  modifyInsertFormatting(t, e) {
    this.nextInsertFormatting[t] = e, this.notifySelectionChanged();
  },
  /**
   * Apply stored insert formatting to text
   */
  applyInsertFormatting(t) {
    const e = this.nextInsertFormatting, n = Object.keys(e);
    n.length && t.forEach((s) => {
      n.forEach((i) => {
        s[i] = e[i];
      });
    });
  },
  /**
   * Get the ordinal (character index) at the start of a word
   */
  wordOrdinal(t) {
    if (t < this.words.length) {
      const e = this._wordOrdinals.length;
      if (e < t + 1) {
        let n = e > 0 ? this._wordOrdinals[e - 1] : 0;
        for (let s = e; s <= t; s++)
          this._wordOrdinals[s] = n, n += this.words[s].length;
      }
      return this._wordOrdinals[t];
    }
    return 0;
  },
  /**
   * Find the word containing a given ordinal
   */
  wordContainingOrdinal(t) {
    let e = 0;
    for (let n = 0; n < this.words.length; n++) {
      const s = this.words[n];
      if (t >= e && t < e + s.length)
        return {
          word: s,
          ordinal: e,
          index: n,
          offset: t - e
        };
      e += s.length;
    }
  },
  /**
   * Iterate over runs within a range
   */
  runs(t, e) {
    const n = this.wordContainingOrdinal(Math.max(0, e.start)), s = this.wordContainingOrdinal(
      Math.min(e.end, this.frame.length - 1)
    );
    if (!(!n || !s))
      if (n.index === s.index)
        n.word.runs(t, {
          start: n.offset,
          end: s.offset
        });
      else {
        n.word.runs(t, { start: n.offset });
        for (let i = n.index + 1; i < s.index; i++)
          this.words[i].runs(t);
        s.word.runs(t, { end: s.offset });
      }
  },
  /**
   * Replace words with new content from runs
   */
  spliceWordsWithRuns(t, e, n) {
    const s = gt(n), i = pt(s, this.codes), r = [];
    for (const a of i)
      a && r.push(mt(a, this.codes));
    let l = !1;
    if ("_filtersRunning" in this)
      this._filtersRunning++;
    else {
      for (let a = 0; a < e; a++)
        if (this.words[t + a].code()) {
          l = !0;
          break;
        }
      l || (l = r.some((a) => !!a.code()));
    }
    this.transaction((a) => {
      if (Mt(this, t, e, r)(a), l) {
        this._filtersRunning = 0;
        try {
          for (; ; ) {
            const o = this._filtersRunning;
            let h = !1;
            for (const u of this.editFilters)
              if (u(this), o !== this._filtersRunning) {
                h = !0;
                break;
              }
            if (!h) break;
          }
        } finally {
          delete this._filtersRunning;
        }
      }
    });
  },
  /**
   * Splice content at a character range
   */
  splice(t, e, n) {
    let s;
    if (typeof n == "string") {
      const g = Math.max(0, t - 1);
      let d;
      this.runs(
        (b) => {
          d || (d = b);
        },
        { start: g, end: g + 1 }
      ), s = d ? [Object.create(d, { text: { value: n } })] : [{ text: n }];
    } else Array.isArray(n) ? s = n : s = [{ text: n }];
    this.applyInsertFormatting(s);
    const i = this.wordContainingOrdinal(t), r = this.wordContainingOrdinal(e);
    if (!i || !r) return 0;
    let l = [];
    t === i.ordinal ? i.index > 0 && !V(this.words[i.index - 1]) && (i.index--, this.words[i.index].runs((d) => l.push(d))) : i.word.runs((g) => l.push(g), { end: i.offset });
    let a = [];
    e === r.ordinal ? e === this.frame.length - 1 || V(r.word) ? (a = [], r.index--) : r.word.runs((g) => a.push(g)) : r.word.runs((g) => a.push(g), { start: r.offset });
    const o = this.frame.length, h = [...l, ...s, ...a], u = [...tt(h)];
    return this.spliceWordsWithRuns(
      i.index,
      r.index - i.index + 1,
      u
    ), this.frame ? this.frame.length - o : 0;
  },
  /**
   * Register an edit filter
   */
  registerEditFilter(t) {
    this.editFilters.push(t);
  },
  /**
   * Get/set document width (legacy method, kept for backward compatibility)
   * @deprecated Use the width property getter/setter instead
   */
  width(t) {
    if (t === void 0)
      return this._width;
    this._width = t, this.layout();
  },
  /**
   * Get document width
   */
  getWidth() {
    return this._width;
  },
  /**
   * Set document width
   */
  setWidth(t) {
    t !== this._width && (this._width = t, this.layout());
  },
  /**
   * Get document height (calculated from content)
   */
  getHeight() {
    var t;
    return ((t = this.frame) == null ? void 0 : t.bounds().h) ?? 0;
  },
  /**
   * Get document children (the frame)
   */
  children() {
    return this.frame ? [this.frame] : [];
  },
  /**
   * Toggle caret visibility (for blinking)
   */
  toggleCaret() {
    const t = this.caretVisible;
    return this.selection.start === this.selection.end && (this.selectionJustChanged ? this.selectionJustChanged = !1 : this.caretVisible = !this.caretVisible), this.caretVisible !== t;
  },
  /**
   * Get the caret coordinates for a given ordinal
   */
  getCaretCoords(t) {
    var n, s;
    const e = this.byOrdinal(t);
    if (e) {
      let i;
      if (e.block && t > 0) {
        const r = this.byOrdinal(t - 1);
        if (r.newLine) {
          const l = r.bounds(), a = (s = (n = r.parent()) == null ? void 0 : n.parent()) == null ? void 0 : s.bounds();
          a ? i = R(a.l, a.b, 1, l.h) : i = R(l.l, l.t, 1, l.h);
        } else {
          const l = r.bounds();
          i = R(l.r, l.t, 1, l.h);
        }
      } else {
        const r = e.bounds();
        r.h ? i = R(r.l, r.t, 1, r.h) : i = R(r.l, r.t, r.w, 1);
      }
      return i;
    }
  },
  /**
   * Find a node by coordinate
   */
  byCoordinate(t, e) {
    if (!this.frame) return this;
    let n = this.frame.byCoordinate(t, e).ordinal, s = this.getCaretCoords(n);
    for (; s && s.b <= e && n < this.frame.length - 1; )
      n++, s = this.getCaretCoords(n);
    for (; s && s.t >= e && n > 0; )
      n--, s = this.getCaretCoords(n);
    return this.byOrdinal(n);
  },
  /**
   * Draw the selection highlight
   */
  drawSelection(t, e) {
    if (this.selection.end === this.selection.start) {
      if (this.selectionJustChanged || e && this.caretVisible) {
        const n = this.getCaretCoords(this.selection.start);
        n && (t.save(), t.fillStyle = "black", n.fill(t), t.restore());
      }
    } else
      t.save(), t.fillStyle = e ? "rgba(0, 100, 200, 0.3)" : "rgba(160, 160, 160, 0.3)", this.selectedRange().parts((n) => {
        n.bounds.call(n, !0).fill(t);
      }), t.restore();
  },
  /**
   * Fire the selectionChanged event (both legacy and modern)
   */
  notifySelectionChanged(t) {
    let e = null;
    const n = () => (e || (e = this.selectedRange().getFormatting()), e);
    this.selectionChanged.fire(n, t), this._events.emit("selectionChange", n());
  },
  /**
   * Emit content change event (both legacy and modern)
   */
  emitChange() {
    this.contentChanged.fire(), this._events.emit("change");
  },
  /**
   * Set the selection
   */
  select(t, e, n) {
    this.frame && (this.selection.start = Math.max(0, t), this.selection.end = Math.min(
      typeof e == "number" ? e : this.selection.start,
      this.frame.length - 1
    ), this.selectionJustChanged = !0, this.caretVisible = !0, this.nextInsertFormatting = {}, this.notifySelectionChanged(n));
  },
  /**
   * Perform undo or redo
   */
  performUndo(t) {
    const e = t ? this._redoStack : this._undoStack, n = t ? this._undoStack : this._redoStack, s = e.pop();
    s && (s((i) => {
      n.push(i);
    }), this.layout(), this.emitChange());
  },
  /**
   * Check if undo/redo is available
   */
  canUndo(t) {
    return t ? !!this._redoStack.length : !!this._undoStack.length;
  },
  /**
   * Convenience method for undo (calls performUndo)
   */
  undo() {
    this.performUndo(!1);
  },
  /**
   * Convenience method for redo (calls performUndo(true))
   */
  redo() {
    this.performUndo(!0);
  },
  /**
   * Check if redo is available (convenience method)
   */
  canRedo() {
    return this.canUndo(!0);
  },
  /**
   * Execute a transaction (for undo support)
   */
  transaction(t) {
    if (this._currentTransaction)
      t(this._currentTransaction);
    else {
      for (; this._undoStack.length > 50; )
        this._undoStack.shift();
      this._redoStack.length = 0;
      let e = !1;
      this._undoStack.push(
        Wt((n) => {
          this._currentTransaction = n;
          try {
            t(n);
          } finally {
            e = n.length > 0, this._currentTransaction = void 0;
          }
        })
      ), e && (this.layout(), this.emitChange());
    }
  },
  // ==========================================================================
  // Modern Event System (Phase 2)
  // ==========================================================================
  /**
   * Subscribe to a document event
   *
   * @param event - Event name ('change' or 'selectionChange')
   * @param handler - Event handler function
   *
   * @example
   * // React useEffect pattern
   * useEffect(() => {
   *   const handler = () => console.log('changed');
   *   doc.on('change', handler);
   *   return () => doc.off('change', handler);
   * }, [doc]);
   */
  on(t, e) {
    this._events.on(t, e);
  },
  /**
   * Unsubscribe from a document event
   *
   * @param event - Event name
   * @param handler - The same handler function that was passed to on()
   */
  off(t, e) {
    this._events.off(t, e);
  },
  // ==========================================================================
  // Render Method (Phase 2)
  // ==========================================================================
  /**
   * Render the document to a canvas.
   *
   * This method allows headless rendering without DOM attachment.
   * Ideal for Three.js texture rendering or server-side rendering.
   *
   * @param options - Render options
   * @param options.canvas - Target canvas (HTMLCanvasElement or OffscreenCanvas)
   * @param options.dpr - Device pixel ratio (default 1)
   *
   * @example
   * const doc = createDocument({ width: 500 });
   * doc.load([{ text: 'Hello', bold: true }]);
   *
   * const canvas = document.createElement('canvas');
   * doc.render({ canvas, dpr: window.devicePixelRatio });
   *
   * // For Three.js texture
   * const texture = new THREE.CanvasTexture(canvas);
   */
  render(t) {
    const { canvas: e, dpr: n = 1 } = t, s = e.getContext("2d");
    if (!s)
      throw new Error("Could not get 2D context from canvas");
    const i = this.getHeight(), r = this._width;
    e.width = r * n, e.height = i * n, s.scale(n, n), s.clearRect(0, 0, r, i);
    const l = R(0, 0, r, i);
    this.draw(s, l), s.setTransform(1, 0, 0, 1, 0, 0);
  },
  // ==========================================================================
  // Formatting Methods (Phase 2)
  // ==========================================================================
  /**
   * Get formatting at current selection
   */
  getFormatting() {
    return this.selectedRange().getFormatting();
  },
  /**
   * Apply formatting to current selection
   */
  setFormatting(t) {
    const e = this.selectedRange();
    Object.entries(t).forEach(([n, s]) => {
      n !== "text" && e.setFormatting(n, s);
    });
  },
  /**
   * Get plain text content
   */
  plainText() {
    return this.documentRange().plainText();
  }
});
function me(t) {
  const e = Object.create(be);
  return e._width = (t == null ? void 0 : t.width) ?? 0, e.selection = { start: 0, end: 0 }, e.caretVisible = !0, e.selectionJustChanged = !1, e.words = [], e.frame = null, e._undoStack = [], e._redoStack = [], e._wordOrdinals = [], e.nextInsertFormatting = {}, e.customCodes = () => {
  }, e.codes = (n, s) => ue(n, s, e.codes) || e.customCodes(n, s, e.codes), e._events = new Vt(), e.selectionChanged = ct(), e.contentChanged = ct(), e.editFilters = [Rt], e.load([]), Object.defineProperty(e, "width", {
    get() {
      return this._width;
    },
    set(n) {
      n !== this._width && (this._width = n, this.layout());
    },
    enumerable: !0,
    configurable: !0
  }), Object.defineProperty(e, "height", {
    get() {
      var n;
      return ((n = this.frame) == null ? void 0 : n.bounds().h) ?? 0;
    },
    enumerable: !0,
    configurable: !0
  }), e;
}
function z(t, e, n) {
  t.addEventListener(e, (s) => {
    n(s) === !1 && s.preventDefault();
  });
}
function we(t, e, n) {
  z(t, e, (s) => {
    const i = t.getBoundingClientRect();
    return n(s, s.clientX - i.left, s.clientY - i.top);
  });
}
function ye(t, e) {
  return document.defaultView.getComputedStyle(t).getPropertyValue(e);
}
typeof document < "u" && setInterval(() => {
  const t = document.querySelectorAll(".carotaEditorCanvas"), e = document.createEvent("Event");
  e.initEvent("carotaEditorSharedTimer", !0, !0);
  for (let n = 0; n < t.length; n++)
    t[n].dispatchEvent(e);
}, 200);
const ve = {
  66: "bold",
  // B
  73: "italic",
  // I
  85: "underline",
  // U
  83: "strikeout"
  // S
};
function Se(t, e) {
  let n, s;
  t instanceof HTMLElement ? (n = t, s = e) : (s = t, n = s.element), ye(n, "position") !== "absolute" && (n.style.position = "relative"), n.innerHTML = '<div class="carotaSpacer"><canvas width="100" height="100" class="carotaEditorCanvas" style="position: absolute;"></canvas></div><div class="carotaTextArea" style="overflow: hidden; position: absolute; height: 0;"><textarea autocorrect="off" autocapitalize="off" spellcheck="false" tabindex="0" style="position: absolute; padding: 0px; width: 1000px; height: 1em; outline: none; font-size: 4px;"></textarea></div>';
  const i = n.querySelector("canvas"), r = n.querySelector(".carotaSpacer"), l = n.querySelector(".carotaTextArea"), a = n.querySelector("textarea"), o = me({ width: (s == null ? void 0 : s.width) ?? 0 });
  let h = 0, u = null, g = null, d = null, b = null, x = "", O = null, T = null, S = (s == null ? void 0 : s.verticalAlign) ?? "top";
  function M(c, f) {
    return f < 0 ? c <= 0 : c >= o.frame.length - 1;
  }
  function k(c, f) {
    return c.b <= f.t || f.b <= c.t;
  }
  function w(c, f) {
    const m = o.getCaretCoords(c);
    if (!m) return c;
    g = u !== null ? u : m.l;
    let p;
    for (; !M(c, f) && (c += f, p = o.getCaretCoords(c), !(p && k(p, m))); )
      ;
    const v = p || m;
    for (; !M(c, f) && !(f > 0 && v.l >= g || f < 0 && v.l <= g); )
      if (c += f, p = o.getCaretCoords(c), p && k(p, v)) {
        c -= f;
        break;
      }
    return c;
  }
  function C(c, f) {
    const m = o.getCaretCoords(c);
    if (!m) return c;
    for (; !M(c, f); ) {
      c += f;
      const p = o.getCaretCoords(c);
      if (p && k(p, m)) {
        c -= f;
        break;
      }
    }
    return c;
  }
  function F() {
    const c = o.frame.bounds().h;
    if (c < n.clientHeight)
      switch (S) {
        case "middle":
          return (n.clientHeight - c) / 2;
        case "bottom":
          return n.clientHeight - c;
      }
    return 0;
  }
  function _() {
    var W, y, L, P;
    const c = n.clientWidth;
    o.width !== c && (o.width = c);
    const f = o.frame.bounds().h, m = Math.max(1, window.devicePixelRatio || 1), p = Math.max(((y = (W = o.frame) == null ? void 0 : W.actualWidth) == null ? void 0 : y.call(W)) || 0, n.clientWidth), v = n.clientHeight;
    i.width = m * p, i.height = m * v, i.style.width = p + "px", i.style.height = v + "px", i.style.top = n.scrollTop + "px", r.style.width = p + "px", r.style.height = Math.max(f, n.clientHeight) + "px", f < n.clientHeight - 50 && (((P = (L = o.frame) == null ? void 0 : L.actualWidth) == null ? void 0 : P.call(L)) || 0) <= c ? n.style.overflow = "hidden" : n.style.overflow = "auto";
    const E = i.getContext("2d");
    E && (E.scale(m, m), E.clearRect(0, 0, p, v), E.translate(0, F() - n.scrollTop), o.draw(E, R(0, n.scrollTop, p, v)), o.drawSelection(E, d !== null || globalThis.document.activeElement === a));
  }
  function j(c, f, m) {
    let p = o.selection.start, v = o.selection.end;
    const E = o.frame.length - 1;
    let W = !1;
    if (g = null, !f)
      h = 0;
    else if (!h)
      switch (c) {
        case 37:
        case 38:
        case 36:
        case 33:
          h = -1;
          break;
        case 39:
        case 40:
        case 35:
        case 34:
          h = 1;
          break;
      }
    let y = h === 1 ? v : p, L = !1;
    switch (c) {
      case 37:
        if (!f && p !== v)
          y = p;
        else if (y > 0)
          if (m) {
            const N = o.wordContainingOrdinal(y);
            N && (N.ordinal === y ? y = N.index > 0 ? o.wordOrdinal(N.index - 1) : 0 : y = N.ordinal);
          } else
            y--;
        L = !0;
        break;
      case 39:
        if (!f && p !== v)
          y = v;
        else if (y < E)
          if (m) {
            const N = o.wordContainingOrdinal(y);
            N && (y = N.ordinal + N.word.length);
          } else
            y++;
        L = !0;
        break;
      case 40:
        y = w(y, 1), L = !0;
        break;
      case 38:
        y = w(y, -1), L = !0;
        break;
      case 36:
        y = C(y, -1), L = !0;
        break;
      case 35:
        y = C(y, 1), L = !0;
        break;
      case 33:
        y = 0, L = !0;
        break;
      case 34:
        y = E, L = !0;
        break;
      case 8:
        p === v && p > 0 && (o.range(p - 1, p).clear(), b = p - 1, o.select(b, b), W = !0);
        break;
      case 46:
        p === v && p < E && (o.range(p, p + 1).clear(), W = !0);
        break;
      case 90:
        m && (W = !0, o.performUndo());
        break;
      case 89:
        m && (W = !0, o.performUndo(!0));
        break;
      case 65:
        m && (W = !0, o.select(0, E));
        break;
      case 67:
      case 88:
        m && (O = o.selectedRange().save(), T = o.selectedRange().plainText());
        break;
    }
    const P = ve[c];
    if (m && P) {
      const N = o.selectedRange(), jt = N.getFormatting()[P];
      N.setFormatting(P, jt !== !0), _(), W = !0;
    }
    if (L) {
      switch (h) {
        case 0:
          p = v = y;
          break;
        case -1:
          p = y;
          break;
        case 1:
          v = y;
          break;
      }
      p === v ? h = 0 : p > v && (h = -h, [p, v] = [v, p]), b = y, o.select(p, v), W = !0;
    }
    return u = g, W;
  }
  function st() {
    b = b === null ? o.selection.end : b;
    const c = o.byOrdinal(b);
    if (b = null, c) {
      const f = c.bounds();
      l.style.left = f.l + "px", l.style.top = f.t + "px", a.focus();
      const m = Math.max(
        0,
        f.t + f.h - (n.scrollTop + n.clientHeight)
      );
      m && (n.scrollTop += m);
      const p = Math.max(0, n.scrollTop - f.t);
      p && (n.scrollTop -= p);
      const v = Math.max(
        0,
        f.l - (n.scrollLeft + n.clientWidth)
      );
      v && (n.scrollLeft += v);
      const E = Math.max(0, n.scrollLeft - f.l);
      E && (n.scrollLeft -= E);
    }
    x = o.selectedRange().plainText(), a.value = x, a.select(), setTimeout(() => {
      a.focus();
    }, 10);
  }
  z(a, "keydown", (c) => {
    if (j(c.keyCode, c.shiftKey, c.ctrlKey || c.metaKey))
      return !1;
  }), z(a, "input", () => {
    const c = a.value;
    x !== c && (x = "", a.value = "", c === T && O ? o.insert(O) : o.insert(c));
  }), z(n, "scroll", _), o.selectionChanged((c, f) => {
    _(), !d && f !== !1 && st();
  });
  function U(c, f) {
    we(r, c, (m, p, v) => {
      const E = o.byCoordinate(p, v - F());
      f(E);
    });
  }
  U("mousedown", (c) => {
    d = c.ordinal, o.select(c.ordinal, c.ordinal), u = null;
  }), U("dblclick", (c) => {
    const f = c.parent();
    if (f) {
      const m = f;
      o.select(
        f.ordinal,
        f.ordinal + (m.word ? m.word.text.length : f.length)
      );
    }
  }), U("mousemove", (c) => {
    d !== null && c && (b = c.ordinal, d > c.ordinal ? o.select(c.ordinal, d) : o.select(d, c.ordinal));
  }), U("mouseup", () => {
    d = null, u = null, st(), a.focus();
  });
  let it = (/* @__PURE__ */ new Date()).getTime(), rt = !1, ot = n.clientWidth, lt = n.clientHeight;
  function at() {
    let c = !1;
    const f = globalThis.document.activeElement === a;
    rt !== f && (rt = f, c = !0);
    const m = (/* @__PURE__ */ new Date()).getTime();
    m > it && (it = m + 500, o.toggleCaret() && (c = !0)), (n.clientWidth !== ot || n.clientHeight !== lt) && (c = !0, ot = n.clientWidth, lt = n.clientHeight), c && _();
  }
  return z(i, "carotaEditorSharedTimer", at), at(), o.sendKey = j, o.setVerticalAlignment = (c) => {
    S = c, _();
  }, o.focus = () => {
    a.focus();
  }, o.blur = () => {
    a.blur();
  }, o.hasFocus = () => globalThis.document.activeElement === a, o;
}
function A(t, e) {
  return function(n, s) {
    n.nodeName === t && (s[e] = !0);
  };
}
function Ft(t, e, n, s) {
  return function(i, r) {
    var a;
    let l = null;
    if (t === "attributes") {
      const o = (a = i.attributes) == null ? void 0 : a.getNamedItem(e);
      o && (l = o.value);
    } else if (t === "style") {
      const o = i;
      o.style && (l = o.style.getPropertyValue(e) || o.style[e]);
    }
    l && (r[n] = s ? s(l) : l);
  };
}
function D(t, e, n) {
  return Ft("attributes", t, e, n);
}
function $(t, e, n) {
  return Ft("style", t, e, n);
}
function q(t, e, n) {
  return function(s, i) {
    const r = s;
    r.style && (r.style.getPropertyValue(t) || r.style[t]) === e && (i[n] = !0);
  };
}
const xe = [6, 7, 9, 10, 12, 16, 20, 30], _e = {
  left: !0,
  center: !0,
  right: !0,
  justify: !0
};
function wt(t) {
  return _e[t] ? t : "left";
}
function yt(t) {
  const e = t.split(/\s*,\s*/g);
  if (e.length === 0)
    return t;
  let n = e[0], s = n.match(/^"(.*)"$/);
  return s || (s = n.match(/^'(.*)'$/), s) ? s[1].trim() : n;
}
const Ce = {
  H1: 30,
  H2: 20,
  H3: 16,
  H4: 14,
  H5: 12
}, ke = [
  // Tag-based formatting
  A("B", "bold"),
  A("STRONG", "bold"),
  A("I", "italic"),
  A("EM", "italic"),
  A("U", "underline"),
  A("S", "strikeout"),
  A("STRIKE", "strikeout"),
  A("DEL", "strikeout"),
  // Style-based formatting
  q("fontWeight", "bold", "bold"),
  q("fontStyle", "italic", "italic"),
  q("textDecoration", "underline", "underline"),
  q("textDecoration", "line-through", "strikeout"),
  $("color", "color"),
  $("fontFamily", "font", yt),
  $("fontSize", "size", (t) => {
    const e = t.match(/^([\d.]+)pt$/);
    return e ? parseFloat(e[1]) : 10;
  }),
  $("textAlign", "align", wt),
  // Special tags
  (t, e) => {
    t.nodeName === "SUB" && (e.script = "sub");
  },
  (t, e) => {
    (t.nodeName === "SUPER" || t.nodeName === "SUP") && (e.script = "super");
  },
  (t, e) => {
    t.nodeName === "CODE" && (e.font = "monospace");
  },
  (t, e) => {
    const n = Ce[t.nodeName];
    n && (e.size = n);
  },
  // Attribute-based formatting (legacy)
  D("color", "color"),
  D("face", "font", yt),
  D("align", "align", wt),
  D("size", "size", (t) => {
    const e = parseInt(t, 10);
    return xe[e] || 10;
  })
], Oe = ["BR", "P", "H1", "H2", "H3", "H4", "H5", "DIV"], Nt = {};
Oe.forEach((t) => {
  Nt[t] = !0;
});
function Ee(t, e = {}) {
  let n;
  typeof t == "string" ? (n = document.createElement("div"), n.innerHTML = t) : n = t;
  const s = [];
  let i = !0;
  function r(o, h) {
    o && s.push(
      Object.create(h, {
        text: { value: o }
      })
    );
  }
  function l(o, h) {
    o = o.replace(/\n+\s*/g, " ");
    const u = o.length;
    o = o.replace(/^\s+/, ""), i ? i = !1 : u !== o.length && (o = " " + o);
    const g = o.length;
    o = o.replace(/\s+$/, ""), g !== o.length && (i = !0, o += " "), r(o, h);
  }
  function a(o, h) {
    if (o.nodeType === 3)
      l(o.nodeValue || "", h);
    else if (o.nodeType === 1) {
      const u = o;
      h = Object.create(h);
      const g = u.getAttribute("class");
      g && g.split(" ").forEach((d) => {
        const b = e[d];
        b && Object.keys(b).forEach((x) => {
          h[x] = b[x];
        });
      }), ke.forEach((d) => {
        d(u, h);
      });
      for (let d = 0; d < u.childNodes.length; d++)
        a(u.childNodes[d], h);
      Nt[u.nodeName] && (r(`
`, h), i = !0);
    }
  }
  return a(n, {}), [...tt(s)];
}
export {
  Vt as EventManager,
  vt as MULTIPLE_VALUES,
  Xt as applyRunStyle,
  Qt as cachedMeasureText,
  zt as cloneRun,
  tt as consolidateRuns,
  Yt as createCachedMeasureText,
  me as createDocument,
  Se as createEditor,
  ct as createEvent,
  ge as createRange,
  R as createRect,
  I as defaultFormatting,
  Ot as draw,
  Ot as drawText,
  Rt as editFilter,
  Ct as enter,
  Ut as formatRuns,
  X as formattingKeys,
  kt as getFontString,
  J as getPieceLength,
  Y as getPiecePlainText,
  Dt as getPlainText,
  Gt as getRunStyle,
  _t as getSubText,
  $t as getTextChar,
  et as getTextLength,
  ue as handleCode,
  Te as isCodeObject,
  K as measure,
  Kt as measureText,
  Bt as mergeFormatting,
  nt as nbsp,
  Ee as parse,
  Ee as parseHtml,
  ut as pieceCharacters,
  Jt as prepareContext,
  R as rect,
  It as sameFormatting
};
