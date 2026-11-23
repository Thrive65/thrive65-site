---
title: "District 65 enrollment: forecasts, actuals and where each grade is headed"
date: "2026-11-23"
category: "Analysis"
permalink: "/analysis/enrollment/"
description: "How many students District 65 serves, how that compares with the 2022 Kofron demographic study and with nearby districts, and what the numbers suggest for each school through 2031-32."
charts: true
---
{%- comment -%}
  Hand-written post (not from the Docs add-on). Every number, table and chart
  comes from _data/enrollment/, generated from data-src/enrollment/ by
  `npm run data:enrollment` (scripts/enrollment/prepare.mjs). Line charts are
  drawn by assets/js/charts.js (front matter `charts: true`); everything else
  renders at build time and reads without JavaScript.
{%- endcomment -%}
{%- assign s = site.data.enrollment.summary -%}
{%- assign c = site.data.enrollment.charts -%}
{%- assign t = site.data.enrollment.tables -%}

<div class="flow" markdown="0">

<p>This fall District 65 serves <strong>{{ s.actual_2026 }}</strong> K-8 students, <strong>{{ s.below_peak_pct }}</strong> below the 2016-17 peak, and close to the middle forecast from the 2022 Kofron demographic study (<strong>{{ s.kofron_mid_2026 }}</strong>). Kindergarten is the smallest grade, so the decline is still moving up through the schools.</p>

<div class="stat-grid">
  <div class="stat card flow flow-space-2xs"><p class="text-eyebrow">K-8 students, fall 2026</p><p class="stat-value">{{ s.actual_2026 }}</p><p class="text-deemphasized">Peak: {{ s.peak_2016 }} in 2016-17</p></div>
  <div class="stat card flow flow-space-2xs"><p class="text-eyebrow">Kofron middle forecast for 2026-27</p><p class="stat-value">{{ s.kofron_mid_2026 }}</p><p class="text-deemphasized">Range {{ s.kofron_low_2026 }} to {{ s.kofron_high_2026 }}</p></div>
  <div class="stat card flow flow-space-2xs"><p class="text-eyebrow">Kindergarten, fall 2026</p><p class="stat-value">{{ s.k_2026 }}</p><p class="text-deemphasized">vs {{ s.g8_2026 }} in 8th grade</p></div>
  <div class="stat card flow flow-space-2xs"><p class="text-eyebrow">Kofron middle forecast for 2031-32</p><p class="stat-value">{{ s.kofron_mid_2031 }}</p><p class="text-deemphasized">District's own 2030-31 projection: {{ s.district_proj_2030 }}</p></div>
</div>

<h2 id="trend-vs-forecasts">District K-8 enrollment vs. the forecasts</h2>
<p class="hint">Kofron's four forecasts are rescaled to start from the district's official 2021-22 count, because his totals count every resident student, a slightly different group. The district's own projection is from its November 2025 memo.</p>
{% include chart.html spec=c.trend labelledby="trend-vs-forecasts" %}

<h3 id="rerun-from-2020">What Kofron's method would have said starting from fall 2020</h3>
<p class="hint">Thrive65 reran the Kofron study's method on the district's official K-8 counts, starting from fall 2020. Each kindergarten class comes from births five years earlier; each later grade comes from the grade below it the year before, using how classes grew or shrank over the previous five years. The high, middle and low series use the best, middle and worst of those five years. Kofron's birth records end with the 2024 kindergarten class, so the left panel follows his straight-line guess after that (about 32 fewer births each year). The right panel uses actual Evanston births through 2023 from Cook County's annual birth reports, scaled up 8% to cover the Skokie part of the district: about 663, 612, 609 and 578 births for the 2025 to 2028 kindergarten classes, held at 578 after that. Births fell faster than his line through 2021, then roughly leveled off. Since 2025-26 the actual count leaves out about 117 special education students the district now counts separately, so the last two actual points run slightly low.</p>
{% include chart.html spec=c.rerun labelledby="rerun-from-2020" %}

