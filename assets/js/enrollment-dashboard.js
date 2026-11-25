/*
 * Enrollment dashboard runtime for /analysis/enrollment/.
 * A small stand-in for the dashboard runtime the charts were first written for:
 * dash.calc() registers derived tables, dash.draw() registers renderers for
 * [data-draw] elements, dash.data() reads a loaded or derived table.
 * Data files live in /assets/data/enrollment/ (path set on #enrollment-dashboard).
 */
window.dash = (function () {
  const FILES = {
    district_trend: 'district_trend.csv',
    district_grades: 'district_grades.csv',
    school_trend: 'school_trend.csv',
    compare_bands: 'compare_bands.csv',
    school_proj: 'school_proj.csv',
    school_proj_yearly: 'school_proj_yearly.csv',
    forecast_check: 'forecast_check_2025_26.csv',
    volatility: 'volatility.csv',
    national: 'national_k8.csv',
    nearby: 'nearby_districts.csv',
    il_districts: 'il_districts_2019_2026.csv',
    area_density: 'area_density.csv',
    area_geometry: 'area_geometry.csv',
    private_k8: 'private_k8.csv',
    eths_feeder: 'eths_feeder.csv',
    births: 'births.csv'
  };
  const store = {}, calcs = {}, draws = {};
  // Okabe–Ito colorblind-safe set, led by the site's brand blue and orange.
  const colors = ['var(--brand)', 'var(--bloom)', '#009E73', '#CC79A7', '#E69F00', '#56B4E9', '#D55E00', '#7F7F7F'];
  function data(id) { return store[id] || { status: 'loading', data: null }; }
  function runCalcs() {
    let progress = true;
    while (progress) {
      progress = false;
      for (const [id, spec] of Object.entries(calcs)) {
        if (store[id]) continue;
        const ins = spec.inputs.map((k) => store[k]);
        if (ins.some((s) => !s)) continue;
        if (ins.some((s) => s.status !== 'ok')) { store[id] = { status: 'error', data: null }; progress = true; continue; }
        try { store[id] = { status: 'ok', data: spec.fn(...ins.map((s) => s.data)) }; }
        catch (e) { console.error('calc ' + id, e); store[id] = { status: 'error', data: null }; }
        progress = true;
      }
    }
  }
  function drawAll() {
    for (const el of document.querySelectorAll('#enrollment-dashboard [data-draw]')) {
      const fn = draws[el.dataset.draw];
      if (!fn) continue;
      try { fn(el); } catch (e) { console.error('draw ' + el.dataset.draw, e); }
    }
  }
  async function start() {
    const root = document.getElementById('enrollment-dashboard');
    const base = root.dataset.dataBase;
    await Promise.all(Object.entries(FILES).map(async ([id, f]) => {
      try {
        const rows = await d3.csv(base + f, (r) => { for (const k in r) if (r[k] === '') r[k] = null; return r; });
        store[id] = { status: 'ok', data: rows };
      } catch (e) { console.error('load ' + f, e); store[id] = { status: 'error', data: null }; }
    }));
    runCalcs();
    drawAll();
    let w = window.innerWidth, t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => { if (Math.abs(window.innerWidth - w) > 40) { w = window.innerWidth; drawAll(); } }, 250);
    });
  }
  return { colors, data, calc: (id, spec) => { calcs[id] = spec; }, draw: (id, fn) => { draws[id] = fn; }, start, redraw: drawAll };
})();

(function () {
(function () {
  const num = (v) => (v === null || v === undefined || v === '' ? null : +v);
  const fmt = d3.format(',');
  const pct1 = (v) => (v === null ? '—' : (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%');
  const pct0 = (v) => (v === null ? '—' : Math.round(v) + '%');
  window.d65 = { num, fmt, pct1, pct0 };
  window.d65.yearsAll = ['2012-13','2013-14','2014-15','2015-16','2016-17','2017-18','2018-19','2019-20','2020-21','2021-22','2022-23','2023-24','2024-25','2025-26','2026-27','2027-28','2028-29','2029-30','2030-31','2031-32'];
  window.d65.tip = function (box) {
    let t = box.querySelector(':scope > .tip');
    if (!t) { t = document.createElement('div'); t.className = 'tip'; t.hidden = true; box.appendChild(t); }
    return {
      show(lines, x, y) {
        t.replaceChildren(...lines.map((l, i) => { const d = document.createElement('div'); d.textContent = l; if (i === 0) d.style.fontWeight = '500'; return d; }));
        t.hidden = false;
        const bw = box.clientWidth, tw = t.offsetWidth;
        t.style.left = Math.max(0, Math.min(x + 12, bw - tw)) + 'px';
        t.style.top = Math.max(0, y - 10) + 'px';
      },
      hide() { t.hidden = true; }
    };
  };
})();

dash.calc('headline', {
  title: 'Change from the 2016-17 peak',
  description: 'How far fall 2026 K-8 enrollment is below the 2016-17 peak, in percent.',
  inputs: ['district_trend'],
  fn: (trend) => {
    const get = (y) => +(trend.find((r) => r.year === y) || {}).actual;
    return Math.round((1 - get('2026-27') / get('2016-17')) * 1000) / 10;
  }
});

function cell(id, y, field) {
  const s = dash.data(id);
  if (s.status !== 'ok') return null;
  const r = s.data.find((d) => d.year === y);
  return r ? d65.num(r[field]) : null;
}
function cellWhere(id, pred, field) {
  const s = dash.data(id);
  if (s.status !== 'ok') return null;
  const r = s.data.find(pred);
  return r ? d65.num(r[field]) : null;
}
const txt = (el, v, f) => { el.textContent = v === null || Number.isNaN(v) ? '—' : f(v); };
dash.draw('hl-actual', (el) => txt(el, cell('district_trend', '2026-27', 'actual'), d65.fmt));
dash.draw('t-peak', (el) => txt(el, cell('district_trend', '2016-17', 'actual'), d65.fmt));
dash.draw('hl-mid', (el) => txt(el, cell('district_trend', '2026-27', 'kofron_mid'), d65.fmt));
dash.draw('t-k', (el) => txt(el, cellWhere('district_grades', (r) => r.grade === 'K' && r.year === '2026-27', 'students'), d65.fmt));
dash.draw('t-8', (el) => txt(el, cellWhere('district_grades', (r) => r.grade === '8' && r.year === '2026-27', 'students'), d65.fmt));
dash.draw('hl-peakpct', (el) => {
  const s = dash.data('headline');
  el.textContent = s.status === 'ok' && s.data !== null ? s.data.toFixed(1) + '%' : '—';
});
dash.draw('lg-actual', (el) => { el.style.borderTopColor = dash.colors[0]; });
dash.draw('lg-mid', (el) => { el.style.borderTopColor = dash.colors[0]; });
dash.draw('lg-band', (el) => { el.style.background = dash.colors[0]; });
dash.draw('lg-mck', (el) => { el.style.borderTopColor = dash.colors[3]; });
dash.draw('lg-t65', (el) => { el.style.borderTopColor = dash.colors[6]; });
dash.draw('lg-t65band', (el) => { el.style.background = dash.colors[6]; });
dash.draw('lg-k', (el) => { el.style.background = dash.colors[0]; });
})();

(function () {
// School small multiples
dash.draw('schools', (el) => {
  const s = dash.data('school_trend');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const years = d65.yearsAll;
  const bySchool = d3.group(s.data, (r) => r.school);
  for (const [school, rs] of bySchool) {
    const rows = years.map((yr) => { const r = rs.find((d) => d.year === yr) || {}; return { year: yr, a: d65.num(r.actual), mid: d65.num(r.kofron_mid), lo: d65.num(r.kofron_low), hi: d65.num(r.kofron_high) }; });
    const card = document.createElement('div'); card.className = 'mult';
    const head = document.createElement('div'); head.className = 't';
    const nm = document.createElement('span'); nm.textContent = school;
    const lastA = rows.filter((r) => r.a !== null).slice(-1)[0];
    const v = document.createElement('span'); v.className = 'v'; v.textContent = lastA ? lastA.year + ': ' + d65.fmt(lastA.a) : '';
    head.append(nm, v); card.append(head); el.append(card);
    const W = card.clientWidth - 12 || 220, H = 130, m = { t: 8, r: 6, b: 18, l: 34 };
    const x = d3.scalePoint(years, [m.l, W - m.r]);
    const ymax = d3.max(rows, (r) => Math.max(r.a || 0, r.hi || 0));
    const y = d3.scaleLinear([0, ymax * 1.05], [H - m.b, m.t]).nice();
    const svg = d3.select(card).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', school + ' enrollment by year, with Kofron forecast where available');
    svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(3)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
    svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues(y.ticks(3).filter((v) => v > 0)).tickSize(0).tickFormat(d3.format(','))).call((g) => g.select('.domain').remove());
    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(['2012-13', '2021-22', '2031-32']).tickFormat((d) => "'" + d.slice(2, 4)).tickSize(0)).call((g) => g.select('.domain').remove());
    svg.append('line').attr('x1', x('2026-27')).attr('x2', x('2026-27')).attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '2 2');
    const band = rows.filter((r) => r.lo !== null);
    if (band.length) {
      svg.append('path').datum(band).attr('d', d3.area().x((r) => x(r.year)).y0((r) => y(r.lo)).y1((r) => y(r.hi))).style('fill', dash.colors[0]).style('opacity', 0.14);
      svg.append('path').datum(rows).attr('d', d3.line().defined((r) => r.mid !== null).x((r) => x(r.year)).y((r) => y(r.mid))).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 1.5).attr('stroke-dasharray', '5 3');
    }
    svg.append('path').datum(rows).attr('d', d3.line().defined((r) => r.a !== null).x((r) => x(r.year)).y((r) => y(r.a))).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2);
    if (lastA) svg.append('circle').attr('cx', x(lastA.year)).attr('cy', y(lastA.a)).attr('r', 3).style('fill', dash.colors[0]);
    const tip = d65.tip(card);
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px] = d3.pointer(ev);
        const r = rows.reduce((a, b) => (Math.abs(x(b.year) - px) < Math.abs(x(a.year) - px) ? b : a));
        const L = [school + ', ' + r.year];
        if (r.a !== null) L.push('Enrolled: ' + d65.fmt(r.a));
        if (r.mid !== null) L.push('Kofron middle: ' + d65.fmt(r.mid) + ' (' + d65.fmt(r.lo) + '–' + d65.fmt(r.hi) + ')');
        if (L.length === 1) L.push('No data');
        tip.show(L, Math.min(x(r.year), W * 0.55) / W * card.clientWidth, 18);
      })
      .on('pointerleave', () => tip.hide());
  }
});
})();

