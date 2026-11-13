---
layout: "page"
title: "What would this cost my household?"
eyebrow: "Tax impact estimator"
description: "Estimate what District 65's yearly levy increase, health and life safety bonds, a capital or operating referendum, and the City of Evanston levy would add to your tax bill or rent, one at a time or stacked by year."
# Test page, should be hidden from search/sitemap
noindex: true      # emits <meta name="robots" content="noindex, follow"> (head.html)
sitemap: false     # omitted from sitemap.xml (jekyll-sitemap)
---

<p>District 65 has several ways to raise money for buildings or for operations, and each one lands on your tax
bill differently. Look at them one at a time, or pick <strong>All together</strong> to see how they stack up year
by year. Every piece keeps its own settings, so what you enter on one tab carries into the combined view.</p>

<fieldset class="field-set mt-l">
  <legend class="visually-hidden">Choose what to estimate</legend>
  <div class="choice-group">
    <button class="choice" type="button" data-mode="stack" aria-pressed="true">
      All together
      <span class="choice-note">Every piece below, stacked by tax year.</span>
    </button>
    <button class="choice" type="button" data-mode="ptell" aria-pressed="false">
      Yearly levy increase
      <span class="choice-note">The annual increase allowed under the tax cap.</span>
    </button>
    <button class="choice" type="button" data-mode="hls" aria-pressed="false">
      Health &amp; life safety
      <span class="choice-note">Mandated repairs. No referendum required.</span>
    </button>
    <button class="choice" type="button" data-mode="capital" aria-pressed="false">
      Capital referendum
      <span class="choice-note">Borrowing for buildings, approved by voters.</span>
    </button>
    <button class="choice" type="button" data-mode="operating" aria-pressed="false">
      Operating referendum
      <span class="choice-note">Ongoing money for running the schools.</span>
    </button>
    <button class="choice" type="button" data-mode="city" aria-pressed="false">
      City of Evanston levy
      <span class="choice-note">Not District 65. The city's own increase, for the full picture.</span>
    </button>
  </div>
</fieldset>

<div class="callout" id="modeNote"></div>

