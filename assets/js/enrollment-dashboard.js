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
    kofron_rerun: 'kofron_rerun_2020.csv',
    compare_bands: 'compare_bands.csv',
    school_proj: 'school_proj.csv',
    school_proj_yearly: 'school_proj_yearly.csv',
    forecast_check: 'forecast_check_2025_26.csv',
    current: 'current_2026_27.csv',
    feeder_grades: 'feeder_grades_2026_27.csv',
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
dash.draw('t-actual', (el) => txt(el, cell('district_trend', '2026-27', 'actual'), d65.fmt));
dash.draw('t-peak', (el) => txt(el, cell('district_trend', '2016-17', 'actual'), d65.fmt));
dash.draw('hl-mid', (el) => txt(el, cell('district_trend', '2026-27', 'kofron_mid'), d65.fmt));
dash.draw('t-mid', (el) => txt(el, cell('district_trend', '2026-27', 'kofron_mid'), d65.fmt));
dash.draw('t-low', (el) => txt(el, cell('district_trend', '2026-27', 'kofron_low'), d65.fmt));
dash.draw('t-high', (el) => txt(el, cell('district_trend', '2026-27', 'kofron_high'), d65.fmt));
dash.draw('t-mid32', (el) => txt(el, cell('district_trend', '2031-32', 'kofron_mid'), d65.fmt));
dash.draw('t-d65', (el) => txt(el, cell('district_trend', '2030-31', 'district_proj_2025'), d65.fmt));
dash.draw('t-k', (el) => txt(el, cellWhere('district_grades', (r) => r.grade === 'K' && r.year === '2026-27', 'students'), d65.fmt));
dash.draw('t-8', (el) => txt(el, cellWhere('district_grades', (r) => r.grade === '8' && r.year === '2026-27', 'students'), d65.fmt));
dash.draw('hl-peakpct', (el) => {
  const s = dash.data('headline');
  el.textContent = s.status === 'ok' && s.data !== null ? s.data.toFixed(1) + '%' : '—';
});
dash.draw('lg-actual', (el) => { el.style.borderTopColor = dash.colors[0]; });
dash.draw('lg-mid', (el) => { el.style.borderTopColor = dash.colors[0]; });
dash.draw('lg-band', (el) => { el.style.background = dash.colors[0]; });
dash.draw('lg-snap', (el) => { el.style.borderTopColor = dash.colors[2]; });
dash.draw('lg-d65', (el) => { el.style.borderTopColor = dash.colors[1]; });
dash.draw('lg-mck', (el) => { el.style.borderTopColor = dash.colors[3]; });
dash.draw('lg-t65', (el) => { el.style.borderTopColor = dash.colors[6]; });
dash.draw('lg-k', (el) => { el.style.background = dash.colors[0]; });
dash.draw('lg-5', (el) => { el.style.background = dash.colors[1]; });
})();