(function () {
// Tables
function tdc(tr, text, cls) { const td = document.createElement('td'); td.textContent = text; if (cls) td.className = cls; tr.append(td); return td; }
dash.draw('check-body', (tb) => {
  const s = dash.data('forecast_check');
  tb.replaceChildren();
  if (s.status !== 'ok') return;
  const rows = s.data.slice().sort((a, b) => +a.vs_mid_pct - +b.vs_mid_pct);
  for (const r of rows) {
    const tr = document.createElement('tr');
    const g = +r.vs_mid_pct;
    tdc(tr, r.school);
    tdc(tr, d65.fmt(+r.actual_2021_22)); tdc(tr, d65.fmt(+r.kofron_low)); tdc(tr, d65.fmt(+r.kofron_mid)); tdc(tr, d65.fmt(+r.kofron_high)); tdc(tr, d65.fmt(+r.actual_2025_26));
    tdc(tr, d65.pct1(g), g <= -10 ? 'neg' : g >= 10 ? 'pos' : '');
    tdc(tr, r.within);
    tb.append(tr);
  }
});
window.d65.volSort = window.d65.volSort || { col: 5, dir: 1 };
const VOL_KEYS = ['school', 'avg_2012_2020', 'y2025_26', 'change_vs_avg_pct', 'avg_yearly_change_pct', 'volatility_sd_pct', 'worst_year_pct', 'worst_year', 'years_declined', 'y2026_27', 'boundary_change_2026_27'];
dash.draw('vol-body', (tb) => {
  const s = dash.data('volatility');
  tb.replaceChildren();
  if (s.status !== 'ok') return;
  const st = d65.volSort, key = VOL_KEYS[st.col], text = key === 'school' || key === 'worst_year';
  const val = (r) => (r[key] === null || r[key] === undefined || r[key] === '' ? null : text ? String(r[key]) : +r[key]);
  const rows = s.data.slice().sort((a, b) => {
    const x = val(a), y = val(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    return (text ? x.localeCompare(y) : x - y) * st.dir;
  });
  for (const r of rows) {
    const tr = document.createElement('tr');
    tdc(tr, r.school);
    tdc(tr, d65.fmt(+r.avg_2012_2020)); tdc(tr, d65.fmt(+r.y2025_26));
    const c = +r.change_vs_avg_pct; tdc(tr, d65.pct1(c), c <= -25 ? 'neg' : '');
    tdc(tr, d65.pct1(+r.avg_yearly_change_pct));
    tdc(tr, (+r.volatility_sd_pct).toFixed(1) + '%');
    tdc(tr, d65.pct1(+r.worst_year_pct)); tdc(tr, r.worst_year); tdc(tr, r.years_declined);
    tdc(tr, r.y2026_27 === null || r.y2026_27 === '' ? 'closed' : d65.fmt(+r.y2026_27));
    tdc(tr, r.boundary_change_2026_27 === null || r.boundary_change_2026_27 === '' ? '' : d65.pct1(+r.boundary_change_2026_27));
    tb.append(tr);
  }
});
(function () {
  const rerun = () => { if (dash.redraw) dash.redraw(); else dash.draw('vol-body'); };
  document.querySelectorAll('tbody[data-draw="vol-body"]').forEach((tb) => {
    const table = tb.closest('table');
    if (!table) return;
    const ths = table.querySelectorAll('thead th');
    const mark = () => ths.forEach((th, i) => th.setAttribute('aria-sort', i === d65.volSort.col ? (d65.volSort.dir === 1 ? 'ascending' : 'descending') : 'none'));
    ths.forEach((th, i) => {
      th.style.cursor = 'pointer';
      th.tabIndex = 0;
      const go = () => {
        const st = d65.volSort;
        if (st.col === i) st.dir = -st.dir; else { st.col = i; st.dir = 1; }
        mark(); rerun();
      };
      th.addEventListener('click', go);
      th.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
    mark();
  });
})();

})();

(function () {
// National comparison
const NAT_BASE = '2019-20';
dash.calc('national_compare', {
  inputs: ['district_grades', 'national'],
  fn: (grades, national) => {
    const m = {};
    for (const r of grades) { (m[r.year] = m[r.year] || {})[r.grade] = +r.students; }
    const k8 = (y) => (m[y] ? ['K', '1', '2', '3', '4', '5', '6', '7', '8'].reduce((s, g) => s + m[y][g], 0) : null);
    const n = {}; for (const r of national) n[r.year] = r;
    const num = (v) => (v === null || v === undefined || v === '' ? null : +v);
    const d0 = k8(NAT_BASE), u0 = num(n[NAT_BASE].us_k8), c0 = num(n[NAT_BASE].cps_k8);
    const idx = (v, b) => (v === null ? null : Math.round(v / b * 1000) / 10);
    return national.map((r) => {
      const y = r.year, d = k8(y);
      return { year: y, d65_k8: d, d65_k8_idx: idx(d, d0), us_k8: num(r.us_k8), us_k8_idx: idx(num(r.us_k8), u0), cps_k8: num(r.cps_k8), cps_k8_idx: idx(num(r.cps_k8), c0) };
    });
  }
});
dash.calc('national_summary', {
  inputs: ['national_compare'],
  fn: (rows) => {
    const r = rows.find((d) => d.year === '2024-25');
    const c = (v) => Math.round((v - 100) * 10) / 10;
    return [{ d65_k8_chg: c(r.d65_k8_idx), us_k8_chg: c(r.us_k8_idx), cps_k8_chg: c(r.cps_k8_idx) }];
  }
});
function natRow() { const s = dash.data('national_summary'); return s.status === 'ok' && s.data && s.data[0] ? s.data[0] : null; }
dash.draw('nt-us', (el) => { const r = natRow(); el.textContent = r ? Math.abs(r.us_k8_chg).toFixed(1) + '%' : '—'; });
dash.draw('nt-d65', (el) => { const r = natRow(); el.textContent = r ? Math.abs(r.d65_k8_chg).toFixed(1) + '%' : '—'; });
dash.draw('lg-nd', (el) => { el.style.borderTopColor = dash.colors[0]; });
dash.draw('lg-nu', (el) => { el.style.borderTopColor = dash.colors[1]; });
dash.draw('lg-nc', (el) => { el.style.borderTopColor = dash.colors[2]; });
dash.draw('nt-cps', (el) => { const r = natRow(); el.textContent = r ? Math.abs(r.cps_k8_chg).toFixed(1) + '%' : '—'; });
dash.draw('nat-k8', (el) => {
  const s = dash.data('national_compare');
  if (s.status !== 'ok' || !s.data) { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const series = [{ f: 'd65_k8_idx', raw: 'd65_k8', c: dash.colors[0], name: 'District 65' }, { f: 'us_k8_idx', raw: 'us_k8', c: dash.colors[1], name: 'U.S. public' },
    { f: 'cps_k8_idx', raw: 'cps_k8', c: dash.colors[2], name: 'Chicago Public Schools' }];
  // Actual counts only: stop at the last year any series has a value.
  const rows = s.data.filter((r) => series.some((sr) => r[sr.f] !== null)), years = rows.map((r) => r.year);
  const vals = rows.flatMap((r) => series.map((sr) => r[sr.f])).filter((v) => v !== null);
  const W = el.clientWidth || 320, H = 300, m = { t: 16, r: 44, b: 26, l: 38 };
  const x = d3.scalePoint(years, [m.l, W - m.r]);
  const y = d3.scaleLinear([Math.min(60, d3.min(vals) - 3), Math.max(110, d3.max(vals) + 3)], [H - m.b, m.t]).nice();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'K-8 enrollment for District 65, U.S. public schools and Chicago Public Schools, indexed to fall 2019 = 100');
  svg.append('rect').attr('x', x('2020-21') - 4).attr('width', x('2021-22') - x('2020-21') + 8).attr('y', m.t).attr('height', H - m.t - m.b).style('fill', 'var(--cds-chart-muted)').style('opacity', 0.25);
  svg.append('text').attr('x', x('2020-21') - 2).attr('y', m.t + 10).text('COVID');
  svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(100)).attr('y2', y(100)).style('stroke', 'var(--cds-chart-reference)');
  const every = Math.max(1, Math.ceil(years.length / Math.max(2, Math.floor((W - m.l - m.r) / 48))));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(years.filter((_, i) => (years.length - 1 - i) % every === 0)).tickFormat((d) => "'" + d.slice(2, 4)).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5));
  const ends = [];
  for (const sr of series) {
    const line = d3.line().defined((r) => r[sr.f] !== null).x((r) => x(r.year)).y((r) => y(r[sr.f]));
    svg.append('path').datum(rows).attr('d', line).attr('fill', 'none').style('stroke', sr.c).attr('stroke-width', 2.5);
    const last = rows.filter((r) => r[sr.f] !== null).slice(-1)[0];
    if (last) { svg.append('circle').attr('cx', x(last.year)).attr('cy', y(last[sr.f])).attr('r', 3.5).style('fill', sr.c); ends.push({ y: y(last[sr.f]) + 4, x: x(last.year) + 5, t: Math.round(last[sr.f]) }); }
  }
  ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (Math.abs(ends[i].x - ends[i - 1].x) < 1 && ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
  svg.append('g').selectAll('text').data(ends).join('text').attr('x', (e) => e.x).attr('y', (e) => e.y).text((e) => e.t);
  const tip = d65.tip(el);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('pointermove', (ev) => {
      const [px] = d3.pointer(ev);
      const r = rows.reduce((a, b) => (Math.abs(x(b.year) - px) < Math.abs(x(a.year) - px) ? b : a));
      const L = ['Fall ' + r.year.slice(0, 4) + ' (fall 2019 = 100)'];
      for (const sr of series) if (r[sr.f] !== null) L.push(sr.name + ': ' + r[sr.f].toFixed(1) + (r[sr.raw] !== null ? ' (' + d65.fmt(r[sr.raw]) + (sr.raw.startsWith('us') ? ' thousand' : '') + ')' : ''));
      tip.show(L, Math.min(x(r.year), W * 0.4) / W * el.clientWidth, 10);
    })
    .on('pointerleave', () => tip.hide());
});

// Nearby and peer districts comparison
const shortName = (n) => n.replace('Chicago Public Schools District 299', 'Chicago Public Schools').replace('Evanston CCSD 65', 'District 65').replace(/ (CCSD|ESD|SD)/, '');
dash.calc('nearby_summary', {
  inputs: ['nearby'],
  fn: (rows) => {
    const sub = rows.filter((r) => r.group === 'Nearby suburb').map((r) => +r.pct_change).sort((a, b) => a - b);
    const mid = sub.length % 2 ? sub[(sub.length - 1) / 2] : (sub[sub.length / 2 - 1] + sub[sub.length / 2]) / 2;
    const g = (grp) => +rows.find((r) => r.group === grp).pct_change;
    return [{ n_suburbs: sub.length, median_chg: Math.round(mid * 10) / 10, n_grew: sub.filter((v) => v > 0).length, d65_chg: g('District 65'), cps_chg: g('Chicago') }];
  }
});
dash.calc('cook_rank', {
  inputs: ['il_districts'],
  fn: (rows) => {
    const set = rows.filter((r) => r.county === 'Cook' && r.type === 'Elementary District' && +r.enr_2018_19 >= 1500).sort((a, b) => +a.pct_change - +b.pct_change);
    const i = set.findIndex((r) => r.district === 'Evanston CCSD 65');
    const ord = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
    const ahead = set.slice(0, i).map((r) => shortName(r.district) + ' (' + d65.pct1(+r.pct_change) + ')');
    return [{ n: set.length, rank: i + 1, rank_text: ord[i] || (i + 1) + 'th', ahead: ahead.length > 1 ? ahead.slice(0, -1).join(', ') + ' and ' + ahead.slice(-1) : ahead.join('') }];
  }
});
function nbRow(id) { const s = dash.data(id); return s.status === 'ok' && s.data && s.data[0] ? s.data[0] : null; }
const nbPct = (v) => Math.abs(v).toFixed(1) + '%';
dash.draw('nb-n', (el) => { const r = nbRow('nearby_summary'); el.textContent = r ? r.n_suburbs : '—'; });
dash.draw('nb-d65', (el) => { const r = nbRow('nearby_summary'); el.textContent = r ? nbPct(r.d65_chg) : '—'; });
dash.draw('nb-med', (el) => { const r = nbRow('nearby_summary'); el.textContent = r ? d65.pct1(r.median_chg) : '—'; });
dash.draw('nb-grew', (el) => { const r = nbRow('nearby_summary'); el.textContent = r ? r.n_grew : '—'; });
dash.draw('ck-n', (el) => { const r = nbRow('cook_rank'); el.textContent = r ? r.n : '—'; });
dash.draw('ck-rank', (el) => { const r = nbRow('cook_rank'); el.textContent = r ? r.rank_text : '—'; });
dash.draw('ck-ahead', (el) => { const r = nbRow('cook_rank'); el.textContent = r ? r.ahead : '—'; });
dash.draw('lg-nb0', (el) => { el.style.background = dash.colors[0]; });
dash.draw('lg-nb1', (el) => { el.style.background = dash.colors[1]; });
dash.draw('lg-nb2', (el) => { el.style.background = dash.colors[2]; });
dash.draw('nearby-chart', (el) => {
  const s = dash.data('nearby');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const rows = s.data.map((r) => ({ name: shortName(r.district), group: r.group, a: +r.enr_2018_19, b: +r.enr_2025_26, p: +r.pct_change, li: r.low_income_pct_2026, peer: r.district_peer || '' })).sort((a, b) => a.p - b.p);
  const W = el.clientWidth || 600, rowH = 22, m = { t: 8, r: 52, b: 26, l: 150 }, H = m.t + m.b + rows.length * rowH;
  const x = d3.scaleLinear([Math.min(-30, d3.min(rows, (r) => r.p) - 2), Math.max(15, d3.max(rows, (r) => r.p) + 2)], [m.l, W - m.r]).nice();
  const y = d3.scaleBand(rows.map((r) => r.name), [m.t, H - m.b]).padding(0.25);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Bar chart of percent change in enrollment from 2018-19 to 2025-26 for District 65, Chicago Public Schools, nearby suburban districts and District 65 peer districts');
  svg.append('g').attr('class', 'grid').selectAll('line').data(x.ticks(6)).join('line').attr('x1', x).attr('x2', x).attr('y1', m.t).attr('y2', H - m.b);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(6).tickFormat((v) => v + '%').tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickSize(0)).call((g) => g.select('.domain').remove());
  const col = (r) => (r.group === 'District 65' ? dash.colors[0] : r.group === 'Chicago' ? dash.colors[2] : r.peer ? dash.colors[1] : 'var(--cds-chart-muted)');
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', (r) => x(Math.min(0, r.p))).attr('width', (r) => Math.max(1, Math.abs(x(r.p) - x(0)))).attr('y', (r) => y(r.name)).attr('height', y.bandwidth()).attr('rx', 2).style('fill', col);
  svg.append('line').attr('x1', x(0)).attr('x2', x(0)).attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)');
  const lab = rows.filter((r) => r.group !== 'Nearby suburb' || r.peer || r.p <= -15 || r.p >= 7);
  svg.append('g').selectAll('text').data(lab).join('text').attr('x', (r) => (r.p < 0 ? x(r.p) - 4 : x(r.p) + 4)).attr('text-anchor', (r) => (r.p < 0 ? 'end' : 'start')).attr('y', (r) => y(r.name) + y.bandwidth() / 2 + 4).text((r) => d65.pct1(r.p));
  svg.selectAll('.axis text').filter((d) => d === 'District 65').style('font-weight', '600').style('fill', 'var(--color-fg)');
  const tip = d65.tip(el);
  svg.append('g').selectAll('rect').data(rows).join('rect').attr('x', m.l).attr('width', W - m.l - m.r).attr('y', (r) => y(r.name) - 2).attr('height', y.bandwidth() + 4).attr('fill', 'transparent')
    .on('pointermove', (ev, r) => {
      const [px] = d3.pointer(ev);
      tip.show([r.name, '2018-19: ' + d65.fmt(r.a) + ' students', '2025-26: ' + d65.fmt(r.b) + ' students', 'Change: ' + d65.pct1(r.p), 'Low-income, 2025-26: ' + (isNaN(+r.li) || r.li === '' || r.li === null ? 'not reported' : Math.round(+r.li) + '%')].concat(r.peer ? ['Cited as a peer by District 65: ' + (r.peer === 'Both' ? 'Dec. 2025 memo and Sept. 2026 presentation' : r.peer === 'Dec. 2025' ? 'Dec. 2025 memo' : 'Sept. 2026 presentation')] : []), Math.min(px, W * 0.55) / W * el.clientWidth, (y(r.name) + 14) / W * el.clientWidth);
    })
    .on('pointerleave', () => tip.hide());
});
})();