<h3 id="kofron-vs-rerun">Kofron's forecast vs. our 2020 rerun, K-5 and 6-8</h3>
<p class="hint">Two forecasts built the same way, compared with what actually happened. <strong>Kofron (2022)</strong> started from fall 2021; his numbers count every resident student, so they are scaled down to match the district's official count in 2021-22 (by 14% for K-5 and 13% for 6-8). <strong>Thrive65's rerun</strong> applies his method to the official counts starting one year earlier, from fall 2020. Shaded bands run from each forecast's low series to its high series; dashed lines are the middle series. Both use Kofron's birth records through the 2024 kindergarten class; after that, use the buttons to see our rerun with his straight-line guess at births or with actual Evanston births through 2023 (Cook County birth reports, scaled up 8% for the Skokie part of the district). Kofron's forecast ends in 2031-32. Since 2025-26 the official count leaves out about 117 special education students the district now counts separately, so the last two actual points run a little low against both forecasts.</p>
{% include chart.html spec=c.cmp labelledby="kofron-vs-rerun" %}
{% include charts/data-table.html table=t.cmp %}
<p class="hint">"Miss" is the forecast minus the actual count, as a share of the actual; positive means the forecast was too high. Average miss is the average size of the yearly misses, ignoring direction. Counting the roughly 117 separately counted special education students the old way would raise the 2025-26 and 2026-27 actuals, making both forecasts look slightly better on the high side and slightly worse on the low side.</p>

<h2 id="each-school">Each school: actual enrollment and the Kofron forecast</h2>
<p class="hint">Solid line: students enrolled in the building each fall. Dashed line and shading: Kofron's middle forecast and low-to-high range for the students living in that school's 2021 attendance area, rescaled to the school's 2021-22 enrollment so the two lines start together. The vertical line marks fall 2026, when Foster opened, Kingsley and Bessie Rhodes closed, and boundaries were redrawn, so jumps there reflect new boundaries rather than families arriving or leaving. Kofron made no forecast for Foster, King Arts or Bessie Rhodes.</p>
{% include chart.html spec=c.schools labelledby="each-school" table=t.schools_actual %}

