#!/usr/bin/env node
/*
 * Enrollment page data prep: data-src/enrollment/*.csv → _data/enrollment/*.json
 *
 * Run by hand whenever the source CSVs change:   npm run data:enrollment
 * Commit both the source CSVs and the generated JSON. Nothing here runs in CI
 * or in the browser: the page (_posts/…-district-65-enrollment-forecasts.md)
 * renders numbers, tables, bar/dot charts, the heatmap and the maps from this
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
const sw = (n) => (n === 'muted' ? 'var(--series-muted)' : `var(--series-${n})`);

/* ---------------------------------------------------------------- load */
const D = {
  trend: load('district_trend.csv'),
  grades: load('district_grades.csv'),
  schoolTrend: load('school_trend.csv'),
  rerun: load('kofron_rerun_2020.csv'),
  bands: load('compare_bands.csv'),
  schoolProj: load('school_proj.csv'),
  schoolProjYearly: load('school_proj_yearly.csv'),
  check: load('forecast_check_2025_26.csv'),
  current: load('current_2026_27.csv'),
  feeder: load('feeder_grades_2026_27.csv'),
  volatility: load('volatility.csv'),
  national: load('national_k8.csv'),
  nearby: load('nearby_districts.csv'),
  il: load('il_districts_2019_2026.csv'),
  density: load('area_density.csv'),
  geometry: load('area_geometry.csv'),
};
const G9 = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
const gradeName = (g) => (g === 'K' ? 'Kindergarten' : 'Grade ' + g);
const gradeShort = (g) => (g === 'K' ? 'K' : 'Gr ' + g);
const trendAt = (y, f) => num((D.trend.find((r) => r.year === y) || {})[f]);
const gradeAt = (y, g) => num((D.grades.find((r) => r.year === y && r.grade === g) || {}).students);

/* ============================================================ summary */
const byYearGrade = {};
for (const r of D.grades) (byYearGrade[r.year] ||= {})[r.grade] = +r.students;
const gradeYears = Object.keys(byYearGrade).sort();
const sumGrades = (y, gs) => gs.reduce((s, g) => s + byYearGrade[y][g], 0);
const k8 = (y) => (byYearGrade[y] ? sumGrades(y, G9) : null);

// COVID-era losses and the decline since the peak (was dash.calc 'change_summary')
const cont = (y, p) => sumGrades(y, G9.slice(1)) - sumGrades(p, G9.slice(0, 8));
const covid = cont('2020-21', '2019-20') + cont('2021-22', '2020-21');
const covidBase = sumGrades('2019-20', G9.slice(0, 8));
let entry = 0, continuing = 0;
for (let i = gradeYears.indexOf('2017-18'); i < gradeYears.length; i++) {
  const y = gradeYears[i], p = gradeYears[i - 1];
  entry += byYearGrade[y].K - byYearGrade[p]['8'];
  continuing += cont(y, p);
}
const sinceTotal = entry + continuing;

// the fall 2020 kindergarten class, now in 6th grade (was 'cohorts')
const k20 = byYearGrade['2020-21'].K, k20now = byYearGrade['2026-27']['6'];

// national comparison (was 'national_compare' / 'national_summary')
const NAT_BASE = '2019-20';
const nat = {}; for (const r of D.national) nat[r.year] = r;
const idx = (v, b) => (v === null ? null : round1((v / b) * 100));
const d0 = k8(NAT_BASE), dk0 = byYearGrade[NAT_BASE].K;
const u0 = num(nat[NAT_BASE].us_k8), uk0 = num(nat[NAT_BASE].us_k), c0 = num(nat[NAT_BASE].cps_k8);
const km0 = trendAt('2021-22', 'kofron_mid'), a21 = k8('2021-22');
const natRows = D.national.map((r) => {
  const y = r.year, d = k8(y), km = trendAt(y, 'kofron_mid');
  return {
    year: y, d65_k8: d, d65_k8_idx: idx(d, d0), d65_k: byYearGrade[y] ? byYearGrade[y].K : null,
    d65_k_idx: byYearGrade[y] ? idx(byYearGrade[y].K, dk0) : null,
    us_k8: num(r.us_k8), us_k8_idx: idx(num(r.us_k8), u0), us_k: num(r.us_k), us_k_idx: idx(num(r.us_k), uk0),
    cps_k8: num(r.cps_k8), cps_k8_idx: idx(num(r.cps_k8), c0),
    us_k8_proj_idx: idx(num(r.us_k8_projected), u0),
    d65_kofron_idx: y >= '2026-27' && km !== null ? idx((a21 * km) / km0, d0) : null,
  };
});
const natAt = (y) => natRows.find((r) => r.year === y);
const chg = (v) => round1(v - 100);

