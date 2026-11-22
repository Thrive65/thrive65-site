---
layout: page
title: "District 65 enrollment: forecasts, actuals and where each grade is headed"
eyebrow: "Enrollment data"
description: "How many students District 65 serves, how that compares with the 2022 Kofron demographic study and with nearby districts, and what the numbers suggest for each school through 2031-32."
permalink: /analysis/enrollment/
wide: true
---

<link rel="stylesheet" href="{{ '/assets/css/enrollment-dashboard.css' | relative_url }}">

<div id="enrollment-dashboard" class="flow" data-data-base="{{ '/assets/data/enrollment/' | relative_url }}" markdown="0">

<p class="lede" id="takeaway">This fall District 65 serves <b data-draw="hl-actual">—</b> K-8 students, <b data-draw="hl-peakpct">—</b> below the 2016-17 peak, and close to the middle forecast from the 2022 Kofron demographic study (<b data-draw="hl-mid">—</b>). Kindergarten is the smallest grade, so the decline is still moving up through the schools.</p>

<div class="tiles" id="tiles">
  <div class="tile"><div class="lab">K-8 students, fall 2026</div><div class="big" data-draw="t-actual">—</div><div class="sub">Peak: <span data-draw="t-peak">—</span> in 2016-17</div></div>
  <div class="tile"><div class="lab">Kofron middle forecast for 2026-27</div><div class="big" data-draw="t-mid">—</div><div class="sub">Range <span data-draw="t-low">—</span> to <span data-draw="t-high">—</span></div></div>
  <div class="tile"><div class="lab">Kindergarten, fall 2026</div><div class="big" data-draw="t-k">—</div><div class="sub">vs <span data-draw="t-8">—</span> in 8th grade</div></div>
  <div class="tile"><div class="lab">Kofron middle forecast for 2031-32</div><div class="big" data-draw="t-mid32">—</div><div class="sub">District's own 2030-31 projection: <span data-draw="t-d65">—</span></div></div>
</div>

<h2 id="trend-vs-forecasts">District K-8 enrollment vs. the forecasts</h2>
<p class="note">Kofron's four forecasts are rescaled to start from the district's official 2021-22 count, because his totals count every resident student, a slightly different group. The district's own projection is from its November 2025 memo.</p>
<div class="card">
  <div class="legend">
    <span><span class="sw" data-draw="lg-actual"></span>Actual</span>
    <span><span class="sw" style="border-top-style: dashed" data-draw="lg-mid"></span>Kofron middle</span>
    <span><span class="box" data-draw="lg-band"></span>Kofron low to high</span>
    <span><span class="sw" style="border-top-style: dotted" data-draw="lg-snap"></span>Kofron "snapshot"</span>
    <span><span class="sw" data-draw="lg-d65"></span>District projection (2025)</span>
  </div>
  <div class="chart" id="trend" data-draw="trend"></div>
</div>

<h3 id="rerun-from-2020">What Kofron's method would have said starting from fall 2020</h3>
<p class="note">Thrive65 reran the Kofron study's method on the district's official K-8 counts, starting from fall 2020. Each kindergarten class comes from births five years earlier; each later grade comes from the grade below it the year before, using how classes grew or shrank over the previous five years. The high, middle and low series use the best, middle and worst of those five years. Kofron's birth records end with the 2024 kindergarten class, so the left panel follows his straight-line guess after that (about 32 fewer births each year). The right panel uses actual Evanston births through 2023 from Cook County's annual birth reports, scaled up 8% to cover the Skokie part of the district: about 663, 612, 609 and 578 births for the 2025 to 2028 kindergarten classes, held at 578 after that. Births fell faster than his line through 2021, then roughly leveled off. Since 2025-26 the actual count leaves out about 117 special education students the district now counts separately, so the last two actual points run slightly low.</p>
<div class="card">
  <div id="rerun" data-draw="rerun" style="min-height:360px"></div>
</div>

<h3 id="kofron-vs-rerun">Kofron's forecast vs. our 2020 rerun, K-5 and 6-8</h3>
<p class="note">Two forecasts built the same way, compared with what actually happened. <b>Kofron (2022)</b> started from fall 2021; his numbers count every resident student, so they are scaled down to match the district's official count in 2021-22 (by 14% for K-5 and 13% for 6-8). <b>Thrive65's rerun</b> applies his method to the official counts starting one year earlier, from fall 2020. Shaded bands run from each forecast's low series to its high series; dashed lines are the middle series. Both use Kofron's birth records through the 2024 kindergarten class; after that, use the buttons to see our rerun with his straight-line guess at births or with actual Evanston births through 2023 (Cook County birth reports, scaled up 8% for the Skokie part of the district). Kofron's forecast ends in 2031-32. Since 2025-26 the official count leaves out about 117 special education students the district now counts separately, so the last two actual points run a little low against both forecasts.</p>
<div class="card">
  <div id="cmp" data-draw="cmp" style="min-height:420px"></div>