(function () {
// Density map by attendance area
window.d65.dens = window.d65.dens || { metric: 'enrolled_per_sq_mi', level: 'ES' };
function densTd(tr, text) { const td = document.createElement('td'); td.textContent = text; tr.append(td); return td; }
dash.draw('density-body', (tb) => {
  const s = dash.data('area_density');
  tb.replaceChildren();
  if (s.status !== 'ok') return;
  let lvl = null;
  for (const r of s.data) {
    const tr = document.createElement('tr');
    if (lvl !== null && r.level !== lvl) tr.className = 'sep';
    lvl = r.level;
    densTd(tr, r.area + (r.level === 'MS' ? ' (middle school)' : ''));
    densTd(tr, (+r.land_sq_mi).toFixed(2)); densTd(tr, d65.fmt(+r.enrolled_2026_27)); densTd(tr, d65.fmt(+r.enrolled_per_sq_mi));
    densTd(tr, d65.fmt(+r.children_5_14_2020)); densTd(tr, d65.fmt(+r.children_per_sq_mi)); densTd(tr, d65.fmt(+r.population_2020));
    tb.append(tr);
  }
});
dash.calc('density_map_data', {
  title: 'Attendance-area shapes joined to density figures',
  description: 'Each 2026-27 attendance area and school location, with its density figures attached, for drawing the map.',
  inputs: ['area_density', 'area_geometry', 'school_proj'],
  fn: (dens, geom, proj) => {
    const p = {}; for (const r of proj) p[r.school] = r;
    const d2 = dens.map((r) => {
      const q = r.level === 'ES' ? p[r.area] : null;
      if (!q) return Object.assign({}, r, { proj_2031: null, proj_per_sq_mi: null });
      const n = +q.today_mid_2031;
      return Object.assign({}, r, { proj_2031: n, proj_low_2031: +q.today_low_2031, proj_high_2031: +q.today_high_2031, proj_per_sq_mi: Math.round(n / +r.land_sq_mi) });
    });
    const nov6 = geom.filter((r) => r.kind === 'area_nov6').map((r) => {
      const q = p[r.name], L = +r.land_sq_mi, magnet = r.name === 'King Arts';
      const n = q ? +q.nov6_mid_2031 : null;
      return { area: r.name, land_sq_mi: L, nov6_2031: n, nov6_low_2031: q ? +q.nov6_low_2031 : null, nov6_high_2031: q ? +q.nov6_high_2031 : null,
        nov6_per_sq_mi: magnet || n === null ? null : Math.round(n / L), magnet };
    });
    return { dens: d2, geom, nov6 };
  }
});
function densMap(el) {
  const c = dash.data('density_map_data');
  if (c.status !== 'ok' || !c.data) { el.textContent = c.status === 'error' ? 'Failed to load' : '—'; return; }
  const s = { data: c.data.dens }, g = { data: c.data.geom };
  el.replaceChildren();
  const st = d65.dens;
  const METRICS = { enrolled_per_sq_mi: 'Enrolled students per sq. mi. (fall 2026)', proj_per_sq_mi: 'Projected per sq. mi., fall 2031 (today\'s boundaries)', nov6_per_sq_mi: 'Projected per sq. mi., fall 2031 (Nov. 6 proposal)', children_per_sq_mi: 'Resident children ages 5-14 per sq. mi. (2020 census)' };
  const LEVELS = { ES: 'Elementary areas', MS: 'Middle school areas' };
  const isN6 = st.metric === 'nov6_per_sq_mi';
  if (st.metric === 'proj_per_sq_mi' || isN6) st.level = 'ES';
  const n6 = {}; for (const r of (c.data.nov6 || [])) n6[r.area] = r;
  const bar = document.createElement('div'); bar.className = 'legend'; bar.style.gap = '6px'; bar.style.marginBottom = '6px';
  const mk = (label, on, fn) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', String(on));
    b.style.cssText = 'cursor:pointer;font:inherit;padding:4px 10px;border-radius:999px;border:1px solid var(--color-border-line);background:' + (on ? 'var(--color-fg)' : 'transparent') + ';color:' + (on ? 'var(--color-panel)' : 'var(--color-fg)');
    b.addEventListener('click', fn); return b; };
  for (const [k, l] of Object.entries(METRICS)) bar.append(mk(l, st.metric === k, () => { st.metric = k; densMap(el); }));
  const sp = document.createElement('span'); sp.style.width = '12px'; bar.append(sp);
  for (const [k, l] of Object.entries(LEVELS)) {
    const b = mk(l, st.level === k, () => { st.level = k; densMap(el); });
    if (k === 'MS' && (st.metric === 'proj_per_sq_mi' || isN6)) { b.disabled = true; b.style.opacity = '0.4'; b.style.cursor = 'not-allowed'; b.title = 'Projections are for elementary schools only'; }
    bar.append(b);
  }
  el.append(bar);
  const vals = {}; for (const r of s.data) vals[r.area] = r;
  const areas = g.data.filter((r) => (isN6 ? r.kind === 'area_nov6' : r.kind === 'area' && r.level === st.level)).map((r) => ({ type: 'Feature', properties: { name: r.name, d: isN6 ? n6[r.name] : vals[r.name] }, geometry: JSON.parse(r.geometry) }));
  const schools = g.data.filter((r) => r.kind === 'school' && (st.level === 'MS' ? r.level === 'MS' : r.level !== 'MS')).filter((r) => !(isN6 && (r.name === 'Dewey' || r.name === 'Lincolnwood'))).map((r) => ({ name: r.name, c: JSON.parse(r.geometry).coordinates }));
  const all = isN6 ? Object.values(n6).map((r) => r.nov6_per_sq_mi).filter((v) => v !== null) : s.data.map((r) => +r[st.metric]).filter((v) => !isNaN(v));
  const lv = areas.map((f) => +f.properties.d[st.metric]);
  const color = d3.scaleSequential([0, d3.max(all) * 1.05], d3.interpolateBlues);
  const box = document.createElement('div'); box.className = 'chart'; box.style.minHeight = '560px'; el.append(box);
  const W = box.clientWidth || 700, H = Math.max(520, Math.min(680, W * 1.1)), LG = 46;
  const fc = { type: 'FeatureCollection', features: areas };
  const proj = d3.geoMercator().fitExtent([[10, 10], [W - 10, H - LG - 10]], fc);
  const path = d3.geoPath(proj);
  const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Map of District 65 ' + LEVELS[st.level].toLowerCase() + ' shaded by ' + METRICS[st.metric]);
  const tip = d65.tip(box);
  svg.append('g').selectAll('path').data(areas).join('path').attr('d', path)
    .attr('fill', (f) => { const v = f.properties.d ? f.properties.d[st.metric] : null; return v === null || v === undefined || isNaN(+v) ? 'var(--cds-chart-muted)' : color(+v); }).style('stroke', 'var(--color-panel)').attr('stroke-width', 2).attr('stroke-linejoin', 'round')
    .on('pointermove', function (ev, f) {
      d3.select(this).style('stroke', 'var(--color-fg)').raise();
      const d = f.properties.d, [px, py] = d3.pointer(ev, box);
      if (isN6) {
        const L = [f.properties.name + ' (Nov. 6 proposed area)', 'Land area: ' + d.land_sq_mi.toFixed(2) + ' sq. mi.'];
        if (d.magnet) L.push('Projected fall 2031: about ' + d65.fmt(d.nov6_2031) + ' K-5 students', 'Most King Arts students come from across the district (magnet), so density is not shown');
        else L.push('Projected fall 2031: about ' + d65.fmt(d.nov6_2031) + ' (' + d65.fmt(d.nov6_low_2031) + '–' + d65.fmt(d.nov6_high_2031) + ')', d65.fmt(d.nov6_per_sq_mi) + ' per sq. mi.');
        tip.show(L, Math.min(px, box.clientWidth * 0.55), py + 12);
        return;
      }
      tip.show([f.properties.name + (st.level === 'MS' ? ' middle school area' : ' attendance area'), 'Land area: ' + (+d.land_sq_mi).toFixed(2) + ' sq. mi.',
        'Enrolled fall 2026: ' + d65.fmt(+d.enrolled_2026_27) + ' (' + d65.fmt(+d.enrolled_per_sq_mi) + ' per sq. mi.)'].concat(d.proj_2031 ? ['Projected fall 2031: about ' + d65.fmt(d.proj_2031) + ' (' + d65.fmt(d.proj_low_2031) + '–' + d65.fmt(d.proj_high_2031) + '), ' + d65.fmt(d.proj_per_sq_mi) + ' per sq. mi.'] : []).concat([
        'Children 5-14, 2020: ' + d65.fmt(+d.children_5_14_2020) + ' (' + d65.fmt(+d.children_per_sq_mi) + ' per sq. mi.)',
        'All residents, 2020: ' + d65.fmt(+d.population_2020)]), Math.min(px, box.clientWidth * 0.55), py + 12);
    })
    .on('pointerleave', function () { d3.select(this).style('stroke', 'var(--color-panel)'); tip.hide(); });
  svg.append('g').selectAll('circle').data(schools).join('circle').attr('cx', (d) => proj(d.c)[0]).attr('cy', (d) => proj(d.c)[1]).attr('r', 3.5)
    .style('fill', 'var(--color-fg)').style('stroke', 'var(--color-panel)').attr('stroke-width', 1.5).style('pointer-events', 'none');
  const lab = svg.append('g').style('pointer-events', 'none');
  for (const f of areas) {
    const raw = f.properties.d ? f.properties.d[st.metric] : null, [cx, cy] = path.centroid(f), v = raw === null || raw === undefined ? NaN : +raw, dark = !isNaN(v) && d3.hsl(color(v)).l < 0.5;
    const t = lab.append('text').attr('x', cx).attr('y', cy).attr('text-anchor', 'middle').style('fill', dark ? '#fff' : '#0b0b0b');
    t.append('tspan').attr('x', cx).attr('dy', '-0.2em').style('font-weight', '600').style('font-size', '12px').style('fill', dark ? '#fff' : '#0b0b0b').text(f.properties.name);
    t.append('tspan').attr('x', cx).attr('dy', '1.25em').style('font-size', '11px').style('fill', dark ? '#fff' : '#0b0b0b').text(isNaN(v) ? 'magnet' : d65.fmt(v));
  }
  // legend
  const lw = Math.min(260, W - 40), lx = 10, ly = H - LG + 6;
  const defs = svg.append('defs'), gid = 'densgrad';
  const gr = defs.append('linearGradient').attr('id', gid);
  d3.range(0, 1.01, 0.1).forEach((t) => gr.append('stop').attr('offset', t).attr('stop-color', color(t * color.domain()[1])));
  svg.append('rect').attr('x', lx).attr('y', ly).attr('width', lw).attr('height', 10).attr('rx', 2).attr('fill', `url(#${gid})`);
  const ls = d3.scaleLinear(color.domain(), [lx, lx + lw]);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${ly + 10})`).call(d3.axisBottom(ls).ticks(4).tickFormat(d3.format(',')).tickSizeOuter(0)).call((a) => a.select('.domain').remove());
  svg.append('text').attr('x', lx + lw + 10).attr('y', ly + 9).text(METRICS[st.metric].replace(/ \(.*\)/, ''));
  svg.append('circle').attr('cx', lx + lw + 16).attr('cy', ly + 26).attr('r', 3.5).style('fill', 'var(--color-fg)');
  svg.append('text').attr('x', lx + lw + 24).attr('y', ly + 30).text('School building');
}
dash.draw('density-map', densMap);
})();

(function () {
// Elementary school projections, today's boundaries vs Nov. 6
dash.draw('schoolproj-body', (tb) => {
  const s = dash.data('school_proj');
  tb.replaceChildren();
  if (s.status !== 'ok') return;
  const td = (tr, t, cls) => { const c = document.createElement('td'); c.textContent = t; if (cls) c.className = cls; tr.append(c); return c; };
  const f = (v) => (v === null || v === undefined || v === '' ? '—' : d65.fmt(+v));
  const closed = (v) => (+v === 0 ? 'closes' : d65.fmt(+v));
  for (const r of s.data) {
    const tr = document.createElement('tr');
    if (r.school === 'Total K-5') tr.className = 'sep';
    td(tr, r.school); td(tr, f(r.actual_2026));
    td(tr, f(r.today_mid_2027)); td(tr, f(r.today_mid_2029)); td(tr, f(r.today_mid_2031)); td(tr, f(r.today_low_2031) + '–' + f(r.today_high_2031));
    const isClosed = +r.nov6_mid_2027 === 0 && r.school !== 'Total K-5';
    td(tr, isClosed ? 'closes' : f(r.nov6_mid_2027)); td(tr, isClosed ? '' : f(r.district_fy28_nov6));
    td(tr, isClosed ? '' : f(r.nov6_mid_2029)); td(tr, isClosed ? '' : f(r.nov6_mid_2031)); td(tr, isClosed ? '' : f(r.nov6_low_2031) + '–' + f(r.nov6_high_2031));
    tb.append(tr);
  }
});
dash.draw('schoolproj', (el) => {
  const s = dash.data('school_proj_yearly'), t = dash.data('school_proj');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const fy28 = {};
  if (t.status === 'ok') for (const r of t.data) if (r.district_fy28_nov6 !== null && r.district_fy28_nov6 !== '' && +r.district_fy28_nov6 > 0) fy28[r.school] = +r.district_fy28_nov6;
  const legend = document.createElement('div'); legend.className = 'legend';
  const add = (style, text, box) => { const sp = document.createElement('span'); const sw = document.createElement('span'); sw.className = box ? 'box' : 'sw'; Object.assign(sw.style, style); sp.append(sw, document.createTextNode(text)); legend.append(sp); };
  add({ borderTopColor: dash.colors[0] }, "Today's boundaries");
  add({ borderTopColor: dash.colors[1] }, 'Nov. 6 proposal');
  add({ background: 'var(--cds-chart-muted)' }, 'Low to high range', true);
  const dm = document.createElement('span'); const dmi = document.createElement('b'); dmi.textContent = '◆ '; dmi.style.color = dash.colors[1]; dm.append(dmi, document.createTextNode("District's own fall 2027 projection")); legend.append(dm);
  el.append(legend);
  const grid = document.createElement('div'); grid.className = 'multiples'; grid.style.minHeight = '0'; el.append(grid);
  const schools = [...new Set(s.data.map((r) => r.school))];
  const years = [...new Set(s.data.map((r) => r.year))];
  const ymax = d3.max(s.data, (r) => +r.high) * 1.05;
  const cards = schools.map((sc) => {
    const card = document.createElement('div'); card.className = 'mult';
    const head = document.createElement('div'); head.className = 't';
    const nm = document.createElement('span'); nm.textContent = sc;
    const v = document.createElement('span'); v.className = 'v';
    const now = s.data.find((r) => r.school === sc && r.year === years[0]);
    v.textContent = 'fall 2026: ' + d65.fmt(+now.mid);
    head.append(nm, v); card.append(head); grid.append(card);
    return [sc, card];
  });
  for (const [sc, card] of cards) {
    const W = card.clientWidth - 12 || 220, H = 140, m = { t: 8, r: 8, b: 18, l: 34 };
    const x = d3.scalePoint(years, [m.l, W - m.r]);
    const y = d3.scaleLinear([0, ymax], [H - m.b, m.t]).nice();
    const svg = d3.select(card).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', sc + ' projected K-5 enrollment, 2026-27 to 2031-32, under today\'s boundaries and the November 6 proposal');
    svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(3)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
    svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues(y.ticks(3).filter((t) => t > 0)).tickSize(0)).call((g) => g.select('.domain').remove());
    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues([years[0], years[years.length - 1]]).tickFormat((d) => "'" + d.slice(2, 4)).tickSize(0)).call((g) => g.select('.domain').remove());
    const series = [["Today's boundaries", dash.colors[0]], ['Nov. 6 proposal', dash.colors[1]]];
    const data = {};
    for (const [b, c] of series) {
      const rs = years.map((yr) => s.data.find((r) => r.school === sc && r.boundaries === b && r.year === yr)).map((r) => ({ year: r.year, low: +r.low, mid: +r.mid, high: +r.high }));
      data[b] = rs;
      if (d3.max(rs, (r) => r.mid) === 0) continue;
      const live = rs.filter((r) => r.mid > 0);
      svg.append('path').datum(live).attr('d', d3.area().x((r) => x(r.year)).y0((r) => y(r.low)).y1((r) => y(r.high))).style('fill', c).style('opacity', 0.12);
      svg.append('path').datum(live).attr('d', d3.line().x((r) => x(r.year)).y((r) => y(r.mid))).attr('fill', 'none').style('stroke', c).attr('stroke-width', 2);
    }
    if (d3.max(data['Nov. 6 proposal'], (r) => r.mid) === 0) {
      svg.append('text').attr('x', x(years[1])).attr('y', m.t + 12).text('closes under Nov. 6 proposal').style('fill', dash.colors[1]);
    }
    if (fy28[sc]) {
      const cx = x(years[1]), cy = y(fy28[sc]), d = 4.5;
      svg.append('path').attr('d', `M${cx},${cy - d}L${cx + d},${cy}L${cx},${cy + d}L${cx - d},${cy}Z`).style('fill', dash.colors[1]).style('stroke', 'var(--color-panel)').attr('stroke-width', 1.5);
    }
    const tip = d65.tip(card);
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px] = d3.pointer(ev);
        const yr = years.reduce((a, b) => (Math.abs(x(b) - px) < Math.abs(x(a) - px) ? b : a));
        const L = [sc + ', fall ' + yr.slice(0, 4)];
        for (const [b] of series) { const r = data[b].find((d) => d.year === yr); L.push(b + ': ' + (r.mid === 0 ? 'closed' : d65.fmt(r.mid) + (yr === years[0] ? '' : ' (' + d65.fmt(r.low) + '–' + d65.fmt(r.high) + ')'))); }
        if (yr === years[1] && fy28[sc]) L.push("District's own projection: " + d65.fmt(fy28[sc]));
        tip.show(L, Math.min(x(yr), W * 0.4) / W * card.clientWidth, 18);
      })
      .on('pointerleave', () => tip.hide());
  }
});
})();

(function () {
// Kofron vs Thrive65 rerun, K-5 and 6-8
window.d65.cmpBirths = window.d65.cmpBirths || 'data';
dash.calc('cmp_accuracy', {
  title: 'How close each forecast came, middle series',
  description: 'Average and latest-year percentage miss of the middle series against official counts (Kofron 2022-23 to 2026-27; Thrive65 rerun 2021-22 to 2026-27), and each forecast\'s 2031-32 value.',
  inputs: ['compare_bands'],
  fn: (rows) => {
    const n = (v) => (v === null || v === undefined || v === '' ? null : +v);
    const yr = (r) => +r.year.slice(0, 4);
    const calc = (pre, from, k5f, mf) => {
      const sel = rows.filter((r) => yr(r) >= from && yr(r) <= 2026);
      const e = (f, a) => sel.map((r) => (n(r[f]) - n(r[a])) / n(r[a]) * 100);
      const ek = e(k5f, 'band_k5_actual'), em = e(mf, 'band_68_actual');
      const avg = (a) => Math.round(a.reduce((s, v) => s + Math.abs(v), 0) / a.length * 10) / 10;
      const r31 = rows.find((r) => yr(r) === 2031);
      return { forecast: pre, years: from + '-' + String(from + 1).slice(2) + ' to 2026-27', k5_avg_err: avg(ek), k5_2026_err: Math.round(ek[ek.length - 1] * 10) / 10, m_avg_err: avg(em), m_2026_err: Math.round(em[em.length - 1] * 10) / 10, k5_2031: n(r31[k5f]), m_2031: n(r31[mf]) };
    };
    return [calc('Kofron (2022), from fall 2021', 2022, 'kof_mid_k5', 'kof_mid_68'),
            calc('McKibben (2024), from fall 2024', 2025, 'mck_k5', 'mck_68')];
  }
});
dash.draw('cmp-body', (tb) => {
  const s = dash.data('cmp_accuracy');
  tb.replaceChildren();
  if (s.status !== 'ok' || !s.data) return;
  const sg = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1) + '%';
  for (const r of s.data) {
    const tr = document.createElement('tr');
    for (const v of [r.forecast, r.years, r.k5_avg_err.toFixed(1) + '%', sg(r.k5_2026_err), r.m_avg_err.toFixed(1) + '%', sg(r.m_2026_err), d65.fmt(r.k5_2031), d65.fmt(r.m_2031)]) {
      const td = document.createElement('td'); td.textContent = v; tr.append(td);
    }
    tb.append(tr);
  }
});
function cmpDraw(el) {
  const s = dash.data('compare_bands');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const n = d65.num;
  const rows = s.data.filter((r) => r.year >= '2016-17');
  const legend = document.createElement('div'); legend.className = 'legend';
  const item = (style, text, box) => { const sp = document.createElement('span'); const sw = document.createElement('span'); sw.className = box ? 'box' : 'sw'; Object.assign(sw.style, style); sp.append(sw, document.createTextNode(text)); legend.append(sp); };
  item({ borderTopColor: 'var(--color-fg)', borderTopWidth: '2.5px' }, 'Actual (official count)');
  item({ borderTopColor: dash.colors[0], borderTopStyle: 'dashed' }, 'Kofron middle');
  item({ background: dash.colors[0] }, 'Kofron low to high', true);
  item({ borderTopColor: dash.colors[6], borderTopStyle: 'dashed' }, 'Thrive65 update from fall 2026, middle');
  item({ background: dash.colors[6] }, 'Thrive65 update, low to high', true);
  item({ borderTopColor: dash.colors[3], borderTopStyle: 'dashed' }, 'McKibben forecast (2024)');
  el.append(legend);
  const grid = document.createElement('div'); grid.className = 'nat-grid'; el.append(grid);
  const panels = [['k5', 'Grades K-5'], ['68', 'Grades 6-8']].map(([band, title]) => {
    const w = document.createElement('div'); const t = document.createElement('div'); t.className = 'nat-t'; t.textContent = title; w.append(t);
    const box = document.createElement('div'); box.className = 'chart'; box.style.minHeight = '300px'; w.append(box); grid.append(w); return [band, title, box];
  });
  for (const [band, title, box] of panels) {
    const get = (r, k) => n(r[k]);
    const series = {
      kof: (s2) => (r) => get(r, `kof_${s2}_${band}`),
      t65: (s2) => (r) => get(r, `t65_${s2}_${band}`)
    };
    const vals = rows.flatMap((r) => [get(r, `band_${band}_actual`), series.kof('high')(r), series.kof('low')(r), series.t65('high')(r), series.t65('low')(r), get(r, `mck_${band}`)]).filter((v) => v !== null);
    const W = box.clientWidth || 360, H = 300, m = { t: 12, r: 44, b: 26, l: 46 };
    const years = rows.map((r) => r.year);
    const x = d3.scalePoint(years, [m.l, W - m.r]);
    const y = d3.scaleLinear([d3.min(vals) * 0.92, d3.max(vals) * 1.03], [H - m.b, m.t]).nice();
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', title + ' enrollment: actual, the Kofron and McKibben forecasts, and the Thrive65 update from fall 2026');
    svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
    const tv = years.filter((yr) => ['2016-17', '2020-21', '2026-27', '2031-32', '2034-35'].includes(yr));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(W < 380 ? tv.filter((_, i) => i % 2 === 0) : tv).tickFormat((d) => "'" + d.slice(2, 4)).tickSizeOuter(0));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(',')));
    svg.append('line').attr('x1', x('2026-27')).attr('x2', x('2026-27')).attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '2 2');
    svg.append('text').attr('x', x('2026-27') + 4).attr('y', m.t + 10).text('this fall');
    for (const [key, c] of [['kof', dash.colors[0]], ['t65', dash.colors[6]]]) {
      const pr = rows.filter((r) => series[key]('mid')(r) !== null);
      svg.append('path').datum(pr).attr('d', d3.area().x((r) => x(r.year)).y0((r) => y(series[key]('low')(r))).y1((r) => y(series[key]('high')(r)))).style('fill', c).style('opacity', 0.13);
      svg.append('path').datum(pr).attr('d', d3.line().x((r) => x(r.year)).y((r) => y(series[key]('mid')(r)))).attr('fill', 'none').style('stroke', c).attr('stroke-width', 2).attr('stroke-dasharray', '6 4');
    }
    const mck = rows.filter((r) => get(r, `mck_${band}`) !== null);
    svg.append('path').datum(mck).attr('d', d3.line().x((r) => x(r.year)).y((r) => y(get(r, `mck_${band}`)))).attr('fill', 'none').style('stroke', dash.colors[3]).attr('stroke-width', 2).attr('stroke-dasharray', '8 3 2 3');
    const act = rows.filter((r) => get(r, `band_${band}_actual`) !== null);
    svg.append('path').datum(act).attr('d', d3.line().x((r) => x(r.year)).y((r) => y(get(r, `band_${band}_actual`)))).attr('fill', 'none').style('stroke', 'var(--color-fg)').attr('stroke-width', 2.5).attr('stroke-linejoin', 'round');
    const la = act[act.length - 1];
    svg.append('circle').attr('cx', x(la.year)).attr('cy', y(get(la, `band_${band}_actual`))).attr('r', 3.5).style('fill', 'var(--color-fg)');
    const tip = d65.tip(box);
    const hover = svg.append('line').attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').attr('opacity', 0).style('pointer-events', 'none');
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px] = d3.pointer(ev);
        const r = rows.reduce((a, b) => (Math.abs(x(b.year) - px) < Math.abs(x(a.year) - px) ? b : a));
        hover.attr('x1', x(r.year)).attr('x2', x(r.year)).attr('opacity', 1);
        const L = [title + ', ' + r.year];
        const a = get(r, `band_${band}_actual`); if (a !== null) L.push('Actual: ' + d65.fmt(a));
        if (series.kof('mid')(r) !== null) L.push('Kofron: ' + d65.fmt(series.kof('mid')(r)) + ' (' + d65.fmt(series.kof('low')(r)) + '–' + d65.fmt(series.kof('high')(r)) + ')');
        if (series.t65('mid')(r) !== null) L.push('Thrive65 update: ' + d65.fmt(series.t65('mid')(r)) + ' (' + d65.fmt(series.t65('low')(r)) + '–' + d65.fmt(series.t65('high')(r)) + ')');
        if (get(r, `mck_${band}`) !== null) L.push('McKibben (2024): ' + d65.fmt(get(r, `mck_${band}`)));
        tip.show(L, Math.min(x(r.year), W * 0.45) / W * box.clientWidth, 10);
      })
      .on('pointerleave', () => { hover.attr('opacity', 0); tip.hide(); });
  }
}
dash.draw('cmp', cmpDraw);
})();

(function () {
// Story sections: headline drop, private schools, ETHS feeders, births
// Shares d65.classesNow() with the c-classes chart so the two can't disagree.
dash.draw('cv-sincek', (el) => {
  const rows = d65.classesNow();
  if (!rows) { el.textContent = '—'; return; }
  const v = rows.reduce((t, r) => t + r.atK - r.now, 0);
  el.textContent = d65.fmt(Math.round(v / 10) * 10);
});
dash.draw('s-drop', (el) => {
  const s = dash.data('district_trend');
  if (s.status !== 'ok') { el.textContent = '—'; return; }
  const get = (y) => +(s.data.find((r) => r.year === y) || {}).actual;
  const v = get('2016-17') - get('2026-27');
  el.textContent = isNaN(v) ? '—' : 'about ' + d65.fmt(Math.round(v / 10) * 10);
});
dash.draw('pv-last', (el) => {
  const s = dash.data('private_k8');
  if (s.status !== 'ok') { el.textContent = '—'; return; }
  const r = s.data[s.data.length - 1];
  el.textContent = d65.fmt(Math.round(+r.private_k8 / 10) * 10);
});
dash.draw('lg-pv0', (el) => { el.style.borderTopColor = dash.colors[0]; });
dash.draw('lg-pv1', (el) => { el.style.borderTopColor = dash.colors[1]; });
dash.draw('private-chart', (el) => {
  const s = dash.data('private_k8');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const rows = s.data.map((r) => ({ year: r.year, d: +r.d65_k8, p: +r.private_k8, gap: +r.private_incomplete === 1 }));
  const W = el.clientWidth || 600, H = 300, m = { t: 14, r: 175, b: 28, l: 48 };
  const x = d3.scalePoint(rows.map((r) => r.year), [m.l, W - m.r]);
  const y = d3.scaleLinear([0, 8000], [H - m.b, m.t]);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'District 65 and private school K-8 enrollment inside the district boundary, 2015-16 to 2025-26');
  svg.append('g').attr('class', 'grid').selectAll('line').data([0, 2000, 4000, 6000, 8000]).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues([0, 2000, 4000, 6000, 8000]).tickFormat(d3.format(',')));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(rows.map((r) => r.year).filter((_, i) => i % 2 === 0)).tickSizeOuter(0));
  const line = (f, def) => d3.line().defined(def || (() => true)).x((r) => x(r.year)).y((r) => y(f(r)));
  svg.append('path').datum(rows).attr('d', line((r) => r.d)).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2.5);
  const gi = rows.findIndex((r) => r.gap);
  const after = rows.filter((_, i) => gi < 0 || i > gi);
  svg.append('path').datum(after).attr('d', line((r) => r.p)).attr('fill', 'none').style('stroke', dash.colors[1]).attr('stroke-width', 2.5);
  if (gi > 0) {
    svg.append('path').datum([rows[gi - 1], rows[gi + 1]]).attr('d', line((r) => r.p)).attr('fill', 'none').style('stroke', dash.colors[1]).attr('stroke-width', 2).attr('stroke-dasharray', '2 4');
    svg.append('circle').attr('cx', x(rows[gi - 1].year)).attr('cy', y(rows[gi - 1].p)).attr('r', 3.5).style('fill', dash.colors[1]);
    svg.append('circle').attr('cx', x(rows[gi].year)).attr('cy', y(rows[gi].p)).attr('r', 4).style('fill', 'none').style('stroke', dash.colors[1]).attr('stroke-width', 2);
  }
  const f = rows[0], l = rows[rows.length - 1];
  const pct = (a, b) => (b < a ? '−' : '+') + Math.abs(Math.round((b - a) / a * 100)) + '%';
  svg.append('circle').attr('cx', x(l.year)).attr('cy', y(l.d)).attr('r', 4).style('fill', dash.colors[0]);
  svg.append('circle').attr('cx', x(l.year)).attr('cy', y(l.p)).attr('r', 4).style('fill', dash.colors[1]);
  svg.append('text').attr('x', x(l.year) + 10).attr('y', y(l.d) + 4).text('District 65: ' + d65.fmt(l.d) + ' (' + pct(f.d, l.d) + ')');
  svg.append('text').attr('x', x(l.year) + 10).attr('y', y(l.p) + 4).text('Private: ' + d65.fmt(l.p) + ' (' + pct(f.p, l.p) + ')');
  const tip = d65.tip(el);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('pointermove', (ev) => {
      const [px] = d3.pointer(ev);
      const r = rows.reduce((a, b) => (Math.abs(x(b.year) - px) < Math.abs(x(a.year) - px) ? b : a));
      tip.show([r.year, 'District 65 K-8: ' + d65.fmt(r.d), 'Private K-8 in the boundary: about ' + d65.fmt(r.p) + (r.gap ? ' (two schools missing from the state report)' : ''), 'Private share: ' + Math.round(r.p / (r.p + r.d) * 1000) / 10 + '%'], Math.min(x(r.year), W * 0.5) / W * el.clientWidth, 10);
    })
    .on('pointerleave', () => tip.hide());
});
dash.draw('eths-chart', (el) => {
  const s = dash.data('eths_feeder');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const segs = [['from_d65', 'District 65'], ['private_parochial', 'Private or parochial'], ['cps', 'Chicago Public Schools'], ['out_of_state_other_il', 'Out of state or country, other Illinois'], ['homeschool_other', 'Homeschool or other']];
  const legend = document.createElement('div'); legend.className = 'legend';
  const add = (bg, text) => { const sp = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'box'; sw.style.opacity = '1'; sw.style.background = bg; sp.append(sw, document.createTextNode(text)); legend.append(sp); };
  add('var(--cds-chart-muted)', 'District 65 8th grade, the year before');
  const segColor = (i) => dash.colors[i === 4 ? 7 : i] || 'var(--cds-text-secondary)';
  segs.forEach(([, n], i) => add(segColor(i), n));
  const box = document.createElement('div'); box.className = 'chart'; el.append(legend, box);
  const rows = s.data.map((r) => Object.assign({}, r, { g8: +r.d65_8th_prior_year, tot: segs.reduce((a, [k]) => a + +r[k], 0) }));
  const W = box.clientWidth || 600, H = 320, m = { t: 22, r: 10, b: 44, l: 48 };
  const band = (W - m.l - m.r) / rows.length, bw = Math.min(56, band * 0.32);
  const y = d3.scaleLinear([0, 1000], [H - m.b, m.t]);
  const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Where each current ETHS class went to 8th grade, next to District 65 8th grade the year before');
  svg.append('g').attr('class', 'grid').selectAll('line').data([0, 250, 500, 750, 1000]).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues([0, 250, 500, 750, 1000]).tickFormat(d3.format(',')));
  const tip = d65.tip(box);
  rows.forEach((r, i) => {
    const cx = m.l + band * i + band / 2;
    svg.append('rect').attr('x', cx - bw - 2).attr('y', y(r.g8)).attr('width', bw).attr('height', y(0) - y(r.g8)).attr('rx', 2).style('fill', 'var(--cds-chart-muted)');
    svg.append('text').attr('x', cx - bw / 2 - 2).attr('y', y(r.g8) - 5).attr('text-anchor', 'middle').text(d65.fmt(r.g8));
    let run = 0;
    segs.forEach(([k], j) => {
      const v = +r[k], b = run; run += v;
      svg.append('rect').attr('x', cx + 2).attr('y', y(b + v) + 0.5).attr('width', bw).attr('height', Math.max(0, y(b) - y(b + v) - 1)).style('fill', segColor(j));
      if (j < 2) svg.append('text').attr('x', cx + 2 + bw / 2).attr('y', (y(b) + y(b + v)) / 2 + 4).attr('text-anchor', 'middle').style('fill', '#fff').text(v);
    });
    svg.append('text').attr('x', cx + 2 + bw / 2).attr('y', y(r.tot) - 5).attr('text-anchor', 'middle').style('font-weight', '600').style('fill', 'var(--color-fg)').text(d65.fmt(r.tot));
    svg.append('text').attr('x', cx).attr('y', H - m.b + 16).attr('text-anchor', 'middle').style('font-weight', '600').style('fill', 'var(--color-fg)').text(r.grade_now);
    svg.append('text').attr('x', cx).attr('y', H - m.b + 30).attr('text-anchor', 'middle').text(r['class'] + ', entered ' + r.entered_fall);
    svg.append('rect').attr('x', cx - band / 2).attr('y', m.t).attr('width', band).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove', () => tip.show([r['class'] + ' (' + r.grade_now.toLowerCase() + ')', 'District 65 8th grade, fall ' + (+r.entered_fall - 1) + ': ' + d65.fmt(r.g8)].concat(segs.map(([k, n]) => n + ': ' + r[k] + ' (' + Math.round(+r[k] / r.tot * 100) + '%)')).concat(['First-time freshmen: ' + d65.fmt(r.tot)]), Math.min(cx, W * 0.55) / W * box.clientWidth, 20))
      .on('pointerleave', () => tip.hide());
  });
});
dash.draw('births-chart', (el) => {
  const s = dash.data('births');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const n = d65.num;
  const rows = s.data.map((r) => ({ y: +r.k_class, kof: n(r.kofron_births), kx: n(r.kofron_trend), rec: n(r.birth_records), hold: n(r.held_flat), pace: n(r.birth_pace), ks: n(r.birth_kofron_slope) }));
  const legend = document.createElement('div'); legend.className = 'legend';
  const add = (style, text) => { const sp = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'sw'; Object.assign(sw.style, style); sp.append(sw, document.createTextNode(text)); legend.append(sp); };
  add({ borderTopColor: 'var(--color-fg-muted)' }, 'Kofron study data and trend');
  add({ borderTopColor: dash.colors[0] }, 'Cook County birth records');
  add({ borderTopColor: dash.colors[0], borderTopWidth: '8px', opacity: '0.25' }, 'Assumed range after 2023');
  add({ borderTopColor: dash.colors[0], borderTopStyle: 'dotted' }, 'Recent pace');
  const box = document.createElement('div'); box.className = 'chart'; el.append(legend, box);
  const W = box.clientWidth || 600, H = 280, m = { t: 14, r: 40, b: 40, l: 48 };
  const x = d3.scaleLinear([2015, 2031], [m.l, W - m.r]);
  const y = d3.scaleLinear([400, 1100], [H - m.b, m.t]);
  const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Births behind each kindergarten class: Kofron trend vs. Evanston birth records');
  svg.append('g').attr('class', 'grid').selectAll('line').data([400, 600, 800, 1000]).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues([400, 600, 800, 1000]).tickFormat(d3.format(',')));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(d3.range(2015, 2032, 2)).tickFormat((d) => "'" + String(d).slice(2)).tickSizeOuter(0));
  svg.append('text').attr('x', W - m.r).attr('y', H - 6).attr('text-anchor', 'end').text('Kindergarten class (fall)');
  svg.append('line').attr('x1', x(2026)).attr('x2', x(2026)).attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '3 3');
  svg.append('text').attr('x', x(2026) + 4).attr('y', m.t + 10).text('this fall');
  const ln = (k) => d3.line().defined((r) => r[k] !== null).x((r) => x(r.y)).y((r) => y(r[k]));
  svg.append('path').datum(rows).attr('d', ln('kof')).attr('fill', 'none').style('stroke', 'var(--color-fg-muted)').attr('stroke-width', 2.5);
  svg.append('path').datum(rows).attr('d', ln('kx')).attr('fill', 'none').style('stroke', 'var(--color-fg-muted)').attr('stroke-width', 2).attr('stroke-dasharray', '6 4');
  svg.append('path').datum(rows).attr('d', ln('rec')).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2.5);
  const band = rows.filter((r) => r.hold !== null && r.ks !== null);
  svg.append('path').datum(band).attr('d', d3.area().x((r) => x(r.y)).y0((r) => y(r.ks)).y1((r) => y(r.hold))).style('fill', dash.colors[0]).style('opacity', 0.18);
  svg.append('path').datum(rows).attr('d', ln('pace')).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2).attr('stroke-dasharray', '2 3');
  svg.append('g').selectAll('circle').data(rows.filter((r) => r.rec !== null)).join('circle').attr('cx', (r) => x(r.y)).attr('cy', (r) => y(r.rec)).attr('r', 3.5).style('fill', dash.colors[0]);
  const r26 = rows.find((r) => r.y === 2026), r15 = rows[0], rEnd = rows[rows.length - 1];
  svg.append('text').attr('x', x(r15.y) + 6).attr('y', y(r15.kof) - 8).text(d65.fmt(r15.kof));
  svg.append('text').attr('x', x(2026) + 4).attr('y', y(r26.kx) - 10).text(d65.fmt(r26.kx));
  svg.append('text').attr('x', x(2026) + 6).attr('y', y(r26.rec) + 18).style('fill', dash.colors[0]).text(d65.fmt(r26.rec));
  [['hold', -2], ['pace', 4], ['ks', 10]].forEach(([k, dy]) => svg.append('text').attr('x', x(rEnd.y) + 4).attr('y', y(rEnd[k]) + dy).style('fill', dash.colors[0]).text(d65.fmt(rEnd[k])));
  const tip = d65.tip(box);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('pointermove', (ev) => {
      const [px] = d3.pointer(ev);
      const r = rows.reduce((a, b) => (Math.abs(x(b.y) - px) < Math.abs(x(a.y) - px) ? b : a));
      const L = ['Kindergarten class of fall ' + r.y];
      if (r.kof !== null) L.push("Kofron's birth data: " + d65.fmt(r.kof));
      if (r.kx !== null && r.y > 2025) L.push("Kofron's trend line: " + d65.fmt(r.kx));
      if (r.rec !== null) L.push('Birth records: ' + d65.fmt(r.rec));
      else if (r.hold !== null) L.push('If births stay flat: ' + d65.fmt(r.hold), 'At the recent pace: ' + d65.fmt(r.pace), "At Kofron's pace: " + d65.fmt(r.ks));
      tip.show(L, Math.min(x(r.y), W * 0.55) / W * box.clientWidth, 10);
    })
    .on('pointerleave', () => tip.hide());
});
})();

(function () {
// Scroll-story chapters: the charts new with the scroll story, their filled
// values, and the observer that highlights the chapter in view.
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
// estimates using the district's method. These are the only capacity figures
// on the page.
const CAP_PLAN = 7212, CAP_NOW = 7212 + 556 + 384;
// Of the 444 students lost (net) in fall 2020 and 2021, about 150 are still
// K-8 age; the rest are in high school or have graduated. A fixed figure.
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
// (2026 - i). The cv-sincek drawer sums the same rows.
const G9 = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
window.d65.classesNow = function () {
  const s = dash.data('district_grades'); if (s.status !== 'ok') return null;
  const m = {}; for (const r of s.data) (m[r.year] = m[r.year] || {})[r.grade] = +r.students;
  return G9.map((g, i) => ({ g, now: m['2026-27'][g], atK: (m[(2026 - i) + '-' + String(2027 - i).slice(2)] || {}).K }));
};
dash.draw('c-classes', (el) => {
  const s = dash.data('district_grades');
  if (s.status !== 'ok') return failed(el, s);
  el.replaceChildren();
  const rows = d65.classesNow();
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
// Each .chapter gets .is-active while it crosses the middle fifth of the
// viewport. The CSS dims only inactive figures, and only under .has-story, so
// the page reads normally if this never runs.
const root = document.getElementById('enrollment-dashboard');
const steps = document.querySelectorAll('#enrollment-dashboard .chapter');
const allActive = () => steps.forEach((s) => s.classList.add('is-active'));
if (!steps.length || !('IntersectionObserver' in window)) allActive();
else {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('is-active', e.isIntersecting);
  }, { rootMargin: '-40% 0px -40% 0px' });
  steps.forEach((s) => io.observe(s));
  root.classList.add('has-story');
  window.addEventListener('beforeprint', allActive);
  // Observing again reports each chapter's current state, undoing allActive.
  window.addEventListener('afterprint', () => steps.forEach((s) => { io.unobserve(s); io.observe(s); }));
}
})();

document.addEventListener('DOMContentLoaded', () => dash.start());