// nearby districts (was 'nearby_summary') and the Cook County rank ('cook_rank')
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

const summary = {
  actual_2026: int(trendAt('2026-27', 'actual')),
  peak_2016: int(trendAt('2016-17', 'actual')),
  below_peak_pct: (Math.round((1 - trendAt('2026-27', 'actual') / trendAt('2016-17', 'actual')) * 1000) / 10).toFixed(1) + '%',
  kofron_mid_2026: int(trendAt('2026-27', 'kofron_mid')),
  kofron_low_2026: int(trendAt('2026-27', 'kofron_low')),
  kofron_high_2026: int(trendAt('2026-27', 'kofron_high')),
  kofron_mid_2031: int(trendAt('2031-32', 'kofron_mid')),
  district_proj_2030: int(trendAt('2030-31', 'district_proj_2025')),
  k_2026: int(gradeAt('2026-27', 'K')),
  g8_2026: int(gradeAt('2026-27', '8')),
  covid_loss: int(Math.abs(covid)),
  covid_loss_signed: signedInt(covid),
  covid_pct: (Math.round((-covid / covidBase) * 1000) / 10).toFixed(1) + '%',
  since_peak_total: signedInt(sinceTotal),
  since_peak_entry: signedInt(entry),
  since_peak_continuing: signedInt(continuing),
  entry_share_pct: Math.round((entry / sinceTotal) * 100) + '%',
  k2020_now: int(k20now),
  k2020_k: int(k20),
  k2020_pct: (Math.round((k20now / k20) * 1000) / 10).toFixed(1) + '%',
  nat_us_k8: pctAbs(chg(natAt('2023-24').us_k8_idx)),
  nat_d65_k8: pctAbs(chg(natAt('2023-24').d65_k8_idx)),
  nat_cps_k8: pctAbs(chg(natAt('2023-24').cps_k8_idx)),
  nat_cps_k8_2025: pctAbs(chg(natAt('2025-26').cps_k8_idx)),
  nat_d65_k8_2025: pctAbs(chg(natAt('2025-26').d65_k8_idx)),
  nat_us_k: (chg(natAt('2023-24').us_k_idx) < 0 ? MINUS : '+') + pctAbs(chg(natAt('2023-24').us_k_idx)),
  nat_d65_k: (chg(natAt('2023-24').d65_k_idx) < 0 ? MINUS : '+') + pctAbs(chg(natAt('2023-24').d65_k_idx)),
  nearby_n: String(subs.length),
  nearby_d65: pctAbs(nearbyPct('District 65')),
  nearby_median: pct1(round1(median)),
  nearby_grew: String(subs.filter((v) => v > 0).length),
  nearby_cps: pctAbs(nearbyPct('Chicago')),
  cook_n: String(cook.length),
  cook_rank: ORD[cookI] || cookI + 1 + 'th',
  cook_ahead: aheadText,
};

/* ===================================================== line charts */
/*
 * A chart spec, as read by charts.js and by _includes/chart.html (which
 * renders the legend and the no-JS table from the same object):
 *   { x: [...], xLabels: [...], xName, ticks: [x...], yMin?, yMax?, zero?,
 *     refs: [{at: index, label}], hrefs: [value], spans: [{from, to, label}],
 *     series: [{label, swatch, style, values, display}]   style: line | strong | dashed | dotted
 *     bands:  [{label, swatch, low, high, display}],
 *     markers:[{at, value, swatch, label}], title?, note? }
 * `display` holds the preformatted strings shown in the tooltip and table.
 */
