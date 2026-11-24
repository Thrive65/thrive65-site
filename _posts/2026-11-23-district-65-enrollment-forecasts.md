---
title: "Why District 65 has fewer students, and what comes next"
date: "2026-11-23"
category: "Analysis"
permalink: "/analysis/enrollment/"
description: "Why District 65 enrollment has fallen since 2016-17, whether it will keep falling, and how much the district can change it."
wide: true
charts: true
---
{%- comment -%}
  Hand-written post (not from the Docs add-on): the scroll story from
  .claude/design-artifacts/2026-11-24_enrollment-scroll-story_handoff/, with
  copy.md word for word. Every number, table and chart comes from
  _data/enrollment/, generated from data-src/enrollment/ by
  `npm run data:enrollment` (scripts/enrollment/prepare.mjs). Line charts are
  drawn by assets/js/charts.js (`charts: true`), which also marks the chapter
  in view ([data-story]) and sorts the stability table; everything else
  renders at build time and reads without JavaScript.
{%- endcomment -%}
{%- assign s = site.data.enrollment.summary -%}
{%- assign c = site.data.enrollment.charts -%}
{%- assign b = site.data.enrollment.bars -%}
{%- assign t = site.data.enrollment.tables -%}

<div class="flow" markdown="0" data-story>

<p>District 65 serves {{ s.actual_2026 }} K-8 students this fall, {{ s.drop_since_peak }} fewer than at its 2016-17 peak. Most of the drop comes from smaller kindergarten classes, and the district's 2022 enrollment study predicted this. The latest birth records point to more of the same.</p>

<section class="chapter" id="ch-drop" aria-labelledby="ch-drop-title">
  <div class="chapter-text flow">
    <h2 id="ch-drop-title">A steady decline since 2016</h2>
    <p>Enrollment peaked at {{ s.peak_2016 }} in 2016-17 and has fallen every year since, to {{ s.actual_2026 }} this fall. That is {{ s.below_peak_pct }} fewer students.</p>
    <p>The pandemic years were the steepest, but the decline started before 2020 and has continued after.</p>
    <p class="text-meta text-deemphasized">Source: K-8 counts from District 65 Opening of Schools reports, excluding Park, Rice and special education students placed outside the district.</p>
  </div>
{% include chart.html spec=c.k8 caption="District 65 K-8 enrollment each fall" cls="chapter-fig" %}
</section>

<section class="chapter" id="ch-nation" aria-labelledby="ch-nation-title">
  <div class="chapter-text flow">
    <h2 id="ch-nation-title">Steeper than the nation and Chicago</h2>
    <p>From fall 2019 to fall 2024, public school K-8 enrollment fell {{ s.nat_us_k8 }} nationally and {{ s.nat_cps_k8 }} in Chicago. District 65 fell {{ s.nat_d65_k8 }}.</p>
    <p>Most of the difference is in kindergarten. Nationally, kindergarten enrollment partly recovered after 2020, while District 65's kept shrinking. That points to something happening locally.</p>
    <p class="text-meta text-deemphasized">Source: National Center for Education Statistics, Digest 2025, table 203.10; CPS FY2027 Budget; Illinois Report Card.</p>
  </div>
{% include chart.html spec=c.nation caption="K-8 enrollment, fall 2019 = 100" cls="chapter-fig" %}
</section>

<section class="chapter tall" id="ch-peers" aria-labelledby="ch-peers-title">
  <div class="chapter-text flow">
    <h2 id="ch-peers-title">Most nearby districts are shrinking too, though less</h2>
    <p>Among {{ s.nearby_n }} nearby suburban elementary districts, the typical one changed {{ s.nearby_median }} from 2018-19 to 2025-26, and only {{ s.nearby_grew }} grew. District 65's drop of {{ s.nearby_d65 }} is the second steepest, behind only Avoca 37, a district of about 500 students. Each of the 13 peer districts District 65 cites lost a smaller share or grew; the closest was Joliet 86 at −19.7%.</p>
    <p>Across Cook County, of {{ s.cook_n }} elementary districts with at least 1,500 students, District 65 has the {{ s.cook_rank }} steepest decline, behind {{ s.cook_ahead }}.</p>
    <p class="text-meta text-deemphasized">Source: Illinois Report Card, total enrollment including pre-K, 2018-19 and 2025-26. Peer districts are those named in the district's Dec. 2025 school-closure memo and Sept. 2026 financial sustainability presentation.</p>
  </div>
{% include bar-figure.html data=b.nearby table=t.nearby caption="Change in enrollment, 2018-19 to 2025-26" label="Percent change in enrollment, 2018-19 to 2025-26, steepest decline first" cls="chapter-fig" %}
</section>

