---
layout: "page"
title: "What would this cost my household?"
description: "Estimate your household's share of District 65 safety work, a capital referendum, or an operating referendum, using your own property's assessed value."
# Test page, should be hidden from search/sitemap
noindex: true      # emits <meta name="robots" content="noindex, follow"> (head.html)
sitemap: false     # omitted from sitemap.xml (jekyll-sitemap)
---


<style>

.page-header,
.wave {
  display: none;
}

  :root{
    --bg:#F7F5EC; --card:#FFFFFF; --ink:#14231B;
    --brand:#0F7A45; --brand-strong:#0A5C34;
    --secondary:hsl(189,65%,22%);
    --accent:#FFB01A; --accent-hover:#FFC44F;
    --bloom:#D42A56;
    --tint:hsl(150,30%,91%);
    --line:hsl(150,20%,83%);
    --frame:#0B0B0B;
    --muted:#5A6B61;
    --radius:12px;
  }
  *{box-sizing:border-box}
  html{-webkit-text-size-adjust:100%}
  body{margin:0;background:var(--bg);color:var(--ink);
    font-family:"Public Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    font-size:17px;line-height:1.55}
  .wrap{max-width:940px;margin:0 auto;padding:32px 20px 72px}

  .eyebrow{font-family:"Archivo",sans-serif;font-weight:700;font-size:.72rem;
    letter-spacing:.14em;text-transform:uppercase;color:var(--brand-strong);margin:0 0 10px}
  h1{font-family:"Archivo",sans-serif;font-weight:800;line-height:1.08;
    font-size:clamp(1.9rem,5vw,2.9rem);margin:0 0 14px;letter-spacing:-.015em}
  h1 em{font-style:normal;color:var(--brand);box-shadow:inset 0 -.34em 0 var(--accent)}
  .lede{font-size:1.06rem;color:var(--muted);max-width:62ch;margin:0}

  /* ---- mode switch ---- */
  .modes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:26px 0 6px}
  @media(max-width:640px){.modes{grid-template-columns:1fr}}
  .mode{
    font-family:"Archivo",sans-serif;font-weight:700;font-size:.92rem;text-align:left;
    cursor:pointer;padding:14px 16px;border:2px solid var(--frame);border-radius:var(--radius);
    background:#fff;color:var(--ink);line-height:1.25
  }
  .mode span{display:block;font-family:"Public Sans",sans-serif;font-weight:400;
    font-size:.82rem;color:var(--muted);margin-top:4px}
  .mode:hover{background:var(--tint)}
  .mode[aria-pressed=true]{background:var(--brand);border-color:var(--frame);color:#fff}
  .mode[aria-pressed=true] span{color:rgba(255,255,255,.85)}

  .card{background:var(--card);border:2px solid var(--frame);border-radius:var(--radius);
    padding:24px;margin:26px 0}
  .card h2{font-family:"Archivo",sans-serif;font-weight:700;font-size:1.16rem;
    margin:0 0 4px;letter-spacing:-.01em}
  .card .sub{color:var(--muted);font-size:.94rem;margin:0 0 20px}

  .field{margin-bottom:20px}
  .field:last-child{margin-bottom:0}
  label{display:block;font-weight:600;font-size:.95rem;margin-bottom:5px}
  .hint{font-size:.85rem;color:var(--muted);margin:5px 0 0}
  .inputrow{display:flex;align-items:stretch}
  .prefix,.suffix{display:flex;align-items:center;padding:0 12px;font-weight:600;color:var(--muted);
    border:1.5px solid var(--line);background:var(--tint);white-space:nowrap}
  .prefix{border-right:0;border-radius:8px 0 0 8px}
  .suffix{border-left:0;border-radius:0 8px 8px 0;font-size:.88rem}
  input[type=number],input[type=text]{font-family:inherit;font-size:1.02rem;font-weight:600;color:var(--ink);
    padding:11px 12px;border:1.5px solid var(--line);width:100%;background:#fff;min-width:0;border-radius:0}
  .inputrow > input:first-child{border-radius:8px 0 0 8px}
  .inputrow > input:last-child{border-radius:0 8px 8px 0}
  .inputrow.solo > input{border-radius:8px}
  input:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
  input[type=range]{width:100%;accent-color:var(--brand);height:26px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}
  @media(max-width:620px){.grid2{grid-template-columns:1fr}}

  .presets{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
  .preset{font-family:inherit;font-size:.85rem;font-weight:600;cursor:pointer;
    padding:7px 12px;border-radius:999px;border:1.5px solid var(--line);background:#fff;color:var(--ink)}
  .preset:hover{border-color:var(--brand);color:var(--brand-strong)}
  .preset[aria-pressed=true]{background:var(--brand);border-color:var(--brand);color:#fff}

  .result{background:var(--secondary);border:2px solid var(--frame);border-radius:var(--radius);
    color:#EAF6F8;padding:28px;margin:26px 0}
  .result .eyebrow{color:var(--accent)}
  .bignum{font-family:"Archivo",sans-serif;font-weight:800;
    font-size:clamp(2.6rem,9vw,4.2rem);line-height:1;color:#fff;letter-spacing:-.02em}
  .bignum .unit{font-size:.34em;font-weight:700;color:var(--accent);letter-spacing:0}
  .persplit{display:flex;flex-wrap:wrap;gap:26px;margin-top:20px;
    padding-top:18px;border-top:1px solid rgba(255,255,255,.22)}
  .persplit div{min-width:130px}
  .persplit .k{font-family:"Archivo",sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.13em;
    text-transform:uppercase;color:var(--accent);margin-bottom:3px}
  .persplit .v{font-size:1.32rem;font-weight:600;color:#fff}

  .trace{background:var(--tint);border:1.5px solid var(--line);border-radius:var(--radius);
    padding:20px 22px;margin:26px 0}
  .trace h2{font-family:"Archivo",sans-serif;font-size:1.02rem;font-weight:700;margin:0 0 14px}
  .step{display:grid;grid-template-columns:26px 1fr auto;gap:12px;align-items:baseline;
    padding:9px 0;border-bottom:1px dashed var(--line)}
  .step:last-child{border-bottom:0}
  .step .n{font-family:"Archivo",sans-serif;font-weight:700;font-size:.72rem;color:var(--brand-strong);letter-spacing:.08em}
  .step .d{font-size:.93rem}
  .step .d small{display:block;color:var(--muted);font-size:.82rem;margin-top:2px}
  .step .v{font-variant-numeric:tabular-nums;font-weight:700;font-size:.98rem;white-space:nowrap}
  .step.total{border-top:2px solid var(--frame);margin-top:6px;padding-top:12px}
  .step.total .v{color:var(--brand-strong);font-size:1.1rem}

  details{border:1.5px solid var(--line);border-radius:var(--radius);background:#fff;margin:26px 0}
  summary{cursor:pointer;padding:16px 20px;font-weight:600;
    font-family:"Archivo",sans-serif;font-size:.98rem;list-style:none}
  summary::-webkit-details-marker{display:none}
  summary::after{content:" +";color:var(--brand);font-weight:800}
  details[open] summary::after{content:" –"}
  details .body{padding:0 20px 20px}
  details p{margin:0 0 12px;font-size:.94rem}
  details p:last-child{margin-bottom:0}

  .note{border-left:4px solid var(--accent);background:#fff;padding:14px 18px;margin:26px 0;font-size:.94rem}
  .note strong{font-family:"Archivo",sans-serif}
  .note.permanent{border-left-color:var(--bloom)}

  footer{margin-top:40px;padding-top:22px;border-top:1px solid var(--line);font-size:.86rem;color:var(--muted)}
  ol.src{padding-left:20px;margin:10px 0 0}
  ol.src li{margin-bottom:7px}
  .hidden{display:none !important}
</style>

<div class="wrap">

  <p class="eyebrow">Thrive65 &middot; Tax impact estimator</p>
  <h1>What would this <em>cost my household?</em></h1>
  <p class="lede">
    There is more than one way District 65 can raise money for buildings or for operations, and they land on your
    tax bill differently. Pick the one you want to understand, then put in your own numbers.
  </p>

  <div class="modes" role="group" aria-label="Choose what to estimate">
    <button class="mode" type="button" data-mode="hls" aria-pressed="true">
      Health &amp; life safety
      <span>Mandated repairs. No referendum required.</span>
    </button>
    <button class="mode" type="button" data-mode="capital" aria-pressed="false">
      Capital referendum
      <span>Borrowing for buildings, approved by voters.</span>
    </button>
    <button class="mode" type="button" data-mode="operating" aria-pressed="false">
      Operating referendum
      <span>Ongoing money for running the schools.</span>
    </button>
  </div>

  <div class="note" id="modeNote"></div>

  <section class="card">
    <h2>Your numbers</h2>
    <p class="sub">Everything below is adjustable. Nothing you enter leaves your browser.</p>

    <div class="field">
      <label for="homeEav">Your property's equalized assessed value (EAV)</label>
      <div class="inputrow"><span class="prefix">$</span>
        <input id="homeEav" type="number" min="0" step="1000" value="140000" inputmode="numeric"></div>
      <p class="hint">On your property tax bill or Cook County assessment notice. Or estimate from market value below.</p>
    </div>

    <div class="field">
      <label for="mktVal">Or estimate from market value</label>
      <div class="inputrow"><span class="prefix">$</span>
        <input id="mktVal" type="number" min="0" step="10000" placeholder="e.g. 465000" inputmode="numeric"></div>
      <p class="hint">Cook County assesses homes at 10% of market value, then the state applies an equalization
        factor near 3.0, putting EAV around 30% of market value before exemptions.</p>
    </div>

    <!-- BORROWING (hls + capital) -->
    <div id="borrowBlock">
      <div class="field">
        <label for="bondNum" id="bondLabel">Amount borrowed</label>
        <input id="bond" type="range" min="0" max="200000000" step="1000000" value="50000000">
        <div class="inputrow solo" style="margin-top:8px;max-width:260px">
          <span class="prefix">$</span>
          <input id="bondNum" type="number" min="0" step="1000000" value="50000000" inputmode="numeric"></div>
        <div class="presets" id="bondPresets" role="group" aria-label="Preset amounts"></div>
        <p class="hint" id="bondHint"></p>
      </div>
      <div class="grid2">
        <div class="field">
          <label for="term">Repayment term</label>
          <div class="inputrow"><input id="term" type="number" min="1" max="30" step="1" value="20" inputmode="numeric"><span class="suffix">years</span></div>
          <p class="hint" id="termHint"></p>
          <p class="termmsg hidden" id="termMsg" role="alert"></p>
        </div>
        <div class="field">
          <label for="rate">Interest rate</label>
          <div class="inputrow"><input id="rate" type="number" min="0" max="15" step="0.05" value="4.5" inputmode="decimal"><span class="suffix">% / yr</span></div>
          <p class="hint">4% to 5% is a common range for school borrowing.</p>
        </div>
      </div>
    </div>

    <!-- OPERATING -->
    <div id="operBlock" class="hidden">
      <div class="field">
        <label for="opMode">How is the increase described?</label>
        <div class="presets" id="opModePresets" role="group" aria-label="Operating input style">
          <button class="preset" type="button" data-op="dollars" aria-pressed="true">As dollars raised</button>
          <button class="preset" type="button" data-op="rate" aria-pressed="false">As a tax rate</button>
        </div>
      </div>
      <div class="field" id="opDollarField">
        <label for="opDollars">Additional money raised each year, district-wide</label>
        <input id="opRange" type="range" min="0" max="30000000" step="500000" value="10000000">
        <div class="inputrow solo" style="margin-top:8px;max-width:260px">
          <span class="prefix">$</span>
          <input id="opDollars" type="number" min="0" step="500000" value="10000000" inputmode="numeric"></div>
        <p class="hint">Referendum questions are often described this way in news coverage and district materials.</p>
      </div>
      <div class="field hidden" id="opRateField">
        <label for="opRate">Rate increase</label>
        <div class="inputrow"><input id="opRate" type="number" min="0" step="0.01" value="0.25" inputmode="decimal"><span class="suffix">per $100 of EAV</span></div>
        <p class="hint">Ballot questions are usually written as a rate. This is the form that appears on the ballot itself.</p>
      </div>
      <div class="field">
        <label for="opYears">Show the running total over</label>
        <div class="inputrow"><input id="opYears" type="number" min="1" max="40" step="1" value="10" inputmode="numeric"><span class="suffix">years</span></div>
        <p class="hint">Operating increases do not expire on their own. This is just a window for comparison.</p>
      </div>
    </div>
  </section>

  <section class="result" aria-live="polite">
    <p class="eyebrow" id="resLabel">Estimated cost to your household</p>
    <div class="bignum"><span id="outYear">$0</span><span class="unit"> / year</span></div>
    <div class="persplit">
      <div><div class="k">Per month</div><div class="v" id="outMonth">$0</div></div>
      <div><div class="k" id="totalKey">Over the full term</div><div class="v" id="outTotal">$0</div></div>
      <div><div class="k">Your share of the district</div><div class="v" id="outShare">0%</div></div>
    </div>
  </section>

  <section class="trace">
    <h2>How that number is built</h2>
    <div id="traceBody"></div>
  </section>

  <details id="detAssume">
    <summary>What this estimate assumes</summary>
    <div class="body" id="assumeBody"></div>
  </details>

  <details id="detVote">
    <summary id="voteSummary">Why a vote may not be required</summary>
    <div class="body" id="voteBody"></div>
  </details>

  <footer>
    <p><strong>Sources</strong></p>
    <ol class="src">
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
    <p style="margin-top:16px">
      Thrive65 is an independent community coalition and is not affiliated with or operated by District 65.
      These are estimates, not tax or legal advice. If you find an error, tell us and we will correct it.
    </p>
  </footer>
</div>

<script>
(function(){
  "use strict";
  var DISTRICT_EAV = 4203686381;
  var CURRENT_LEVY = 136600;
  var LEVY_CAP_PCT = 0.0005;

  var $=function(i){return document.getElementById(i)};
  var mode="hls", opStyle="dollars";
  var homeEav=$("homeEav"),mktVal=$("mktVal"),bond=$("bond"),bondNum=$("bondNum"),
      term=$("term"),rate=$("rate"),opDollars=$("opDollars"),opRange=$("opRange"),
      opRate=$("opRate"),opYears=$("opYears");

  function usd(n,dp){ if(!isFinite(n))n=0;
    return "$"+n.toLocaleString("en-US",{minimumFractionDigits:dp||0,maximumFractionDigits:dp||0}); }
  function num(el,f){ var v=parseFloat(el.value); return isFinite(v)&&v>=0?v:f; }
  function ds(P,n,r){ if(P<=0||n<=0)return 0; r=r/100;
    return r===0? P/n : P*(r/(1-Math.pow(1+r,-n))); }

  var CFG={
    hls:{
      note:'<strong>No borrowing amount has been proposed.</strong> The district has not said how much it intends to '+
        'levy or borrow for this work. This is a what-if tool so you can size the question before those numbers arrive.',
      noteClass:"note",
      bondLabel:"Amount borrowed for safety work",
      bondHint:'$128.8 million is the full ten-year figure reported to the board in August 2026. Most of that work '+
        'is classified as deferrable for up to a decade, so the full amount is a ceiling rather than a plan.',
      termHint:"Illinois caps these particular bonds at 20 years.",
      termMax:20,
      termCapMsg:"Illinois caps health and life safety bonds at 20 years, so this estimate uses 20.",
      bondMax:200e6,
      presets:[[25e6,"$25M"],[50e6,"$50M"],[100e6,"$100M"],[128.8e6,"$128.8M · full survey"]],
      voteTitle:"Why a vote may not be required",
      vote:'<p>Illinois school districts may levy for state-approved health and life safety work at up to 0.05% of '+
        'district value per year. When that levy is not enough to finish approved work, the board may issue bonds '+
        'without a referendum, repaid over as long as twenty years.</p>'+
        '<p>The work must be approved by the State Superintendent and, in Cook County, by the Executive Director of '+
        'the Intermediate Service Center, and it proceeds under an order from that office. A public hearing is '+
        'required before bonds are issued. Since a 2024 change in state law, taxes levied to repay these bonds sit '+
        'outside the property tax cap that otherwise limits district revenue.</p>'+
        '<p>None of this is improper. It is the mechanism the legislature built for mandated safety work. It does '+
        'mean a decision of this size can be made by a board vote rather than a community vote.</p>'
    },
    capital:{
      note:'<strong>No capital referendum has been proposed.</strong> This estimates what one would cost if voters '+
        'approved borrowing for building work that is not legally mandated.',
      noteClass:"note",
      bondLabel:"Amount borrowed, approved by voters",
      bondHint:'For scale, District 65 has identified about $409.6 million of facilities needs in the first ten years.',
      termHint:"Illinois caps voter-approved building bonds at 30 years. Terms of 20 to 25 years are common.",
      termMax:30,
      termCapMsg:"Illinois caps voter-approved building bonds at 30 years, so this estimate uses 30.",
      bondMax:410e6,
      presets:[[50e6,"$50M"],[100e6,"$100M"],[200e6,"$200M"],[409.6e6,"$409.6M · 10-yr needs"]],
      voteTitle:"How a capital referendum differs",
      vote:'<p>A capital referendum asks voters directly for permission to borrow. If it passes, the debt service '+
        'is a recognized exception to the property tax cap, so it is added on top of the capped levy rather than '+
        'squeezed inside it.</p>'+
        '<p>Bond money arrives within months of approval, which is why capital questions and operating questions '+
        'move on very different timelines.</p>'
    },
    operating:{
      note:'<strong>An operating increase does not expire on its own.</strong> Unlike bonds, which end when they are '+
        'repaid, an approved operating increase becomes part of the district\'s permanent tax base unless the ballot '+
        'question sets an end date. District 65\'s 2017 referendum was presented as a time-limited bridge.',
      noteClass:"note permanent",
      voteTitle:"How an operating referendum differs",
      vote:'<p>Operating money pays salaries, programs, and the daily cost of running schools. There is no borrowing '+
        'and no interest, so the arithmetic is simpler: the district raises a set amount each year and your share is '+
        'your property\'s share of the district.</p>'+
        '<p>Two differences matter more than the math. First, timing. Bond proceeds arrive within months of approval, '+
        'while operating money does not reach the district until the following tax cycle. Second, duration. Bond debt '+
        'service ends. An operating increase becomes the new base and continues to grow afterward under the tax cap '+
        'formula, unless the question is written with a sunset.</p>'
    }
  };

  var ASSUME_COMMON =
    '<p><strong>A fixed district value.</strong> Your share depends on the district\'s total equalized assessed value, '+
    'which changes every year. This tool uses $4.20 billion, District 65\'s Tax Year 2024 value from its FY2025 '+
    'audited financial report. Your 2026 tax bill reflects Evanston\'s 2025 reassessment, a newer year, so the '+
    'district-wide total will shift once that figure is finalized.</p>'+
    '<p><strong>Your assessment stays put.</strong> If your property is reassessed, your share moves with it.</p>'+
    '<p><strong>District 65 only.</strong> This is one line on your tax bill. It excludes Evanston Township High School '+
    'District 202, the city, the county, and every other taxing body.</p>'+
    '<p><strong>Not a prediction.</strong> Nothing here has been proposed. Actual terms would differ from whatever you entered.</p>';

  function setMode(m){
    mode=m;
    document.querySelectorAll(".mode").forEach(function(b){
      b.setAttribute("aria-pressed", String(b.dataset.mode===m)); });
    var c=CFG[m];
    $("modeNote").innerHTML=c.note;
    $("modeNote").className=c.noteClass;
    $("voteSummary").textContent=c.voteTitle;
    $("voteBody").innerHTML=c.vote;
    $("assumeBody").innerHTML =
      (m==="operating"
        ? '<p><strong>A flat annual amount.</strong> This holds the increase constant. In practice an approved '+
          'operating increase grows each year under the tax cap formula, so later years would run higher.</p>'
        : '<p><strong>Level debt service.</strong> Real bond schedules are rarely perfectly level, so early and late '+
          'years may differ from the average shown.</p>') + ASSUME_COMMON;

    var borrowing = (m!=="operating");
    $("borrowBlock").classList.toggle("hidden", !borrowing);
    $("operBlock").classList.toggle("hidden", borrowing);
    $("totalKey").textContent = borrowing ? "Over the full term" : "Over the window below";

    if(borrowing){
      $("bondLabel").textContent=c.bondLabel;
      $("bondHint").innerHTML=c.bondHint;
      $("termHint").textContent=c.termHint;
      term.max=c.termMax;
      bond.max=c.bondMax;
      bond.value=Math.min(num(bondNum,0),c.bondMax);
      var ph="";
      c.presets.forEach(function(p){ ph+='<button class="preset" type="button" data-bond="'+p[0]+'">'+p[1]+'</button>'; });
      $("bondPresets").innerHTML=ph;
      $("bondPresets").querySelectorAll(".preset").forEach(function(b){
        b.addEventListener("click",function(){
          bondNum.value=b.dataset.bond; bond.value=Math.min(b.dataset.bond,bond.max); render(); });
      });
    }
    render();
  }

  function setOpStyle(s){
    opStyle=s;
    document.querySelectorAll("#opModePresets .preset").forEach(function(b){
      b.setAttribute("aria-pressed",String(b.dataset.op===s)); });
    $("opDollarField").classList.toggle("hidden", s!=="dollars");
    $("opRateField").classList.toggle("hidden", s!=="rate");
    render();
  }

  function render(){
    var he=num(homeEav,0), share = DISTRICT_EAV>0 ? he/DISTRICT_EAV : 0;
    var yearly=0, windowYears=0, steps=[];

    steps.push(["A","Your property's share of the district",
      usd(he)+" &divide; "+usd(DISTRICT_EAV)+" of total district value",
      share>0?(share*100).toFixed(4)+"%":"0%"]);

    var termMsg=$("termMsg");
    if(mode!=="operating"){
      var cap=parseFloat(term.max), entered=parseFloat(term.value);
      if(isFinite(entered)&&entered>cap){
        termMsg.textContent=CFG[mode].termCapMsg; termMsg.classList.remove("hidden");
      } else { termMsg.textContent=""; termMsg.classList.add("hidden"); }
      var P=num(bondNum,0), yrs=Math.max(1,Math.min(num(term,20),cap)), rt=num(rate,4.5);
      var annual=ds(P,yrs,rt);
      yearly=annual*share; windowYears=yrs;
      if(P>0){
        steps.push(["B","What the district would pay each year on "+usd(P),
          yrs+" years at "+rt+"%, level payments", usd(annual)]);
        steps.push(["C","Your share of that annual payment",
          usd(annual)+" &times; your share", usd(yearly)]);
        steps.push(["D","Interest included in the total",
          "total repaid "+usd(annual*yrs)+" &minus; borrowed "+usd(P), usd(Math.max(0,annual*yrs-P))]);
      }
    } else {
      windowYears=Math.max(1,num(opYears,10));
      var raised;
      if(opStyle==="dollars"){
        raised=num(opDollars,0);
        steps.push(["B","Additional money raised district-wide each year","as entered above",usd(raised)]);
      } else {
        var rr=num(opRate,0);
        raised=(rr/100)*DISTRICT_EAV;
        steps.push(["B","What that rate raises district-wide",
          "$"+rr.toFixed(2)+" per $100 &times; "+usd(DISTRICT_EAV)+" of district value", usd(raised)]);
      }
      yearly=raised*share;
      steps.push(["C","Your share of that amount", usd(raised)+" &times; your share", usd(yearly)]);
    }

    steps.push(["=","Your estimated cost","per year, added to what you pay today",usd(yearly)]);

    $("outYear").textContent=usd(yearly);
    $("outMonth").textContent=usd(yearly/12);
    $("outTotal").textContent=usd(yearly*windowYears);
    $("outShare").textContent = share>0 ? (share*100).toFixed(4).replace(/0+$/,"").replace(/\.$/,"")+"%" : "0%";

    var html="";
    steps.forEach(function(s){
      var t=(s[0]==="=");
      html+='<div class="step'+(t?" total":"")+'"><div class="n">'+s[0]+'</div>'+
        '<div class="d">'+s[1]+'<small>'+s[2]+'</small></div><div class="v">'+s[3]+'</div></div>';
    });
    $("traceBody").innerHTML=html;

    document.querySelectorAll("#bondPresets .preset").forEach(function(b){
      b.setAttribute("aria-pressed",String(parseFloat(b.dataset.bond)===num(bondNum,0))); });
  }

  document.querySelectorAll(".mode").forEach(function(b){
    b.addEventListener("click",function(){ setMode(b.dataset.mode); }); });
  document.querySelectorAll("#opModePresets .preset").forEach(function(b){
    b.addEventListener("click",function(){ setOpStyle(b.dataset.op); }); });

  bond.addEventListener("input",function(){ bondNum.value=bond.value; render(); });
  bondNum.addEventListener("input",function(){ bond.value=Math.min(num(bondNum,0),bond.max); render(); });
  opRange.addEventListener("input",function(){ opDollars.value=opRange.value; render(); });
  opDollars.addEventListener("input",function(){ opRange.value=Math.min(num(opDollars,0),opRange.max); render(); });
  mktVal.addEventListener("input",function(){
    var mv=parseFloat(mktVal.value);
    if(isFinite(mv)&&mv>0){ homeEav.value=Math.round(mv*0.30/1000)*1000; render(); } });
  homeEav.addEventListener("input",function(){ mktVal.value=""; render(); });
  [term,rate,opRate,opYears].forEach(function(el){
    el.addEventListener("input",render); el.addEventListener("change",render); });

  setMode("hls");
})();
</script>