const series = (label, swatch, style, values, display) => ({ label, swatch: sw(swatch), style, values, display: display || values.map(dash) });
const band = (label, swatch, low, high) => ({ label, swatch: sw(swatch), low, high, display: low.map((l, i) => range(l, high[i])) });
const legendOf = (items) => items.map(([label, swatch, style]) => ({ label, swatch: sw(swatch), style }));
const ticksFrom = (x, wanted) => x.filter((v) => wanted.includes(v));

const charts = {};

// District trend vs the forecasts
{
  const x = D.trend.map((r) => r.year), col = (f) => D.trend.map((r) => num(r[f]));
  charts.trend = {
    legend: legendOf([['Actual', 1, 'strong'], ['Kofron middle', 2, 'dashed'], ['Kofron low to high', 2, 'band'],
      ['Kofron "snapshot"', 2, 'dotted'], ['District projection (2025)', 4, 'line']]),
    panels: [{
      x, xLabels: x, xName: 'School year', ticks: ticksFrom(x, ['2012-13', '2016-17', '2021-22', '2026-27', '2031-32']),
      yMin: 3000,
      bands: [band('Kofron low to high', 2, col('kofron_low'), col('kofron_high'))],
      series: [series('Kofron middle', 2, 'dashed', col('kofron_mid')), series('Kofron "snapshot"', 2, 'dotted', col('kofron_snapshot')),
        series('District projection (2025)', 4, 'line', col('district_proj_2025')), series('Actual', 1, 'strong', col('actual'))],
    }],
  };
}

// Kofron method rerun from fall 2020: two panels
{
  const rows = D.rerun.filter((r) => r.year >= '2016-17'), x = rows.map((r) => r.year), col = (f) => rows.map((r) => num(r[f]));
  const all = rows.flatMap((r) => ['actual', 'high_births_falling', 'snapshot_births_falling', 'high_births_data', 'snapshot_births_data'].map((f) => num(r[f]))).filter((v) => v !== null);
  const yMin = Math.floor((Math.min(...all) - 200) / 500) * 500, yMax = Math.ceil((Math.max(...all) + 100) / 500) * 500;
  const panel = (key, title) => {
    const mid = col('mid_' + key).map((v, i) => (x[i] === '2020-21' ? null : v)); // the start year is the actual count
    return {
      title, x, xLabels: x, xName: 'School year', ticks: ticksFrom(x, ['2016-17', '2020-21', '2026-27', '2030-31', '2034-35']),
      yMin, yMax, refs: [{ at: x.indexOf('2020-21'), label: 'start, fall 2020' }],
      bands: [band('Low to high series', 3, col('low_' + key), col('high_' + key))],
      series: [series('Snapshot', 3, 'dotted', col('snapshot_' + key)), series('Middle series', 3, 'dashed', mid), series('Actual', 1, 'strong', col('actual'))],
    };
  };
  charts.rerun = {
    legend: legendOf([['Actual', 1, 'strong'], ['Middle series', 3, 'dashed'], ['Low to high series', 3, 'band'], ['Snapshot (last 2 years only)', 3, 'dotted']]),
    panels: [panel('births_falling', "If births keep falling (Kofron's straight-line trend)"), panel('births_data', 'Using birth records through 2023')],
  };
}