<section class="chapter" id="ch-private" aria-labelledby="ch-private-title">
  <div class="chapter-text flow">
    <h2 id="ch-private-title">Private schools gained some students during the pandemic, but don't explain our decline in enrollment</h2>
    <p>Private K-8 enrollment in the boundary rose by about 200 from 2019-20 to 2022-23, then fell back to about 940.</p>
    <p>In fall 2020 and 2021, District 65 lost 444 students who were already enrolled, net, for any reason, including moving away. About two-thirds of them would be in high school or graduated by now, so even if their families came back, few of them would still be in District 65 for long.</p>
    <p class="text-meta text-deemphasized">Source: Illinois State Board of Education nonpublic school enrollment; District 65 counts. Note: Private school data is for schools within Evanston. A family choosing Baker School in Wilmette (148 students, not all Evanston) does not appear here, and some children included in totals at Evanston private schools live elsewhere and would not be D65.</p>
  </div>
{% include chart.html spec=c.private caption="K-8 enrollment inside the District 65 boundary" cls="chapter-fig" %}
</section>

<section class="chapter" id="ch-eths" aria-labelledby="ch-eths-title">
  <div class="chapter-text flow">
    <h2 id="ch-eths-title">More District 65 8th graders now stay for ETHS</h2>
    <p>Evanston Township High School (ETHS) reports where each class went to 8th grade. The share of District 65 8th graders who went on to ETHS rose from about 84% for the class of 2026 to about 93% for the class of 2029.</p>
    <p>Private and parochial schools send 11% to 14% of each freshman class. Fewer freshmen now arrive from out of state or elsewhere in Illinois: 59 for the class of 2026, 25 for the class of 2029.</p>
    <p class="text-meta text-deemphasized">Source: District 202 feeder report, fall 2025; District 65 Opening of Schools reports.</p>
  </div>
{% include bar-figure.html data=b.eths table=t.eths caption="Each ETHS class by where it went to 8th grade, next to District 65's 8th grade the year before" label="Where each ETHS class went to 8th grade" cls="chapter-fig" %}
</section>

<section class="chapter" id="ch-classes" aria-labelledby="ch-classes-title">
  <div class="chapter-text flow">
    <h2 id="ch-classes-title">Today's classes started smaller</h2>
    <p>Most classes in school this fall are close to the size they were in kindergarten. The oldest, who were in early elementary school during the pandemic, are somewhat smaller. Together they are only about {{ s.classes_since_k }} students smaller than when they started.</p>
    <p>So nearly all of the drop since 2016-17 comes from smaller kindergarten classes. Families leaving explains only a small part.</p>
    <p class="text-meta text-deemphasized">Source: District enrollment by grade: state Illinois Report Card counts for fall 2020 to 2025, district counts for other years.</p>
  </div>
{% include bar-figure.html data=b.classes table=t.classes caption="Each grade this fall, next to its size in kindergarten" label="Each grade in fall 2026 next to its size in kindergarten" cls="chapter-fig" %}
</section>

<section class="chapter" id="ch-births" aria-labelledby="ch-births-title">
  <div class="chapter-text flow">
    <h2 id="ch-births-title">Fewer children were born here</h2>
    <p>Births behind each kindergarten class fell from about 1,050 for the class of 2015 to about 720 for the class of 2025 in Kofron's data. County records, which count somewhat lower, show about 610 for this fall's class and about 580 for the class of 2028. The decline has slowed but not stopped. Births after 2023 are not yet published, so the shading shows a range: births holding at the 2023 level at the top, and falling at the pace of Kofron's trend line, about 32 fewer a year, at the bottom. The dotted line continues the recent pace of about 3% fewer a year. By the class of 2031, that puts births between about 480 and 580. The Thrive65 projections later on this page use the top of that range; at the recent pace, K-5 enrollment in 2031-32 would be about 85 students lower, and at Kofron's pace about 165 lower.</p>
    <p>This fall {{ s.k_2026 }} children started kindergarten, while {{ s.g8_2026 }} are in 8th grade. Each year the class leaving is larger than the class arriving.</p>
    <p>The children who will start kindergarten through fall 2028 have already been born, so the size of those classes is largely set.</p>
    <p class="text-meta text-deemphasized">Source: Kofron study birth data; Cook County Department of Public Health birth reports for Evanston, scaled up 8% for Skokie.</p>
  </div>
{% include chart.html spec=c.births caption="Births five years before each kindergarten class" cls="chapter-fig" %}
</section>