<h3 id="school-projections">Each elementary school through 2031-32: today's boundaries vs. the November 6 proposal</h3>
<p class="hint">A Thrive65 estimate using the Kofron method. Each school starts from this fall's students by grade; each class moves up a grade at district-wide rates from the last five years; each year's kindergarten class comes from births five years earlier and is split among schools by each school's share of this fall's students in kindergarten through 2nd grade (a three-grade average, so one unusually large or small kindergarten class does not drive a school's forecast). Oakton is the case where this matters: its kindergarten this fall (68) is its largest grade, and basing the split on kindergarten alone would show Oakton roughly holding at about 350 by 2031 rather than easing to about 315. The November 6 version moves current students once in fall 2027 and sends new kindergartners to their new schools after that, following the district's own counts of where students live. Births come from actual Evanston birth records through 2023 (Cook County's annual birth reports, scaled up 8% for the Skokie part of the district). The shaded band runs from the low series to the high series, also allowing for births following Kofron's straight-line guess instead. The diamond marks the district's own fall 2027 projection from its November 6 utilization table. Treat individual schools as about plus or minus 10%: the estimate cannot see changes in two-way immersion placements, transfers, or a single neighborhood's turnover.</p>
{% include chart.html spec=c.schoolproj labelledby="school-projections" %}
{% include charts/data-table.html table=t.schoolproj %}
<p class="hint">Years are fall of each school year (2027 = 2027-28). Middle estimates use birth records; the range runs from the low series to the high series, using whichever birth assumption (records or Kofron's line) is lower or higher each year. Totals for the November 6 proposal match today's boundaries because the same children are being reassigned, not added or lost. Lincolnwood's special education program (STEP) moves to Orrington under the proposal; this estimate sends those students with the rest of Lincolnwood, which likely puts a couple dozen too many at Willard and too few at Orrington.</p>

<h2 id="kofron-by-school">How close was Kofron by school? (2025-26, the last year on his boundaries)</h2>
<p class="hint">Rescaled forecasts compared with fall 2025 enrollment. Kofron forecast where students live, while these are counts of where they attend, so magnet, dual-language and transfer choices account for part of any gap.</p>
{% include charts/data-table.html table=t.check %}

<h2 id="k-vs-5th">Kindergarten vs. 5th grade at each school this fall</h2>
<p class="hint">Each row compares this year's kindergarten with this year's 5th grade at the same school. A kindergarten much smaller than 5th grade means smaller classes ahead as today's 5th graders leave. Counts include permissive transfers.</p>
<figure class="card flow" style="--card-padding: var(--space-s)" aria-labelledby="k-vs-5th">
{% include charts/legend.html items=site.data.enrollment.dots.legend %}
{% include charts/dot-chart.html data=site.data.enrollment.dots label="Kindergarten and 5th grade enrollment at each elementary school, fall 2026, sorted by the change" a="kindergarten" b="5th grade" sa="var(--series-1)" sb="var(--series-3)" value_label="K vs. 5th" %}
<details class="accordion">
  <summary class="cluster"><span>Show the data as a table</span><span class="accordion-icon" aria-hidden="true"></span></summary>
  <div class="accordion-body">{% include charts/data-table.html table=t.k5 %}</div>
</details>
</figure>

<h2 id="feeder-patterns">Students per grade in each middle school feeder pattern, fall 2026</h2>
<p class="hint">Grades K-5 add up the neighborhood elementary schools that feed each middle school under the 2026-27 boundaries: Chute (Dawes, Oakton, Walker), Haven (Foster, Lincolnwood, Orrington, Willard) and Nichols (Dewey, Lincoln, Washington). Grades 6-8 are the middle school itself. King Arts is the K-8 magnet. Read left to right, the line shows how large each class will be when it reaches middle school, before moves, magnet choices and transfers.</p>
{% include chart.html spec=c.feeder labelledby="feeder-patterns" %}

<h2 id="by-grade">District enrollment by grade and year</h2>
<p class="hint">Each cell is one grade in one fall. Read a diagonal from upper left to lower right to follow a class as it moves up. Fall 2020 through fall 2025 use the state's Illinois Report Card counts, one consistent source for those years; earlier years come from District 65's Opening of Schools reports, and fall 2026 from the district's own count, since the state has not published it yet. Totals for fall 2020-2025 can therefore differ slightly from the K-8 totals in the forecast charts above, which use the district's reports (by up to about 60 students a year).</p>
<figure class="card flow" style="--card-padding: var(--space-s)" aria-labelledby="by-grade">
<p class="cluster text-meta" aria-hidden="true">Fewer students {{ site.data.enrollment.heat.min }} <span class="chart-ramp"></span> {{ site.data.enrollment.heat.max }} more students</p>
{% include charts/heat-table.html data=site.data.enrollment.heat caption="District 65 enrollment by grade (rows) and school year (columns), fall 2012 to fall 2026" %}
</figure>

<h2 id="after-covid">Did families leave after COVID? What the numbers show</h2>
<p>Fall 2020 and fall 2021 showed a steep loss: the district lost <strong>{{ s.covid_loss }}</strong> students who would normally have moved up a grade, about <strong>{{ s.covid_pct }}</strong> of those enrolled. Since then, students already in District 65 have mostly stayed, much as before the pandemic. Most of the decline since the 2016-17 peak, <strong>{{ s.entry_share_pct }}</strong>, comes from each new kindergarten class being smaller than the 8th grade class leaving.</p>
<div class="stat-grid">
  <div class="stat card flow flow-space-2xs"><p class="text-eyebrow">Students lost in fall 2020 and fall 2021</p><p class="stat-value">{{ s.covid_loss_signed }}</p><p class="text-deemphasized">Already-enrolled students, beyond normal moves. That's {{ s.covid_pct }} of those enrolled.</p></div>
  <div class="stat card flow flow-space-2xs"><p class="text-eyebrow">Decline since the 2016-17 peak</p><p class="stat-value">{{ s.since_peak_total }}</p><p class="text-deemphasized">{{ s.since_peak_entry }} from smaller kindergartens; {{ s.since_peak_continuing }} from enrolled students leaving</p></div>
  <div class="stat card flow flow-space-2xs"><p class="text-eyebrow">Fall 2020 kindergarten class today</p><p class="stat-value">{{ s.k2020_now }}</p><p class="text-deemphasized">6th graders, from {{ s.k2020_k }} kindergartners ({{ s.k2020_pct }} of its starting size)</p></div>
</div>

<h3 id="national">How District 65 compares with the national trend</h3>
<p class="hint">Both lines start at 100 in fall 2019, the last fall before COVID, so they show the change from that point. Nationally, public school K-8 enrollment fell <strong>{{ s.nat_us_k8 }}</strong> from fall 2019 to fall 2023, the latest national count; District 65 fell <strong>{{ s.nat_d65_k8 }}</strong>. Chicago Public Schools, closer to home, fell <strong>{{ s.nat_cps_k8 }}</strong> over the same years, nearly three times the national rate but still well short of District 65. By fall 2025 the gap held: Chicago was down <strong>{{ s.nat_cps_k8_2025 }}</strong> from fall 2019 and District 65 <strong>{{ s.nat_d65_k8_2025 }}</strong>. Most of the gap with the nation is kindergarten. Nationally, kindergarten dropped in fall 2020 and partly recovered (<strong>{{ s.nat_us_k }}</strong> by fall 2023). District 65's kindergarten classes did not recover (<strong>{{ s.nat_d65_k }}</strong> by fall 2023). So District 65's steeper decline comes mainly from fewer children starting here, a local pattern rather than a national one. Dashed lines are forecasts: the National Center for Education Statistics (NCES) projection for the nation, and Kofron's middle forecast for District 65.</p>
{% include chart.html spec=c.national labelledby="national" %}

<h3 id="nearby-and-peers">How District 65 compares with nearby and peer districts, 2018-19 to 2025-26</h3>
<p class="hint">Among <strong>{{ s.nearby_n }}</strong> nearby suburban elementary districts, District 65's drop of <strong>{{ s.nearby_d65 }}</strong> is the second steepest, behind only Avoca 37, a district of about 500 students. The typical nearby district changed <strong>{{ s.nearby_median }}</strong>, and <strong>{{ s.nearby_grew }}</strong> grew. Chicago Public Schools fell <strong>{{ s.nearby_cps }}</strong>. Across Cook County, though, District 65 is not alone: of <strong>{{ s.cook_n }}</strong> elementary districts with at least 1,500 students, it has the <strong>{{ s.cook_rank }}</strong> steepest decline, behind {{ s.cook_ahead }}. In each of those districts most students are from low-income families, compared with about 39% in District 65. The district's own peer districts tell the same story. Its December 2025 school-closure memo and September 2026 financial sustainability presentation compared District 65 with 13 other districts, from Palatine, Wheeling and Schaumburg to Orland Park and Joliet. Every one of them lost a smaller share of students than District 65 did; the closest was Joliet 86 at −19.7%, and Des Plaines 62 grew.</p>
<figure class="card flow" style="--card-padding: var(--space-s)" aria-labelledby="nearby-and-peers">
{% include charts/legend.html items=site.data.enrollment.bars.legend %}
{% include charts/bar-chart.html data=site.data.enrollment.bars label="Percent change in enrollment, 2018-19 to 2025-26, steepest decline first" %}
<details class="accordion">
  <summary class="cluster"><span>Show the data as a table</span><span class="accordion-icon" aria-hidden="true"></span></summary>
  <div class="accordion-body">{% include charts/data-table.html table=t.nearby %}</div>
</details>
</figure>
<p class="hint">Totals include pre-K and come from the state's Illinois Report Card, so District 65's figures here (7,832 to 5,936) differ slightly from the K-8 counts used elsewhere on this page. The state's "2019" report covers the 2018-19 school year, one year earlier than the fall 2019 starting point used above.</p>

<h2 id="density">Where students live: density by attendance area</h2>
<p class="hint">Ways to measure density, all per square mile of land in each attendance area. <strong>Enrolled students</strong> is everyone attending the area's school this fall, including students who come from other areas through transfers or the two-way immersion (TWI) program; students at the King Arts magnet are not assigned to any area. <strong>Resident children</strong> is every child ages 5 to 14 living in the area at the 2020 census, whether they attend District 65, a private school or another option. <strong>Projected students</strong> is the Thrive65 estimate for fall 2031 (the 2031-32 school year, the last year of the projections) at each elementary school, from the school-by-school projection section above, shown either on today's boundaries or on the district's November 6 proposed boundaries (Dewey and Lincolnwood closed, their areas split among neighboring schools, and a small King Arts area). King Arts is shaded gray because most of its students come from across the district through the magnet lottery, so its density would mislead. Projections are not available for middle school areas. Lake Michigan and other water are left out of the land area.</p>
{% include charts/choropleth.html data=site.data.enrollment.map labelledby="density" %}
<p class="text-meta"><strong>Today's attendance areas (2026-27 boundaries)</strong></p>
{% include charts/data-table.html table=t.density %}
<p class="text-meta"><strong>Areas under the November 6 proposal</strong></p>
{% include charts/data-table.html table=t.density_nov6 %}

<h2 id="stability">Which schools have been stable, and which have swung</h2>
<p class="hint">Volatility is how much a school's enrollment typically moves from one fall to the next (the standard deviation of yearly percentage changes, 2012-13 to 2025-26). Lower means steadier. The last column shows the change in fall 2026, when boundaries were redrawn.</p>
{% include charts/data-table.html table=t.vol %}

<details id="sources" class="accordion">
  <summary class="cluster"><span>Definitions, sources and cautions</span><span class="accordion-icon" aria-hidden="true"></span></summary>
  <div class="accordion-body">
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
  </div>
</details>

<p>Related: <a href="{{ '/analysis/d65-enrollment-and-capacity/' | relative_url }}">D65 enrollment and capacity, 2026-27 vs. 2027-28</a>, which looks at building utilization under the November 6 proposal.</p>

</div>
