---
layout: "page"
title: "What would this cost my household?"
eyebrow: "Tax impact estimator"
description: "Estimate your household's share of District 65 safety work, a capital referendum, or an operating referendum, using your own property's assessed value."
# Test page, should be hidden from search/sitemap
noindex: true      # emits <meta name="robots" content="noindex, follow"> (head.html)
sitemap: false     # omitted from sitemap.xml (jekyll-sitemap)
---

<p>There is more than one way District 65 can raise money for buildings or for operations, and they land on your
tax bill differently. Pick the one you want to understand, then put in your own numbers.</p>

<fieldset class="field-set mt-l">
  <legend class="visually-hidden">Choose what to estimate</legend>
  <div class="choice-group">
    <button class="choice" type="button" data-mode="hls" aria-pressed="true">
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
  </div>
</fieldset>

<div class="callout" id="modeNote"></div>

<section class="card flow">
  <h2>Your numbers</h2>
  <p class="text-deemphasized">Everything below is adjustable. Nothing you enter leaves your browser.</p>

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

  <!-- BORROWING (hls + capital) -->
  <div id="borrowBlock" class="flow">
    <fieldset class="field-set field">
      <legend id="bondLabel">Amount borrowed</legend>
      <input id="bond" type="range" min="0" max="200000000" step="1000000" value="50000000"
             aria-label="Amount borrowed, slider">
      <div class="input-group mt-xs" style="--field-width: 16rem">
        <span class="affix">$</span>
        <input id="bondNum" type="number" min="0" step="1000000" value="50000000" inputmode="numeric"
               aria-label="Amount borrowed, in dollars">
      </div>
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
        <p class="field-msg hidden" id="termMsg" role="alert"></p>
      </div>
      <div class="field">
        <label for="rate">Interest rate</label>
        <div class="input-group">
          <input id="rate" type="number" min="0" max="15" step="0.05" value="4.5" inputmode="decimal">
          <span class="affix">% / yr</span>
        </div>
        <p class="hint">4% to 5% is a common range for school borrowing.</p>
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
      <label for="opDollars">Additional money raised each year, district-wide</label>
      <input id="opRange" type="range" min="0" max="30000000" step="500000" value="10000000"
             aria-label="Additional money raised each year, slider">
      <div class="input-group mt-xs" style="--field-width: 16rem">
        <span class="affix">$</span>
        <input id="opDollars" type="number" min="0" step="500000" value="10000000" inputmode="numeric">
      </div>
      <p class="hint">Referendum questions are often described this way in news coverage and district materials.</p>
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
      <label for="opYears">Show the running total over</label>
      <div class="input-group">
        <input id="opYears" type="number" min="1" max="40" step="1" value="10" inputmode="numeric">
        <span class="affix">years</span>
      </div>
      <p class="hint">Operating increases do not expire on their own. This is just a window for comparison.</p>
    </div>
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
    <h2 id="voteSummary">Why a vote may not be required</h2>
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
    <li>District 65 FY2027 preliminary budget memo (June 22, 2026), Health Life Safety Fund property tax revenue
      of $136,600.</li>
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
