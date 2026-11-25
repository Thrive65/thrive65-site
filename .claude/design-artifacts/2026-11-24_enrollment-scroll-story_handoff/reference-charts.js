/*
 * Reference code for the scroll-story charts that the site doesn't have yet.
 * Ported from the approved Claude dashboard version and rewritten against the
 * site's shim in assets/js/enrollment-dashboard.js (window.dash, window.d65).
 * Paste into enrollment-dashboard.js as a new IIFE block. Treat it as a
 * starting point: match the file's existing style, and size text via the CSS
 * (svg text is 11px in enrollment-dashboard.css) rather than inline.
 *
 * Not tested in the site build. The dashboard versions render correctly.
 */
(function () {
const num = d65.num, fmt = d65.fmt;
const trendVal = (y, f) => {
  const s = dash.data('district_trend'); if (s.status !== 'ok') return null;
  const r = s.data.find((d) => d.year === y); return r ? num(r[f]) : null;
};
const failed = (el, s) => { el.replaceChildren(); el.textContent = s.status === 'error' ? 'This chart could not load.' : ''; };
const svgFor = (el, W, H, label) => d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', label);

// ---- Capacity (district Nov. 6, 2026 utilization table) -------------------
// 7,212 K-8 seats with Dewey and Lincolnwood closed (King Arts included).
// Today's buildings add Dewey (556) and Lincolnwood (about 384), Thrive65
// estimates using the district's method. Replaces the old 7,500 figure.
const CAP_PLAN = 7212, CAP_NOW = 7212 + 556 + 384;
// Of the 444 students lost in fall 2020-21, about 150 are still K-8 age.
const LEFT_STILL_K8 = 150;
const gap2031 = (cap) => { const t = trendVal('2031-32', 't65_mid'); return t === null ? null : cap - t; };

dash.draw('s-gap', (el) => { const v = gap2031(CAP_NOW); el.textContent = v === null ? '—' : 'about ' + fmt(Math.round(v / 100) * 100); });
dash.draw('s-gap2', (el) => { const v = gap2031(CAP_PLAN); el.textContent = v === null ? '—' : 'about ' + fmt(Math.round(v / 100) * 100); });
dash.draw('s-t65', (el) => { const v = trendVal('2031-32', 't65_mid'); el.textContent = v === null ? '—' : fmt(Math.round(v / 10) * 10); });
dash.draw('s-t65r', (el) => {
  const a = trendVal('2031-32', 't65_low'), b = trendVal('2031-32', 't65_high');
  el.textContent = a === null || b === null ? '—' : 'range ' + fmt(Math.round(a / 10) * 10) + ' to ' + fmt(Math.round(b / 10) * 10);
});

// ---- Shared line-chart frame --------------------------------------------
function lineFrame(el, years, ymin, ymax, label, m) {
  const W = el.clientWidth || 600, H = 320;
  const x = d3.scalePoint(years, [m.l, W - m.r]);
  const y = d3.scaleLinear([ymin, ymax], [H - m.b, m.t]).nice();
  const svg = svgFor(el, W, H, label);
  svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  const every = Math.max(1, Math.ceil(years.length / Math.max(2, Math.floor((W - m.l - m.r) / 64))));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(years.filter((_, i) => i % every === 0)).tickFormat((d) => "'" + d.slice(2, 4)).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(',')));
  return { svg, x, y, W, H };
}
function hoverYears(el, f, rows, lines) {
  const tip = d65.tip(el);
  f.svg.append('rect').attr('width', f.W).attr('height', f.H).attr('fill', 'transparent')
    .on('pointermove', (ev) => {
      const [px] = d3.pointer(ev);
      const r = rows.reduce((a, b) => (Math.abs(f.x(b.year) - px) < Math.abs(f.x(a.year) - px) ? b : a));
      const L = lines(r); if (!L) return tip.hide();
      tip.show(L, Math.min(f.x(r.year), f.W * 0.55) / f.W * el.clientWidth, 8);
    })
    .on('pointerleave', () => tip.hide());
}

