#!/usr/bin/env node
/*
 * Enrollment page data prep: data-src/enrollment/*.csv → _data/enrollment/*.json
 *
 * Run by hand whenever the source CSVs change:   npm run data:enrollment
 * Commit both the source CSVs and the generated JSON. Nothing here runs in CI
 * or in the browser: the page (_posts/…-district-65-enrollment-forecasts.md)
 * renders numbers, tables, bar charts and the maps from this
 * output in Liquid, and assets/js/charts.js draws the line charts from it.
 *
 * Why here and not in Liquid: Liquid sorts CSV values as text and is clumsy at
 * arithmetic, so every derived figure, sort order, formatted label, 0–1 shade
 * and projected map path is computed once, here.
 *
 * No dependencies — plain Node (≥20).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'data-src', 'enrollment');
const OUT = join(ROOT, '_data', 'enrollment');

/* ------------------------------------------------------------------ CSV */
function parseCsv(text) {
  const rows = []; let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.length > 1 || r[0] !== '');
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] === undefined || r[i] === '' ? null : r[i]])));
}
const load = (f) => parseCsv(readFileSync(join(SRC, f), 'utf8'));

/* ----------------------------------------------------------- formatting */
const num = (v) => (v === null || v === undefined || v === '' ? null : +v);
const MINUS = '−';
const int = (v) => (v === null || Number.isNaN(v) ? null : Math.round(v).toLocaleString('en-US'));
const pct1 = (v) => (v === null ? '—' : (v > 0 ? '+' : v < 0 ? MINUS : '') + Math.abs(v).toFixed(1) + '%');
const pctAbs = (v) => Math.abs(v).toFixed(1) + '%';
const signedInt = (v) => (v > 0 ? '+' : v < 0 ? MINUS : '') + int(Math.abs(v));
const round1 = (v) => Math.round(v * 10) / 10;
const dash = (v) => (v === null ? '—' : int(v));
const range = (lo, hi) => (lo === null || hi === null ? null : int(lo) + '–' + int(hi));
const shortYear = (y) => '’' + y.slice(2, 4); // 2012-13 → ’12
const fall = (y) => 'Fall ' + y.slice(0, 4);
const unique = (a) => [...new Set(a)];
const by = (f) => (a, b) => (f(a) < f(b) ? -1 : f(a) > f(b) ? 1 : 0);
// swatch tokens: 1-4 series, 'muted' (context fill), 'ink' and 'text' (--muted ink, for reference lines)
const sw = (n) => (n === 'muted' ? 'var(--series-muted)' : n === 'ink' ? 'var(--ink)' : n === 'text' ? 'var(--muted)' : `var(--series-${n})`);
const round10 = (v) => Math.round(v / 10) * 10;
const round100 = (v) => Math.round(v / 100) * 100;

/* ---------------------------------------------------------------- load */
const D = {
  trend: load('district_trend.csv'),
  grades: load('district_grades.csv'),
  schoolTrend: load('school_trend.csv'),
  bands: load('compare_bands.csv'),
  schoolProj: load('school_proj.csv'),
  schoolProjYearly: load('school_proj_yearly.csv'),
  check: load('forecast_check_2025_26.csv'),
  volatility: load('volatility.csv'),
  national: load('national_k8.csv'),
  nearby: load('nearby_districts.csv'),
  il: load('il_districts_2019_2026.csv'),
  density: load('area_density.csv'),
  geometry: load('area_geometry.csv'),
  priv: load('private_k8.csv'),
  eths: load('eths_feeder.csv'),
  births: load('births.csv'),
};
const G9 = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
const gradeName = (g) => (g === 'K' ? 'Kindergarten' : 'Grade ' + g);
const gradeShort = (g) => (g === 'K' ? 'K' : 'Gr ' + g);
const trendAt = (y, f) => num((D.trend.find((r) => r.year === y) || {})[f]);
const gradeAt = (y, g) => num((D.grades.find((r) => r.year === y && r.grade === g) || {}).students);

/* ============================================================ summary */
const byYearGrade = {};
for (const r of D.grades) (byYearGrade[r.year] ||= {})[r.grade] = +r.students;
const sumGrades = (y, gs) => gs.reduce((s, g) => s + byYearGrade[y][g], 0);
const k8 = (y) => (byYearGrade[y] ? sumGrades(y, G9) : null);

/* Capacity, from the district's Nov. 6, 2026 utilization table
   (https://resources.finalsite.net/images/v1793999411/district65net/jvpg6fw1yuufwph9z6h5/UtilizationNov6.pdf):
   7,212 K-8 seats with Dewey and Lincolnwood closed (King Arts' 636 included).
   Today's buildings add Dewey (556) and Lincolnwood (about 384), Thrive65
   estimates using the district's method, for about 8,150. These are the only
   capacity figures on the page. */
const CAP_PLAN = 7212, CAP_NOW = 7212 + 556 + 384;
/* Of the 444 students lost (net) in fall 2020 and 2021, about 150 are still
   K-8 age; the rest are in high school or have graduated. A fixed figure. */
const LEFT_STILL_K8 = 150;

// Each class in school this fall next to its kindergarten size: grade index i
// started kindergarten in fall (2026 - i). Shared by the chart and the text.
const classesNow = G9.map((g, i) => ({ g, now: byYearGrade['2026-27'][g], atK: byYearGrade[`${2026 - i}-${String(2027 - i).slice(2)}`].K }));

// national comparison: K-8, fall 2019 = 100, latest national count fall 2024
const NAT_BASE = '2019-20', NAT_LAST = '2024-25';
const nat = {}; for (const r of D.national) nat[r.year] = r;
const idx = (v, b) => (v === null ? null : round1((v / b) * 100));
const d0 = k8(NAT_BASE), u0 = num(nat[NAT_BASE].us_k8), c0 = num(nat[NAT_BASE].cps_k8);
const natRows = D.national.map((r) => ({
  year: r.year, d65_k8: k8(r.year), d65_k8_idx: idx(k8(r.year), d0),
  us_k8: num(r.us_k8), us_k8_idx: idx(num(r.us_k8), u0), cps_k8: num(r.cps_k8), cps_k8_idx: idx(num(r.cps_k8), c0),
})).filter((r) => r.d65_k8_idx !== null || r.us_k8_idx !== null || r.cps_k8_idx !== null);
const natAt = (y) => natRows.find((r) => r.year === y);
const chg = (v) => round1(v - 100);