(function () {
// District trend chart
dash.draw('trend', (el) => {
  const s = dash.data('district_trend');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const rows = s.data.map((r) => ({ year: r.year, actual: d65.num(r.actual), high: d65.num(r.kofron_high), mid: d65.num(r.kofron_mid), low: d65.num(r.kofron_low), snap: d65.num(r.kofron_snapshot), d65: d65.num(r.district_proj_2025), mck: d65.num(r.mckibben_2024), t65: d65.num(r.t65_mid), t65lo: d65.num(r.t65_low), t65hi: d65.num(r.t65_high) }));
  const W = el.clientWidth || 600, H = 300, m = { t: 14, r: 16, b: 28, l: 48 };
  const years = rows.map((r) => r.year);
  const x = d3.scalePoint(years, [m.l, W - m.r]);
  const ymax = d3.max(rows, (r) => Math.max(r.actual || 0, r.high || 0));
  const y = d3.scaleLinear([3000, ymax * 1.03], [H - m.b, m.t]).nice();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Line chart of District 65 K-8 enrollment from 2012-13 to 2026-27 with Kofron forecasts and the district projection to 2031-32');
  svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  const step = Math.max(1, Math.ceil(years.length / Math.max(2, Math.floor((W - m.l) / 70))));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(years.filter((_, i) => i % step === 0)).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(',')));
  const band = rows.filter((r) => r.low !== null);
  svg.append('path').datum(band).attr('d', d3.area().x((r) => x(r.year)).y0((r) => y(r.low)).y1((r) => y(r.high))).style('fill', dash.colors[0]).style('opacity', 0.14);
  const line = (k) => d3.line().defined((r) => r[k] !== null).x((r) => x(r.year)).y((r) => y(r[k]));
  svg.append('path').datum(rows).attr('d', line('mid')).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2).attr('stroke-dasharray', '6 4');
  svg.append('path').datum(rows).attr('d', line('snap')).attr('fill', 'none').style('stroke', dash.colors[2]).attr('stroke-width', 2).attr('stroke-dasharray', '2 3');
  svg.append('path').datum(rows).attr('d', line('d65')).attr('fill', 'none').style('stroke', dash.colors[1]).attr('stroke-width', 2);
  svg.append('path').datum(rows).attr('d', line('mck')).attr('fill', 'none').style('stroke', dash.colors[3]).attr('stroke-width', 2).attr('stroke-dasharray', '8 3 2 3');
  const t65b = rows.filter((r) => r.t65lo !== null);
  svg.append('path').datum(t65b).attr('d', d3.area().x((r) => x(r.year)).y0((r) => y(r.t65lo)).y1((r) => y(r.t65hi))).style('fill', dash.colors[6]).style('opacity', 0.14);
  svg.append('path').datum(rows).attr('d', line('t65')).attr('fill', 'none').style('stroke', dash.colors[6]).attr('stroke-width', 2).attr('stroke-dasharray', '3 2');
  svg.append('path').datum(rows).attr('d', line('actual')).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2.5).attr('stroke-linejoin', 'round');
  const last = rows.filter((r) => r.actual !== null).slice(-1)[0];
  svg.append('circle').attr('cx', x(last.year)).attr('cy', y(last.actual)).attr('r', 4).style('fill', dash.colors[0]);
  const tip = d65.tip(el);
  const hover = svg.append('line').attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').attr('opacity', 0);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('pointermove', (ev) => {
      const [px] = d3.pointer(ev);
      const r = rows.reduce((a, b) => (Math.abs(x(b.year) - px) < Math.abs(x(a.year) - px) ? b : a));
      hover.attr('x1', x(r.year)).attr('x2', x(r.year)).attr('opacity', 1);
      const L = [r.year];
      if (r.actual !== null) L.push('Actual: ' + d65.fmt(r.actual));
      if (r.mid !== null) L.push('Kofron middle: ' + d65.fmt(r.mid) + ' (' + d65.fmt(r.low) + '–' + d65.fmt(r.high) + ')');
      if (r.snap !== null) L.push('Kofron snapshot: ' + d65.fmt(r.snap));
      if (r.d65 !== null) L.push('District projection: ' + d65.fmt(r.d65));
      if (r.mck !== null) L.push('McKibben (2024): ' + d65.fmt(r.mck));
      if (r.t65 !== null && r.year !== '2026-27') L.push('Thrive65 update: ' + d65.fmt(r.t65) + ' (' + d65.fmt(r.t65lo) + '–' + d65.fmt(r.t65hi) + ')');
      tip.show(L, x(r.year) / W * el.clientWidth, 10);
    })
    .on('pointerleave', () => { hover.attr('opacity', 0); tip.hide(); });
});
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
dash.draw('now-body', (tb) => {
  const s = dash.data('current');
  tb.replaceChildren();
  if (s.status !== 'ok') return;
  let lvl = null;
  for (const r of s.data) {
    const tr = document.createElement('tr');
    if (lvl !== null && r.level !== lvl) tr.className = 'sep';
    lvl = r.level;
    tdc(tr, r.school); tdc(tr, r.feeder); tdc(tr, d65.fmt(+r.total));
    tdc(tr, r.k === null || r.k === '' ? '' : r.k); tdc(tr, r.g5 === null || r.g5 === '' ? '' : r.g5);
    const kv = d65.num(r.k_vs_5_pct); tdc(tr, kv === null ? '' : d65.pct1(kv), kv !== null && kv <= -20 ? 'neg' : '');
    tdc(tr, d65.pct0(+r.frl_pct)); tdc(tr, d65.pct0(+r.el_pct)); tdc(tr, d65.pct0(+r.iep_pct)); tdc(tr, d65.pct0(+r.black_hisp_pct)); tdc(tr, d65.pct0(+r.white_pct));
    tdc(tr, r.twi === null || r.twi === '' ? '' : r.twi);
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
// K vs 5th dumbbell
dash.draw('k5', (el) => {
  const s = dash.data('current');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const avg = (a) => a.reduce((t, v) => t + v, 0) / a.length;
  const rows = s.data.filter((r) => r.level === 'Elementary').map((r) => {
    const g = ['k', 'g1', 'g2', 'g3', 'g4', 'g5'].map((c) => +r[c]);
    const k = avg(g.slice(0, 3)), g5 = avg(g.slice(3));
    return { school: r.school, g, k, g5, p: Math.round((k / g5 - 1) * 1000) / 10, tin: d65.num(r.transfers_in_may2026), tout: d65.num(r.transfers_out_may2026) };
  }).sort((a, b) => a.p - b.p);
  const W = el.clientWidth || 600, rowH = 32, m = { t: 22, r: 70, b: 24, l: 96 }, H = m.t + m.b + rows.length * rowH;
  const x = d3.scaleLinear([0, d3.max(rows, (r) => Math.max(r.k, r.g5)) * 1.1], [m.l, W - m.r]).nice();
  const y = d3.scaleBand(rows.map((r) => r.school), [m.t, H - m.b]).padding(0.4);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Average class size in grades K-2 and in grades 3-5 at each elementary school, fall 2026');
  svg.append('g').attr('class', 'grid').selectAll('line').data(x.ticks(5)).join('line').attr('x1', x).attr('x2', x).attr('y1', m.t).attr('y2', H - m.b);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickSize(0)).call((g) => g.select('.domain').remove());
  const g = svg.append('g');
  const cy = (r) => y(r.school) + y.bandwidth() / 2;
  g.selectAll('line.c').data(rows).join('line').attr('x1', (r) => x(r.k)).attr('x2', (r) => x(r.g5)).attr('y1', cy).attr('y2', cy).style('stroke', 'var(--cds-chart-muted)').attr('stroke-width', 3);
  g.selectAll('circle.k').data(rows).join('circle').attr('cx', (r) => x(r.k)).attr('cy', cy).attr('r', 6).style('fill', dash.colors[0]);
  g.selectAll('circle.f').data(rows).join('circle').attr('cx', (r) => x(r.g5)).attr('cy', cy).attr('r', 6).style('fill', dash.colors[1]);
  g.selectAll('text.p').data(rows).join('text').attr('x', W - m.r + 8).attr('y', (r) => cy(r) + 4).text((r) => d65.pct1(r.p)).style('fill', (r) => (r.p <= -20 ? 'var(--color-bad)' : 'var(--cds-text-secondary)'));
  svg.append('text').attr('x', W - m.r + 8).attr('y', 12).text('K-2 vs. 3-5');
  const tip = d65.tip(el);
  g.selectAll('rect.h').data(rows).join('rect').attr('x', m.l).attr('width', W - m.l - m.r).attr('y', (r) => y(r.school) - 6).attr('height', y.bandwidth() + 12).attr('fill', 'transparent')
    .on('pointermove', (ev, r) => { tip.show([r.school, 'K-2 average: ' + Math.round(r.k) + ' (K ' + r.g[0] + ', 1st ' + r.g[1] + ', 2nd ' + r.g[2] + ')', '3-5 average: ' + Math.round(r.g5) + ' (3rd ' + r.g[3] + ', 4th ' + r.g[4] + ', 5th ' + r.g[5] + ')', 'K-2 vs. 3-5: ' + d65.pct1(r.p)].concat(r.tin !== null ? ['Transfers approved last spring: ' + r.tin + ' in, ' + r.tout + ' out'] : []), Math.min(x(Math.max(r.k, r.g5)), W * 0.5) / W * el.clientWidth, cy(r) / W * el.clientWidth); })
    .on('pointerleave', () => tip.hide());
});

// Feeder pipeline lines
dash.draw('feeder-legend', (el) => {
  const s = dash.data('feeder_grades');
  el.replaceChildren();
  if (s.status !== 'ok') return;
  [...new Set(s.data.map((r) => r.feeder))].forEach((f, i) => {
    const sp = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'sw'; sw.style.borderTopColor = dash.colors[i];
    if (f === 'King Arts') sw.style.borderTopStyle = 'dashed';
    sp.append(sw, document.createTextNode(f === 'King Arts' ? 'King Arts (K-8 magnet)' : f + ' feeder')); el.append(sp);
  });
});
dash.draw('feeder', (el) => {
  const s = dash.data('feeder_grades');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
  const groups = d3.group(s.data, (r) => r.feeder);
  const W = el.clientWidth || 600, H = 280, m = { t: 14, r: 70, b: 28, l: 44 };
  const x = d3.scalePoint(grades, [m.l, W - m.r]);
  const y = d3.scaleLinear([0, d3.max(s.data, (r) => +r.students) * 1.08], [H - m.b, m.t]).nice();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Students per grade, K through 8, in each middle school feeder pattern, fall 2026');
  svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickFormat((g) => (g === 'K' ? 'K' : 'Gr ' + g)).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5));
  svg.append('line').attr('x1', (x('5') + x('6')) / 2).attr('x2', (x('5') + x('6')) / 2).attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '3 3');
  svg.append('text').attr('x', (x('5') + x('6')) / 2 + 4).attr('y', m.t + 10).text('middle school');
  const all = [], ends = [];
  [...groups.keys()].forEach((f, i) => {
    const rs = grades.map((g) => ({ f, g, n: +((groups.get(f).find((r) => r.grade === g) || {}).students) }));
    all.push(...rs);
    svg.append('path').datum(rs).attr('d', d3.line().x((r) => x(r.g)).y((r) => y(r.n))).attr('fill', 'none').style('stroke', dash.colors[i]).attr('stroke-width', 2).attr('stroke-dasharray', f === 'King Arts' ? '5 3' : null);
    svg.append('g').selectAll('circle').data(rs).join('circle').attr('cx', (r) => x(r.g)).attr('cy', (r) => y(r.n)).attr('r', 3.5).style('fill', dash.colors[i]);
    ends.push({ f, y: y(rs[rs.length - 1].n) + 4 });
  });
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  svg.append('g').selectAll('text').data(ends).join('text').attr('x', W - m.r + 6).attr('y', (e) => e.y).text((e) => e.f);
  const tip = d65.tip(el);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('pointermove', (ev) => {
      const [px] = d3.pointer(ev);
      const g = grades.reduce((a, b) => (Math.abs(x(b) - px) < Math.abs(x(a) - px) ? b : a));
      tip.show([g === 'K' ? 'Kindergarten' : 'Grade ' + g].concat(all.filter((r) => r.g === g).map((r) => r.f + ': ' + r.n)), x(g) / W * el.clientWidth, 10);
    })
    .on('pointerleave', () => tip.hide());
});