// Kofron vs the Thrive65 rerun, K-5 and 6-8, with a births toggle
{
  const rows = D.bands.filter((r) => r.year >= '2016-17'), x = rows.map((r) => r.year), col = (f) => rows.map((r) => num(r[f]));
  const panel = (b, title, mode) => {
    const vals = ['actual'].map((k) => col(`band_${b}_actual`)).concat(['kof_high', 'kof_low', 't65_high_falling', 't65_low_falling', 't65_high_data', 't65_low_data'].map((k) => col(`${k}_${b}`)))
      .flat().filter((v) => v !== null);
    return {
      title, x, xLabels: x, xName: 'School year', ticks: ticksFrom(x, ['2016-17', '2020-21', '2026-27', '2031-32', '2034-35']),
      yMin: Math.min(...vals) * 0.92, yMax: Math.max(...vals) * 1.03,
      refs: [{ at: x.indexOf('2026-27'), label: 'this fall' }],
      bands: [band('Kofron low to high', 2, col(`kof_low_${b}`), col(`kof_high_${b}`)), band('Our rerun low to high', 3, col(`t65_low_${mode}_${b}`), col(`t65_high_${mode}_${b}`))],
      series: [series('Kofron middle', 2, 'dashed', col(`kof_mid_${b}`)), series('Our rerun middle', 3, 'dashed', col(`t65_mid_${mode}_${b}`)),
        series('Actual (official count)', 1, 'strong', col(`band_${b}_actual`))],
    };
  };
  const legend = legendOf([['Actual (official count)', 1, 'strong'], ['Kofron middle', 2, 'dashed'], ['Kofron low to high', 2, 'band'], ['Our rerun middle', 3, 'dashed'], ['Our rerun low to high', 3, 'band']]);
  charts.cmp = {
    legend,
    variantLabel: 'Our rerun after 2025',
    variants: [
      { id: 'data', label: 'Birth records through 2023', panels: [panel('k5', 'Grades K-5', 'data'), panel('68', 'Grades 6-8', 'data')] },
      { id: 'falling', label: "Kofron's straight-line births", panels: [panel('k5', 'Grades K-5', 'falling'), panel('68', 'Grades 6-8', 'falling')] },
    ],
  };
}

// Each school: actual and the Kofron forecast (small multiples)
const YEARS_ALL = unique(D.trend.map((r) => r.year)).sort();
{
  const schools = unique(D.schoolTrend.map((r) => r.school));
  charts.schools = {
    legend: legendOf([['Enrolled', 1, 'strong'], ['Kofron middle', 2, 'dashed'], ['Kofron low to high', 2, 'band']]),
    table: 'schools_actual',
    panels: schools.map((s) => {
      const rs = YEARS_ALL.map((y) => D.schoolTrend.find((r) => r.school === s && r.year === y) || {});
      const col = (f) => rs.map((r) => num(r[f]));
      const a = col('actual'), lastI = a.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop();
      const p = {
        title: s, note: lastI === undefined ? '' : YEARS_ALL[lastI] + ': ' + int(a[lastI]), compact: true,
        x: YEARS_ALL, xLabels: YEARS_ALL, xName: 'School year', ticks: ['2012-13', '2021-22', '2031-32'], zero: true,
        refs: [{ at: YEARS_ALL.indexOf('2026-27') }], bands: [], series: [],
      };
      if (col('kofron_low').some((v) => v !== null)) {
        p.bands.push(band('Kofron low to high', 2, col('kofron_low'), col('kofron_high')));
        p.series.push(series('Kofron middle', 2, 'dashed', col('kofron_mid')));
      }
      p.series.push(series('Enrolled', 1, 'strong', a));
      return p;
    }),
  };
}

// Each elementary school through 2031-32: today's boundaries vs the Nov. 6 proposal
{
  const rows = D.schoolProjYearly, schools = unique(rows.map((r) => r.school)), years = unique(rows.map((r) => r.year));
  const yMax = Math.max(...rows.map((r) => +r.high)) * 1.05;
  const fy28 = {}; for (const r of D.schoolProj) if (num(r.district_fy28_nov6) > 0) fy28[r.school] = +r.district_fy28_nov6;
  charts.schoolproj = {
    legend: legendOf([["Today's boundaries", 1, 'strong'], ['Nov. 6 proposal', 4, 'strong'], ['Low to high range', 'muted', 'band'], ["District's own fall 2027 projection", 4, 'diamond']]),
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
        p.bands.push(band('Nov. 6 proposal, low to high', 4, live(n, 'low'), live(n, 'high')));
        p.series.push(series('Nov. 6 proposal', 4, 'strong', live(n, 'mid')));
      }
      if (fy28[s]) p.markers.push({ at: 1, value: fy28[s], swatch: sw(4), label: "District's own projection: " + int(fy28[s]) });
      return p;
    }),
  };
}