<section class="card flow">
  <h2>Your numbers</h2>
  <p class="text-deemphasized">Everything below is adjustable. Nothing you enter leaves your browser.</p>

  <fieldset class="field-set field">
    <legend>Do you own or rent?</legend>
    <div class="choice-group compact" id="tenure" role="group" aria-label="Own or rent">
      <button class="choice compact" type="button" data-tenure="own" aria-pressed="true">I own my home</button>
      <button class="choice compact" type="button" data-tenure="rent" aria-pressed="false">I rent</button>
    </div>
  </fieldset>

  <!-- RENTERS -->
  <div id="renterFields" class="flow hidden">
    <div class="field">
      <label for="rent">Your monthly rent</label>
      <div class="input-group">
        <span class="affix">$</span>
        <input id="rent" type="number" min="0" step="25" value="1800" inputmode="numeric">
      </div>
    </div>
    <div class="grid-wide">
      <div class="field">
        <label for="taxShare">Share of rent that covers property tax</label>
        <div class="input-group">
          <input id="taxShare" type="number" min="0" max="40" step="1" value="17" inputmode="decimal">
          <span class="affix">%</span>
        </div>
        <p class="hint">Minnesota's renter credit assumes 17%, based on state studies. Maine's assumes 25%. District 65 is
          about 41% of whatever that comes to.</p>
      </div>
      <div class="field">
        <label for="passPct">Share of an increase your landlord passes on</label>
        <div class="input-group">
          <input id="passPct" type="number" min="0" max="100" step="5" value="50" inputmode="decimal">
          <span class="affix">%</span>
        </div>
        <div class="choice-group compact mt-xs" id="passPresets" role="group" aria-label="Pass-through presets">
          <button class="choice compact" type="button" data-pass="15" aria-pressed="false">Low · 15%</button>
          <button class="choice compact" type="button" data-pass="50" aria-pressed="false">Middle · 50%</button>
          <button class="choice compact" type="button" data-pass="85" aria-pressed="false">High · 85%</button>
        </div>
      </div>
    </div>
    <p class="hint">Research disagrees on how much of a tax increase reaches tenants. Studies range from about 15% to more
      than 80%, with more passed on in large, professionally managed buildings and over several years. Your actual rent
      depends mostly on the rental market. This shows only the property tax part, and it does not apply to
      income-restricted or subsidized units, where rent is set by formula.</p>
  </div>

  <div id="ownerFields" class="flow">
  <div class="field">
    <label for="homeEav">Your property's equalized assessed value (EAV)</label>
    <div class="input-group">
      <span class="affix">$</span>
      <input id="homeEav" type="number" min="0" step="1000" value="140000" inputmode="numeric">
    </div>
    <p class="hint">On your property tax bill or Cook County assessment notice. Or estimate from market value below.</p>
  </div>

  <div class="field">
    <label for="mktVal">Or estimate from market value</label>
    <div class="input-group">
      <span class="affix">$</span>
      <input id="mktVal" type="number" min="0" step="10000" placeholder="e.g. 465000" inputmode="numeric">
    </div>
    <p class="hint">Cook County assesses homes at 10% of market value, then the state applies an equalization
      factor near 3.0, putting EAV around 30% of market value before exemptions.</p>
  </div>

  <div class="field">
    <label for="curTax">Your current District 65 tax, per year <span class="text-deemphasized">(optional, most accurate)</span></label>
    <div class="input-group">
      <span class="affix">$</span>
      <input id="curTax" type="number" min="0" step="10" inputmode="numeric">
    </div>
    <p class="hint" id="curTaxHint">The "Evanston/Skokie School District 65" line on your 2026 tax bill. If you enter it, every
      estimate on this page uses it, which also picks up the 2025 reassessment. Until then, this is estimated from your EAV.</p>
  </div>
  </div>

  <!-- ALL TOGETHER -->
  <div id="stackBlock" class="flow levy-chart">
    <fieldset class="field-set field">
      <legend>Include in the total</legend>
      <div class="choice-group compact" id="stackPieces" role="group" aria-label="Pieces to include">
        <button class="choice compact" type="button" data-piece="ptell" aria-pressed="true">Yearly levy increase</button>
        <button class="choice compact" type="button" data-piece="hls" aria-pressed="true">Health &amp; life safety</button>
        <button class="choice compact" type="button" data-piece="capital" aria-pressed="true">Capital referendum</button>
        <button class="choice compact" type="button" data-piece="operating" aria-pressed="true">Operating referendum</button>
        <button class="choice compact" type="button" data-piece="city" aria-pressed="true">City of Evanston levy</button>
      </div>
      <p class="hint">Each piece uses the settings on its own tab. Open a tab to change its amount, term, or start year.</p>
    </fieldset>
    <fieldset class="field-set field">
      <legend>Start the referendum pieces from a scenario</legend>
      <div class="choice-group compact" id="scenarioPresets" role="group" aria-label="Referendum scenarios">
        <button class="choice compact" type="button" data-scenario="v4" aria-pressed="false">Community v4 package</button>
        <button class="choice compact" type="button" data-scenario="page" aria-pressed="false">Page defaults</button>
      </div>
      <p class="hint">The community group For a Brighter Evanston's model (v4, November 2026) assumes two referendums on the
        November 2028 ballot: a $17&nbsp;million operating increase that grows with the tax base, and $63.7&nbsp;million in
        bonds to replace the district's yearly building budget, repaid over 20 years at 4.5%. This button loads those
        amounts into the operating and capital tabs. The yearly levy increase, health and life safety bonds and city levy
        are not part of that package, so they keep their own settings. Neither referendum has formally been proposed by
        the district.</p>
    </fieldset>
    <div class="steps" id="stackSummary"></div>
    <div class="field">
      <label for="stackYear">Spotlight year</label>
      <div class="input-group">
        <input id="stackYear" type="number" min="2027" max="2066" step="1" value="2030" inputmode="numeric">
        <span class="affix">bill paid</span>
      </div>
      <p class="hint">The headline figure below is the total for this year. 2030 is the first year all four pieces would
        appear on a bill under the default start years.</p>
    </div>
  </div>

  <!-- YEARLY LEVY INCREASE (PTELL) -->
  <div id="ptellBlock" class="flow hidden">
    <div class="grid-wide">
      <div class="field">
        <label for="cpiNow">Cap for the 2026 levy (bills paid in 2027)</label>
        <div class="input-group">
          <input id="cpiNow" type="number" min="0" max="5" step="0.1" value="2.7" inputmode="decimal">
          <span class="affix">%</span>
        </div>
        <p class="hint">The inflation rate the state set for taxes payable in 2027.</p>
      </div>
      <div class="field">
        <label for="cpiFut">Cap in later years</label>
        <div class="input-group">
          <input id="cpiFut" type="number" min="0" max="5" step="0.1" value="3.0" inputmode="decimal">
          <span class="affix">% / yr</span>
        </div>
        <p class="hint">3.0% is the district's own planning assumption. State law caps it at 5%.</p>
      </div>
    </div>
    <fieldset class="field-set field">
      <legend>Which increases to count</legend>
      <div class="choice-group compact" id="ptellScope" role="group" aria-label="Which levy increases to count">
        <button class="choice compact" type="button" data-scope="every" aria-pressed="true">Every year at the cap</button>
        <button class="choice compact" type="button" data-scope="once" aria-pressed="false">Just the 2026 levy</button>
      </div>
      <p class="hint">Districts usually levy the maximum every year, and each increase builds on the one before.
        "Just the 2026 levy" isolates this year's decision.</p>
    </fieldset>
  </div>

  <!-- CITY OF EVANSTON LEVY (not D65) -->
  <div id="cityBlock" class="flow hidden">
    <div class="field" id="cityTaxField">
      <label for="cityTax">Your current City of Evanston tax, per year</label>
      <div class="input-group">
        <span class="affix">$</span>
        <input id="cityTax" type="number" min="0" step="10" inputmode="numeric">
      </div>
      <p class="hint" id="cityTaxHint">Add the "City of Evanston" and "General Assistance" lines on your bill for the most
        accurate figure. Until you enter one, this is estimated from your EAV.</p>
    </div>
    <div class="grid-wide">
      <div class="field">
        <label for="cityPct">Increase in the city's levy for 2027</label>
        <div class="input-group">
          <input id="cityPct" type="number" min="0" max="30" step="0.1" value="4.1" inputmode="decimal">
          <span class="affix">%</span>
        </div>
        <div class="choice-group compact mt-xs" id="cityPresets" role="group" aria-label="Preset increases">
          <button class="choice compact" type="button" data-citypct="4.1" aria-pressed="false">4.1% · as introduced</button>
          <button class="choice compact" type="button" data-citypct="10.1" aria-pressed="false">10.1% · first proposal</button>
        </div>
      </div>
      <div class="field">
        <label for="cityLater">Increase in later years</label>
        <div class="input-group">
          <input id="cityLater" type="number" min="0" max="30" step="0.1" value="0" inputmode="decimal">
          <span class="affix">% / yr</span>
        </div>
        <p class="hint">The city is home rule and is not bound by the tax cap. It held its levy flat from 2021 to 2025, then
          raised it for 2026. Zero shows only the 2027 decision.</p>
      </div>
    </div>
  </div>

  <!-- BORROWING (hls + capital) -->
  <div id="borrowBlock" class="flow hidden">
    <fieldset class="field-set field">
      <legend id="bondLabel">Amount borrowed</legend>
      <input id="bond" type="range" min="0" max="200000000" step="1000000" value="22000000"
             aria-label="Amount borrowed, slider">
      <div class="input-group mt-xs" style="--field-width: 16rem">
        <span class="affix">$</span>
        <input id="bondNum" type="number" min="0" max="200000000" step="1000000" value="22000000" inputmode="numeric"
               aria-label="Amount borrowed, in dollars">
      </div>
      <p class="field-msg hidden" id="bondMsg" role="status" aria-live="polite"></p>
      <div class="choice-group compact mt-xs" id="bondPresets" role="group" aria-label="Preset amounts"></div>
      <p class="hint" id="bondHint"></p>
    </fieldset>

    <div class="grid-wide">
      <div class="field">
        <label for="term">Repayment term</label>
        <div class="input-group">
          <input id="term" type="number" min="1" max="30" step="1" value="20" inputmode="numeric">
          <span class="affix">years</span>
        </div>
        <p class="hint" id="termHint"></p>
        <p class="field-msg hidden" id="termMsg" role="status" aria-live="polite"></p>
      </div>
      <div class="field">
        <label for="rate">Interest rate</label>
        <div class="input-group">
          <input id="rate" type="number" min="0" max="15" step="0.05" value="4.5" inputmode="decimal">
          <span class="affix">% / yr</span>
        </div>
        <p class="hint">4% to 5% is a common range for school borrowing.</p>
      </div>
      <div class="field">
        <label for="bondStart">First tax bill that includes it</label>
        <div class="input-group">
          <input id="bondStart" type="number" min="2027" max="2040" step="1" value="2028" inputmode="numeric">
          <span class="affix">year paid</span>
        </div>
        <p class="hint" id="startHint"></p>
      </div>
    </div>
  </div>

  <!-- OPERATING -->
  <div id="operBlock" class="flow hidden">
    <fieldset class="field-set field">
      <legend>How is the increase described?</legend>
      <div class="choice-group compact" id="opModePresets">
        <button class="choice compact" type="button" data-op="dollars" aria-pressed="true">As dollars raised</button>
        <button class="choice compact" type="button" data-op="rate" aria-pressed="false">As a tax rate</button>
      </div>
    </fieldset>

    <div class="field" id="opDollarField">
      <label for="opDollars">Additional money raised in the first year, district-wide</label>
      <input id="opRange" type="range" min="0" max="30000000" step="500000" value="10000000"
             aria-label="Additional money raised each year, slider">
      <div class="input-group mt-xs" style="--field-width: 16rem">
        <span class="affix">$</span>
        <input id="opDollars" type="number" min="0" max="30000000" step="500000" value="10000000" inputmode="numeric">
      </div>
      <p class="field-msg hidden" id="opMsg" role="status" aria-live="polite"></p>
      <div class="choice-group compact mt-xs" id="opPresets" role="group" aria-label="Preset amounts">
        <button class="choice compact" type="button" data-opamt="5000000" aria-pressed="false">$5M</button>
        <button class="choice compact" type="button" data-opamt="10000000" aria-pressed="false">$10M</button>
        <button class="choice compact" type="button" data-opamt="20000000" aria-pressed="false">$20M · size of FY28 cuts</button>
        <button class="choice compact" type="button" data-opamt="17000000" aria-pressed="false">$17M · community v4 model</button>
      </div>
      <p class="hint">Referendum questions are often described this way in news coverage and district materials. $20 million
        is the reduction target in the district's FY2028 plan, shown for scale.</p>
    </div>

    <div class="field hidden" id="opRateField">
      <label for="opRate">Rate increase</label>
      <div class="input-group">
        <input id="opRate" type="number" min="0" step="0.01" value="0.25" inputmode="decimal">
        <span class="affix">per $100 of EAV</span>
      </div>
      <p class="hint">Ballot questions are usually written as a rate. This is the form that appears on the ballot itself.</p>
    </div>

    <div class="field">
      <label for="opStart">First tax bill that includes it</label>
      <div class="input-group">
        <input id="opStart" type="number" min="2027" max="2040" step="1" value="2029" inputmode="numeric">
        <span class="affix">year paid</span>
      </div>
      <p class="hint">Operating money arrives through the next tax cycle. A question on the November 2028 ballot would first
        show up on bills paid in 2029.</p>
    </div>
  </div>

  <!-- shared window (stack, ptell, operating) -->
  <div class="field" id="windowField">
    <label for="opYears">Show the running total over</label>
    <div class="input-group">
      <input id="opYears" type="number" min="1" max="30" step="1" value="20" inputmode="numeric">
      <span class="affix">years</span>
    </div>
    <p class="hint" id="windowHint">Counted from bills paid in 2027. Levy and operating increases do not expire on their own,
      so this is just a window for comparison.</p>
  </div>