// nearby districts and the Cook County rank
const shortName = (n) => n.replace('Chicago Public Schools District 299', 'Chicago Public Schools')
  .replace('Evanston CCSD 65', 'District 65').replace(/ (CCSD|ESD|SD)/, '');
const subs = D.nearby.filter((r) => r.group === 'Nearby suburb').map((r) => +r.pct_change).sort((a, b) => a - b);
const median = subs.length % 2 ? subs[(subs.length - 1) / 2] : (subs[subs.length / 2 - 1] + subs[subs.length / 2]) / 2;
const nearbyPct = (grp) => +D.nearby.find((r) => r.group === grp).pct_change;
const cook = D.il.filter((r) => r.county === 'Cook' && r.type === 'Elementary District' && +r.enr_2018_19 >= 1500)
  .sort((a, b) => +a.pct_change - +b.pct_change);
const cookI = cook.findIndex((r) => r.district === 'Evanston CCSD 65');
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
const ahead = cook.slice(0, cookI).map((r) => shortName(r.district) + ' (' + pct1(+r.pct_change) + ')');
const aheadText = ahead.length > 1 ? ahead.slice(0, -1).join(', ') + ' and ' + ahead.slice(-1) : ahead.join('');

const peak = trendAt('2016-17', 'actual'), now = trendAt('2026-27', 'actual');
const t65 = (f) => trendAt('2031-32', 't65_' + f);
const privLast = +D.priv[D.priv.length - 1].private_k8;
const gap = (cap) => cap - t65('mid');
const fullPct = (cap) => Math.round(((cap - round100(gap(cap))) / cap) * 100);

const summary = {
  actual_2026: int(now),                                                    // {s-now}
  drop_since_peak: 'about ' + int(round10(peak - now)),                     // {s-drop}
  peak_2016: int(peak),                                                     // {s-peak}
  below_peak_pct: (Math.round((1 - now / peak) * 1000) / 10).toFixed(1) + '%', // {s-pct}
  nat_us_k8: pctAbs(chg(natAt(NAT_LAST).us_k8_idx)),                        // {s-us}
  nat_cps_k8: pctAbs(chg(natAt(NAT_LAST).cps_k8_idx)),                      // {s-cps}
  nat_d65_k8: pctAbs(chg(natAt(NAT_LAST).d65_k8_idx)),                      // {s-d65}
  nearby_n: String(subs.length),
  nearby_d65: pctAbs(nearbyPct('District 65')),
  nearby_median: pct1(round1(median)),
  nearby_grew: String(subs.filter((v) => v > 0).length),
  cook_n: String(cook.length),
  cook_rank: ORD[cookI] || cookI + 1 + 'th',
  cook_ahead: aheadText,
  classes_since_k: int(round10(classesNow.reduce((t, r) => t + r.atK - r.now, 0))), // {s-sincek}
  k_2026: int(gradeAt('2026-27', 'K')),                                     // {s-k}
  g8_2026: int(gradeAt('2026-27', '8')),                                    // {s-8}
  kofron_mid_2026: int(trendAt('2026-27', 'kofron_mid')),                   // {s-kmid}
  t65_2031: int(round10(t65('mid'))),                                       // {s-t65}
  t65_2031_range: 'range ' + int(round10(t65('low'))) + ' to ' + int(round10(t65('high'))), // {s-t65r}
  private_now: int(round10(privLast)),                                      // {s-priv}
  gap_now: 'about ' + int(round100(gap(CAP_NOW))),                          // {s-gap}
  gap_plan: 'about ' + int(round100(gap(CAP_PLAN))),                        // {s-gap2}
};

/* ===================================================== line charts */
/*
 * A chart spec, as read by charts.js and by _includes/chart.html (which
 * renders the legend and the no-JS table from the same object):
 *   { x: [...], xLabels: [...], xName, ticks: [x...], yMin?, yMax?, zero?,
 *     refs: [{at: index, label}], spans: [{from, to, label}],
 *     hrefs: [value | {value, label, below?}],
 *     series: [{label, swatch, style, values, display, dots?, hidden?, joinGaps?}]
 *             style: line | strong | dashed | dotted | dashdot
 *     bands:  [{label, swatch, low, high, display}],
 *     markers:[{at, value, swatch, label, shape?: 'diamond' | 'ring'}],
 *     labels: [{at, value, text, swatch?, anchor?: start|middle|end, dy?: em}],
 *     title?, note?, compact?, flag? }
 * `display` holds the preformatted strings shown in the tooltip and table. A
 * `hidden` series is drawn but left out of the tooltip and table (e.g. the
 * dotted bridge over a missing year); `joinGaps` draws across nulls.
 */
const series = (label, swatch, style, values, display) => ({ label, swatch: sw(swatch), style, values, display: display || values.map(dash) });
const band = (label, swatch, low, high) => ({ label, swatch: sw(swatch), low, high, display: low.map((l, i) => range(l, high[i])) });
const legendOf = (items) => items.map(([label, swatch, style]) => ({ label, swatch: sw(swatch), style }));
const ticksFrom = (x, wanted) => x.filter((v) => wanted.includes(v));
const lastIndex = (vals) => vals.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop();

const charts = {};

// 1. K-8 enrollment each fall
{
  const rows = D.trend.filter((r) => num(r.actual) !== null), x = rows.map((r) => r.year), a = rows.map((r) => num(r.actual));
  const pk = a.indexOf(Math.max(...a)), last = a.length - 1;
  charts.k8 = {
    legend: [],
    panels: [{
      x, xLabels: x, xName: 'School year', ticks: ticksFrom(x, ['2012-13', '2014-15', '2016-17', '2018-19', '2020-21', '2022-23', '2024-25', '2026-27']),
      yMin: 4000, yMax: 8000,
      series: [series('K-8 students', 1, 'strong', a)],
      markers: [{ at: pk, value: a[pk], swatch: sw(1), shape: 'dot' }],
      labels: [{ at: pk, value: a[pk], text: x[pk] + ': ' + int(a[pk]), anchor: 'middle', dy: -0.9, swatch: 'var(--ink)' },
        { at: last, value: a[last], text: x[last] + ': ' + int(a[last]), anchor: 'end', dy: 1.6, swatch: 'var(--ink)' }],
    }],
  };
}

