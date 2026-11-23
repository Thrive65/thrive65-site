/*
 * charts.js — the site-wide chart runtime. No dependencies.
 *
 * Loaded (deferred) by _layouts/default.html on pages whose front matter sets
 * `charts: true`. It enhances markup rendered by Jekyll:
 *
 *   _includes/chart.html → <figure data-chart-figure> with a JSON spec, one
 *     .chart per panel, an optional variant .choice-group, and a server-
 *     rendered legend + data table (so the figure reads without JS).
 *     This file draws each panel as an SVG line/band chart at its rendered
 *     width (1 viewBox unit = 1px, labels at --step--1), with a focusable band
 *     per x position: Tab reaches the chart, arrow keys / Home / End move
 *     along it, and focus, hover or tap shows the shared .chart-tip.
 *
 *   _includes/choropleth.html → <figure data-map> with three static SVG maps.
 *     This file wires the map and measure .choice-groups: switching only
 *     toggles .is-hidden and rewrites each area's --t, so CSS crossfades the
 *     maps and transitions the fills. Nothing is rebuilt, so focus stays put.
 *
 * Spec shape (written by scripts/enrollment/prepare.mjs): see the comment above
 * "line charts" in that script. Colors are always var(--series-N) tokens and
 * line styles always .swatch-* utilities, so every theme just works.
 */