// Grade x year heatmap
dash.draw('grades', (el) => {
  const s = dash.data('district_grades');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
  const years = [...new Set(s.data.map((r) => r.year))].sort();
  const W = Math.max(el.clientWidth || 600, 560), m = { t: 22, r: 4, b: 4, l: 36 }, cw = (W - m.l - m.r) / years.length, ch = 26, H = m.t + m.b + grades.length * ch;
  const col = d3.scaleSequential([500, 950], d3.interpolateBlues);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Heat map of District 65 enrollment by grade (rows) and school year (columns), 2012-13 to 2026-27');
  years.forEach((yr, i) => svg.append('text').attr('x', m.l + i * cw + cw / 2).attr('y', 14).attr('text-anchor', 'middle').text("'" + yr.slice(2, 4)));
  grades.forEach((g, j) => svg.append('text').attr('x', m.l - 6).attr('y', m.t + j * ch + ch / 2 + 4).attr('text-anchor', 'end').text(g === 'K' ? 'K' : 'Gr ' + g));
  const tip = d65.tip(el);
  for (const r of s.data) {
    const i = years.indexOf(r.year), j = grades.indexOf(r.grade), n = +r.students;
    const c = d3.color(col(n));
    svg.append('rect').attr('x', m.l + i * cw + 1).attr('y', m.t + j * ch + 1).attr('width', cw - 2).attr('height', ch - 2).attr('rx', 2).attr('fill', c.formatHex())
      .on('pointermove', () => tip.show([(r.grade === 'K' ? 'Kindergarten' : 'Grade ' + r.grade) + ', ' + r.year, d65.fmt(n) + ' students'], (m.l + i * cw) / W * el.clientWidth, (m.t + j * ch) / W * el.clientWidth))
      .on('pointerleave', () => tip.hide());
    if (cw > 30) svg.append('text').attr('x', m.l + i * cw + cw / 2).attr('y', m.t + j * ch + ch / 2 + 4).attr('text-anchor', 'middle').style('fill', n > 760 ? '#fff' : '#0b0b0b').style('pointer-events', 'none').text(n);
  }
});
})();