// 2. Steeper than the nation and Chicago (K-8 only, actual counts)
{
  const x = natRows.map((r) => r.year), col = (f) => natRows.map((r) => r[f]);
  const disp = (f, raw, unit) => natRows.map((r) => (r[f] === null ? null : r[f].toFixed(1) + (r[raw] !== null ? ' (' + int(r[raw]) + unit + ')' : '')));
  const s = [series('Chicago Public Schools', 3, 'line', col('cps_k8_idx'), disp('cps_k8_idx', 'cps_k8', '')),
    series('U.S. public schools', 2, 'line', col('us_k8_idx'), disp('us_k8_idx', 'us_k8', ' thousand')),
    series('District 65', 1, 'strong', col('d65_k8_idx'), disp('d65_k8_idx', 'd65_k8', ''))];
  const vals = s.flatMap((q) => q.values).filter((v) => v !== null);
  charts.nation = {
    legend: legendOf([['District 65', 1, 'strong'], ['U.S. public schools', 2, 'line'], ['Chicago Public Schools', 3, 'line']]),
    panels: [{
      x, xLabels: x.map(shortYear), xName: 'Fall (fall 2019 = 100)',
      yMin: Math.min(60, Math.min(...vals) - 3), yMax: Math.max(110, Math.max(...vals) + 3),
      hrefs: [100], spans: [{ from: x.indexOf('2020-21'), to: x.indexOf('2021-22'), label: 'COVID' }],
      series: s,
      labels: s.map((q) => { const i = lastIndex(q.values); return { at: i, value: q.values[i], text: String(Math.round(q.values[i])), anchor: 'start', swatch: q.swatch }; }),
    }],
  };
}

// 4. Private schools inside the boundary
{
  const rows = D.priv, x = rows.map((r) => r.year), d = rows.map((r) => +r.d65_k8);
  const gi = rows.findIndex((r) => +r.private_incomplete === 1);
  const p = rows.map((r, i) => (i === gi ? null : +r.private_k8));
  const pDisp = rows.map((r, i) => 'about ' + int(+r.private_k8) + (i === gi ? ' (two schools missing from the state report)' : ''));
  const bridge = rows.map((r, i) => (gi > 0 && (i === gi - 1 || i === gi + 1) ? +r.private_k8 : null));
  const pct = (a, b) => (b < a ? MINUS : '+') + Math.abs(Math.round(((b - a) / a) * 100)) + '%';
  const L = rows.length - 1;
  const priv = series('Private and parochial schools', 2, 'strong', p, pDisp);
  charts.private = {
    legend: legendOf([['District 65', 1, 'strong'], ['Private and parochial schools', 2, 'strong']]),
    panels: [{
      x, xLabels: x, xName: 'School year', yMin: 0, yMax: 8000, zero: true,
      series: [{ ...series('Private, gap year', 2, 'dotted', bridge), hidden: true, joinGaps: true }, priv, series('District 65', 1, 'strong', d)],
      markers: gi > 0 ? [{ at: gi, value: +rows[gi].private_k8, swatch: sw(2), shape: 'ring', label: 'Private (incomplete report): about ' + int(+rows[gi].private_k8) }] : [],
      labels: [{ at: L, value: d[L], text: 'District 65: ' + int(d[L]) + ' (' + pct(d[0], d[L]) + ')', anchor: 'end', dy: 1.7, swatch: 'var(--ink)' },
        { at: L, value: p[L], text: 'Private: ' + int(p[L]) + ' (' + pct(+rows[0].private_k8, p[L]) + ')', anchor: 'end', dy: -0.9, swatch: 'var(--ink)' }],
    }],
  };
}

// 7. Births five years before each kindergarten class
{
  const rows = D.births, x = rows.map((r) => r.k_class), col = (f) => rows.map((r) => num(r[f]));
  const kof = col('kofron_births'), kx = col('kofron_trend'), rec = col('birth_records'), hold = col('held_flat'), pace = col('birth_pace'), ks = col('birth_kofron_slope');
  const i26 = x.indexOf('2026'), L = x.length - 1;
  charts.births = {
    legend: legendOf([['Kofron study data and trend', 'text', 'strong'], ['Cook County birth records', 1, 'strong'], ['Assumed range after 2023', 1, 'band'], ['Recent pace', 1, 'dotted']]),
    panels: [{
      x, xLabels: x.map((y) => '’' + y.slice(2)), xName: 'Kindergarten class (fall)', yMin: 400, yMax: 1100,
      refs: [{ at: i26, label: 'this fall' }],
      bands: [band('Assumed range after 2023', 1, ks, hold)],
      series: [series("Kofron's birth data", 'text', 'strong', kof), series("Kofron's trend line", 'text', 'dashed', kx),
        series('Recent pace', 1, 'dotted', pace), { ...series('Cook County birth records', 1, 'strong', rec), dots: true }],
      labels: [{ at: 0, value: kof[0], text: int(kof[0]), anchor: 'start', dy: -0.8, swatch: 'var(--ink)' },
        { at: i26, value: kx[i26], text: int(kx[i26]), anchor: 'start', dy: -0.8, swatch: 'var(--ink)' },
        { at: i26, value: rec[i26], text: int(rec[i26]), anchor: 'start', dy: 1.4, swatch: sw(1) },
        { at: L, value: hold[L], text: int(hold[L]), anchor: 'start', swatch: sw(1) },
        { at: L, value: pace[L], text: int(pace[L]), anchor: 'start', swatch: sw(1) },
        { at: L, value: ks[L], text: int(ks[L]), anchor: 'start', swatch: sw(1) }],
    }],
  };
}