</section>

<section class="card surface-feature">
  <p class="text-eyebrow" id="resLabel">Estimated cost to your household</p>
  <p class="stat-value" style="--stat-step: var(--step-6)">
    <span id="outYear">$0</span><span class="stat-unit"> / year</span>
  </p>
  <div class="stat-grid fit rule-above" id="resSplit" style="--stat-step: var(--step-2)">
    <div class="stat">
      <p class="text-eyebrow">Per month</p>
      <p class="stat-value" id="outMonth">$0</p>
    </div>
    <div class="stat">
      <p class="text-eyebrow" id="totalKey">Over the full term</p>
      <p class="stat-value" id="outTotal">$0</p>
    </div>
    <div class="stat">
      <p class="text-eyebrow">Your share of the district</p>
      <p class="stat-value" id="outShare">0%</p>
    </div>
  </div>
  <p class="text-eyebrow rule-above" id="by32Label">Through 2032, the end of the district's current projections</p>
  <div class="stat-grid fit" style="--stat-step: var(--step-2)">
    <div class="stat">
      <p class="text-eyebrow">Added on the 2032 bill</p>
      <p class="stat-value" id="out32Year">$0</p>
    </div>
    <div class="stat">
      <p class="text-eyebrow">Per month in 2032</p>
      <p class="stat-value" id="out32Month">$0</p>
    </div>
    <div class="stat">
      <p class="text-eyebrow">All extra paid, 2027–2032</p>
      <p class="stat-value" id="out32Total">$0</p>
    </div>
  </div>