(function () {
  "use strict";

  var SVG = "http://www.w3.org/2000/svg";
  var STYLE = { strong: "swatch-strong", dashed: "swatch-dashed", dotted: "swatch-dotted", line: "" };

  /* ------------------------------------------------------------ helpers */
  function rem() { return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function fmt(v) { return Math.round(v).toLocaleString("en-US"); }
  function say(msg) { if (typeof window.announce === "function") window.announce(msg); }

  /* "Nice" axis ticks: round step of 1, 2 or 5 × 10^n covering [lo, hi]. */
  function niceTicks(lo, hi, count) {
    var span = hi - lo || Math.abs(hi) || 1;
    var raw = span / Math.max(1, count), mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var step = [1, 2, 5, 10].map(function (m) { return m * mag; }).find(function (s) { return s >= raw; });
    var start = Math.floor(lo / step) * step, end = Math.ceil(hi / step) * step, ticks = [];
    for (var v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v / step) * step);
    return { lo: start, hi: end, ticks: ticks };
  }
  function scale(d0, d1, r0, r1) { return function (v) { return r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0); }; }

  /* Path through the points; a null value breaks the line. */
  function linePath(values, sx, sy) {
    var d = "", pen = false;
    values.forEach(function (v, i) {
      if (v === null || v === undefined) { pen = false; return; }
      d += (pen ? "L" : "M") + sx(i).toFixed(1) + "," + sy(v).toFixed(1);
      pen = true;
    });
    return d;
  }
  /* Closed area between low and high, one polygon per unbroken run. */
  function areaPath(low, high, sx, sy) {
    var d = "", run = [];
    function flush() {
      if (run.length > 1) {
        d += "M" + run.map(function (i) { return sx(i).toFixed(1) + "," + sy(high[i]).toFixed(1); }).join("L");
        d += "L" + run.slice().reverse().map(function (i) { return sx(i).toFixed(1) + "," + sy(low[i]).toFixed(1); }).join("L") + "Z";
      }
      run = [];
    }
    low.forEach(function (v, i) { if (v === null || high[i] === null) flush(); else run.push(i); });
    flush();
    return d;
  }

  /* --------------------------------------------------------- line charts */
  function drawPanel(el, spec) {
    var W = el.clientWidth;
    if (!W) return;
    var R = rem(), fs = R * 0.833, compact = !!spec.compact;
    var n = spec.x.length;
    var H = Math.round(R * (compact ? 8 : 15));

    // y domain from everything drawn
    var vals = [];
    (spec.series || []).forEach(function (s) { vals = vals.concat(s.values); });
    (spec.bands || []).forEach(function (b) { vals = vals.concat(b.low, b.high); });
    (spec.markers || []).forEach(function (m) { vals.push(m.value); });
    (spec.hrefs || []).forEach(function (v) { vals.push(v); });
    vals = vals.filter(function (v) { return v !== null && v !== undefined; });
    var lo = spec.zero ? 0 : spec.yMin !== undefined ? spec.yMin : Math.min.apply(null, vals);
    var hi = spec.yMax !== undefined ? spec.yMax : Math.max.apply(null, vals);
    if (!spec.zero && spec.yMin === undefined) lo -= (hi - lo) * 0.05;
    var nice = niceTicks(lo, hi, compact ? 3 : 5);

    // margins in rem, so they grow with the text-size setting
    var longest = Math.max.apply(null, nice.ticks.map(function (t) { return fmt(t).length; }));
    var m = { t: fs * (spec.refs && spec.refs.some(function (r) { return r.label; }) || spec.spans ? 1.6 : 0.8),
      r: R * 0.75, b: fs * 2, l: Math.max(R * 1.5, longest * fs * 0.62 + R * 0.5) };
    var sx = scale(0, n - 1, m.l, W - m.r), sy = scale(nice.lo, nice.hi, H - m.b, m.t);

    var s = "";
    // shaded spans (e.g. COVID years)
    (spec.spans || []).forEach(function (sp) {
      var x0 = sx(sp.from) - fs * 0.3, x1 = sx(sp.to) + fs * 0.3;
      s += '<rect x="' + x0 + '" y="' + m.t + '" width="' + (x1 - x0) + '" height="' + (H - m.t - m.b) +
        '" style="fill: var(--series-muted); fill-opacity: 0.15"/>';
      if (sp.label) s += '<text class="chart-axis" x="' + x0 + '" y="' + (m.t - fs * 0.4) + '">' + esc(sp.label) + "</text>";
    });
    // grid + y labels
    nice.ticks.forEach(function (t) {
      if (compact && t === 0) return;
      var y = sy(t).toFixed(1);
      s += '<line class="chart-grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + y + '" y2="' + y + '"/>';
      s += '<text class="chart-axis" x="' + (m.l - fs * 0.4) + '" y="' + y + '" dy="0.32em" text-anchor="end">' + fmt(t) + "</text>";
    });
    // x labels, thinned until they fit
    var ticks = (spec.ticks || spec.x).map(function (v) { return spec.x.indexOf(v); }).filter(function (i) { return i >= 0; });
    // x labels: anchor the edge labels inward, then keep a label only if its
    // box clears the last one kept; the final label always shows, displacing
    // neighbours it would collide with
    var gap = fs * 0.8;
    function box(i) {
      var w = String(spec.xLabels[i]).length * fs * 0.6, x = sx(i);
      var anchor = x - w / 2 < m.l - fs ? "start" : x + w / 2 > W ? "end" : "middle";
      var left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
      return { i: i, x: x, anchor: anchor, left: left, right: left + w };
    }
    var boxes = ticks.map(box), keep = [];
    boxes.forEach(function (b) { if (!keep.length || b.left >= keep[keep.length - 1].right + gap) keep.push(b); });
    var lastBox = boxes[boxes.length - 1];
    if (lastBox && keep[keep.length - 1] !== lastBox) {
      while (keep.length && lastBox.left < keep[keep.length - 1].right + gap) keep.pop();
      keep.push(lastBox);
    }
    keep.forEach(function (b) {
      s += '<text class="chart-axis" x="' + b.x.toFixed(1) + '" y="' + (H - m.b + fs * 1.4) + '" text-anchor="' + b.anchor + '">' + esc(spec.xLabels[b.i]) + "</text>";
    });
    // reference lines
    (spec.hrefs || []).forEach(function (v) {
      s += '<line class="chart-ref" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + sy(v) + '" y2="' + sy(v) + '" style="stroke-dasharray: none"/>';
    });
    (spec.refs || []).forEach(function (r) {
      var x = sx(r.at).toFixed(1);
      s += '<line class="chart-ref" x1="' + x + '" x2="' + x + '" y1="' + m.t + '" y2="' + (H - m.b) + '"/>';
      if (r.label) {
        // right of the line if it fits, else left of it, else centred and held inside the chart
        var lw = r.label.length * fs * 0.6, pad = fs * 0.3, lx = +x + pad, la = "start";
        if (lx + lw > W) { lx = +x - pad; la = "end"; }
        if (la === "end" && lx - lw < 0) { lx = Math.min(Math.max(+x, lw / 2), W - lw / 2); la = "middle"; }
        s += '<text class="chart-axis" x="' + lx.toFixed(1) + '" y="' + (m.t - fs * 0.4) + '" text-anchor="' + la + '">' + esc(r.label) + "</text>";
      }
    });
    // bands, then lines (strong series last so they sit on top)
    (spec.bands || []).forEach(function (b) {
      s += '<path class="chart-band" style="--swatch: ' + b.swatch + '" d="' + areaPath(b.low, b.high, sx, sy) + '"/>';
    });
    (spec.series || []).forEach(function (se) {
      s += '<path class="chart-line ' + (STYLE[se.style] || "") + '" style="--swatch: ' + se.swatch + '" d="' + linePath(se.values, sx, sy) + '"/>';
      var pts = se.values.map(function (v, i) { return v === null ? -1 : i; }).filter(function (i) { return i >= 0; });
      (spec.dots ? pts : se.style === "strong" ? pts.slice(-1) : []).forEach(function (i) {
        s += '<circle class="chart-dot" style="--swatch: ' + se.swatch + '" cx="' + sx(i).toFixed(1) + '" cy="' + sy(se.values[i]).toFixed(1) + '" r="' + (fs * 0.3).toFixed(1) + '"/>';
      });
    });
    (spec.markers || []).forEach(function (mk) {
      var cx = sx(mk.at), cy = sy(mk.value), d = fs * 0.42;
      s += '<path class="chart-dot" style="--swatch: ' + mk.swatch + '" d="M' + cx + "," + (cy - d) + "L" + (cx + d) + "," + cy + "L" + cx + "," + (cy + d) + "L" + (cx - d) + "," + cy + 'Z"/>';
    });
    if (spec.flag) s += '<text class="chart-axis" x="' + sx(1) + '" y="' + (m.t + fs) + '">' + esc(spec.flag) + "</text>";
    s += '<line class="chart-cursor" y1="' + m.t + '" y2="' + (H - m.b) + '"/>';

    // one focusable band per x position (roving tabindex: one tab stop per chart)
    var bw = (W - m.l - m.r) / Math.max(1, n - 1);
    for (var i = 0; i < n; i++) {
      s += '<rect class="chart-hit" data-i="' + i + '" tabindex="' + (i === 0 ? 0 : -1) + '" role="img" aria-label="' + esc(tipText(spec, i)) +
        '" x="' + Math.max(m.l, sx(i) - bw / 2) + '" y="' + m.t + '" width="' + (i === 0 || i === n - 1 ? bw / 2 : bw) + '" height="' + (H - m.t - m.b) + '" fill="transparent"/>';
    }

    var svg = el.querySelector("svg");
    if (!svg) {
      svg = document.createElementNS(SVG, "svg");
      svg.setAttribute("role", "group");
      el.appendChild(svg);
    }
    svg.setAttribute("aria-label", (spec.title ? spec.title + ". " : "") + "Use the arrow keys to move between years.");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.style.setProperty("--chart-text", "var(--step--1)");
    svg.innerHTML = s;
    el._chart = { spec: spec, sx: sx, last: -1 };
  }

  function rowsAt(spec, i) {
    var rows = [];
    (spec.series || []).slice().reverse().forEach(function (se) {
      if (se.values[i] !== null) rows.push({ label: se.label, swatch: se.swatch, shape: "swatch-line " + (STYLE[se.style] || ""), value: se.display[i] });
    });
    (spec.bands || []).forEach(function (b) {
      if (b.display[i]) rows.push({ label: b.label, swatch: b.swatch, shape: "swatch-band", value: b.display[i] });
    });
    (spec.markers || []).forEach(function (mk) { if (mk.at === i) rows.push({ label: mk.label, swatch: mk.swatch, shape: "swatch-diamond", value: "" }); });
    return rows;
  }
  function tipText(spec, i) {
    var rows = rowsAt(spec, i);
    return spec.xLabels[i] + ": " + (rows.length ? rows.map(function (r) { return r.label + (r.value ? " " + r.value : ""); }).join("; ") : "no data");
  }

  function showTip(el, i) {
    var c = el._chart; if (!c) return;
    var tip = el.querySelector(".chart-tip");
    if (!tip) { tip = document.createElement("div"); tip.className = "chart-tip hidden"; tip.setAttribute("aria-hidden", "true"); el.appendChild(tip); }
    var rows = rowsAt(c.spec, i);
    tip.innerHTML = "<strong>" + esc(c.spec.title ? c.spec.title + ", " : "") + esc(c.spec.xLabels[i]) + "</strong>" +
      (rows.length ? rows.map(function (r) {
        return '<span class="chart-tip-row cluster"><span class="chart-swatch ' + r.shape + '" style="--swatch: ' + r.swatch + '"></span>' +
          esc(r.label) + (r.value ? "<b>" + esc(r.value) + "</b>" : "") + "</span>";
      }).join("") : "<span>No data</span>");
    tip.classList.remove("hidden");
    var x = c.sx(i), w = tip.offsetWidth, W = el.clientWidth;
    // sit beside the cursor, flipping to the left past the middle
    tip.style.left = Math.max(0, Math.min(W - w, x > W / 2 ? x - w - 12 : x + 12)) + "px";
    var cur = el.querySelector(".chart-cursor");
    if (cur) { cur.setAttribute("x1", x); cur.setAttribute("x2", x); cur.classList.add("is-on"); }
    c.last = i;
  }
  function hideTip(el) {
    var tip = el.querySelector(".chart-tip"), cur = el.querySelector(".chart-cursor");
    if (tip) tip.classList.add("hidden");
    if (cur) cur.classList.remove("is-on");
  }

  function wirePanel(el) {
    el.addEventListener("pointerover", function (e) { if (e.target.classList.contains("chart-hit")) showTip(el, +e.target.dataset.i); });
    el.addEventListener("pointerdown", function (e) { if (e.target.classList.contains("chart-hit")) showTip(el, +e.target.dataset.i); });
    el.addEventListener("pointerleave", function () { if (!el.contains(document.activeElement)) hideTip(el); });
    el.addEventListener("focusin", function (e) { if (e.target.classList.contains("chart-hit")) showTip(el, +e.target.dataset.i); });
    el.addEventListener("focusout", function (e) { if (!el.contains(e.relatedTarget)) hideTip(el); });
    el.addEventListener("keydown", function (e) {
      if (!e.target.classList.contains("chart-hit")) return;
      var hits = el.querySelectorAll(".chart-hit"), i = +e.target.dataset.i, j = i;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") j = Math.min(hits.length - 1, i + 1);
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") j = Math.max(0, i - 1);
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = hits.length - 1;
      else if (e.key === "Escape") { hideTip(el); return; }
      else return;
      e.preventDefault();
      hits[i].setAttribute("tabindex", "-1");
      hits[j].setAttribute("tabindex", "0");
      hits[j].focus();
    });
  }

  function initFigure(fig) {
    var spec = JSON.parse(fig.querySelector("script[data-chart-spec]").textContent);
    var variant = spec.variants ? spec.variants[0] : null;
    var panels = [].slice.call(fig.querySelectorAll(".chart[data-panel]"));
    function panelSpec(k) { return (variant ? variant.panels : spec.panels)[k]; }
    function drawAll() { panels.forEach(function (el, k) { drawPanel(el, panelSpec(k)); }); }

    panels.forEach(function (el, k) {
      wirePanel(el);
      var w = 0, raf = 0;
      // ResizeObserver also catches text-size / dyslexic-font changes, which
      // reflow the column without resizing the window
      new ResizeObserver(function () {
        if (el.clientWidth === w) return;
        w = el.clientWidth;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { drawPanel(el, panelSpec(k)); });
      }).observe(el);
    });

    var group = fig.querySelector("[data-variants]");
    if (group) {
      group.hidden = false;
      group.addEventListener("click", function (e) {
        var b = e.target.closest("[data-variant]");
        if (!b) return;
        variant = spec.variants.find(function (v) { return v.id === b.dataset.variant; });
        group.querySelectorAll("[data-variant]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        drawAll();
        say("Showing " + b.textContent.trim());
      });
    }
  }

  /* ---------------------------------------------------------------- maps */
  function initMap(fig) {
    var spec = JSON.parse(fig.querySelector("script[data-map-spec]").textContent);
    var mapGroup = fig.querySelector("[data-map-group]"), measureGroup = fig.querySelector("[data-measure-group]");
    var legendName = fig.querySelector("[data-legend-name]"), legendMax = fig.querySelector("[data-legend-max]");
    var note = fig.querySelector("[data-map-note]");
    var current = spec.maps.find(function (m) { return m.default; }) || spec.maps[0];
    var measure = current.measures[0].id;

    function panel(id) { return fig.querySelector('svg[data-map-panel="' + id + '"]'); }
    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function applyMeasure() {
      var svg = panel(current.id);
      svg.querySelectorAll(".choropleth-area").forEach(function (p) {
        var t = p.dataset["t" + cap(measure)];
        if (t !== undefined) p.style.setProperty("--t", t);
      });
      svg.querySelectorAll("[data-value]").forEach(function (v) {
        var txt = v.dataset["v" + cap(measure)];
        if (txt !== undefined) v.textContent = txt;
      });
      var m = spec.measures[measure];
      legendName.textContent = m.label;
      legendMax.textContent = m.maxLabel;
      measureGroup.querySelectorAll("[data-measure]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.measure === measure)); });
    }
    function renderMeasures() {
      if (current.measures.length < 2) {
        measureGroup.innerHTML = '<p class="hint">Showing: ' + esc(current.measures[0].label) + "</p>";
        return;
      }
      measureGroup.innerHTML = current.measures.map(function (m) {
        return '<button type="button" class="choice compact" data-measure="' + m.id + '" aria-pressed="false">' + esc(m.label) + "</button>";
      }).join("");
    }

    // keep labels at --step--1 on screen: tell CSS how many viewBox units one
    // rendered pixel is (the maps share one viewBox)
    var stage = fig.querySelector(".choropleth-stage"), vbW = +spec.viewBox.split(" ")[2];
    new ResizeObserver(function () {
      if (stage.clientWidth) fig.style.setProperty("--map-scale", (vbW / stage.clientWidth).toFixed(3));
    }).observe(stage);

    mapGroup.hidden = false;
    measureGroup.hidden = false;
    renderMeasures();
    applyMeasure();

    mapGroup.addEventListener("click", function (e) {
      var b = e.target.closest("[data-map-id]");
      if (!b || b.dataset.mapId === current.id) return;
      current = spec.maps.find(function (m) { return m.id === b.dataset.mapId; });
      // keep the measure if the new map has it (shared color domain), else its first
      if (!current.measures.some(function (m) { return m.id === measure; })) measure = current.measures[0].id;
      mapGroup.querySelectorAll("[data-map-id]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      fig.querySelectorAll("svg[data-map-panel]").forEach(function (s) { s.classList.toggle("is-hidden", s.dataset.mapPanel !== current.id); });
      if (note) { note.textContent = current.note || ""; note.hidden = !current.note; }
      renderMeasures();
      applyMeasure();
      say("Showing " + current.label + ", " + spec.measures[measure].label);
    });
    measureGroup.addEventListener("click", function (e) {
      var b = e.target.closest("[data-measure]");
      if (!b) return;
      measure = b.dataset.measure;
      applyMeasure();
      say("Showing " + spec.measures[measure].label);
    });
  }

  function init() {
    document.querySelectorAll("[data-chart-figure]").forEach(initFigure);
    document.querySelectorAll("[data-map]").forEach(initMap);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