// 8 and 9. K-8 actual vs the forecasts; forecasts to 2031-32 against capacity
{
  const panel = (aheadView) => {
    const rows = D.trend.filter((r) => r.year >= (aheadView ? '2016-17' : '2018-19')), x = rows.map((r) => r.year), col = (f) => rows.map((r) => num(r[f]));
    const L = x.length - 1, mid = col('kofron_mid'), mck = col('mckibben_2024');
    const p = {
      x, xLabels: x, xName: 'School year', ticks: ticksFrom(x, ['2016-17', '2018-19', '2020-21', '2022-23', '2024-25', '2026-27', '2028-29', '2031-32']),
      yMin: aheadView ? 3000 : 3500, yMax: aheadView ? 8500 : 7600,
      bands: [], series: [series('Kofron middle', 1, 'dashed', mid), series('McKibben', 4, 'dashdot', mck), series('Actual', 1, 'strong', col('actual'))],
      labels: [{ at: L, value: mid[L], text: int(mid[L]), anchor: 'start', swatch: sw(1) }],
    };
    if (mck[L] !== null) p.labels.push({ at: L, value: mck[L], text: int(mck[L]), anchor: 'start', swatch: sw(4) });
    if (!aheadView) p.bands.push(band('Kofron low to high', 1, col('kofron_low'), col('kofron_high')));
    else {
      const t = col('t65_mid');
      p.hrefs = [{ value: CAP_NOW, label: "Today's buildings: about 8,150 seats" }, { value: CAP_PLAN, label: 'After the two proposed closures: about 7,200', below: true }];
      p.bands.push(band('Thrive65 update, low to high', 2, col('t65_low'), col('t65_high')));
      p.series.splice(2, 0, series('Thrive65 update', 2, 'dotted', t));
      p.labels.push({ at: L, value: t[L], text: int(t[L]), anchor: 'start', swatch: sw(2) });
    }
    return p;
  };
  charts.forecast = {
    legend: legendOf([['Actual', 1, 'strong'], ['Kofron middle (shaded: low to high)', 1, 'dashed'], ['McKibben', 4, 'dashdot']]),
    panels: [panel(false)],
  };
  charts.ahead = {
    legend: legendOf([['Actual', 1, 'strong'], ['Kofron middle', 1, 'dashed'], ['McKibben', 4, 'dashdot'], ['Thrive65 update (shaded: low to high)', 2, 'dotted'], ['Building capacity', 'text', 'dotted']]),
    panels: [panel(true)],
  };
}

// Foot: K-5 and 6-8, actual vs Kofron, McKibben and the Thrive65 update
{
  const rows = D.bands.filter((r) => r.year >= '2016-17'), x = rows.map((r) => r.year), col = (f) => rows.map((r) => num(r[f]));
  const panel = (b, title) => {
    const vals = [`band_${b}_actual`, `kof_high_${b}`, `kof_low_${b}`, `t65_high_${b}`, `t65_low_${b}`, `mck_${b}`].flatMap(col).filter((v) => v !== null);
    return {
      title, x, xLabels: x, xName: 'School year', ticks: ticksFrom(x, ['2016-17', '2020-21', '2026-27', '2031-32']),
      yMin: Math.min(...vals) * 0.92, yMax: Math.max(...vals) * 1.03, refs: [{ at: x.indexOf('2026-27'), label: 'this fall' }],
      bands: [band('Kofron low to high', 1, col(`kof_low_${b}`), col(`kof_high_${b}`)), band('Thrive65 update, low to high', 2, col(`t65_low_${b}`), col(`t65_high_${b}`))],
      series: [series('Kofron middle', 1, 'dashed', col(`kof_mid_${b}`)), series('Thrive65 update from fall 2026, middle', 2, 'dashed', col(`t65_mid_${b}`)),
        series('McKibben forecast (2024)', 4, 'dashdot', col(`mck_${b}`)), series('Actual (official count)', 'ink', 'strong', col(`band_${b}_actual`))],
    };
  };
  charts.cmp = {
    legend: legendOf([['Actual (official count)', 'ink', 'strong'], ['Kofron middle', 1, 'dashed'], ['Kofron low to high', 1, 'band'],
      ['Thrive65 update from fall 2026, middle', 2, 'dashed'], ['Thrive65 update, low to high', 2, 'band'], ['McKibben forecast (2024)', 4, 'dashdot']]),
    panels: [panel('k5', 'Grades K-5'), panel('68', 'Grades 6-8')],
  };
}

// Foot: each school, actual and the Kofron forecast (small multiples)
const YEARS_ALL = unique(D.trend.map((r) => r.year)).sort();
{
  const schools = unique(D.schoolTrend.map((r) => r.school));
  charts.schools = {
    legend: legendOf([['Enrolled', 1, 'strong'], ['Kofron middle', 1, 'dashed'], ['Kofron low to high', 1, 'band']]),
    table: 'schools_actual',
    panels: schools.map((s) => {
      const rs = YEARS_ALL.map((y) => D.schoolTrend.find((r) => r.school === s && r.year === y) || {});
      const col = (f) => rs.map((r) => num(r[f]));
      const a = col('actual'), lastI = lastIndex(a);
      const p = {
        title: s, note: lastI === undefined ? '' : YEARS_ALL[lastI] + ': ' + int(a[lastI]), compact: true,
        x: YEARS_ALL, xLabels: YEARS_ALL, xName: 'School year', ticks: ['2012-13', '2021-22', '2031-32'], zero: true,
        refs: [{ at: YEARS_ALL.indexOf('2026-27') }], bands: [], series: [],
      };
      if (col('kofron_low').some((v) => v !== null)) {
        p.bands.push(band('Kofron low to high', 1, col('kofron_low'), col('kofron_high')));
        p.series.push(series('Kofron middle', 1, 'dashed', col('kofron_mid')));
      }
      p.series.push(series('Enrolled', 1, 'strong', a));
      return p;
    }),
  };
}

// Foot: each elementary school through 2031-32, today's boundaries vs the Nov. 6 proposal
{
  const rows = D.schoolProjYearly, schools = unique(rows.map((r) => r.school)), years = unique(rows.map((r) => r.year));
  const yMax = Math.max(...rows.map((r) => +r.high)) * 1.05;
  const fy28 = {}; for (const r of D.schoolProj) if (num(r.district_fy28_nov6) > 0) fy28[r.school] = +r.district_fy28_nov6;
  charts.schoolproj = {
    legend: legendOf([["Today's boundaries", 1, 'strong'], ['Nov. 6 proposal', 2, 'strong'], ['Low to high range', 'muted', 'band'], ["District's own fall 2027 projection", 2, 'diamond']]),
    table: 'none', // the schoolproj table below the figure carries every value
    panels: schools.map((s) => {
      const get = (b) => years.map((y) => rows.find((r) => r.school === s && r.boundaries === b && r.year === y));
      const t = get("Today's boundaries"), n = get('Nov. 6 proposal');
      const closes = Math.max(...n.map((r) => +r.mid)) === 0;
      const live = (rs, f) => rs.map((r) => (+r.mid === 0 ? null : +r[f]));
      const p = {
        title: s, note: 'fall 2026: ' + int(+t[0].mid), compact: true,
        x: years, xLabels: years, xName: 'Fall', ticks: [years[0], years[years.length - 1]], zero: true, yMax,
        bands: [band("Today's boundaries, low to high", 1, live(t, 'low'), live(t, 'high'))],
        series: [series("Today's boundaries", 1, 'strong', live(t, 'mid'))],
        markers: [],
      };
      if (closes) p.flag = 'Closes under Nov. 6 proposal';
      else {
        p.bands.push(band('Nov. 6 proposal, low to high', 2, live(n, 'low'), live(n, 'high')));
        p.series.push(series('Nov. 6 proposal', 2, 'strong', live(n, 'mid')));
      }
      if (fy28[s]) p.markers.push({ at: 1, value: fy28[s], swatch: sw(2), label: "District's own projection: " + int(fy28[s]) });
      return p;
    }),
  };
}

