---
layout: "page"
title: "What would this cost my household?"
eyebrow: "Tax impact estimator"
description: "District 65 could raise property taxes in several ways over the next few years. Enter your home's value or your rent, choose which increases to include, and see what they would add to your tax bill or rent, year by year."
---

<!-- Two columns at --measure-wide on desktop: everything down to the sources, and the docked result beside it. -->
<div class="dock-layout">
  <div class="flow">
<section class="card flow">
  <h2>Your numbers</h2>
  <p class="text-deemphasized hint">Everything below is adjustable. Nothing entered is saved.</p>

  <fieldset class="field-set field mt-s">
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
    <p class="hint">Research disagrees on how much of a tax increase reaches tenants. Studies range from about 15% to more
      than 80%, with more passed on in large, professionally managed buildings and over several years. Your actual rent
      depends mostly on the rental market. This shows only the property tax part, and it does not apply to
      income-restricted or subsidized units, where rent is set by formula.</p>
  </div>

  <div id="ownerFields" class="flow">
  <div class="field">
    <label for="homeEav">Equalized assessed value (EAV), from your tax bill</label>
    <div class="input-group">
      <span class="affix">$</span>
      <input id="homeEav" type="number" min="0" step="1000" value="140000" inputmode="numeric">
    </div>
    <p class="hint">No bill handy? Estimate it from market value below.</p>
  </div>

  <div class="field">
    <label for="mktVal">Or estimate from market value</label>
    <div class="input-group">
      <span class="affix">$</span>
      <input id="mktVal" type="number" min="0" step="10000" placeholder="e.g. 500000" inputmode="numeric">
    </div>
    <p class="hint">Cook County assesses homes at 10% of market value, then the state applies its equalization
      factor (3.0300 for 2025), and the $10,000 standard homeowner exemption comes off. A $500,000 home works out to
      about $141,500. Senior and other exemptions would lower it further. "Market value" here means the assessor's
      value, which can differ from a sale price.</p>
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
</section>

<!-- Each piece is a checkbox (count it), an exclusive <details> whose summary is the row, and the
     row's .include-panel of fields, a sibling so the checkbox can centre on the summary alone (CSS shows
     the panel while its <details> is open). The rows are
     static: tax-calculator.js only rewrites each row's note (#<key>Note) and amount (#<key>Amount), so
     the inputs inside the panels survive every render. Field ids are prefixed with the piece key. -->