</section>

<section class="card flow" id="ref2017Card">
  <p class="text-eyebrow">Already on your bill</p>
  <h2>What you still pay for the 2017 referendum</h2>
  <div class="stat-grid fit" style="--stat-step: var(--step-3)">
    <div class="stat">
      <p class="text-eyebrow">Per year, 2026 bill</p>
      <p class="stat-value" id="r17Year">$0</p>
    </div>
    <div class="stat">
      <p class="text-eyebrow">Per month</p>
      <p class="stat-value" id="r17Month">$0</p>
    </div>
    <div class="stat">
      <p class="text-eyebrow" id="r17ComboLabel">2017 plus new referendums, 2030</p>
      <p class="stat-value" id="r17Combo">$0</p>
    </div>
  </div>
  <p class="hint">Voters approved an operating referendum in April 2017 (about 80% yes) to raise about $14.5&nbsp;million a
    year, starting with bills paid in 2018. It had no end date, so it is now part of the district's permanent tax base
    and has grown with the tax cap every year since: an estimated $18.4&nbsp;million on 2026 bills, about 12% of what
    District 65 collects. This is already in your current bill, so it is not counted in the increases above. The last
    figure adds it to the operating and capital referendum amounts on this page for the spotlight year, to show the total
    you would be paying for referendums. It is a different total from the headline above: it adds the 2017 referendum,
    which is already on your bill, and leaves out the yearly levy increase, health and life safety bonds and the city
    levy, which are increases but not referendums. Thrive65 estimate.</p>