/* ========================================================= bar charts */
/*
 * Build-time horizontal bars (_includes/charts/bars.html). One model for every
 * bar chart: { zero?, legend, groups: [{label?, rows: [row]}] } where a row is
 *   { label, strong?, value, detail?, note?,
 *     bars:  [{offset, size, swatch, cls?}]   — overlaid; cls takes utilities
 *                                              (bar-inset = thinner, swatch-outline)
 *     stack: [{share, swatch, text?, label}], stackSize } — one segmented bar;
 *            share is the segment's fraction of the stack
 * offset/size are 0–1 of the axis domain, so CSS only positions.
 */
const bars = {};
const f4 = (v) => +v.toFixed(4);
const muted = (offset, size) => ({ offset: f4(offset), size: f4(size), swatch: sw('muted'), cls: 'swatch-outline' });

// 3. Nearby and peer districts: diverging bars around zero
{
  const rows = D.nearby.map((r) => ({ name: shortName(r.district), group: r.group, a: +r.enr_2018_19, b: +r.enr_2025_26, p: +r.pct_change, li: num(r.low_income_pct_2026), peer: r.district_peer || '' }))
    .sort((a, b) => a.p - b.p);
  const lo = Math.floor(Math.min(-30, Math.min(...rows.map((r) => r.p)) - 2) / 5) * 5, hi = Math.ceil(Math.max(15, Math.max(...rows.map((r) => r.p)) + 2) / 5) * 5;
  const pos = (v) => (v - lo) / (hi - lo);
  const swatch = (r) => (r.group === 'District 65' ? 1 : r.group === 'Chicago' ? 3 : r.peer ? 2 : 'muted');
  const peerText = (p) => (p === 'Both' ? 'Dec. 2025 memo and Sept. 2026 presentation' : p === 'Dec. 2025' ? 'Dec. 2025 memo' : p ? 'Sept. 2026 presentation' : '');
  bars.nearby = {
    zero: f4(pos(0)),
    legend: legendOf([['District 65', 1, 'box'], ['Chicago Public Schools', 3, 'box'], ['Peer district cited by District 65', 2, 'box'], ['Nearby suburban district', 'muted', 'outline']]),
    groups: [{ rows: rows.map((r) => {
      const o = pos(Math.min(0, r.p)), z = Math.abs(r.p) / (hi - lo);
      return { label: r.name, strong: r.group === 'District 65', value: pct1(r.p), bars: [swatch(r) === 'muted' ? muted(o, z) : { offset: f4(o), size: f4(z), swatch: sw(swatch(r)) }] };
    }) }],
    table: rows.map((r) => [r.name, r.group === 'Chicago' ? 'Chicago' : r.peer ? 'Peer (cited by District 65)' : r.group,
      int(r.a), int(r.b), pct1(r.p), r.li === null ? 'not reported' : Math.round(r.li) + '%', peerText(r.peer)]),
  };
}

// 5. ETHS classes by where they went to 8th grade, next to District 65's 8th grade the year before
const ETHS_SEGS = [['from_d65', 'District 65', 1], ['private_parochial', 'Private or parochial', 2], ['cps', 'Chicago Public Schools', 3],
  ['out_of_state_other_il', 'Out of state or country, other Illinois', 4], ['homeschool_other', 'Homeschool or other', 'text']];
{
  const rows = D.eths.map((r) => ({ ...r, g8: +r.d65_8th_prior_year, tot: ETHS_SEGS.reduce((a, [k]) => a + +r[k], 0) }));
  const max = Math.ceil(Math.max(...rows.map((r) => Math.max(r.g8, r.tot))) / 100) * 100;
  bars.eths = {
    zero: 0,
    legend: [{ label: 'District 65 8th grade, the year before', swatch: sw('muted'), style: 'outline' }].concat(ETHS_SEGS.map(([, n, c]) => ({ label: n, swatch: sw(c), style: 'box' }))),
    groups: rows.map((r) => ({
      label: r.grade_now + ': ' + r['class'] + ', entered ETHS in fall ' + r.entered_fall,
      rows: [
        { label: 'District 65 8th grade, fall ' + (+r.entered_fall - 1), value: int(r.g8), bars: [muted(0, r.g8 / max)] },
        { label: 'First-time ETHS freshmen', value: int(r.tot), stackSize: f4(r.tot / max),
          stack: ETHS_SEGS.map(([k, n, c], j) => ({ share: f4(+r[k] / r.tot), swatch: sw(c), text: j < 2 ? int(+r[k]) : '', label: n + ' ' + int(+r[k]) })) },
      ],
    })),
  };
}

// 6. Each grade this fall, next to its size in kindergarten
{
  const max = Math.ceil((Math.max(...classesNow.map((r) => Math.max(r.now, r.atK))) * 1.05) / 50) * 50;
  bars.classes = {
    zero: 0,
    legend: [{ label: 'Size in kindergarten', swatch: sw('muted'), style: 'outline' }, { label: 'Fall 2026', swatch: sw(1), style: 'box' }],
    groups: [{ rows: classesNow.map((r) => ({
      label: gradeName(r.g), value: int(r.now), detail: 'in K: ' + int(r.atK),
      bars: [muted(0, r.atK / max), { offset: 0, size: f4(r.now / max), swatch: sw(1), cls: 'bar-inset' }],
    })) }],
  };
}