(function () {
// COVID retention section
const SEES_2025 = 94; // 2024-25 total (5,854) minus the district's restated total excluding SEES students (5,760), SY2024-25 Opening of Schools
const G9 = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
function byYear(rows) { const m = {}; for (const r of rows) { (m[r.year] = m[r.year] || {})[r.grade] = +r.students; } return m; }
function nextYear(y) { const a = +y.slice(0, 4) + 1; return a + '-' + String(a + 1).slice(2); }
dash.calc('change_summary', {
  title: 'COVID-era losses and the decline since the peak',
  description: 'Fall 2020 + 2021 losses among enrolled students, and the 2016-17 to 2026-27 decline split into smaller kindergartens vs. enrolled students leaving.',
  inputs: ['district_grades'],
  fn: (grades) => {
    const m = byYear(grades), years = Object.keys(m).sort();
    const cont = (y, p) => G9.slice(1).reduce((s, g) => s + m[y][g], 0) - G9.slice(0, 8).reduce((s, g) => s + m[p][g], 0);
    const covid = cont('2020-21', '2019-20') + cont('2021-22', '2020-21');
    const base = G9.slice(0, 8).reduce((s, g) => s + m['2019-20'][g], 0);
    let entry = 0, cc = 0;
    for (let i = years.indexOf('2017-18'); i < years.length; i++) { const y = years[i], p = years[i - 1]; entry += m[y].K - m[p]['8']; cc += cont(y, p); }
    const total = entry + cc;
    return [{ covid_loss: covid, covid_pct: Math.round(-covid / base * 1000) / 10, since_peak_total: total, since_peak_entry: entry, since_peak_continuing: cc,
      entry_share_pct: Math.round(entry / total * 100), sees_adjustment: SEES_2025 }];
  }
});
dash.calc('cohorts', {
  title: 'Kindergarten classes followed up the grades',
  description: 'Each kindergarten class from 2016-17 on, by grade, as a count and a share of its kindergarten size.',
  inputs: ['district_grades'],
  fn: (grades) => {
    const m = byYear(grades), years = Object.keys(m).sort(), out = [];
    for (const k of years.filter((y) => y >= '2016-17')) {
      let y = k; const k0 = m[k].K;
      for (const g of G9) { if (!m[y]) break; out.push({ k_year: k, grade: g, students: m[y][g], pct_of_k: Math.round(m[y][g] / k0 * 1000) / 10 }); y = nextYear(y); }
    }
    return out;
  }
});
function sumRow() { const s = dash.data('change_summary'); return s.status === 'ok' && s.data && s.data[0] ? s.data[0] : null; }
const sgn = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + d65.fmt(Math.abs(v));
dash.draw('cv-loss', (el) => { const r = sumRow(); el.textContent = r ? d65.fmt(Math.abs(r.covid_loss)) : '—'; });
dash.draw('cv-loss2', (el) => { const r = sumRow(); el.textContent = r ? sgn(r.covid_loss) : '—'; });
dash.draw('cv-pct', (el) => { const r = sumRow(); el.textContent = r ? r.covid_pct.toFixed(1) + '%' : '—'; });
dash.draw('cv-pct2', (el) => { const r = sumRow(); el.textContent = r ? r.covid_pct.toFixed(1) + '%' : '—'; });
dash.draw('cv-entry', (el) => { const r = sumRow(); el.textContent = r ? r.entry_share_pct + '%' : '—'; });
dash.draw('cv-total', (el) => { const r = sumRow(); el.textContent = r ? sgn(r.since_peak_total) : '—'; });
dash.draw('cv-entry2', (el) => { const r = sumRow(); el.textContent = r ? sgn(r.since_peak_entry) : '—'; });
dash.draw('cv-cont', (el) => { const r = sumRow(); el.textContent = r ? sgn(r.since_peak_continuing) : '—'; });
function coh(k, g, f) { const s = dash.data('cohorts'); if (s.status !== 'ok' || !s.data) return null; const r = s.data.find((d) => d.k_year === k && d.grade === g); return r ? r[f] : null; }
dash.draw('cv-k20', (el) => { const v = coh('2020-21', '6', 'students'); el.textContent = v === null ? '—' : d65.fmt(v); });
dash.draw('cv-k20k', (el) => { const v = coh('2020-21', 'K', 'students'); el.textContent = v === null ? '—' : d65.fmt(v); });
dash.draw('cv-k20p', (el) => { const v = coh('2020-21', '6', 'pct_of_k'); el.textContent = v === null ? '—' : v.toFixed(1) + '%'; });
dash.draw('cohort-legend', (el) => {
  const s = dash.data('cohorts');
  el.replaceChildren();
  if (s.status !== 'ok' || !s.data) return;
  const ks = [...new Set(s.data.map((r) => r.k_year))].filter((k) => k >= '2020-21' && s.data.filter((r) => r.k_year === k).length > 1);
  const pre = document.createElement('span'); const sw0 = document.createElement('span'); sw0.className = 'sw'; sw0.style.borderTopColor = 'var(--cds-chart-muted)'; pre.append(sw0, document.createTextNode('Started K 2016-2019')); el.append(pre);
  ks.forEach((k, i) => { const sp = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'sw'; sw.style.borderTopColor = dash.colors[i]; sp.append(sw, document.createTextNode('K in fall ' + k.slice(0, 4))); el.append(sp); });
  const xs = document.createElement('span'); const xm = document.createElement('b'); xm.textContent = '× '; xm.style.color = 'var(--color-fg)'; xs.append(xm, document.createTextNode('Fall 2020, first COVID school year')); el.append(xs);
});
dash.draw('covid-cohorts', (el) => {
  const s = dash.data('cohorts');
  if (s.status !== 'ok' || !s.data) { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const groups = d3.group(s.data, (r) => r.k_year);
  const W = el.clientWidth || 600, H = 340, m = { t: 14, r: 92, b: 30, l: 46 };
  const x = d3.scalePoint(G9, [m.l, W - m.r]);
  const y = d3.scaleLinear([78, 112], [H - m.b, m.t]);
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', 'Line chart of each kindergarten class since 2016 as a percent of its kindergarten size by grade; classes starting in 2020 or later stay near 100 percent');
  svg.append('g').attr('class', 'grid').selectAll('line').data([80, 85, 90, 95, 105, 110]).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(100)).attr('y2', y(100)).style('stroke', 'var(--cds-chart-reference)');
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickFormat((g) => (g === 'K' ? 'K' : 'Gr ' + g)).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues([80, 85, 90, 95, 100, 105, 110]).tickFormat((v) => v + '%'));
  const line = d3.line().x((r) => x(r.grade)).y((r) => y(Math.max(78, Math.min(112, r.pct_of_k))));
  const post = [...groups.keys()].filter((k) => k >= '2020-21' && groups.get(k).length > 1);
  const ends = [];
  for (const [k, rs] of groups) {
    if (rs.length < 2) continue;
    const isPost = k >= '2020-21', i = post.indexOf(k);
    svg.append('path').datum(rs).attr('d', line).attr('fill', 'none').style('stroke', isPost ? dash.colors[i] : 'var(--cds-chart-muted)').attr('stroke-width', isPost ? 2.5 : 2);
    const last = rs[rs.length - 1];
    svg.append('circle').attr('cx', x(last.grade)).attr('cy', y(last.pct_of_k)).attr('r', isPost ? 4 : 3).style('fill', isPost ? dash.colors[i] : 'var(--cds-chart-muted)');
    if (!isPost && last.grade === '8') ends.push({ t: 'K ' + k.slice(0, 4) + ': ' + last.pct_of_k.toFixed(0) + '%', y: y(last.pct_of_k) + 4 });
  }
  ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 13) ends[i].y = ends[i - 1].y + 13;
  svg.append('g').selectAll('text').data(ends).join('text').attr('x', x('8') + 8).attr('y', (e) => e.y).text((e) => e.t);
  const covidPts = [];
  for (const [k, rs] of groups) {
    if (rs.length < 2) continue;
    const gi = 2020 - +k.slice(0, 4);
    if (gi < 0 || gi > 8) continue;
    const r = rs.find((d) => d.grade === G9[gi]);
    if (r) covidPts.push({ k, r, isPost: k >= '2020-21', i: post.indexOf(k) });
  }
  const xg = svg.append('g');
  for (const p of covidPts) {
    const cx = x(p.r.grade), cy = y(Math.max(78, Math.min(112, p.r.pct_of_k))), d = 3.5;
    xg.append('path').attr('d', `M${cx - d},${cy - d}L${cx + d},${cy + d}M${cx - d},${cy + d}L${cx + d},${cy - d}`)
      .style('stroke', 'var(--color-panel)').attr('stroke-width', 4.5).attr('stroke-linecap', 'round');
    xg.append('path').attr('d', `M${cx - d},${cy - d}L${cx + d},${cy + d}M${cx - d},${cy + d}L${cx + d},${cy - d}`)
      .style('stroke', p.isPost ? dash.colors[p.i] : 'var(--color-fg)').attr('stroke-width', 1.75).attr('stroke-linecap', 'round');
  }
  const tip = d65.tip(el);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('pointermove', (ev) => {
      const [px] = d3.pointer(ev);
      const g = G9.reduce((a, b) => (Math.abs(x(b) - px) < Math.abs(x(a) - px) ? b : a));
      const L = [(g === 'K' ? 'Kindergarten' : 'Grade ' + g) + ': share of kindergarten size'];
      for (const [k, rs] of groups) { const r = rs.find((d) => d.grade === g); if (r && rs.length > 1) L.push('K fall ' + k.slice(0, 4) + ': ' + r.pct_of_k.toFixed(1) + '% (' + d65.fmt(r.students) + ')'); }
      tip.show(L, Math.min(x(g), W * 0.45) / W * el.clientWidth, 10);
    })
    .on('pointerleave', () => tip.hide());
});
})();