</section>

<section class="card flow" id="finCard">
  <p class="text-eyebrow">District-wide</p>
  <h2>What the borrowing would cost the district</h2>
  <p class="text-deemphasized">Every taxpayer together, using the amounts, terms and rates set on the Health &amp; life
    safety and Capital referendum tabs.</p>
  <div class="levy-table-wrap" id="finTable"></div>
  <p class="hint">Annual payment is level debt service: principal plus interest, the same each year. Interest is highest
    in the first year and falls as the loan is paid down, so the first-year figure is the peak; the average spreads total
    interest evenly over the term. Existing bonds are shown for scale: District 65 extended $7.43&nbsp;million for bond
    and interest on Tax Year 2025 bills and had $99.1&nbsp;million of long-term debt principal outstanding on June 30,
    2025; the interest share of that payment is not published in the levy memo. The community v4 model's $63.7&nbsp;million
    capital bond replaces the district's yearly building budget of about $7.97&nbsp;million with borrowed money, so the
    interest is the added cost of paying for routine capital work over time. Thrive65 estimate.</p>
</section>

<section class="card flow levy-chart" id="chartCard">
  <h2 id="chartTitle">Year by year</h2>
  <p class="text-deemphasized" id="chartSub">Added to what you pay on your 2026 bill, by the year the bill is paid.</p>
  <div class="levy-legend cluster" id="chartLegend"></div>
  <div class="levy-chart-wrap" id="chartWrap">
    <svg id="chartSvg" role="img" aria-labelledby="chartTitle chartSub" viewBox="0 0 640 280"
         preserveAspectRatio="xMidYMid meet"></svg>
    <div class="levy-tip hidden" id="chartTip" aria-hidden="true"></div>
  </div>
  <details class="accordion">
    <summary class="cluster">
      <h3>Show as a table</h3>
      <span class="accordion-icon" aria-hidden="true"></span>
    </summary>
    <div class="accordion-body levy-table-wrap" id="chartTable"></div>
  </details>