// 10. What the district can change, next to the empty seats expected by 2031-32
{
  const items = [
    { n: 'Every private K-8 student in the boundary', v: round10(privLast), c: 2 },
    { n: 'Students who left in 2020-21, still K-8 age', v: LEFT_STILL_K8, c: 2 },
    { n: "Empty seats in 2031-32, today's buildings", v: round100(gap(CAP_NOW)), note: 'Buildings about ' + fullPct(CAP_NOW) + '% full' },
    { n: 'Empty seats in 2031-32, after the two proposed closures', v: round100(gap(CAP_PLAN)), note: 'Buildings about ' + fullPct(CAP_PLAN) + '% full' },
  ];
  const max = Math.max(...items.map((r) => r.v));
  bars.levers = {
    zero: 0,
    legend: [],
    groups: [{ rows: items.map((r) => ({ label: r.n, value: 'about ' + int(r.v), note: r.note || null,
      bars: [r.c ? { offset: 0, size: f4(r.v / max), swatch: sw(r.c) } : muted(0, r.v / max)] })) }],
  };
}

/* ============================================================== tables */
const cell = (t, b) => (b ? { t, b: true } : { t });
const tables = {};
{
  // How close was Kofron by school (2025-26)
  const rows = D.check.slice().sort((a, b) => +a.vs_mid_pct - +b.vs_mid_pct);
  tables.check = {
    caption: 'Kofron forecast vs. fall 2025 enrollment, by school',
    columns: ['School', '2021-22 actual', 'Kofron low', 'Kofron middle', 'Kofron high', '2025-26 actual', 'Actual vs. middle', 'Result'],
    rows: rows.map((r) => ({ cells: [cell(r.school), cell(int(+r.actual_2021_22)), cell(int(+r.kofron_low)), cell(int(+r.kofron_mid)), cell(int(+r.kofron_high)), cell(int(+r.actual_2025_26)),
      cell(pct1(+r.vs_mid_pct), Math.abs(+r.vs_mid_pct) >= 10), cell(r.within)] })),
  };
}
{
  // sortable: each cell carries a sort value `v` (number, or text for names/years); blanks sort last
  const rows = D.volatility.slice().sort((a, b) => +a.volatility_sd_pct - +b.volatility_sd_pct);
  const n = (v) => (v === null ? null : +v);
  const c = (t, v, b) => ({ ...cell(t, b), v });
  tables.vol = {
    caption: 'Enrollment stability by school, 2012-13 to 2026-27',
    sortable: true, sortedBy: 5,
    columns: ['School', 'Avg. 2012-20', '2025-26', '2025-26 vs. avg.', 'Avg. yearly change', 'Volatility', 'Worst year', 'Which year', 'Years down (of 13)', '2026-27', 'Change at redraw'],
    rows: rows.map((r) => ({ cells: [c(r.school, r.school), c(int(+r.avg_2012_2020), n(r.avg_2012_2020)), c(int(+r.y2025_26), n(r.y2025_26)),
      c(pct1(+r.change_vs_avg_pct), n(r.change_vs_avg_pct), +r.change_vs_avg_pct <= -25), c(pct1(+r.avg_yearly_change_pct), n(r.avg_yearly_change_pct)),
      c((+r.volatility_sd_pct).toFixed(1) + '%', n(r.volatility_sd_pct)), c(pct1(+r.worst_year_pct), n(r.worst_year_pct)), c(r.worst_year, r.worst_year), c(r.years_declined, n(r.years_declined)),
      c(r.y2026_27 === null ? 'closed' : int(+r.y2026_27), n(r.y2026_27)), c(r.boundary_change_2026_27 === null ? '' : pct1(+r.boundary_change_2026_27), n(r.boundary_change_2026_27))] })),
  };
}
{
  // How close each forecast came (middle series)
  const yr = (r) => +r.year.slice(0, 4), rows = D.bands;
  const calc = (pre, from, k5f, mf) => {
    const sel = rows.filter((r) => yr(r) >= from && yr(r) <= 2026);
    const e = (f, a) => sel.map((r) => ((num(r[f]) - num(r[a])) / num(r[a])) * 100);
    const ek = e(k5f, 'band_k5_actual'), em = e(mf, 'band_68_actual');
    const avg = (a) => (Math.round((a.reduce((s, v) => s + Math.abs(v), 0) / a.length) * 10) / 10).toFixed(1) + '%';
    const r31 = rows.find((r) => yr(r) === 2031);
    return { cells: [cell(pre), cell(from + '-' + String(from + 1).slice(2) + ' to 2026-27'), cell(avg(ek)), cell(pct1(round1(ek[ek.length - 1]))), cell(avg(em)), cell(pct1(round1(em[em.length - 1]))), cell(int(num(r31[k5f]))), cell(int(num(r31[mf])))] };
  };
  tables.accuracy = {
    caption: 'How close each forecast came (middle series)',
    columns: ['Forecast (middle series)', 'Years checked', 'K-5: average miss', 'K-5: miss in 2026-27', '6-8: average miss', '6-8: miss in 2026-27', 'K-5 in 2031-32', '6-8 in 2031-32'],
    rows: [calc('Kofron (2022), from fall 2021', 2022, 'kof_mid_k5', 'kof_mid_68'), calc('McKibben (2024), from fall 2024', 2025, 'mck_k5', 'mck_68')],
  };
}
{
  const f = (v) => (v === null ? '—' : int(+v));
  tables.schoolproj = {
    caption: 'Elementary school projections through 2031-32',
    columns: ['School', 'Fall 2026', "Today's boundaries: 2027", '2029', '2031', '2031 range', 'Nov. 6 proposal: 2027', "District's own 2027", '2029', '2031', '2031 range'],
    rows: D.schoolProj.map((r) => {
      const isTotal = r.school === 'Total K-5', closed = +r.nov6_mid_2027 === 0 && !isTotal;
      return { rule: isTotal, cells: [cell(r.school), cell(f(r.actual_2026)), cell(f(r.today_mid_2027)), cell(f(r.today_mid_2029)), cell(f(r.today_mid_2031)), cell(f(r.today_low_2031) + '–' + f(r.today_high_2031)),
        cell(closed ? 'closes' : f(r.nov6_mid_2027)), cell(closed ? '' : f(r.district_fy28_nov6)), cell(closed ? '' : f(r.nov6_mid_2029)), cell(closed ? '' : f(r.nov6_mid_2031)), cell(closed ? '' : f(r.nov6_low_2031) + '–' + f(r.nov6_high_2031))] };
    }),
  };
}
{
  let lvl = null;
  tables.density = {
    caption: 'Density by attendance area, 2026-27 boundaries',
    columns: ['Attendance area', 'Land (sq. mi.)', 'Enrolled, fall 2026', 'Enrolled per sq. mi.', 'Children 5-14 (2020)', 'Children per sq. mi.', 'All residents (2020)'],
    rows: D.density.map((r) => {
      const rule = lvl !== null && r.level !== lvl; lvl = r.level;
      return { rule, cells: [cell(r.area + (r.level === 'MS' ? ' (middle school)' : '')), cell((+r.land_sq_mi).toFixed(2)), cell(int(+r.enrolled_2026_27)), cell(int(+r.enrolled_per_sq_mi)),
        cell(int(+r.children_5_14_2020)), cell(int(+r.children_per_sq_mi)), cell(int(+r.population_2020))] };
    }),
  };
}
tables.classes = {
  caption: 'Each grade in fall 2026 and the same class in kindergarten',
  columns: ['Grade, fall 2026', 'Students now', 'In kindergarten', 'Change'],
  rows: classesNow.map((r) => ({ cells: [cell(gradeName(r.g)), cell(int(r.now)), cell(int(r.atK)), cell(signedInt(r.now - r.atK))] })),
};
tables.eths = {
  caption: 'First-time ETHS freshmen by where they went to 8th grade',
  columns: ['Class', 'District 65 8th grade, the fall before'].concat(ETHS_SEGS.map(([, n]) => n)).concat(['First-time freshmen']),
  rows: D.eths.map((r) => { const tot = ETHS_SEGS.reduce((a, [k]) => a + +r[k], 0);
    return { cells: [cell(r['class'] + ' (' + r.grade_now.toLowerCase() + ')'), cell(int(+r.d65_8th_prior_year))]
      .concat(ETHS_SEGS.map(([k]) => cell(int(+r[k]) + ' (' + Math.round((+r[k] / tot) * 100) + '%)'))).concat([cell(int(tot))]) }; }),
};
tables.levers = {
  caption: 'Students each possibility could add, and the empty seats expected by 2031-32',
  columns: ['Possibility', 'About'],
  rows: bars.levers.groups[0].rows.map((r) => ({ cells: [cell(r.label + (r.note ? ' (' + r.note.toLowerCase() + ')' : '')), cell(r.value.replace('about ', ''))] })),
};
tables.nearby = {
  caption: 'Enrollment change, 2018-19 to 2025-26, nearby and peer districts',
  columns: ['District', 'Group', '2018-19', '2025-26', 'Change', 'Low-income, 2025-26', 'Cited as a peer by District 65'],
  rows: bars.nearby.table.map((c) => ({ cells: c.map((t, i) => cell(t, i === 0 && t === 'District 65')) })),
};
{
  const schools = unique(D.schoolTrend.map((r) => r.school)), years = YEARS_ALL.filter((y) => y <= '2026-27');
  tables.schools_actual = {
    caption: 'Students enrolled in each school building, fall 2012 to fall 2026',
    columns: ['School'].concat(years),
    rows: schools.map((s) => ({ cells: [cell(s)].concat(years.map((y) => cell(dash(num((D.schoolTrend.find((r) => r.school === s && r.year === y) || {}).actual))))) })),
  };
}