<section class="card flow" id="pieces">
  <h2>What to include</h2>
  <p class="text-deemphasized">Untick a piece to leave it out of your total. Open one to change its amount, term or
    start year.</p>

  <!-- scenario options and their notes are generated from SCEN in tax-calculator.js -->
  <div class="field">
    <label for="scenario">Scenario</label>
    <div class="select">
      <select id="scenario" aria-describedby="scenarioNote">
        <option value="custom">Custom</option>
      </select>
      {% include icons/chevron.svg %}
    </div>
    <p class="hint" id="scenarioNote"></p>
  </div>

  <div class="steps" id="stackSummary">

    <!-- YEARLY LEVY INCREASE (PTELL) -->
    <div class="step include-row">
      <label class="checkbox">
        <input type="checkbox" id="ptellInclude" checked>
        {% include icons/checkbox.svg %}
        <span class="visually-hidden">Include the yearly levy increase</span>
      </label>
      <details name="piece">
        <summary aria-controls="ptellPanel">
          <span class="include-label"><span class="levy-swatch" style="--swatch: var(--series-1)"></span><span class="include-name" id="ptellName">Yearly levy increase</span><small class="step-note" id="ptellNote"></small></span>
          <span class="step-value" id="ptellAmount"></span>
          {% include icons/chevron.svg %}
        </summary>
      </details>
      <div class="include-panel" id="ptellPanel" role="group" aria-labelledby="ptellName" hidden>
        <div class="callout">
          <p><strong>The district requested a 4.99% increase, but existing homeowners should expect closer to
            2.4%.</strong> State law caps growth on existing property at inflation, 2.7% for taxes paid in 2027, and
            that cap covers about 95% of the District 65 tax. The other 5%, existing bond payments, is estimated to
            fall 2.88%. The district's own memo estimates capped extensions will actually rise about 3%, with the
            extra coming from newly built property, billed to its owners rather than to you. The levy is set to be
            adopted December 14.</p>
        </div>
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
          <p class="hint">3.0% is the district's own planning assumption. State law caps it at 5%. The operating
            referendum grows at this rate too.</p>
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
    </div>

    <!-- HEALTH & LIFE SAFETY BONDS -->
    <div class="step include-row">
      <label class="checkbox">
        <input type="checkbox" id="hlsInclude" checked>
        {% include icons/checkbox.svg %}
        <span class="visually-hidden">Include health and life safety bonds</span>
      </label>
      <details name="piece">
        <summary aria-controls="hlsPanel">
          <span class="include-label"><span class="levy-swatch" style="--swatch: var(--series-2)"></span><span class="include-name" id="hlsName">Health &amp; life safety bonds</span><small class="step-note" id="hlsNote"></small></span>
          <span class="step-value" id="hlsAmount"></span>
          {% include icons/chevron.svg %}
        </summary>
      </details>
      <div class="include-panel" id="hlsPanel" role="group" aria-labelledby="hlsName" hidden>
        <div class="callout">
          <p><strong>The district has started to borrow for this work.</strong> Its FY2027 budget anticipates about
            $22.1 million in health and life safety bond proceeds, and the proposed summer 2027 repairs use
            $5 million of these bonds alongside $3.85 million of district funds. The full $128.8 million survey is a
            ten-year ceiling, not a plan.</p>
        </div>
        <fieldset class="field-set field">
          <legend>Amount borrowed for safety work</legend>
          <input id="hlsBond" type="range" min="0" max="200000000" step="1000000" value="22000000"
                 aria-label="Amount borrowed, slider">
          <div class="input-group mt-xs">
            <span class="affix">$</span>
            <input id="hlsBondNum" type="number" min="0" max="200000000" step="1000000" value="22000000"
                   inputmode="numeric" aria-label="Amount borrowed, in dollars">
          </div>
          <p class="field-msg hidden" id="hlsBondMsg" role="status" aria-live="polite"></p>
          <div class="choice-group compact mt-xs" id="hlsPresets" role="group" aria-label="Preset amounts">
            <button class="choice compact" type="button" data-bond="5000000" aria-pressed="false">$5M · summer 2027</button>
            <button class="choice compact" type="button" data-bond="22000000" aria-pressed="false">$22M · FY27 budget</button>
            <button class="choice compact" type="button" data-bond="50000000" aria-pressed="false">$50M</button>
            <button class="choice compact" type="button" data-bond="128800000" aria-pressed="false">$128.8M · full survey</button>
          </div>
          <p class="hint">$22 million is the bond amount in the FY2027 budget. $128.8 million is the full ten-year
            survey reported to the board in August 2026, much of which can be deferred for up to a decade.</p>
        </fieldset>
        <div class="field">
          <label for="hlsTerm">Repayment term</label>
          <div class="input-group">
            <input id="hlsTerm" type="number" min="1" max="20" step="1" value="20" inputmode="numeric">
            <span class="affix">years</span>
          </div>
          <p class="hint">Illinois caps these particular bonds at 20 years.</p>
          <p class="field-msg hidden" id="hlsTermMsg" role="status" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="hlsRate">Interest rate</label>
          <div class="input-group">
            <input id="hlsRate" type="number" min="0" max="15" step="0.05" value="4.5" inputmode="decimal">
            <span class="affix">% / yr</span>
          </div>
          <p class="hint">4% to 5% is a common range for school borrowing.</p>
        </div>
        <div class="field">
          <label for="hlsStart">First tax bill that includes it</label>
          <div class="input-group">
            <input id="hlsStart" type="number" min="2027" max="2040" step="1" value="2028" inputmode="numeric">
            <span class="affix">year paid</span>
          </div>
          <p class="hint">Bonds sold during 2027 would most likely first appear on bills paid in 2028.</p>
        </div>
      </div>
    </div>

    <!-- CAPITAL REFERENDUM -->
    <div class="step include-row">
      <label class="checkbox">
        <input type="checkbox" id="capitalInclude" checked>
        {% include icons/checkbox.svg %}
        <span class="visually-hidden">Include a capital referendum</span>
      </label>
      <details name="piece">
        <summary aria-controls="capitalPanel">
          <span class="include-label"><span class="levy-swatch" style="--swatch: var(--series-3)"></span><span class="include-name" id="capitalName">Capital referendum</span><small class="step-note" id="capitalNote"></small></span>
          <span class="step-value" id="capitalAmount"></span>
          {% include icons/chevron.svg %}
        </summary>
      </details>
      <div class="include-panel" id="capitalPanel" role="group" aria-labelledby="capitalName" hidden>
        <div class="callout">
          <p><strong>No capital referendum has been proposed.</strong> The district has said it is exploring a bond
            referendum in November 2028 to build two new or significantly renovated schools and invest in the
            buildings that remain. It has not named an amount.</p>
        </div>
        <fieldset class="field-set field">
          <legend>Amount borrowed, approved by voters</legend>
          <input id="capitalBond" type="range" min="0" max="410000000" step="1000000" value="63737800"
                 aria-label="Amount borrowed, slider">
          <div class="input-group mt-xs">
            <span class="affix">$</span>
            <input id="capitalBondNum" type="number" min="0" max="410000000" step="1000000" value="63737800"
                   inputmode="numeric" aria-label="Amount borrowed, in dollars">
          </div>
          <p class="field-msg hidden" id="capitalBondMsg" role="status" aria-live="polite"></p>
          <div class="choice-group compact mt-xs" id="capitalPresets" role="group" aria-label="Preset amounts">
            <button class="choice compact" type="button" data-bond="50000000" aria-pressed="false">$50M</button>
            <button class="choice compact" type="button" data-bond="63737800" aria-pressed="false">$63.7M · community v4 model</button>
            <button class="choice compact" type="button" data-bond="100000000" aria-pressed="false">$100M</button>
            <button class="choice compact" type="button" data-bond="200000000" aria-pressed="false">$200M</button>
            <button class="choice compact" type="button" data-bond="409600000" aria-pressed="false">$409.6M · 10-yr needs</button>
          </div>
          <p class="hint">For scale, District 65 has identified about $409.6 million of facilities needs in the first
            ten years.</p>
        </fieldset>
        <div class="field">
          <label for="capitalTerm">Repayment term</label>
          <div class="input-group">
            <input id="capitalTerm" type="number" min="1" max="30" step="1" value="20" inputmode="numeric">
            <span class="affix">years</span>
          </div>
          <p class="hint">Illinois caps voter-approved building bonds at 30 years. Terms of 20 to 25 years are
            common.</p>
          <p class="field-msg hidden" id="capitalTermMsg" role="status" aria-live="polite"></p>
        </div>
        <div class="field">
          <label for="capitalRate">Interest rate</label>
          <div class="input-group">
            <input id="capitalRate" type="number" min="0" max="15" step="0.05" value="4.5" inputmode="decimal">
            <span class="affix">% / yr</span>
          </div>
          <p class="hint">4% to 5% is a common range for school borrowing.</p>
        </div>
        <div class="field">
          <label for="capitalStart">First tax bill that includes it</label>
          <div class="input-group">
            <input id="capitalStart" type="number" min="2027" max="2040" step="1" value="2030" inputmode="numeric">
            <span class="affix">year paid</span>
          </div>
          <p class="hint">This assumes a November 2028 vote, with bonds sold in 2029 and first repaid on bills paid
            in 2030.</p>
        </div>
      </div>
    </div>

    <!-- OPERATING REFERENDUM -->
    <div class="step include-row">
      <label class="checkbox">
        <input type="checkbox" id="operatingInclude" checked>
        {% include icons/checkbox.svg %}
        <span class="visually-hidden">Include an operating referendum</span>
      </label>
      <details name="piece">
        <summary aria-controls="operatingPanel">
          <span class="include-label"><span class="levy-swatch" style="--swatch: var(--series-4)"></span><span class="include-name" id="operatingName">Operating referendum</span><small class="step-note" id="operatingNote"></small></span>
          <span class="step-value" id="operatingAmount"></span>
          {% include icons/chevron.svg %}
        </summary>
      </details>
      <div class="include-panel" id="operatingPanel" role="group" aria-labelledby="operatingName" hidden>
        <div class="callout stripe-bloom">
          <p><strong>No operating referendum has been proposed, and an operating increase does not expire on its
            own.</strong> Unlike bonds, which end when they are repaid, an approved operating increase becomes part
            of the district's permanent tax base unless the ballot question sets an end date. District 65's 2017
            referendum was presented as a time-limited bridge.</p>
        </div>
        <fieldset class="field-set field">
          <legend>How is the increase described?</legend>
          <div class="choice-group compact" id="opModePresets">
            <button class="choice compact" type="button" data-op="dollars" aria-pressed="true">As dollars raised</button>
            <button class="choice compact" type="button" data-op="rate" aria-pressed="false">As a tax rate</button>
          </div>
        </fieldset>

        <div class="field" id="opDollarField">
          <label for="opDollars">Additional money raised in the first year, district-wide</label>
          <input id="opRange" type="range" min="0" max="30000000" step="500000" value="17000000"
                 aria-label="Additional money raised each year, slider">
          <div class="input-group mt-xs">
            <span class="affix">$</span>
            <input id="opDollars" type="number" min="0" max="30000000" step="500000" value="17000000" inputmode="numeric">
          </div>
          <p class="field-msg hidden" id="opMsg" role="status" aria-live="polite"></p>
          <div class="choice-group compact mt-xs" id="opPresets" role="group" aria-label="Preset amounts">
            <button class="choice compact" type="button" data-opamt="5000000" aria-pressed="false">$5M</button>
            <button class="choice compact" type="button" data-opamt="10000000" aria-pressed="false">$10M</button>
            <button class="choice compact" type="button" data-opamt="20000000" aria-pressed="false">$20M · size of FY28 cuts</button>
            <button class="choice compact" type="button" data-opamt="17000000" aria-pressed="false">$17M · community v4 model</button>
          </div>
          <p class="hint">Referendum questions are often described this way in news coverage and district materials.
            $20 million is the reduction target in the district's FY2028 plan, shown for scale.</p>
        </div>

        <div class="field hidden" id="opRateField">
          <label for="opRate">Rate increase</label>
          <div class="input-group">
            <input id="opRate" type="number" min="0" step="0.01" value="0.25" inputmode="decimal">
            <span class="affix">per $100 of EAV</span>
          </div>
          <p class="hint">Ballot questions are usually written as a rate. This is the form that appears on the ballot
            itself.</p>
        </div>

        <div class="field">
          <label for="opStart">First tax bill that includes it</label>
          <div class="input-group">
            <input id="opStart" type="number" min="2027" max="2040" step="1" value="2029" inputmode="numeric">
            <span class="affix">year paid</span>
          </div>
          <p class="hint">Operating money arrives through the next tax cycle. A question on the November 2028 ballot
            would first show up on bills paid in 2029.</p>
        </div>
      </div>
    </div>

    <div class="step total">
      <div class="step-n"></div>
      <div class="step-label"><strong id="stackTotalLabel">Added on your 2030 bill</strong></div>
      <div class="step-value" id="stackTotal"></div>
    </div>
  </div>

  <div class="field">
    <label for="stackYear">Show the total for bills paid in</label>
    <div class="input-group">
      <input id="stackYear" type="number" min="2027" max="2066" step="1" value="2030" inputmode="numeric">
      <span class="affix">bill paid</span>
    </div>
    <p class="hint">The headline figure below is the total for this year. 2030 is the first year all four pieces would
      appear on a bill under the default start years.</p>
  </div>

  <div class="field">
    <label for="opYears">Show the running total over</label>
    <div class="input-group">
      <input id="opYears" type="number" min="1" max="30" step="1" value="20" inputmode="numeric">
      <span class="affix">years</span>
    </div>
    <p class="hint">Counted from bills paid in 2027. Levy and operating increases do not expire on their own,
      so this is just a window for comparison.</p>
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
  </div>
  <p class="hint">Voters approved an operating referendum in April 2017 (about 80% yes) to raise about $14.5&nbsp;million a
    year, starting with bills paid in 2018. It had no end date, so it is now part of the district's permanent tax base
    and has grown with the tax cap every year since: an estimated $18.4&nbsp;million on 2026 bills, about 12% of what
    District 65 collects. This is already in your current bill, so it is not counted in the increases above. Thrive65
    estimate.</p>