</section>

<section class="card surface-quiet">
  <h2>How that number is built</h2>
  <div id="traceBody"></div>
</section>

<details class="accordion" id="detAssume">
  <summary class="cluster">
    <h2>What this estimate assumes</h2>
    <span class="accordion-icon" aria-hidden="true"></span>
  </summary>
  <div class="accordion-body" id="assumeBody"></div>
</details>

<details class="accordion" id="detVote">
  <summary class="cluster">
    <!-- id lives on the span, not the h2: an id'd heading would collect an
         injected .heading-anchor (head.html), which setMode's textContent
         swap would then destroy — and a copy-link inside a <summary> is
         wrong anyway. -->
    <h2><span id="voteSummary">Why a vote may not be required</span></h2>
    <span class="accordion-icon" aria-hidden="true"></span>
  </summary>
  <div class="accordion-body" id="voteBody"></div>
</details>

<p class="visually-hidden" id="resAnnounce" role="status" aria-live="polite"></p>

<hr>

<div class="text-meta text-deemphasized">
  <p><strong>Sources</strong></p>
  <ol>
    <li>District 65 FY2025 annual financial report (fiscal year ending June 30, 2025), Financial Profile
      Information page, reporting a Tax Year 2024 equalized assessed valuation of $4,203,686,381 and long-term
      debt principal outstanding of $99,111,300 as of June 30, 2025.</li>
    <li>District 65, HLS Approval for Submission to ISBE, board memo (August 4, 2026), reporting $128.8&nbsp;million
      in identified health and life safety work.</li>
    <li>District 65 FY2027 tentative budget memo (August 31, 2026) and FY2027 budget filed with ISBE (September 2026),
      showing about $22.1&nbsp;million of anticipated health and life safety bond proceeds ($22,000,000 in bond principal
      in the Fire Prevention and Safety Fund) against about $4.4&nbsp;million of eligible spending in FY2027.</li>
    <li>Evanston RoundTable, "District 65 board debates budget cut plan again amid community backlash" (November 10, 2026),
      reporting proposed summer 2027 repairs of $3.85&nbsp;million in district funds and $5&nbsp;million in health and life
      safety bonds.</li>
    <li>District 65, "2026 Tentative Tax Levy," memo from CFO Eric Miller (October 26, 2026): 2025 extension of
      $148,509,149 ($141,083,900 capped, $7,425,249 bond and interest); a 4.99% request for capped funds with an estimated
      3.01% extension; bond and interest estimated down 2.88%; estimated levy set November 16, public hearing and final
      adoption December 14.</li>
    <li>Evanston RoundTable, "District 65 proposes 4.99% property tax increase" (October 27, 2026), reporting the 4.99%
      levy request, the 2.7% inflation factor for taxes payable in 2027, about $15&nbsp;million in assumed new property,
      the district's estimate of about $110 a year for a $500,000 home, and a public hearing set for December 14.</li>
    <li>Evanston RoundTable, "Property tax report: Median residential bill up 5%" (August 24, 2026), citing the Cook County
      Treasurer's 2025 Tax Year Bill Analysis: District 65's Tax Year 2025 levy of $150.43&nbsp;million, up
      $4.58&nbsp;million from Tax Year 2024; District 65 at 41.25% of Evanston bills and the city, including the library,
      at 18.87% ($62.68&nbsp;million); and, after the 2025 reassessment, median residential taxable value up 17.67%
      against 8.58% to 11.14% for other property types, moving homes from 69% to 70.4% of Evanston's taxable value. The
      Tax Year 2024 D65 figure ($145.85&nbsp;million) divided by source 1's EAV gives the rate this page uses to estimate
      your District 65 tax when you have not entered one.</li>
    <li>The Daily Northwestern, "EPL board continues executive director search, holds Truth in Taxation hearing"
      (October 22, 2026), reporting the library's operating levy of $9.48&nbsp;million and debt service levy of
      $547,823, used here to separate the library from the city's 18.87% share of the bill.</li>
    <li>District 65, Financial Projection Assumptions (October 2026), assuming inflation of 2.7% for levy year 2026 and
      3.0% in later levy years.</li>
    <li>District 65, "A Sustainable Path Forward," board committee presentation (September 14, 2026), with long-range
      financial projections running through FY2032. The "through 2032" figures on this page stop at the same year so
      they can be read alongside the district's own outlook.</li>
    <li>District 65, FY2028 proposed financial sustainability package (October 2026), describing a potential bond
      referendum in November 2028 for two new or significantly renovated schools and investment in remaining buildings,
      and a $20&nbsp;million FY2028 reduction target.</li>
    <li>Evanston Now, "Council votes 5-4 to introduce Evanston's 2027 budget" (November 2026), reporting the introduced
      budget's 4.1% increase to the city's portion of the property tax levy, down from the 10.1% first proposed, with
      adoption scheduled for later in November.</li>
    <li>The Daily Northwestern, "Proposed city budget includes 8.9% property tax levy hike, mostly for parks" (October 7,
      2026), reporting the city's estimate that the original proposal, including the library, would add about $180 a year
      for the median Evanston home.</li>
    <li>City of Evanston, "Property Tax Bill Explanation," listing tax rates of 1.269 for the City of Evanston and 0.029 for
      General Assistance per $100 of EAV (Tax Year 2023), which this page uses to estimate your current city tax.</li>
    <li>Minnesota Department of Revenue, "Percentage of Rent Constituting Property Taxes," presuming property taxes on
      residential rental property average 17% of annual rent; and Center on Budget and Policy Priorities, noting that
      Maine's Property Tax Fairness Credit assumes 25% of gross rent. Used for the share of rent that covers property tax.</li>
    <li>Research on how much of a property tax change reaches rent: Carroll and Yinger, "Is the Property Tax a Benefit
      Tax? The Case of Rental Housing" (about $0.15 per $1); Schwegman and Yinger, U.S. Census Bureau CES Working Paper
      20-43 (2020) (about 14%); Baker, Federal Reserve Bank of Philadelphia Working Paper 25-41 (2025) ($0.50 to $0.89 per
      $1); Federal Reserve Bank of Philadelphia Working Paper 26-51 (about 73% in professionally managed large
      apartments, no significant market-wide effect); and Löffler and Siegloch (about 83% over several years, Germany).
      These set the low, middle, and high presets.</li>
    <li>For a Brighter Evanston, "D65 Ten-Year Financial Model, v4" (New_Money tab: $17,000,000 operating referendum
      from FY2030 growing with local revenue; $63,737,800 in bonds replacing $7,967,225 a year of capital transfers;
      memo debt service of $4,899,916 a year) and "Model Executive Summary" (November 2026), used for the community v4
      package preset.</li>
    <li>District-wide financing costs use level debt service on the bond amounts entered on this page. Existing bond
      and interest ($7,425,249, Tax Year 2025 extension) is from source 5; long-term debt outstanding ($99,111,300) is
      from source 1.</li>
    <li>The Daily Northwestern, "Voters set to decide District 65's financial future through property tax referendum"
      (April 3, 2017), reporting that the referendum would raise about $14.5&nbsp;million a year; Evanston RoundTable,
      "80% Yes! D65 Referendum Passes" (April 5, 2017). Growth since then applies the Illinois Department of Revenue's
      PTELL inflation factors for levy years 2018 to 2025 (Thrive65 estimate).</li>
    <li>35 ILCS 200/18-185, Property Tax Extension Limitation Law, limiting annual growth in a district's capped levy
      to the lesser of 5% or the prior year's change in the Consumer Price Index, plus new property.</li>
    <li>105 ILCS 5/17-2.11, school board authority to levy taxes or issue bonds for fire prevention, safety, and
      specified repair purposes, with such bonds required to mature within 20 years.</li>
    <li>Illinois House Bill 4582 (103rd General Assembly), effective July 1, 2024, setting a 30-year maximum
      maturity for voter-approved school bonds issued to purchase, construct, or improve real property, for
      referendums held on or after November 5, 2024.</li>
  </ol>
  <p class="mt-s">
    Thrive65 is an independent community coalition and is not affiliated with or operated by District 65.
    These are estimates, not tax or legal advice. If you find an error, tell us and we will correct it.
  </p>
</div>

<script src="{{ '/assets/js/tax-calculator.js' | relative_url }}" defer></script>