/* ================================================================= map */
/*
 * Three maps share ONE projection fitted to the union of every shape, so
 * switching maps never shifts or rescales. Equirectangular with x scaled by
 * cos(mid-latitude): over ~8 sq. mi. it is indistinguishable from Mercator.
 * Each measure gets one color domain across every map that shows it.
 */
const map = (() => {
  const geo = D.geometry.map((r) => ({ ...r, g: JSON.parse(r.geometry) }));
  const polys = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []);
  const pts = geo.flatMap((r) => (r.g.type === 'Point' ? [r.g.coordinates] : polys(r.g).flat(2)));
  const lons = pts.map((p) => p[0]), lats = pts.map((p) => p[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const k = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const W = 300, PAD = 8, sx = (W - 2 * PAD) / ((maxLon - minLon) * k);
  const H = Math.round((maxLat - minLat) * sx + 2 * PAD);
  const proj = ([lon, lat]) => [PAD + (lon - minLon) * k * sx, PAD + (maxLat - lat) * sx];
  const r1 = (v) => Math.round(v * 10) / 10;
  const pathOf = (g) => polys(g).map((poly) => poly.map((ring) => 'M' + ring.map((p) => proj(p).map(r1).join(',')).join('L') + 'Z').join('')).join('');
  // label anchor: area-weighted centroid of the largest outer ring
  const centroid = (g) => {
    let best = null, bestA = 0;
    for (const poly of polys(g)) {
      const ring = poly[0].map(proj); let a = 0, cx = 0, cy = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
        a += f; cx += (ring[j][0] + ring[i][0]) * f; cy += (ring[j][1] + ring[i][1]) * f;
      }
      if (Math.abs(a) > bestA) { bestA = Math.abs(a); best = [cx / (3 * a), cy / (3 * a)]; }
    }
    return best.map(r1);
  };
  /* Label placement: start at the centroid, then try nearby spots until the
     two-line label (name over value) clears every school dot on that map and
     its centre stays inside the area. Sizes are in viewBox units at the label
     cap (11 units, see .choropleth-label), so the check holds at every width. */
  const FS = 11, insideRing = (pt, ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const largestRing = (g) => polys(g).map((poly) => poly[0].map(proj)).sort((a, b) => b.length - a.length)[0];
  const placeLabel = (a, dots) => {
    const [cx, cy] = centroid(a.g), ring = largestRing(a.g);
    const w = Math.max(a.name.length, 5) * FS * 0.6, h = FS * 2.4, r = FS * 0.45;
    // label box spans [x - w/2, x + w/2] × [y - 1.1 FS, y + 1.3 FS] around the anchor
    const clear = (x, y) => dots.every((d) => d.x < x - w / 2 - r || d.x > x + w / 2 + r || d.y < y - FS * 1.1 - r || d.y > y + FS * 1.3 + r);
    const steps = [[0, 0], [0, -h * 0.6], [0, h * 0.6], [0, -h], [0, h], [-w * 0.4, 0], [w * 0.4, 0], [-w * 0.4, -h * 0.6], [w * 0.4, -h * 0.6], [-w * 0.4, h * 0.6], [w * 0.4, h * 0.6]];
    for (const [dx, dy] of steps) {
      const x = cx + dx, y = cy + dy;
      if (clear(x, y) && insideRing([x, y], ring)) return [x, y];
    }
    return [cx, cy];
  };

  const dens = {}; for (const r of D.density) dens[r.level + ':' + r.area] = r;
  const proj31 = {}; for (const r of D.schoolProj) proj31[r.school] = r;
  const M = {
    enrolled: { label: 'Enrolled students per sq. mi., fall 2026' },
    projected: { label: 'Projected students per sq. mi., fall 2031' },
    children: { label: 'Resident children ages 5-14 per sq. mi., 2020 census' },
  };
  const maps = [
    { id: 'ms', label: 'Middle school areas', measures: ['enrolled', 'children'], areas: geo.filter((r) => r.kind === 'area' && r.level === 'MS'),
      schools: geo.filter((r) => r.kind === 'school' && r.level === 'MS'), note: 'Projections are for elementary schools only.' },
    { id: 'es', label: 'Elementary areas, 2026-27 boundaries', default: true, measures: ['enrolled', 'projected', 'children'], areas: geo.filter((r) => r.kind === 'area' && r.level === 'ES'),
      schools: geo.filter((r) => r.kind === 'school' && r.level !== 'MS') },
    { id: 'nov6', label: 'Elementary areas, Nov. 6 proposal', measures: ['projected'], areas: geo.filter((r) => r.kind === 'area_nov6'),
      schools: geo.filter((r) => r.kind === 'school' && r.level !== 'MS' && r.name !== 'Dewey' && r.name !== 'Lincolnwood') },
  ];
  // raw per-area measure values
  const value = (m, a, measure) => {
    if (m.id === 'nov6') {
      const q = proj31[a.name], L = +a.land_sq_mi;
      if (a.name === 'King Arts' || !q) return null;
      return { v: +q.nov6_mid_2031 / L, n: +q.nov6_mid_2031, lo: +q.nov6_low_2031, hi: +q.nov6_high_2031 };
    }
    const d = dens[a.level + ':' + a.name];
    if (measure === 'enrolled') return { v: +d.enrolled_per_sq_mi, n: +d.enrolled_2026_27 };
    if (measure === 'children') return { v: +d.children_per_sq_mi, n: +d.children_5_14_2020 };
    const q = proj31[a.name]; if (!q) return null;
    return { v: +q.today_mid_2031 / +d.land_sq_mi, n: +q.today_mid_2031, lo: +q.today_low_2031, hi: +q.today_high_2031 };
  };
  // one domain per measure across every map that shows it
  for (const key of Object.keys(M)) {
    const all = maps.flatMap((m) => (m.measures.includes(key) ? m.areas.map((a) => value(m, a, key)) : [])).filter(Boolean).map((x) => Math.round(x.v));
    M[key].max = Math.ceil((Math.max(...all) * 1.05) / 100) * 100;
    M[key].maxLabel = int(M[key].max);
  }
  const out = maps.map((m) => ({
    id: m.id, label: m.label, default: !!m.default, note: m.note || null,
    measures: m.measures.map((k2) => ({ id: k2, label: M[k2].label })),
    areas: m.areas.map((a) => {
      const dots = m.schools.map((sc) => { const [x, y] = proj(sc.g.coordinates); return { x, y }; });
      const [lx, ly] = placeLabel(a, dots);
      const values = {}, parts = [];
      for (const key of m.measures) {
        const x = value(m, a, key);
        values[key] = x ? { t: +(Math.round(x.v) / M[key].max).toFixed(3), label: int(Math.round(x.v)) } : null;
        if (!x) continue;
        const what = key === 'enrolled' ? 'Enrolled fall 2026' : key === 'children' ? 'Children 5-14, 2020' : 'Projected fall 2031';
        parts.push(what + ': ' + (key === 'projected' ? 'about ' : '') + int(x.n) + (x.lo !== undefined ? ' (' + int(x.lo) + '–' + int(x.hi) + ')' : '') + ', ' + int(Math.round(x.v)) + ' per sq. mi.');
      }
      const empty = m.measures.every((key) => !values[key]);
      const kind = m.id === 'ms' ? ' middle school area' : m.id === 'nov6' ? ' (Nov. 6 proposed area)' : ' attendance area';
      const title = a.name + kind + '. Land: ' + (+a.land_sq_mi).toFixed(2) + ' sq. mi. ' +
        (empty ? 'Most King Arts students come from across the district through the magnet lottery, so density is not shown.' : parts.join('. ') + '.');
      const first = values[m.measures[0]];
      return { name: a.name, d: pathOf(a.g), x: r1(lx), y: r1(ly), empty, values, t: first ? first.t : 0, label: first ? first.label : 'magnet', title };
    }),
    schools: m.schools.map((s) => { const [x, y] = proj(s.g.coordinates).map(r1); return { name: s.name, x, y }; }),
  }));
  return { viewBox: `0 0 ${W} ${H}`, measures: M, maps: out };
})();
{
  const rows = map.maps.find((m) => m.id === 'nov6');
  tables.density_nov6 = {
    caption: 'Projected students per sq. mi., fall 2031, under the Nov. 6 proposal',
    columns: ['Proposed area', 'Land (sq. mi.)', 'Projected fall 2031', '2031 range', 'Per sq. mi.'],
    rows: D.geometry.filter((r) => r.kind === 'area_nov6').map((a) => {
      const q = D.schoolProj.find((r) => r.school === a.name), magnet = a.name === 'King Arts';
      return { cells: [cell(a.name), cell((+a.land_sq_mi).toFixed(2)), cell(q ? int(+q.nov6_mid_2031) : '—'), cell(q ? int(+q.nov6_low_2031) + '–' + int(+q.nov6_high_2031) : '—'),
        cell(magnet ? 'magnet (not shown)' : q ? int(Math.round(+q.nov6_mid_2031 / +a.land_sq_mi)) : '—')] };
    }),
  };
  void rows;
}

/* ============================================================== write */
mkdirSync(OUT, { recursive: true });
const write = (name, obj) => { writeFileSync(join(OUT, name), JSON.stringify(obj, null, 1) + '\n'); console.log('wrote _data/enrollment/' + name); };
write('summary.json', summary);
write('charts.json', charts);
for (const b of Object.values(bars)) delete b.table; // the table copy lives in tables.json
write('bars.json', bars);
write('tables.json', tables);
write('map.json', map);