<section class="chapter" id="ch-forecast" aria-labelledby="ch-forecast-title">
  <div class="chapter-text flow">
    <h2 id="ch-forecast-title">The district's own study saw this coming</h2>
    <p>The 2022 Kofron study, done for the district's facilities planning, forecast {{ s.kofron_mid_2026 }} students for this fall. The actual count was {{ s.actual_2026 }}.</p>
    <p>It pointed to births falling steadily since 2010 and fewer young families moving in. The 2024 McKibben study expected more young families and is running a little high.</p>
    <p>Split into grades K-5 and 6-8, Kofron's middle forecast has stayed within a few percent of actual enrollment in both. That comparison is at the foot of the page.</p>
    <p class="text-meta text-deemphasized">Source: Kofron, ES65 Geodemographic Study (2022); McKibben Demographic Consulting (2024); both scaled to district counts.</p>
  </div>
{% include chart.html spec=c.forecast caption="K-8 enrollment: actual and forecasts" cls="chapter-fig" %}
</section>

<section class="chapter" id="ch-ahead" aria-labelledby="ch-ahead-title">
  <div class="chapter-text flow">
    <h2 id="ch-ahead-title">What comes next</h2>
    <p>Both studies expect about 4,500 to 5,300 K-8 students by 2031-32. Thrive65's update of Kofron's method, starting from this fall's actual count, points to about {{ s.t65_2031 }} ({{ s.t65_2031_range }}). Using the district's capacity method, today's buildings hold about 8,150 students, and about 7,200 after the two proposed closures.</p>
    <p>The Thrive65 update uses county birth records for each kindergarten class. It assumes births hold at the 2023 level, so if they keep falling, enrollment will land nearer the low end.</p>
    <p class="text-meta text-deemphasized">Source: Kofron rescaled to the district's 2021-22 count; McKibben rescaled to its 2024-25 count.</p>
  </div>
{% include chart.html spec=c.ahead caption="Forecasts to 2031-32 against building capacity" cls="chapter-fig" %}
</section>