</div>
<div class="card tw">
<table id="cmp-table">
  <thead><tr><th>Forecast (middle series)</th><th>Years checked</th><th>K-5: average miss</th><th>K-5: miss in 2026-27</th><th>6-8: average miss</th><th>6-8: miss in 2026-27</th><th>K-5 in 2031-32</th><th>6-8 in 2031-32</th></tr></thead>
  <tbody data-draw="cmp-body"></tbody>
</table>
</div>
<p class="note">"Miss" is the forecast minus the actual count, as a share of the actual; positive means the forecast was too high. Average miss is the average size of the yearly misses, ignoring direction. Counting the roughly 117 separately counted special education students the old way would raise the 2025-26 and 2026-27 actuals, making both forecasts look slightly better on the high side and slightly worse on the low side.</p>

<h2 id="each-school">Each school: actual enrollment and the Kofron forecast</h2>
<p class="note">Solid line: students enrolled in the building each fall. Dashed line and shading: Kofron's middle forecast and low-to-high range for the students living in that school's 2021 attendance area, rescaled to the school's 2021-22 enrollment so the two lines start together. The vertical line marks fall 2026, when Foster opened, Kingsley and Bessie Rhodes closed, and boundaries were redrawn, so jumps there reflect new boundaries rather than families arriving or leaving. Kofron made no forecast for Foster, King Arts or Bessie Rhodes.</p>
<div class="multiples" id="schools" data-draw="schools"></div>