</section>

<section class="card flow" id="finCard">
  <p class="text-eyebrow">District-wide</p>
  <h2>What the borrowing would cost the district</h2>
  <p class="text-deemphasized">Every taxpayer together, using the amounts, terms and rates set for Health &amp; life
    safety bonds and the Capital referendum above.</p>
  <!-- tabindex lets keyboard users scroll the table sideways when it overflows -->
  <div class="levy-table-wrap" id="finTable" role="region" tabindex="0" aria-label="District-wide borrowing costs"></div>
  <p class="hint"><strong>How to read this.</strong> Annual payment is level debt service: principal plus interest, the
    same each year. Interest is highest in the first year and falls as the loan is paid down, so the first-year figure is
    the peak, and the average spreads total interest evenly over the term. Thrive65 estimate.</p>
  <p class="hint"><strong>For scale.</strong> District 65 extended $7.43&nbsp;million for bond and interest on Tax Year
    2025 bills and had $99.1&nbsp;million of long-term debt principal outstanding on June 30, 2025. The levy memo doesn't
    publish the interest share of that payment.</p>
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
    <div class="accordion-body levy-table-wrap" id="chartTable" role="region" tabindex="0"
         aria-label="Year-by-year amounts"></div>
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
         injected .heading-anchor (head.html), which the JS textContent
         swap would then destroy — and a copy-link inside a <summary> is
         wrong anyway. Hidden by JS while no piece is ticked. -->
    <h2><span id="voteSummary">Why a vote may not be required</span></h2>
    <span class="accordion-icon" aria-hidden="true"></span>
  </summary>
  <div class="accordion-body" id="voteBody"></div>