// Feeder patterns: students per grade, fall 2026
{
  const feeders = unique(D.feeder.map((r) => r.feeder));
  const legend = feeders.map((f, i) => ({ label: f === 'King Arts' ? 'King Arts (K-8 magnet)' : f + ' feeder', swatch: sw(i + 1), style: f === 'King Arts' ? 'dashed' : 'line' }));
  charts.feeder = {
    legend,
    panels: [{
      x: G9, xLabels: G9.map(gradeShort), xName: 'Grade', ticks: G9, zero: true, dots: true,
      refs: [{ at: 5.5, label: 'middle school' }],
      bands: [],
      series: feeders.map((f, i) => series(legend[i].label, i + 1, f === 'King Arts' ? 'dashed' : 'line',
        G9.map((g) => num((D.feeder.find((r) => r.feeder === f && r.grade === g) || {}).students)))),
    }],
  };
}

// National comparison: two panels, fall 2019 = 100
{
  const panel = (isK8) => {
    const rows = natRows.filter((r) => isK8 || r.year <= '2026-27'), x = rows.map((r) => r.year), col = (f) => rows.map((r) => r[f]);
    const disp = (f, raw, unit) => rows.map((r) => (r[f] === null ? null : r[f].toFixed(1) + (raw && r[raw] !== null ? ' (' + int(r[raw]) + unit + ')' : '')));
    const s = isK8
      ? [series('District 65 forecast (Kofron middle)', 1, 'dashed', col('d65_kofron_idx'), disp('d65_kofron_idx')),
        series('U.S. forecast (NCES)', 3, 'dashed', col('us_k8_proj_idx'), disp('us_k8_proj_idx')),
        series('Chicago Public Schools', 4, 'line', col('cps_k8_idx'), disp('cps_k8_idx', 'cps_k8', '')),
        series('U.S. public', 3, 'line', col('us_k8_idx'), disp('us_k8_idx', 'us_k8', ' thousand')),
        series('District 65', 1, 'strong', col('d65_k8_idx'), disp('d65_k8_idx', 'd65_k8', ''))]
      : [series('U.S. public', 3, 'line', col('us_k_idx'), disp('us_k_idx', 'us_k', ' thousand')),
        series('District 65', 1, 'strong', col('d65_k_idx'), disp('d65_k_idx', 'd65_k', ''))];
    const vals = s.flatMap((q) => q.values).filter((v) => v !== null);
    return {
      title: isK8 ? 'All grades, K-8' : 'Kindergarten', x, xLabels: x, xName: 'Fall (fall 2019 = 100)',
      ticks: ticksFrom(x, ['2012-13', '2016-17', '2019-20', '2023-24', '2026-27', '2031-32']),
      yMin: Math.min(60, Math.min(...vals) - 3), yMax: Math.max(110, Math.max(...vals) + 3),
      hrefs: [100], spans: [{ from: x.indexOf('2020-21'), to: x.indexOf('2021-22'), label: 'COVID' }],
      bands: [], series: s,
    };
  };
  charts.national = {
    legend: legendOf([['District 65', 1, 'strong'], ['U.S. public schools', 3, 'line'], ['Chicago Public Schools (K-8 panel)', 4, 'line'], ['Forecast', 'muted', 'dashed']]),
    panels: [panel(true), panel(false)],
  };
}