<section class="chapter" id="ch-levers" aria-labelledby="ch-levers-title">
  <div class="chapter-text flow">
    <h2 id="ch-levers-title">What the district can change, and how far that goes</h2>
    <p>Every family that chooses District 65 matters. It also helps to know how many students each possibility could bring. If every K-8 student at a private school inside the boundary enrolled in District 65, that would add about {{ s.private_now }}. That is close to what private schools here have enrolled for decades: in the years with complete records since the late 1990s, between about 850 and 1,200 K-8 students. Of the students who left in fall 2020 and 2021, about 150 are still young enough for grades K-8.</p>
    <p>Housing that young families can afford and programs that draw families from nearby could add students too, though there is no good estimate yet of how many. Taken together, the options within reach are measured in hundreds of students. By 2031-32, today's buildings will have room for {{ s.gap_now }} more students than the district expects to serve, and {{ s.gap_plan }} more even after the two proposed closures.</p>
    <p>Bringing families back is worth the effort, but it cannot fill that space on its own. Decisions about buildings should start from the expected number of students.</p>
    <p class="text-meta text-deemphasized">Source: This chapter is Thrive65's view. Private schools: Illinois State Board of Education nonpublic enrollment reports, 2010-11 to 2025-26, and the National Center for Education Statistics Private School Survey, 1997-98 to 2017-18 (Evanston schools, years when all the larger schools reported). Students who left: net change in grade counts, fall 2020 and 2021. Empty seats: the district's building capacities from its Nov. 6, 2026 utilization table (7,212 K-8 seats after the proposed closures; about 8,150 with Dewey and Lincolnwood, using the district's method for those two schools) minus the Thrive65 middle projection for 2031-32. The district's capacity count leaves out STEP and RISE special education classrooms and their students.</p>
  </div>
{% include bar-figure.html data=b.levers table=t.levers caption="Students each possibility could add, next to the empty seats expected by 2031-32" label="Students each possibility could add, and the empty seats expected by 2031-32" cls="chapter-fig" %}
</section>

<section class="flow" aria-labelledby="foot-title">
<h2 id="foot-title">How the decline is felt across the district</h2>
<p class="hint">The same pattern shows up at most schools, though the size and timing vary by neighborhood. Some schools have always moved up and down from year to year; others held steady for years and have declined since 2020.</p>

<h3 id="each-school">Each school: actual enrollment and the Kofron forecast</h3>
<p class="hint">Solid line: students enrolled in the building each fall. Dashed line and shading: Kofron's middle forecast and low-to-high range for the students living in that school's 2021 attendance area, rescaled to the school's 2021-22 enrollment. The vertical line marks fall 2026, when Foster opened, Kingsley and Bessie Rhodes closed and boundaries were redrawn; jumps there come from students being reassigned. Kofron made no forecast for Foster, King Arts or Bessie Rhodes.</p>
{% include chart.html spec=c.schools labelledby="each-school" table=t.schools_actual %}

<h3 id="kofron-by-school">How close Kofron was by school, 2025-26 (the last year on his boundaries)</h3>
<p class="hint">Kofron forecast where students live, while these are counts of where they attend, so magnet, dual-language and transfer choices account for part of any gap.</p>
{% include charts/data-table.html table=t.check %}

<h3 id="school-projections">Each elementary school through 2031-32: today's boundaries vs. the November 6 proposal</h3>
<p class="hint">A Thrive65 estimate using the Kofron method: each class moves up a grade at district-wide rates from the last five years, and each kindergarten class comes from births five years earlier, split among schools by their share of this fall's K-2 students. The diamond marks the district's own fall 2027 projection from its November 6 utilization table. Treat individual schools as about plus or minus 10%. Years are fall of each school year.</p>
{% include chart.html spec=c.schoolproj labelledby="school-projections" %}
{% include charts/data-table.html table=t.schoolproj %}

<h3 id="stability">Which schools have held steady and which have swung</h3>
<p class="hint">Volatility is how much a school's enrollment typically moves from one fall to the next (the standard deviation of yearly percentage changes, 2012-13 to 2025-26). Lower means steadier. The last column shows the change in fall 2026, when boundaries were redrawn. The table starts sorted by volatility; click any column heading to sort by it, and click again to reverse.</p>
{% include charts/data-table.html table=t.vol %}

<h3 id="density">Where students live: density by attendance area</h3>
<p class="hint">Each measure is per square mile of land in each attendance area. <strong>Enrolled students</strong> counts everyone attending the area's school this fall, including transfers and two-way immersion (TWI) students. <strong>Resident children</strong> counts every child ages 5 to 14 living in the area at the 2020 census, whatever school they attend. <strong>Projected students</strong> is the Thrive65 estimate for fall 2031, on today's boundaries or the November 6 proposal. King Arts is shaded gray because most of its students come from across the district.</p>
{% include charts/choropleth.html data=site.data.enrollment.map labelledby="density" %}
<p class="text-meta"><strong>Today's attendance areas (2026-27 boundaries)</strong></p>
{% include charts/data-table.html table=t.density %}
<p class="text-meta"><strong>Areas under the November 6 proposal</strong></p>
{% include charts/data-table.html table=t.density_nov6 %}

<h3 id="k5-and-6-8">K-5 and 6-8: actual enrollment and forecasts</h3>
<p class="hint">Kofron is rescaled to the district's 2021-22 counts and McKibben to its 2024-25 counts. McKibben's K-5 forecast runs higher because it expected more young families to move in. The Thrive65 update starts from this fall's count.</p>
{% include chart.html spec=c.cmp labelledby="k5-and-6-8" %}

<h3 id="forecast-accuracy">How close each forecast came</h3>
<p class="hint">"Miss" is the forecast minus the actual count, as a share of the actual; positive means the forecast was too high. Average miss is the average size of the yearly misses, ignoring direction.</p>
{% include charts/data-table.html table=t.accuracy %}

<details id="sources" class="accordion">
  <summary class="cluster"><span>Definitions, sources and cautions</span><span class="accordion-icon" aria-hidden="true"></span></summary>
  <div class="accordion-body">
  <ul>
    <li>Kofron is the ES65 Geodemographic Study by Charles Kofron (final revision March 3, 2022). It projected resident students by 2021 attendance area through 2031-32 in four series: high, middle, low, and a "snapshot" series assuming pandemic-era losses continued.</li>
    <li>McKibben is the Evanston-Skokie School District 65 Demographic Study Report by McKibben Demographic Consulting LLC (November 18, 2024), summarized for the board in the district's Feb. 10, 2025 memo. Its enrollment forecast (Appendix D) counts Park, Rice and separately counted special education students, so this page scales it to the district's 2024-25 counts without those students (K-5 3,728, 6-8 2,032, from the 2024-25 Opening of Schools report) and compares percentage change.</li>
    <li>Actual enrollment 2012-13 to 2025-26 comes from Thrive65's compilation of the District 65 Opening of Schools reports (K-8, excluding Park School and the Rice Education Center). Fall 2026 comes from the district's 2026-27 enrollment and demographics table including permissive transfers. Its K-8 total (5,408) is two more than the district's October 1 count (5,406).</li>
    <li>Special education students placed outside the district or receiving only evaluation or services are left out of the school counts used here. Reports before 2022 left them out too (36 to 47 outplaced students a year). The district's original 2022-23 to 2024-25 reports included them, but its later reports restate those years without them, and this page uses the restated figures.</li>
    <li>Grade-by-grade counts for fall 2020 to 2025 come from the state's Illinois Report Card. They run about 20 to 35 students above the district's own counts in recent years.</li>
    <li>Students lost in fall 2020 and 2021 and the comparison of classes with their kindergarten size are net figures from grade counts, not individual student records.</li>
    <li>Private school enrollment is K-8 enrollment at private and parochial schools located inside the District 65 boundary, from the Illinois State Board of Education's nonpublic school enrollment reports. The 2016-17 report is missing two schools. Longer-run figures (2010-11 to 2014-15 state reports, and the National Center for Education Statistics Private School Survey from 1997-98) are used only for the range quoted in the last chapter. The 2010-11 and 2012-13 state reports each miss one school.</li>
    <li>ETHS figures are first-time freshmen by sending school from District 202's fall 2025 feeder report, for the classes of 2026 through 2029. District 65 8th grade counts are from the District 65 Opening of Schools reports for the fall before each class entered ETHS.</li>
    <li>Birth counts are from the Cook County Department of Public Health's Suburban Cook County birth data reports (2015 and 2017-2023), for the City of Evanston, weighted by the kindergarten birthday cutoff and scaled up 8% for the Skokie part of the district. Earlier births are from the Kofron study. Kofron's birth figures and the county records differ by about 8% for the same years, so this page does not measure change from one source to the other.</li>
    <li>Building capacity: District 65 utilization table, Nov. 6, 2026 (7,212 K-8 seats with Dewey and Lincolnwood closed). Dewey (556) and Lincolnwood (about 384) are Thrive65 estimates using the district's method. The district's count leaves out STEP and RISE classrooms and their students. Because the projections include those students, the empty-seat figures may run about 100 high.</li>
    <li>School counts in fall 2026 reflect new boundaries: Foster opened and Kingsley and Bessie Rhodes closed. Changes at the redraw are mostly students reassigned to new schools.</li>
    <li>November 6 proposal boundaries are from the district's published proposal map.</li>
    <li>National figures are U.S. public school enrollment from the National Center for Education Statistics: Digest of Education Statistics 2025, table 203.10 (actual counts through fall 2024, the latest published; K-8 excludes prekindergarten). These are the same national data behind recent New York Times coverage of falling enrollment.</li>
    <li>Chicago Public Schools figures are fall K-8 enrollment from the CPS FY2027 Budget, Appendix A (the "Elementary Schools (K-8)" row, which leaves out school-based pre-K). CPS reported a further drop to 304,687 students in all grades in fall 2026, but has not yet published the K-8 breakdown for that year.</li>
    <li>Nearby and peer district figures are total enrollment, including pre-K, from the Illinois State Board of Education's Illinois Report Card public data sets for 2019 (school year 2018-19) and 2026 (school year 2025-26). "Nearby" is the North Shore, Skokie-area, Northbrook and Glenview elementary districts plus Oak Park 97 and the two Berwyn districts. Peer districts are those District 65 compared itself with in the SDRP III school-closure scenario memo for the Dec. 1, 2025 special board meeting (Comm Cons SD 59, Wheeling 21, Oak Park 97, Joliet 86, Orland 135, Schaumburg 54, Palatine 15, Arlington Heights 25, Crystal Lake 47) and the Sept. 14, 2026 Financial Sustainability presentation (CCSD 59, Des Plaines CCSD 62, Palatine 15, Woodridge 68, North Shore 112, Orland 135, DuPage County SD 45). The Cook County ranking covers every Cook County elementary (K-8) district that had at least 1,500 students in 2018-19. The Evanston RoundTable has reported District 65's decline as the steepest among 21 nearby K-8 districts; that holds for this nearby group apart from very small Avoca 37, but not county-wide.</li>
    <li>Census figures are from the 2020 decennial census, apportioned to attendance areas by block group.</li>
  </ul>
  </div>
</details>
</section>

</div>