</details>

<p class="visually-hidden" id="resAnnounce" role="status" aria-live="polite"></p>
  </div>

  <!-- The result, docked (audit issue 5): all of it, in the right column on desktop (sticky below the
       header), and on phones a bottom bar that shows the headline and slides up into the full card on
       "Details". It docks down to the sources. With docking off (short screens, 150% text) it is an
       ordinary card at the end of that column.
       Not a live region: #resAnnounce already announces every result. -->
  <aside class="result-dock card surface-feature" id="result" aria-labelledby="resLabel">
    <div class="dock-collapse" id="dockTop">
      <div><p class="text-eyebrow" id="resLabel">Estimated cost to your household</p></div>
    </div>
    <div class="dock-head">
      <div>
        <p class="text-eyebrow dock-bar-label" id="dockBarLabel">Added cost in 2030</p>
        <p class="stat-value"><span id="outYear">$0</span><span class="stat-unit"> / year</span></p>
      </div>
      <button class="dock-details" type="button" id="dockDetails" aria-expanded="false"
              aria-controls="dockTop dockMore"><span id="dockDetailsLabel">Details</span>{% include icons/chevron.svg %}</button>
    </div>
    <div class="dock-collapse" id="dockMore">
      <div>
        <div class="stat-grid fit rule-above" id="resSplit" style="--stat-step: var(--step-2)">
          <div class="stat">
            <p class="text-eyebrow">Per month</p>
            <p class="stat-value" id="outMonth">$0</p>
          </div>
        </div>
        <p class="text-eyebrow rule-above">Through 2032</p>
        <p class="hint">The district's own projections end in 2032.</p>
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
      </div>
    </div>
  </aside>