/* ========================================================= HTML charts */
// Nearby and peer districts: diverging bars, pre-sorted
const bars = (() => {
  const rows = D.nearby.map((r) => ({ name: shortName(r.district), group: r.group, a: +r.enr_2018_19, b: +r.enr_2025_26, p: +r.pct_change, li: num(r.low_income_pct_2026), peer: r.district_peer || '' }))
    .sort((a, b) => a.p - b.p);
  const lo = Math.floor(Math.min(-30, Math.min(...rows.map((r) => r.p)) - 2) / 5) * 5, hi = Math.ceil(Math.max(15, Math.max(...rows.map((r) => r.p)) + 2) / 5) * 5;
  const pos = (v) => (v - lo) / (hi - lo);
  const swatch = (r) => (r.group === 'District 65' ? 1 : r.group === 'Chicago' ? 4 : r.peer ? 2 : 'muted');
  const peerText = (p) => (p === 'Both' ? 'Dec. 2025 memo and Sept. 2026 presentation' : p === 'Dec. 2025' ? 'Dec. 2025 memo' : p ? 'Sept. 2026 presentation' : '');
  return {
    zero: +pos(0).toFixed(4),
    legend: legendOf([['District 65', 1, 'box'], ['Chicago Public Schools', 4, 'box'], ['Peer district cited by District 65', 2, 'box'], ['Nearby suburban district', 'muted', 'box']]),
    rows: rows.map((r) => ({
      label: r.name, strong: r.group === 'District 65', value: pct1(r.p), swatch: sw(swatch(r)),
      offset: +pos(Math.min(0, r.p)).toFixed(4), size: +(Math.abs(r.p) / (hi - lo)).toFixed(4),
    })),
    table: rows.map((r) => [r.name, r.group === 'Nearby suburb' ? (r.peer ? 'Peer (cited by District 65)' : 'Nearby suburb') : r.group === 'Chicago' ? 'Chicago' : r.peer ? 'Peer (cited by District 65)' : r.group,
      int(r.a), int(r.b), pct1(r.p), r.li === null ? 'not reported' : Math.round(r.li) + '%', peerText(r.peer)]),
  };
})();

// Kindergarten vs 5th grade at each elementary school: dumbbells
const dots = (() => {
  const rows = D.current.filter((r) => r.level === 'Elementary').map((r) => ({ school: r.school, k: +r.k, g5: +r.g5, p: +r.k_vs_5_pct })).sort((a, b) => a.p - b.p);
  const max = Math.ceil((Math.max(...rows.map((r) => Math.max(r.k, r.g5))) * 1.1) / 20) * 20;
  const pos = (v) => +(v / max).toFixed(4);
  const step = max / 4;
  return {
    legend: legendOf([['Kindergarten', 1, 'dot'], ['5th grade', 3, 'dot']]),
    ticks: [0, 1, 2, 3, 4].map((i) => ({ at: i / 4, label: int(i * step) })),
    rows: rows.map((r) => ({ label: r.school, k: int(r.k), g5: int(r.g5), k_at: pos(r.k), g5_at: pos(r.g5), lo: pos(Math.min(r.k, r.g5)), hi: pos(Math.max(r.k, r.g5)), value: pct1(r.p), strong: r.p <= -20 })),
  };
})();