<h3 id="school-projections">Each elementary school through 2031-32: today's boundaries vs. the November 6 proposal</h3>
<p class="note">A Thrive65 estimate using the Kofron method. Each school starts from this fall's students by grade; each class moves up a grade at district-wide rates from the last five years; each year's kindergarten class comes from births five years earlier and is split among schools by each school's share of this fall's students in kindergarten through 2nd grade (a three-grade average, so one unusually large or small kindergarten class does not drive a school's forecast). Oakton is the case where this matters: its kindergarten this fall (68) is its largest grade, and basing the split on kindergarten alone would show Oakton roughly holding at about 350 by 2031 rather than easing to about 315. The November 6 version moves current students once in fall 2027 and sends new kindergartners to their new schools after that, following the district's own counts of where students live. Births come from actual Evanston birth records through 2023 (Cook County's annual birth reports, scaled up 8% for the Skokie part of the district). The shaded band runs from the low series to the high series, also allowing for births following Kofron's straight-line guess instead. The diamond marks the district's own fall 2027 projection from its November 6 utilization table. Treat individual schools as about plus or minus 10%: the estimate cannot see changes in two-way immersion placements, transfers, or a single neighborhood's turnover.</p>
<div class="card">
  <div id="schoolproj" data-draw="schoolproj" style="min-height:520px"></div>
</div>
<div class="card tw">
<table id="schoolproj-table">
  <thead><tr><th>School</th><th>Fall 2026</th><th>Today's boundaries: 2027</th><th>2029</th><th>2031</th><th>2031 range</th><th>Nov. 6 proposal: 2027</th><th>District's own 2027</th><th>2029</th><th>2031</th><th>2031 range</th></tr></thead>
  <tbody data-draw="schoolproj-body"></tbody>
</table>
</div>
<p class="note">Years are fall of each school year (2027 = 2027-28). Middle estimates use birth records; the range runs from the low series to the high series, using whichever birth assumption (records or Kofron's line) is lower or higher each year. Totals for the November 6 proposal match today's boundaries because the same children are being reassigned, not added or lost. Lincolnwood's special education program (STEP) moves to Orrington under the proposal; this estimate sends those students with the rest of Lincolnwood, which likely puts a couple dozen too many at Willard and too few at Orrington.</p>

<h2 id="kofron-by-school">How close was Kofron by school? (2025-26, the last year on his boundaries)</h2>
<p class="note">Rescaled forecasts compared with fall 2025 enrollment. Kofron forecast where students live, while these are counts of where they attend, so magnet, dual-language and transfer choices account for part of any gap.</p>
<div class="card tw">
<table id="check-table">
  <thead><tr><th>School</th><th>2021-22 actual</th><th>Kofron low</th><th>Kofron middle</th><th>Kofron high</th><th>2025-26 actual</th><th>Actual vs. middle</th><th>Result</th></tr></thead>
  <tbody data-draw="check-body"></tbody>
</table>
</div>

<h2 id="k-vs-5th">Kindergarten vs. 5th grade at each school this fall</h2>
<p class="note">Each row compares this year's kindergarten with this year's 5th grade at the same school. A kindergarten much smaller than 5th grade means smaller classes ahead as today's 5th graders leave. Counts include permissive transfers.</p>
<div class="card">
  <div class="legend"><span><span class="box" style="opacity:1;border-radius:50%;width:10px" data-draw="lg-k"></span>Kindergarten</span><span><span class="box" style="opacity:1;border-radius:50%;width:10px" data-draw="lg-5"></span>5th grade</span></div>
  <div class="chart tall" id="k5" data-draw="k5"></div>
</div>

<h2 id="feeder-patterns">Students per grade in each middle school feeder pattern, fall 2026</h2>
<p class="note">Grades K-5 add up the neighborhood elementary schools that feed each middle school under the 2026-27 boundaries: Chute (Dawes, Oakton, Walker), Haven (Foster, Lincolnwood, Orrington, Willard) and Nichols (Dewey, Lincoln, Washington). Grades 6-8 are the middle school itself. King Arts is the K-8 magnet. Read left to right, the line shows how large each class will be when it reaches middle school, before moves, magnet choices and transfers.</p>
<div class="card">
  <div class="legend" data-draw="feeder-legend"></div>
  <div class="chart" id="feeder" data-draw="feeder"></div>
</div>

<h2 id="by-grade">District enrollment by grade and year</h2>
<p class="note">Each cell is one grade in one fall. Read a diagonal from upper left to lower right to follow a class as it moves up. Fall 2020 through fall 2025 use the state's Illinois Report Card counts, one consistent source for those years; earlier years come from District 65's Opening of Schools reports, and fall 2026 from the district's own count, since the state has not published it yet. Totals for fall 2020-2025 can therefore differ slightly from the K-8 totals in the forecast charts above, which use the district's reports (by up to about 60 students a year).</p>
<div class="card tw">
  <div class="chart" id="grades" data-draw="grades"></div>
</div>

<h2 id="after-covid">Did families leave after COVID? What the numbers show</h2>
<p class="lede" id="covid-takeaway">Fall 2020 and fall 2021 showed a steep loss: the district lost <b data-draw="cv-loss">—</b> students who would normally have moved up a grade, about <b data-draw="cv-pct">—</b> of those enrolled. Since then, students already in District 65 have mostly stayed, much as before the pandemic. Most of the decline since the 2016-17 peak, <b data-draw="cv-entry">—</b>, comes from each new kindergarten class being smaller than the 8th grade class leaving.</p>
<div class="tiles" id="covid-tiles">
  <div class="tile"><div class="lab">Students lost in fall 2020 and fall 2021</div><div class="big" data-draw="cv-loss2">—</div><div class="sub">Already-enrolled students, beyond normal moves. That's <span data-draw="cv-pct2">—</span> of those enrolled.</div></div>
  <div class="tile"><div class="lab">Decline since the 2016-17 peak</div><div class="big" data-draw="cv-total">—</div><div class="sub"><span data-draw="cv-entry2">—</span> from smaller kindergartens; <span data-draw="cv-cont">—</span> from enrolled students leaving</div></div>
  <div class="tile"><div class="lab">Fall 2020 kindergarten class today</div><div class="big" data-draw="cv-k20">—</div><div class="sub">6th graders, from <span data-draw="cv-k20k">—</span> kindergartners (<span data-draw="cv-k20p">—</span> of its starting size)</div></div>
</div>

<h3 id="national">How District 65 compares with the national trend</h3>
<p class="note" id="national-takeaway">Both lines start at 100 in fall 2019, the last fall before COVID, so they show the change from that point. Nationally, public school K-8 enrollment fell <b data-draw="nt-us">—</b> from fall 2019 to fall 2023, the latest national count; District 65 fell <b data-draw="nt-d65">—</b>. Chicago Public Schools, closer to home, fell <b data-draw="nt-cps">—</b> over the same years, nearly three times the national rate but still well short of District 65. By fall 2025 the gap held: Chicago was down <b data-draw="nt-cps25">—</b> from fall 2019 and District 65 <b data-draw="nt-d6525">—</b>. Most of the gap with the nation is kindergarten. Nationally, kindergarten dropped in fall 2020 and partly recovered (<b data-draw="nt-usk">—</b> by fall 2023). District 65's kindergarten classes did not recover (<b data-draw="nt-d65k">—</b> by fall 2023). So District 65's steeper decline comes mainly from fewer children starting here, a local pattern rather than a national one. Dashed lines are forecasts: the National Center for Education Statistics (NCES) projection for the nation, and Kofron's middle forecast for District 65.</p>
<div class="card">
  <div class="legend"><span><span class="sw" data-draw="lg-nd"></span>District 65</span><span><span class="sw" data-draw="lg-nu"></span>U.S. public schools</span><span><span class="sw" data-draw="lg-nc"></span>Chicago Public Schools (K-8 panel)</span><span><span class="sw" style="border-top-style:dashed;border-top-color:var(--muted)"></span>Forecast</span></div>
  <div class="nat-grid">
    <div><div class="nat-t">All grades, K-8</div><div class="chart" id="nat-k8" data-draw="nat-k8"></div></div>
    <div><div class="nat-t">Kindergarten</div><div class="chart" id="nat-k" data-draw="nat-k"></div></div>
  </div>
</div>

<h3 id="nearby-and-peers">How District 65 compares with nearby and peer districts, 2018-19 to 2025-26</h3>
<p class="note" id="nearby-takeaway">Among <b data-draw="nb-n">—</b> nearby suburban elementary districts, District 65's drop of <b data-draw="nb-d65">—</b> is the second steepest, behind only Avoca 37, a district of about 500 students. The typical nearby district changed <b data-draw="nb-med">—</b>, and <b data-draw="nb-grew">—</b> grew. Chicago Public Schools fell <b data-draw="nb-cps">—</b>. Across Cook County, though, District 65 is not alone: of <b data-draw="ck-n">—</b> elementary districts with at least 1,500 students, it has the <b data-draw="ck-rank">—</b> steepest decline, behind <span data-draw="ck-ahead">—</span>. In each of those districts most students are from low-income families, compared with about 39% in District 65. The district's own peer districts tell the same story. Its December 2025 school-closure memo and September 2026 financial sustainability presentation compared District 65 with 13 other districts, from Palatine, Wheeling and Schaumburg to Orland Park and Joliet. Every one of them lost a smaller share of students than District 65 did; the closest was Joliet 86 at −19.7%, and Des Plaines 62 grew.</p>
<div class="card">
  <div class="legend"><span><span class="box" style="opacity:1;width:12px" data-draw="lg-nb0"></span>District 65</span><span><span class="box" style="opacity:1;width:12px" data-draw="lg-nb2"></span>Chicago Public Schools</span><span><span class="box" style="opacity:1;width:12px" data-draw="lg-nb1"></span>Peer district cited by District 65</span><span><span class="box" style="opacity:1;width:12px;background:var(--cds-chart-muted)"></span>Nearby suburban district</span></div>
  <div class="chart tall" id="nearby-chart" data-draw="nearby-chart"></div>
</div>
<p class="note">Totals include pre-K and come from the state's Illinois Report Card, so District 65's figures here (7,832 to 5,936) differ slightly from the K-8 counts used elsewhere on this page. The state's "2019" report covers the 2018-19 school year, one year earlier than the fall 2019 starting point used above.</p>

<h2 id="density">Where students live: density by attendance area</h2>
<p class="note" id="density-takeaway">Ways to measure density, all per square mile of land in each attendance area. <b>Enrolled students</b> is everyone attending the area's school this fall, including students who come from other areas through transfers or the two-way immersion (TWI) program; students at the King Arts magnet are not assigned to any area. <b>Resident children</b> is every child ages 5 to 14 living in the area at the 2020 census, whether they attend District 65, a private school or another option. <b>Projected students</b> is the Thrive65 estimate for fall 2031 (the 2031-32 school year, the last year of the projections) at each elementary school, from the school-by-school projection section above, shown either on today's boundaries or on the district's November 6 proposed boundaries (Dewey and Lincolnwood closed, their areas split among neighboring schools, and a small King Arts area). King Arts is shaded gray because most of its students come from across the district through the magnet lottery, so its density would mislead. Projections are not available for middle school areas. Lake Michigan and other water are left out of the land area.</p>
<div class="card">
  <div id="density-map" data-draw="density-map" style="min-height:620px"></div>
</div>
<div class="card tw">
<table id="density-table">
  <thead><tr><th>Attendance area</th><th>Land (sq. mi.)</th><th>Enrolled, fall 2026</th><th>Enrolled per sq. mi.</th><th>Children 5-14 (2020)</th><th>Children per sq. mi.</th><th>All residents (2020)</th></tr></thead>
  <tbody data-draw="density-body"></tbody>
</table>
</div>

<h2 id="stability">Which schools have been stable, and which have swung</h2>
<p class="note">Volatility is how much a school's enrollment typically moves from one fall to the next (the standard deviation of yearly percentage changes, 2012-13 to 2025-26). Lower means steadier. The last column shows the change in fall 2026, when boundaries were redrawn.</p>
<div class="card tw">
<table id="vol-table">
  <thead><tr><th>School</th><th>Avg. 2012-20</th><th>2025-26</th><th>2025-26 vs. avg.</th><th>Avg. yearly change</th><th>Volatility</th><th>Worst year</th><th>Which year</th><th>Years down (of 13)</th><th>2026-27</th><th>Change at redraw</th></tr></thead>
  <tbody data-draw="vol-body"></tbody>
</table>
</div>

<details id="sources" class="accordion">
  <summary class="cluster"><span>Definitions, sources and cautions</span></summary>
  <ul>
    <li>Kofron is the ES65 Geodemographic Study by Charles Kofron (final revision March 3, 2022). It projected resident students by 2021 attendance area through 2031-32 in four series: high, middle, low, and a "snapshot" series assuming pandemic-era losses continued.</li>
    <li>Actual enrollment 2012-13 to 2025-26 comes from Thrive65's compilation of the District 65 Opening of Schools reports (K-8, excluding Park School and the Rice Education Center). Fall 2026 comes from the district's 2026-27 enrollment and demographics table including permissive transfers. Its K-8 total (5,408) is two more than the district's October 1 count (5,406).</li>
    <li>From 2025-26 the district counts some special education students (evaluation and services only, or placed outside the district) separately rather than at a school, about 120 K-8 students, and its later reports restate 2022-23 to 2024-25 the same way. That makes 2025-26 and later counts lower than earlier years on a like-for-like basis, by roughly 10 to 15 students per grade.</li>
    <li>School counts in fall 2026 reflect new boundaries: Foster opened and Kingsley and Bessie Rhodes closed. Changes at the redraw are mostly students reassigned, not families arriving or leaving.</li>
    <li>Feeder patterns are taken from the district's 2026-27 attendance boundaries: every elementary area falls within one middle school area. November 6 proposal boundaries are from the district's published proposal map.</li>
    <li>Birth counts are from the Cook County Department of Public Health's Suburban Cook County birth data reports (2015 and 2017-2023), for the City of Evanston, weighted by the kindergarten birthday cutoff and scaled up 8% for the Skokie part of the district.</li>
    <li>National figures are U.S. public school enrollment from the National Center for Education Statistics: Digest of Education Statistics 2024, table 203.10 (actual counts through fall 2023; K-8 excludes prekindergarten), and Digest 2022, table 105.30 (projections to fall 2031, made in December 2022 and applied here as percent change from the fall 2023 actual).</li>
    <li>Chicago Public Schools figures are fall K-8 enrollment from the CPS FY2027 Budget, Appendix A (the "Elementary Schools (K-8)" row, which leaves out school-based pre-K).</li>
    <li>Nearby and peer district figures are total enrollment, including pre-K, from the Illinois State Board of Education's Illinois Report Card public data sets for 2019 (school year 2018-19) and 2026 (school year 2025-26). "Nearby" is the North Shore, Skokie-area, Northbrook and Glenview elementary districts plus Oak Park 97 and the two Berwyn districts. Peer districts are those District 65 compared itself with in the SDRP III school-closure scenario memo for the Dec. 1, 2025 special board meeting (Comm Cons SD 59, Wheeling 21, Oak Park 97, Joliet 86, Orland 135, Schaumburg 54, Palatine 15, Arlington Heights 25, Crystal Lake 47) and the Sept. 14, 2026 Financial Sustainability presentation (CCSD 59, Des Plaines CCSD 62, Palatine 15, Woodridge 68, North Shore 112, Orland 135, DuPage County SD 45). The Cook County ranking covers every Cook County elementary (K-8) district that had at least 1,500 students in 2018-19.</li>
    <li>Census figures are from the 2020 decennial census, apportioned to attendance areas by block group.</li>
  </ul>
</details>

</div>

<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
<script src="{{ '/assets/js/enrollment-dashboard.js' | relative_url }}" defer></script>