</div>

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
      District 65 Tax Year 2025 extension (source 5) divided by the Tax Year 2025 EAV (Cook County Clerk, below) gives
      the rate, about 2.985%, this page uses to estimate your District 65 tax when you have not entered one.</li>
    <li>Cook County Clerk, "Tax Year 2025 Agency EAV by Class Report" (October 6, 2026): School District C C 65
      (agency 04-0270-000) total valuation less exemptions of $4,975,974,449, of which $4,011,594,534 residential. Used as
      the district's total taxable value. Illinois Department of Revenue 2025 Cook County final equalization factor of
      3.0300 and the $10,000 general homeowner exemption are used to estimate EAV from market value.</li>
    <li>District 65, Financial Projection Assumptions (October 2026), assuming inflation of 2.7% for levy year 2026 and
      3.0% in later levy years.</li>
    <li>District 65, "A Sustainable Path Forward," board committee presentation (September 14, 2026), with long-range
      financial projections running through FY2032. The "through 2032" figures on this page stop at the same year so
      they can be read alongside the district's own outlook.</li>
    <li>District 65, FY2028 proposed financial sustainability package (October 2026), describing a potential bond
      referendum in November 2028 for two new or significantly renovated schools and investment in remaining buildings,
      and a $20&nbsp;million FY2028 reduction target.</li>
    <li>Minnesota Department of Revenue, "Percentage of Rent Constituting Property Taxes," presuming property taxes on
      residential rental property average 17% of annual rent; and Center on Budget and Policy Priorities, noting that
      Maine's Property Tax Fairness Credit assumes 25% of gross rent. Used for the share of rent that covers property tax.</li>
    <li>Research on how much of a property tax change reaches rent: Carroll and Yinger, "Is the Property Tax a Benefit
      Tax? The Case of Rental Housing" (about $0.15 per $1); Schwegman and Yinger, U.S. Census Bureau CES Working Paper
      20-43 (2020) (about 14%); Baker, Federal Reserve Bank of Philadelphia Working Paper 25-41 (2025) ($0.50 to $0.89 per
      $1); Federal Reserve Bank of Philadelphia Working Paper 26-51 (about 73% in professionally managed large
      apartments, no significant market-wide effect); and Löffler and Siegloch (about 83% over several years, Germany).
      These set the low, middle, and high presets.</li>
    <li id="source-v4">For a Brighter Evanston, "D65 Ten-Year Financial Model, v4" (New_Money tab: $17,000,000 operating referendum
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