// ---- 1. K-8 enrollment each fall ------------------------------------------
dash.draw('c-k8', (el) => {
  const s = dash.data('district_trend');
  if (s.status !== 'ok') return failed(el, s);
  el.replaceChildren();
  const rows = s.data.map((r) => ({ year: r.year, a: num(r.actual) })).filter((r) => r.a !== null);
  const f = lineFrame(el, rows.map((r) => r.year), 4000, 8000, 'District 65 K-8 enrollment, 2012-13 to 2026-27', { t: 20, r: 20, b: 26, l: 48 });
  f.svg.append('path').datum(rows).attr('d', d3.line().x((r) => f.x(r.year)).y((r) => f.y(r.a))).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2.5);
  const pk = rows.reduce((a, b) => (b.a > a.a ? b : a)), last = rows[rows.length - 1];
  for (const [r, anchor, dy] of [[pk, 'middle', -10], [last, 'end', 20]]) {
    f.svg.append('circle').attr('cx', f.x(r.year)).attr('cy', f.y(r.a)).attr('r', 4).style('fill', dash.colors[0]);
    f.svg.append('text').attr('x', f.x(r.year)).attr('y', f.y(r.a) + dy).attr('text-anchor', anchor).style('fill', 'var(--color-fg)').text(r.year + ': ' + fmt(r.a));
  }
  hoverYears(el, f, rows, (r) => [r.year, fmt(r.a) + ' students']);
});

// ---- 6. Each grade this fall vs. its size in kindergarten ------------------
// For grade index i, the class's kindergarten size is the K count in fall
// (2026 - i). The site's cv-sincek drawer does the same sum inline; consider
// having it call classesNow() too so the two can't disagree.
const G9 = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
function classesNow() {
  const s = dash.data('district_grades'); if (s.status !== 'ok') return null;
  const m = {}; for (const r of s.data) (m[r.year] = m[r.year] || {})[r.grade] = +r.students;
  return G9.map((g, i) => ({ g, now: m['2026-27'][g], atK: (m[(2026 - i) + '-' + String(2027 - i).slice(2)] || {}).K }));
}
dash.draw('c-classes', (el) => {
  const s = dash.data('district_grades');
  if (s.status !== 'ok') return failed(el, s);
  el.replaceChildren();
  const rows = classesNow();
  const W = el.clientWidth || 600, H = 320, m = { t: 22, r: 10, b: 28, l: 44 };
  const x = d3.scaleBand(rows.map((r) => r.g), [m.l, W - m.r]).padding(0.25);
  const y = d3.scaleLinear([0, d3.max(rows, (r) => Math.max(r.now, r.atK)) * 1.12], [H - m.b, m.t]).nice();
  const svg = svgFor(el, W, H, 'Each grade in fall 2026 next to the size of the same class in kindergarten');
  svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(4)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickFormat((g) => (g === 'K' ? 'K' : 'Gr ' + g)).tickSizeOuter(0));
  const bw = x.bandwidth();
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(r.g)).attr('width', bw).attr('y', (r) => y(r.atK)).attr('height', (r) => y(0) - y(r.atK)).attr('rx', 3).style('fill', 'var(--cds-chart-muted)');
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(r.g) + bw * 0.2).attr('width', bw * 0.6).attr('y', (r) => y(r.now)).attr('height', (r) => y(0) - y(r.now)).attr('rx', 3).style('fill', dash.colors[0]);
  svg.append('g').selectAll('text').data(rows).join('text').attr('x', (r) => x(r.g) + bw / 2).attr('y', (r) => y(Math.max(r.now, r.atK)) - 6).attr('text-anchor', 'middle').text((r) => fmt(r.now));
  const tip = d65.tip(el);
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(r.g)).attr('width', bw).attr('y', m.t).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('pointermove', (ev, r) => tip.show([(r.g === 'K' ? 'Kindergarten' : 'Grade ' + r.g) + ', fall 2026', 'Now: ' + fmt(r.now), 'In kindergarten: ' + fmt(r.atK), 'Change: ' + (r.now - r.atK >= 0 ? '+' : '−') + Math.abs(r.now - r.atK)], Math.min(x(r.g), W * 0.6) / W * el.clientWidth, 8))
    .on('pointerleave', () => tip.hide());
});