(function () {
// National comparison
const NAT_BASE = '2019-20';
dash.calc('national_compare', {
  inputs: ['district_grades', 'national', 'district_trend'],
  fn: (grades, national, trend) => {
    const m = {};
    for (const r of grades) { (m[r.year] = m[r.year] || {})[r.grade] = +r.students; }
    const k8 = (y) => (m[y] ? ['K', '1', '2', '3', '4', '5', '6', '7', '8'].reduce((s, g) => s + m[y][g], 0) : null);
    const n = {}; for (const r of national) n[r.year] = r;
    const t = {}; for (const r of trend) t[r.year] = r;
    const num = (v) => (v === null || v === undefined || v === '' ? null : +v);
    const d0 = k8(NAT_BASE), dk0 = m[NAT_BASE].K, u0 = num(n[NAT_BASE].us_k8), uk0 = num(n[NAT_BASE].us_k), km0 = num(t['2021-22'].kofron_mid), a21 = k8('2021-22'), c0 = num(n[NAT_BASE].cps_k8);
    const idx = (v, b) => (v === null ? null : Math.round(v / b * 1000) / 10);
    return national.map((r) => {
      const y = r.year, d = k8(y), km = t[y] ? num(t[y].kofron_mid) : null;
      return { year: y, d65_k8: d, d65_k8_idx: idx(d, d0), d65_k: m[y] ? m[y].K : null, d65_k_idx: m[y] ? idx(m[y].K, dk0) : null,
        us_k8: num(r.us_k8), us_k8_idx: idx(num(r.us_k8), u0), us_k: num(r.us_k), us_k_idx: idx(num(r.us_k), uk0),
        cps_k8: num(r.cps_k8), cps_k8_idx: idx(num(r.cps_k8), c0),
        us_k8_proj_idx: idx(num(r.us_k8_projected), u0), d65_kofron_idx: y >= '2026-27' && km !== null ? idx(a21 * km / km0, d0) : null };
    });
  }
});
dash.calc('national_summary', {
  inputs: ['national_compare'],
  fn: (rows) => {
    const r = rows.find((d) => d.year === '2024-25');
    const c = (v) => Math.round((v - 100) * 10) / 10;
    const r25 = rows.find((d) => d.year === '2025-26');
    return [{ d65_k8_chg: c(r.d65_k8_idx), us_k8_chg: c(r.us_k8_idx), d65_k_chg: c(r.d65_k_idx), us_k_chg: c(r.us_k_idx),
      cps_k8_chg: c(r.cps_k8_idx), cps_k8_chg_2025: c(r25.cps_k8_idx), d65_k8_chg_2025: c(r25.d65_k8_idx) }];
  }
});
function natRow() { const s = dash.data('national_summary'); return s.status === 'ok' && s.data && s.data[0] ? s.data[0] : null; }
const natPct = (v) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1) + '%';
dash.draw('nt-us', (el) => { const r = natRow(); el.textContent = r ? Math.abs(r.us_k8_chg).toFixed(1) + '%' : '—'; });
dash.draw('nt-d65', (el) => { const r = natRow(); el.textContent = r ? Math.abs(r.d65_k8_chg).toFixed(1) + '%' : '—'; });
dash.draw('nt-usk', (el) => { const r = natRow(); el.textContent = r ? natPct(r.us_k_chg) : '—'; });
dash.draw('nt-d65k', (el) => { const r = natRow(); el.textContent = r ? natPct(r.d65_k_chg) : '—'; });
dash.draw('lg-nd', (el) => { el.style.borderTopColor = dash.colors[0]; });
dash.draw('lg-nu', (el) => { el.style.borderTopColor = dash.colors[1]; });
dash.draw('lg-nc', (el) => { el.style.borderTopColor = dash.colors[2]; });
dash.draw('nt-cps', (el) => { const r = natRow(); el.textContent = r ? Math.abs(r.cps_k8_chg).toFixed(1) + '%' : '—'; });
dash.draw('nt-cps25', (el) => { const r = natRow(); el.textContent = r ? Math.abs(r.cps_k8_chg_2025).toFixed(1) + '%' : '—'; });
dash.draw('nt-d6525', (el) => { const r = natRow(); el.textContent = r ? Math.abs(r.d65_k8_chg_2025).toFixed(1) + '%' : '—'; });
function natChart(el, key) {
  const s = dash.data('national_compare');
  if (s.status !== 'ok' || !s.data) { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const isK8 = key === 'k8';
  const rows = s.data.filter((r) => isK8 || r.year <= '2026-27'), years = rows.map((r) => r.year);
  const series = isK8
    ? [{ f: 'd65_k8_idx', raw: 'd65_k8', c: dash.colors[0], name: 'District 65' }, { f: 'us_k8_idx', raw: 'us_k8', c: dash.colors[1], name: 'U.S. public' },
       { f: 'cps_k8_idx', raw: 'cps_k8', c: dash.colors[2], name: 'Chicago Public Schools' },
       { f: 'd65_kofron_idx', c: dash.colors[0], dash: true, name: 'District 65 forecast (Kofron middle)' }, { f: 'us_k8_proj_idx', c: dash.colors[1], dash: true, name: 'U.S. forecast (NCES)' }]
    : [{ f: 'd65_k_idx', raw: 'd65_k', c: dash.colors[0], name: 'District 65' }, { f: 'us_k_idx', raw: 'us_k', c: dash.colors[1], name: 'U.S. public' }];
  const vals = rows.flatMap((r) => series.map((sr) => r[sr.f])).filter((v) => v !== null);
  const W = el.clientWidth || 320, H = 260, m = { t: 16, r: 44, b: 26, l: 38 };
  const x = d3.scalePoint(years, [m.l, W - m.r]);
  const y = d3.scaleLinear([Math.min(60, d3.min(vals) - 3), Math.max(110, d3.max(vals) + 3)], [H - m.b, m.t]).nice();
  const svg = d3.select(el).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', (isK8 ? 'K-8' : 'Kindergarten') + ' enrollment for District 65 and U.S. public schools, indexed to fall 2019 = 100');
  svg.append('rect').attr('x', x('2020-21') - 4).attr('width', x('2021-22') - x('2020-21') + 8).attr('y', m.t).attr('height', H - m.t - m.b).style('fill', 'var(--cds-chart-muted)').style('opacity', 0.25);
  svg.append('text').attr('x', x('2020-21') - 2).attr('y', m.t + 10).text('COVID');
  svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
  svg.append('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y(100)).attr('y2', y(100)).style('stroke', 'var(--cds-chart-reference)');
  const tv = years.filter((yr) => ['2012-13', '2016-17', '2019-20', '2023-24', '2026-27', '2031-32'].includes(yr) && (isK8 || yr <= '2026-27'));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(W < 380 ? tv.filter((_, i) => i % 2 === 0) : tv).tickFormat((d) => "'" + d.slice(2, 4)).tickSizeOuter(0));
  svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5));
  const ends = [];
  for (const sr of series) {
    const line = d3.line().defined((r) => r[sr.f] !== null).x((r) => x(r.year)).y((r) => y(r[sr.f]));
    svg.append('path').datum(rows).attr('d', line).attr('fill', 'none').style('stroke', sr.c).attr('stroke-width', sr.dash ? 1.75 : 2.5).attr('stroke-dasharray', sr.dash ? '5 3' : null);
    const last = rows.filter((r) => r[sr.f] !== null).slice(-1)[0];
    if (last) { svg.append('circle').attr('cx', x(last.year)).attr('cy', y(last[sr.f])).attr('r', sr.dash ? 2.5 : 3.5).style('fill', sr.c); ends.push({ y: y(last[sr.f]) + 4, x: x(last.year) + 5, t: Math.round(last[sr.f]) }); }
  }
  ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (Math.abs(ends[i].x - ends[i - 1].x) < 1 && ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
  svg.append('g').selectAll('text').data(ends).join('text').attr('x', (e) => e.x).attr('y', (e) => e.y).text((e) => e.t);
  const tip = d65.tip(el);
  svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
    .on('pointermove', (ev) => {
      const [px] = d3.pointer(ev);
      const r = rows.reduce((a, b) => (Math.abs(x(b.year) - px) < Math.abs(x(a.year) - px) ? b : a));
      const L = ['Fall ' + r.year.slice(0, 4) + ' (fall 2019 = 100)'];
      for (const sr of series) if (r[sr.f] !== null) L.push(sr.name + ': ' + r[sr.f].toFixed(1) + (sr.raw && r[sr.raw] !== null ? ' (' + d65.fmt(r[sr.raw]) + (sr.raw.startsWith('us') ? ' thousand' : '') + ')' : ''));
      tip.show(L, Math.min(x(r.year), W * 0.4) / W * el.clientWidth, 10);
    })
    .on('pointerleave', () => tip.hide());
}
dash.draw('nat-k8', (el) => natChart(el, 'k8'));
dash.draw('nat-k', (el) => natChart(el, 'k'));

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
dash.draw('nb-cps', (el) => { const r = nbRow('nearby_summary'); el.textContent = r ? nbPct(r.cps_chg) : '—'; });
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
// Kofron method rerun from 2020: two panels (births falling / births flat)
dash.draw('rerun', (el) => {
  const s = dash.data('kofron_rerun');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const num = d65.num;
  const rows = s.data.map((r) => ({ year: r.year, actual: num(r.actual),
    f: { high: num(r.high_births_falling), mid: num(r.mid_births_falling), low: num(r.low_births_falling), snap: num(r.snapshot_births_falling) },
    k: { high: num(r.high_births_data), mid: num(r.mid_births_data), low: num(r.low_births_data), snap: num(r.snapshot_births_data) } }))
    .filter((r) => r.year >= '2016-17');
  const legend = document.createElement('div'); legend.className = 'legend';
  const item = (style, text) => { const sp = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'sw'; Object.assign(sw.style, style); sp.append(sw, document.createTextNode(text)); legend.append(sp); };
  item({ borderTopColor: dash.colors[0], borderTopWidth: '2.5px' }, 'Actual');
  item({ borderTopColor: dash.colors[1], borderTopStyle: 'dashed' }, 'Middle series');
  const bx = document.createElement('span'); const bsw = document.createElement('span'); bsw.className = 'box'; bsw.style.background = dash.colors[1]; bx.append(bsw, document.createTextNode('Low to high series')); legend.append(bx);
  item({ borderTopColor: dash.colors[1], borderTopStyle: 'dotted' }, 'Snapshot (last 2 years only)');
  el.append(legend);
  const grid = document.createElement('div'); grid.className = 'nat-grid'; el.append(grid);
  const all = rows.flatMap((r) => [r.actual, r.f.high, r.f.snap, r.k.high, r.k.snap]).filter((v) => v !== null);
  const ymin = Math.floor((d3.min(all) - 200) / 500) * 500, ymax = Math.ceil((d3.max(all) + 100) / 500) * 500;
  const panels = [['f', 'If births keep falling (Kofron\'s straight-line trend)'], ['k', 'Using birth records through 2023']].map(([key, title]) => {
    const wrap = document.createElement('div');
    const t = document.createElement('div'); t.className = 'nat-t'; t.textContent = title; wrap.append(t);
    const box = document.createElement('div'); box.className = 'chart'; box.style.minHeight = '280px'; wrap.append(box); grid.append(wrap);
    return [key, title, box];
  });
  for (const [key, title, box] of panels) {
    const W = box.clientWidth || 340, H = 280, m = { t: 12, r: 44, b: 26, l: 46 };
    const years = rows.map((r) => r.year);
    const x = d3.scalePoint(years, [m.l, W - m.r]);
    const y = d3.scaleLinear([ymin, ymax], [H - m.b, m.t]);
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img')
      .attr('aria-label', 'District 65 K-8 enrollment, actual and projected from fall 2020 using the Kofron method, ' + title.toLowerCase());
    svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
    const tv = years.filter((yr) => ['2016-17', '2020-21', '2026-27', '2030-31', '2034-35'].includes(yr));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(W < 380 ? tv.filter((_, i) => i % 2 === 0) : tv).tickFormat((d) => "'" + d.slice(2, 4)).tickSizeOuter(0));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(',')));
    svg.append('line').attr('x1', x('2020-21')).attr('x2', x('2020-21')).attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').attr('stroke-dasharray', '2 2');
    svg.append('text').attr('x', x('2020-21') + 4).attr('y', m.t + 10).text('start, fall 2020');
    const pr = rows.filter((r) => r[key].mid !== null);
    svg.append('path').datum(pr).attr('d', d3.area().x((r) => x(r.year)).y0((r) => y(r[key].low)).y1((r) => y(r[key].high))).style('fill', dash.colors[1]).style('opacity', 0.16);
    const ln = (f) => d3.line().defined((r) => f(r) !== null).x((r) => x(r.year)).y((r) => y(f(r)));
    svg.append('path').datum(pr).attr('d', ln((r) => r[key].snap)).attr('fill', 'none').style('stroke', dash.colors[1]).attr('stroke-width', 1.75).attr('stroke-dasharray', '2 3');
    svg.append('path').datum(pr).attr('d', ln((r) => r[key].mid)).attr('fill', 'none').style('stroke', dash.colors[1]).attr('stroke-width', 2).attr('stroke-dasharray', '6 4');
    svg.append('path').datum(rows).attr('d', ln((r) => r.actual)).attr('fill', 'none').style('stroke', dash.colors[0]).attr('stroke-width', 2.5).attr('stroke-linejoin', 'round');
    const lastA = rows.filter((r) => r.actual !== null).slice(-1)[0];
    svg.append('circle').attr('cx', x(lastA.year)).attr('cy', y(lastA.actual)).attr('r', 3.5).style('fill', dash.colors[0]);
    const end = pr[pr.length - 1];
    svg.append('text').attr('x', x(end.year) + 4).attr('y', y(end[key].high) + 4).text(d3.format(',')(end[key].high));
    svg.append('text').attr('x', x(end.year) + 4).attr('y', y(end[key].low) + 4).text(d3.format(',')(end[key].low));
    const tip = d65.tip(box);
    const hover = svg.append('line').attr('y1', m.t).attr('y2', H - m.b).style('stroke', 'var(--cds-chart-reference)').attr('opacity', 0).style('pointer-events', 'none');
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px] = d3.pointer(ev);
        const r = rows.reduce((a, b) => (Math.abs(x(b.year) - px) < Math.abs(x(a.year) - px) ? b : a));
        hover.attr('x1', x(r.year)).attr('x2', x(r.year)).attr('opacity', 1);
        const L = [r.year];
        if (r.actual !== null) L.push('Actual: ' + d65.fmt(r.actual));
        if (r[key].mid !== null && r.year !== '2020-21') { L.push('High: ' + d65.fmt(r[key].high)); L.push('Middle: ' + d65.fmt(r[key].mid)); L.push('Low: ' + d65.fmt(r[key].low)); L.push('Snapshot: ' + d65.fmt(r[key].snap)); }
        tip.show(L, Math.min(x(r.year), W * 0.5) / W * box.clientWidth, 10);
      })
      .on('pointerleave', () => { hover.attr('opacity', 0); tip.hide(); });
  }
});
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
dash.draw('cv-sincek', (el) => {
  const s = dash.data('district_grades');
  if (s.status !== 'ok') { el.textContent = '—'; return; }
  const m = {};
  for (const r of s.data) (m[r.year] = m[r.year] || {})[r.grade] = +r.students;
  let now = 0, atK = 0;
  ['K', '1', '2', '3', '4', '5', '6', '7', '8'].forEach((g, i) => {
    const ky = (2026 - i) + '-' + String(2027 - i).slice(2);
    now += m['2026-27'][g]; atK += m[ky].K;
  });
  el.textContent = d65.fmt(Math.round((atK - now) / 10) * 10);
});
dash.draw('hl-drop', (el) => {
  const s = dash.data('district_trend');
  if (s.status !== 'ok') { el.textContent = '—'; return; }
  const get = (y) => +(s.data.find((r) => r.year === y) || {}).actual;
  const v = get('2016-17') - get('2026-27');
  el.textContent = isNaN(v) ? '—' : d65.fmt(Math.round(v / 10) * 10);
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
  add({ borderTopColor: 'var(--color-fg-muted)' }, "Kofron's birth data");
  add({ borderTopColor: 'var(--color-fg-muted)', borderTopStyle: 'dashed' }, "Kofron's straight-line extension");
  add({ borderTopColor: dash.colors[0] }, 'Cook County birth records');
  add({ borderTopColor: dash.colors[0], borderTopWidth: '8px', opacity: '0.25' }, 'Assumed range: births flat, or falling at Kofron\'s pace');
  add({ borderTopColor: dash.colors[0], borderTopStyle: 'dotted' }, 'Middle: recent pace, about 3% fewer a year');
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
// Future middle school classes from students already enrolled
dash.draw('ms-future', (el) => {
  const s = dash.data('feeder_grades'), cb = dash.data('compare_bands');
  if (s.status !== 'ok') { el.textContent = s.status === 'error' ? 'Failed to load' : '—'; return; }
  el.replaceChildren();
  const G = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
  const f = {}; for (const r of s.data) (f[r.feeder] = f[r.feeder] || {})[r.grade] = +r.students;
  const feeders = Object.keys(f);
  const years = [0, 1, 2, 3, 4, 5, 6].map((t) => {
    const from = [6 - t, 7 - t, 8 - t].map((i) => G[i]), v = {};
    let total = 0;
    for (const k of feeders) { v[k] = from.reduce((a, g) => a + f[k][g], 0); total += v[k]; }
    return { year: (2026 + t) + '-' + String(2027 + t).slice(2), from, v, total };
  });
  const adj = {};
  if (cb.status === 'ok') for (const r of cb.data) { const n = d65.num(r.t65_mid_68); if (n !== null) adj[r.year] = n; }
  for (const y of years) y.adj = adj[y.year] ?? null;
  const fromText = (y) => "today's " + y.from.map((g) => (g === 'K' ? 'kindergarten' : g === '1' ? '1st' : g === '2' ? '2nd' : g === '3' ? '3rd' : g + 'th')).join(', ').replace(/, ([^,]*)$/, ' and $1') + ' graders';
  const legend = document.createElement('div'); legend.className = 'legend';
  const add = (style, text) => { const sp = document.createElement('span'); const sw = document.createElement('span'); sw.className = 'sw'; Object.assign(sw.style, style); sp.append(sw, document.createTextNode(text)); legend.append(sp); };
  add({ borderTopColor: 'var(--color-fg)', borderTopWidth: '2.5px' }, 'All middle schools, students already enrolled');
  add({ borderTopColor: dash.colors[6], borderTopStyle: 'dashed' }, 'All middle schools, Thrive65 update (allows for moves)');
  feeders.forEach((k, i) => add({ borderTopColor: dash.colors[i], borderTopStyle: k === 'King Arts' ? 'dashed' : 'solid' }, k === 'King Arts' ? 'King Arts (K-8 magnet)' : k + ' feeder pattern'));
  el.append(legend);
  const grid = document.createElement('div'); grid.className = 'nat-grid'; el.append(grid);
  const panel = (title) => { const w = document.createElement('div'); const t = document.createElement('div'); t.className = 'nat-t'; t.textContent = title; const box = document.createElement('div'); box.className = 'chart'; box.style.minHeight = '300px'; w.append(t, box); grid.append(w); return box; };
  const draw = (box, series, ymin, ymax, label) => {
    const W = box.clientWidth || 360, H = 300, m = { t: 14, r: 86, b: 26, l: 46 };
    const x = d3.scalePoint(years.map((y) => y.year), [m.l, W - m.r]);
    const y = d3.scaleLinear([ymin, ymax], [H - m.b, m.t]).nice();
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', label);
    svg.append('g').attr('class', 'grid').selectAll('line').data(y.ticks(5)).join('line').attr('x1', m.l).attr('x2', W - m.r).attr('y1', y).attr('y2', y);
    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickFormat((d) => "'" + d.slice(2, 4)).tickSizeOuter(0));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(',')));
    const ends = [];
    for (const sr of series) {
      const pts = years.filter((yy) => sr.get(yy) !== null);
      svg.append('path').datum(pts).attr('d', d3.line().x((yy) => x(yy.year)).y((yy) => y(sr.get(yy)))).attr('fill', 'none').style('stroke', sr.c).attr('stroke-width', sr.w || 2).attr('stroke-dasharray', sr.dash || null);
      svg.append('g').selectAll('circle').data(pts).join('circle').attr('cx', (yy) => x(yy.year)).attr('cy', (yy) => y(sr.get(yy))).attr('r', 3).style('fill', sr.c);
      const l = pts[pts.length - 1];
      if (l) ends.push({ x: x(l.year) + 6, y: y(sr.get(l)) + 4, t: sr.label + ' ' + d65.fmt(sr.get(l)) });
    }
    ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 12) ends[i].y = ends[i - 1].y + 12;
    svg.append('g').selectAll('text').data(ends).join('text').attr('x', (e) => e.x).attr('y', (e) => e.y).text((e) => e.t);
    const tip = d65.tip(box);
    svg.append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const [px] = d3.pointer(ev);
        const yy = years.reduce((a, b) => (Math.abs(x(b.year) - px) < Math.abs(x(a.year) - px) ? b : a));
        const L = ['Fall ' + yy.year.slice(0, 4) + ' grades 6-8', 'From ' + fromText(yy)].concat(series.filter((sr) => sr.get(yy) !== null).map((sr) => sr.name + ': ' + d65.fmt(sr.get(yy))));
        tip.show(L, Math.min(x(yy.year), W * 0.45) / W * box.clientWidth, 10);
      })
      .on('pointerleave', () => tip.hide());
  };
  const b1 = panel('All middle schools'), b2 = panel('By middle school');
  const tot = [{ name: 'Students already enrolled', label: '', get: (yy) => yy.total, c: 'var(--color-fg)', w: 2.5 }, { name: 'Thrive65 update', label: '', get: (yy) => yy.adj, c: dash.colors[6], dash: '5 3' }];
  draw(b1, tot, 1400, d3.max(years, (yy) => yy.total) * 1.04, 'Grades 6-8 enrollment in each fall from 2026 to 2032, from students already enrolled, with the Thrive65 update');
  const by = feeders.map((k, i) => ({ name: k, label: k, get: (yy) => yy.v[k], c: dash.colors[i], dash: k === 'King Arts' ? '5 3' : null }));
  draw(b2, by, 0, d3.max(years, (yy) => d3.max(feeders, (k) => yy.v[k])) * 1.08, 'Grades 6-8 enrollment by middle school feeder pattern in each fall from 2026 to 2032, from students already enrolled');
});
})();

document.addEventListener('DOMContentLoaded', () => dash.start());