// District enrollment by grade and year: heat table
const heat = (() => {
  const years = gradeYears;
  const vals = D.grades.map((r) => +r.students), lo = Math.min(...vals), hi = Math.max(...vals);
  return {
    years: years.map((y) => ({ short: shortYear(y), full: y })),
    rows: G9.map((g) => ({ label: gradeShort(g), full: gradeName(g), cells: years.map((y) => { const n = byYearGrade[y][g]; return { n: int(n), t: +((n - lo) / (hi - lo)).toFixed(3) }; }) })),
    min: int(lo), max: int(hi),
  };
})();

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
  const rows = D.volatility.slice().sort((a, b) => +a.volatility_sd_pct - +b.volatility_sd_pct);
  tables.vol = {
    caption: 'Enrollment stability by school, 2012-13 to 2026-27',
    columns: ['School', 'Avg. 2012-20', '2025-26', '2025-26 vs. avg.', 'Avg. yearly change', 'Volatility', 'Worst year', 'Which year', 'Years down (of 13)', '2026-27', 'Change at redraw'],
    rows: rows.map((r) => ({ cells: [cell(r.school), cell(int(+r.avg_2012_2020)), cell(int(+r.y2025_26)), cell(pct1(+r.change_vs_avg_pct), +r.change_vs_avg_pct <= -25),
      cell(pct1(+r.avg_yearly_change_pct)), cell((+r.volatility_sd_pct).toFixed(1) + '%'), cell(pct1(+r.worst_year_pct)), cell(r.worst_year), cell(r.years_declined),
      cell(r.y2026_27 === null ? 'closed' : int(+r.y2026_27)), cell(r.boundary_change_2026_27 === null ? '' : pct1(+r.boundary_change_2026_27))] })),
  };
}
{
  // Kofron vs rerun accuracy (was 'cmp_accuracy')
  const yr = (r) => +r.year.slice(0, 4), rows = D.bands;
  const calc = (pre, from, k5f, mf) => {
    const sel = rows.filter((r) => yr(r) >= from && yr(r) <= 2026);
    const e = (f, a) => sel.map((r) => ((num(r[f]) - num(r[a])) / num(r[a])) * 100);
    const ek = e(k5f, 'band_k5_actual'), em = e(mf, 'band_68_actual');
    const avg = (a) => (Math.round((a.reduce((s, v) => s + Math.abs(v), 0) / a.length) * 10) / 10).toFixed(1) + '%';
    const r31 = rows.find((r) => yr(r) === 2031);
    return { cells: [cell(pre), cell(from + '-' + String(from + 1).slice(2) + ' to 2026-27'), cell(avg(ek)), cell(pct1(round1(ek[ek.length - 1]))), cell(avg(em)), cell(pct1(round1(em[em.length - 1]))), cell(int(num(r31[k5f]))), cell(int(num(r31[mf])))] };
  };
  tables.cmp = {
    caption: 'How close each forecast came (middle series)',
    columns: ['Forecast (middle series)', 'Years checked', 'K-5: average miss', 'K-5: miss in 2026-27', '6-8: average miss', '6-8: miss in 2026-27', 'K-5 in 2031-32', '6-8 in 2031-32'],
    rows: [calc('Kofron (2022), from fall 2021', 2022, 'kof_mid_k5', 'kof_mid_68'),
      calc('Thrive65 rerun, from fall 2020 (births falling)', 2021, 't65_mid_falling_k5', 't65_mid_falling_68'),
      calc('Thrive65 rerun, from fall 2020 (births flat)', 2021, 't65_mid_data_k5', 't65_mid_data_68')],
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
tables.k5 = {
  caption: 'Kindergarten and 5th grade at each elementary school, fall 2026',
  columns: ['School', 'Kindergarten', '5th grade', 'K vs. 5th'],
  rows: dots.rows.map((r) => ({ cells: [cell(r.label), cell(r.k), cell(r.g5), cell(r.value, r.strong)] })),
};
tables.nearby = {
  caption: 'Enrollment change, 2018-19 to 2025-26, nearby and peer districts',
  columns: ['District', 'Group', '2018-19', '2025-26', 'Change', 'Low-income, 2025-26', 'Cited as a peer by District 65'],
  rows: bars.table.map((c) => ({ cells: c.map((t, i) => cell(t, i === 0 && t === 'District 65')) })),
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
  // hand nudges for crowded labels, in viewBox units: 'map:area' → [dx, dy]
  const NUDGE = {};

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
      const [cx, cy] = centroid(a.g), [dx, dy] = NUDGE[m.id + ':' + a.name] || [0, 0];
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
      return { name: a.name, d: pathOf(a.g), x: r1(cx + dx), y: r1(cy + dy), empty, values, t: first ? first.t : 0, label: first ? first.label : 'magnet', title };
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
write('bars.json', bars);
write('dots.json', dots);
write('heat.json', heat);
write('tables.json', tables);
write('map.json', map);