// ---- 8 and 9. Forecast charts ---------------------------------------------
// c-fcst: 2018-19 on, Kofron band low-high, Kofron middle, McKibben, actual.
// c-ahead: 2016-17 on, adds the Thrive65 band/line and two capacity lines.
function forecastChart(el, ahead) {
  const s = dash.data('district_trend');
  if (s.status !== 'ok') return failed(el, s);
  el.replaceChildren();
  const rows = s.data.map((r) => ({ year: r.year, a: num(r.actual), lo: num(r.kofron_low), mid: num(r.kofron_mid), hi: num(r.kofron_high), mck: num(r.mckibben_2024) })).filter((r) => r.year >= (ahead ? '2016-17' : '2018-19'));
  const f = lineFrame(el, rows.map((r) => r.year), ahead ? 3000 : 3500, ahead ? 8500 : 7600, ahead ? 'K-8 enrollment and forecasts to 2031-32 against building capacity' : 'K-8 enrollment, actual vs. the Kofron and McKibben forecasts', { t: 16, r: 56, b: 26, l: 48 });
  if (!ahead) {
    const band = rows.filter((r) => r.lo !== null);
    f.svg.append('path').datum(band).attr('d', d3.area().x((r) => f.x(r.year)).y0((r) => f.y(r.lo)).y1((r) => f.y(r.hi))).style('fill', dash.colors[0]).style('opacity', 0.13);
  } else {
    for (const [cap, label] of [[CAP_NOW, "Today's buildings: about 8,150 seats"], [CAP_PLAN, 'After the two proposed closures: about 7,200']]) {
      f.svg.append('line').attr('x1', f.x.range()[0]).attr('x2', f.x.range()[1]).attr('y1', f.y(cap)).attr('y2', f.y(cap)).style('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '2 3');
      f.svg.append('text').attr('x', f.x.range()[1]).attr('y', f.y(cap) - 6).attr('text-anchor', 'end').text(label);
    }
    const tr = s.data.map((r) => ({ year: r.year, lo: num(r.t65_low), mid: num(r.t65_mid), hi: num(r.t65_high) })).filter((r) => r.mid !== null);
    f.svg.append('path').datum(tr).attr('d', d3.area().x((r) => f.x(r.year)).y0((r) => f.y(r.lo)).y1((r) => f.y(r.hi))).style('fill', dash.colors[6]).style('opacity', 0.14);
    f.svg.append('path').datum(tr).attr('d', d3.line().x((r) => f.x(r.year)).y((r) => f.y(r.mid))).attr('fill', 'none').style('stroke', dash.colors[6]).attr('stroke-width', 2).attr('stroke-dasharray', '3 2');
    const te = tr[tr.length - 1];
    if (te) f.svg.append('text').attr('x', f.x(te.year) + 6).attr('y', f.y(te.mid) + 16).text(fmt(te.mid));
  }
  const ln = (k) => d3.line().defined((r) => r[k] !== null).x((r) => f.x(r.year)).y((r) => f.y(r[k]));
  f.svg.append('path').datum(rows).attr('d', ln('mid')).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2).attr('stroke-dasharray', '6 4');
  f.svg.append('path').datum(rows).attr('d', ln('mck')).attr('fill', 'none').style('stroke', dash.colors[3]).attr('stroke-width', 2).attr('stroke-dasharray', '8 3 2 3');
  f.svg.append('path').datum(rows).attr('d', ln('a')).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2.5);
  const la = rows.filter((r) => r.a !== null).slice(-1)[0];
  f.svg.append('circle').attr('cx', f.x(la.year)).attr('cy', f.y(la.a)).attr('r', 4).style('fill', dash.colors[0]);
  const end = rows[rows.length - 1], labs = [];
  if (end.mid !== null) labs.push({ y: f.y(end.mid) + 4, t: fmt(end.mid) });
  if (end.mck !== null) labs.push({ y: f.y(end.mck) + 4, t: fmt(end.mck) });
  labs.sort((a, b) => a.y - b.y); for (let i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < 13) labs[i].y = labs[i - 1].y + 13;
  f.svg.append('g').selectAll('text').data(labs).join('text').attr('x', f.x(end.year) + 6).attr('y', (l) => l.y).text((l) => l.t);
  hoverYears(el, f, rows, (r) => [r.year].concat(r.a !== null ? ['Actual: ' + fmt(r.a)] : []).concat(r.mid !== null ? ['Kofron middle: ' + fmt(r.mid) + ' (' + fmt(r.lo) + '–' + fmt(r.hi) + ')'] : []).concat(r.mck !== null ? ['McKibben: ' + fmt(r.mck)] : []));
}
dash.draw('c-fcst', (el) => forecastChart(el, false));
dash.draw('c-ahead', (el) => forecastChart(el, true));

// ---- 10. What the district can change ------------------------------------
dash.draw('c-levers', (el) => {
  const s = dash.data('district_trend'), p = dash.data('private_k8');
  if (s.status !== 'ok') return failed(el, s);
  if (p.status !== 'ok') return failed(el, p);
  el.replaceChildren();
  const gap = gap2031(CAP_NOW), gap2 = gap2031(CAP_PLAN), priv = +p.data[p.data.length - 1].private_k8;
  if (gap === null) { el.textContent = 'This chart could not load.'; return; }
  const rows = [
    { n: 'Every private K-8 student in the boundary', v: Math.round(priv / 10) * 10, c: dash.colors[1] },
    { n: 'Students who left in 2020-21, still K-8 age', v: LEFT_STILL_K8, c: dash.colors[1] },
    { n: "Empty seats in 2031-32, today's buildings", v: Math.round(gap / 100) * 100, c: 'var(--cds-chart-muted)', u: Math.round((CAP_NOW - gap) / CAP_NOW * 100) },
    { n: 'Empty seats in 2031-32, after the two proposed closures', v: Math.round(gap2 / 100) * 100, c: 'var(--cds-chart-muted)', u: Math.round((CAP_PLAN - gap2) / CAP_PLAN * 100) }
  ];
  const W = el.clientWidth || 600, H = 300, m = { t: 8, r: 80, b: 10, l: 10 };
  const x = d3.scaleLinear([0, d3.max(rows, (r) => r.v)], [m.l, W - m.r]);
  const rowH = (H - m.t - m.b) / rows.length, bh = Math.min(26, rowH * 0.42);
  const svg = svgFor(el, W, H, 'Students each possibility could add, compared with empty building space expected by 2031-32');
  rows.forEach((r, i) => {
    const y0 = m.t + rowH * i;
    svg.append('text').attr('x', m.l).attr('y', y0 + 14).style('fill', 'var(--color-fg)').text(r.n);
    svg.append('rect').attr('x', m.l).attr('y', y0 + 22).attr('width', Math.max(2, x(r.v) - m.l)).attr('height', bh).attr('rx', 3).style('fill', r.c);
    svg.append('text').attr('x', x(r.v) + 6).attr('y', y0 + 22 + bh / 2 + 4).text('about ' + fmt(r.v));
    if (r.u !== undefined) svg.append('text').attr('x', m.l + 8).attr('y', y0 + 22 + bh / 2 + 4).style('fill', 'var(--color-fg)').text('Buildings about ' + r.u + '% full');
  });
});

// ---- Highlight the chapter in view ---------------------------------------
const steps = document.querySelectorAll('#enrollment-dashboard .step');
if (!steps.length || !('IntersectionObserver' in window)) steps.forEach((s) => s.classList.add('is-active'));
else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('is-active', e.isIntersecting);
  }, { rootMargin: '-40% 0px -40% 0px' });
  steps.forEach((s) => io.observe(s));
  window.addEventListener('beforeprint', () => steps.forEach((s) => s.classList.add('is-active')));
}
})();

/*
 * CSS the dashboard used for the step layout (its own tokens; translate to the
 * site's: --space-*, --step-*, --card, --line, @custom-media --md-and-up):
 *
 * .step { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); gap: <xl>;
 *         min-height: 92vh; align-items: start; border-top: 1px solid <line>; padding-top: <lg>; }
 * .step .txt { padding-top: 18vh; padding-bottom: 30vh; opacity: .55; transition: opacity <slow>; }
 * .step.is-active .txt { opacity: 1; }
 * .step .fig { position: sticky; top: 8vh (use --header-size); background: <card>; border; radius; padding; }
 * .step.tall { min-height: 0; } .step.tall .fig { position: static; } .step.tall .txt { padding-block: <lg>; }
 * narrow: .step { grid-template-columns: 1fr; min-height: 0; } .txt { padding: 0; opacity: 1; } .fig { position: static; }
 * print:  same as narrow, plus .step { break-before: page; } .step:first-of-type { break-before: auto; }
 */
