/* Tax impact estimator (page: /tax-calculator/).
   This page requires JS: the controls have sensible HTML defaults, but the
   row notes and amounts, the two disclosure bodies, the derivation, the chart
   and every result are rendered here, so with JS off the page shows $0.

   Four pieces, added together by the year the bill is paid:
     ptell     the yearly increase allowed under the property tax cap
     hls       health and life safety bonds (no referendum)
     capital   a voter-approved building bond
     operating a voter-approved operating (limiting-rate) increase
   Each is a static row in the page: a checkbox (#<key>Include) that counts it,
   beside a disclosure holding its own fields. Bond fields carry the piece key as
   an id prefix (#hlsBondNum, #capitalTerm, ...). render() never rebuilds a row,
   it only rewrites its note and amount text, so focus and typing survive.
   An own/rent toggle switches the starting point: renters start from rent and a
   pass-through rate instead of an EAV or tax bill.

   All styling comes from main.css. Classes emitted only from here (step*,
   total, levy-*) are listed in the PurgeCSS safelist in postcss.config.cjs.
   The chart's --series-N colors are theme tokens on :root. */
(function () {
  "use strict";

  /* Tax Year 2025 EAV less exemptions for School District C C 65 (agency 04-0270-000),
     Cook County Clerk, 2025 Agency EAV by Class report (October 6, 2026). This is the
     post-reassessment base behind 2026 bills. */
  var DISTRICT_EAV = 4975974449;
  /* Tax Year 2025 D65 extension ($148,509,149, levy memo, source 5) over that EAV:
     about 2.985% of EAV. Used only to estimate a household's current D65 tax until
     they type in their own. */
  var D65_RATE = 148509149 / DISTRICT_EAV;
  /* D65 Tax Year 2026 tentative levy memo (Oct 26, 2026): 2025 extension $148,509,149,
     of which $141,083,900 is capped funds and $7,425,249 bond & interest. Bond &
     interest is estimated to fall 2.88% for 2026 ($7,211,625). Only the capped part
     grows with the PTELL factor. */
  var CAPPED_SHARE = 141083900 / 148509149;
  var BOND_CHG_2026 = 7211625 / 7425249 - 1;
  /* 2025 extension (memo) — the denominator for a household's share when they
     enter their own D65 tax, so share and bill come from the same, post-
     reassessment tax year. */
  var D65_EXT_2025 = 148509149;
  var FIRST_BILL = 2027;             /* 2026 levy, paid in 2027 */
  /* 2017 operating referendum: about $14.5M a year (Daily Northwestern, Apr. 3, 2017), first
     extended on the 2017 levy (bills paid 2018). No sunset, so it joined the capped base and grew
     with the PTELL inflation factor each levy year 2018-2025: 2.1, 1.9, 2.3, 1.4, 5.0, 5.0, 3.4,
     2.9 percent. That gives about $18.4M in the Tax Year 2025 extension, expressed as a share of
     the $148.5M D65 extended for that year. Estimate: excludes any new-property growth. */
  var REF17_GROWTH = [0.021, 0.019, 0.023, 0.014, 0.05, 0.05, 0.034, 0.029].reduce(function (p, g) {
    return p * (1 + g); }, 1);
  var REF17_TY2025 = 14.5e6 * REF17_GROWTH;
  var REF17_SHARE = REF17_TY2025 / 148509149;
  /* Last year of the district's long-range projections (FY2032, Sept 14, 2026
     presentation), so the results panel always reports a fixed 2027–2032 view. */
  var HORIZON = 2032;
  var PIECES = ["ptell", "hls", "capital", "operating"];
  var NAMES = { ptell: "Yearly levy increase", hls: "Health & life safety bonds",
                capital: "Capital referendum", operating: "Operating referendum" };
  /* column heads in the year-by-year table, where the full names would overflow the card */
  var SHORT = { ptell: "Levy", hls: "HLS", capital: "Capital", operating: "Operating" };
  var SERIES = { ptell: 1, hls: 2, capital: 3, operating: 4 };   /* color follows the piece */

  var $ = function (i) { return document.getElementById(i); };
  var homeEav = $("homeEav");
  if (!homeEav) return;   // not on the calculator page

  var opStyle = "dollars", ptellScope = "every", curTaxTouched = false;
  var mktVal = $("mktVal"), opDollars = $("opDollars"), opRange = $("opRange"), opRate = $("opRate"),
      opStart = $("opStart"), opYears = $("opYears"), curTax = $("curTax"), cpiNow = $("cpiNow"),
      cpiFut = $("cpiFut"), stackYear = $("stackYear"),
      rent = $("rent"), taxShare = $("taxShare"), passPct = $("passPct");
  var renter = false;
  var D65_BILL_SHARE = 0.4125;   /* D65's share of an Evanston bill, TY2025 (Treasurer via RoundTable) */
  /* Property tax built into rent, D65 portion: rent × 12 × share-of-rent × D65's share of the bill */
  function renterD65() { return num(rent, 0) * 12 * Math.min(num(taxShare, 17), 40) / 100 * D65_BILL_SHARE; }
  /* Pass-through factor: 1 for owners, the landlord pass-through for renters */
  function PT() { return renter ? Math.min(num(passPct, 50), 100) / 100 : 1; }

  /* Referendum scenarios: real proposals the operating and capital pieces can be loaded from.
     Each sets the operating referendum (op = first-year dollars district-wide, opStart = first
     bill year) and the capital bond (cap), plus the option text in the #scenario select (label)
     and the note shown under it while that scenario is selected (note, HTML). DEFAULT_SCEN is
     loaded on page open; point it at another key to change what the page opens with.

     v4 = For a Brighter Evanston, "D65 Ten-Year Financial Model, v4" (New_Money tab): $17M
     operating from FY30 (first bills paid 2029 after a November 2028 vote), and $63,737,800 of
     bonds replacing the $7.97M/yr capital transfers, level debt service at 4.5% over 20 years
     ($4.90M/yr), first repaid 2030.

     To add a scenario: add an entry here and cite it in the page's sources (give the <li> an id
     for the note to link to). For example:
       district: { label: "District proposal (Mar 2027)", note: "…",
                   op: 12e6, opStart: 2029, cap: { P: 150e6, term: 25, rate: 4.5, start: 2030 } }
     The select's options, the selected state, the note and the loading all key off SCEN, so
     nothing else changes. Options appear in this order, before "Custom". */
  var SCEN = {
    v4: {
      label: "Community v4 package (Nov 2026)",
      note: "From For a Brighter Evanston's model (v4, Nov 2026): a $17M operating increase and $63.7M in " +
        "building bonds over 20 years at 4.5%, both on the November 2028 ballot. The bonds would replace the " +
        "district's yearly building budget of about $7.97M, so their interest is the added cost of paying for " +
        "routine building work over time. The district hasn't proposed either one. " +
        "Your total also counts the yearly levy increase and the district's health and life safety bonds, " +
        "which happen under any plan and aren't part of the community model. " +
        '<a href="#source-v4">Full assumptions</a>',
      op: 17e6, opStart: 2029, cap: { P: 63737800, term: 20, rate: 4.5, start: 2030 }
    }
  };
  var DEFAULT_SCEN = "v4";
  var CUSTOM_NOTE = "You've changed the amounts or left out a piece. Choose a scenario to start over.";
  /* true once someone picks "Custom" by hand, so the select doesn't snap back to a scenario
     whose numbers still happen to match; picking a scenario clears it */
  var customPicked = false;

  /* The bond pieces' own fields, by id prefix. Their max attributes are the tool's caps. */
  function bondEls(k) {
    return { range: $(k + "Bond"), num: $(k + "BondNum"), msg: $(k + "BondMsg"), term: $(k + "Term"),
             termMsg: $(k + "TermMsg"), rate: $(k + "Rate"), start: $(k + "Start"), presets: $(k + "Presets") };
  }
  var BOND = { hls: bondEls("hls"), capital: bondEls("capital") };
  var BOND_START = { hls: 2028, capital: 2030 };   /* fallback when the start field is blank or out of range */
  var TERM_CAP_MSG = {
    hls: "Illinois caps health and life safety bonds at 20 years, so this estimate uses 20.",
    capital: "Illinois caps voter-approved building bonds at 30 years, so this estimate uses 30."
  };
  function included(k) { return $(k + "Include").checked; }
  function includedKeys() { return PIECES.filter(included); }

  function applyScenario(k) {
    var s = SCEN[k], e = BOND.capital;
    if (!s) return;
    customPicked = false;
    opDollars.value = s.op; opRange.value = s.op; opStart.value = s.opStart;
    e.num.value = s.cap.P; e.range.value = Math.min(s.cap.P, e.range.max);
    e.term.value = s.cap.term; e.rate.value = s.cap.rate; e.start.value = s.cap.start;
    PIECES.forEach(function (p) { $(p + "Include").checked = true; });   /* a scenario counts every piece */
    setOpStyle("dollars");   /* also renders */
  }
  function scenarioMatch(k) {
    var s = SCEN[k], b = bondRaw("capital");
    return PIECES.every(included) && opStyle === "dollars" && num(opDollars, 0) === s.op &&
      clampYear(num(opStart, 2029), 2029) === s.opStart && b.P === s.cap.P && b.term === s.cap.term &&
      b.rate === s.cap.rate && b.start === s.cap.start;
  }
  /* Select the scenario the current numbers match, or "Custom" once they've drifted, a piece is
     left out, or it was picked by hand, and show only that choice's note. */
  var shownScen = null;
  function syncScenario() {
    var k = "custom";
    if (!customPicked) {
      Object.keys(SCEN).some(function (s) { return scenarioMatch(s) && (k = s); });
    }
    if ($("scenario").value !== k) $("scenario").value = k;
    if (shownScen === k) return;
    shownScen = k;
    $("scenarioNote").innerHTML = k === "custom" ? CUSTOM_NOTE : SCEN[k].note;
  }

  function usd(n, dp) {
    if (!isFinite(n)) n = 0;
    return "$" + n.toLocaleString("en-US",
      { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 });
  }
  function usdShort(n) {
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(n % 1e6 ? 1 : 0).replace(/\.0$/, "") + "M";
    return usd(n);
  }
  function num(el, f) { var v = parseFloat(el.value); return isFinite(v) && v >= 0 ? v : f; }
  function clampYear(v, f) { v = Math.round(v); return isFinite(v) && v >= FIRST_BILL && v <= 2060 ? v : f; }
  /* level debt service: annual payment on principal P over n years at r% */
  function ds(P, n, r) {
    if (P <= 0 || n <= 0) return 0;
    r = r / 100;
    return r === 0 ? P / n : P * (r / (1 - Math.pow(1 + r, -n)));
  }

  /* render() runs on every keystroke across the whole form, so only touch a
     message when its text actually changes — otherwise the live region
     re-announces the same sentence on each key. */
  function setMsg(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.toggle("hidden", !text);
  }
  /* Clamp-and-explain: the input keeps whatever was typed, the math uses the
     capped value, and a polite message says so. Returns the value to compute with. */
  function capped(el, msgEl, text, fallback) {
    var max = parseFloat(el.max), entered = parseFloat(el.value);
    var over = isFinite(max) && isFinite(entered) && entered > max;
    setMsg(msgEl, over ? text : "");
    return over ? max : num(el, fallback);
  }
  function amountCapMsg(el) {
    return "This tool caps the amount at " + usd(parseFloat(el.max)) +
           ", so the estimate below uses that.";
  }

  /* "Which of these need a vote": each ticked piece's own copy, cumulatively, in PIECES order.
     With two or more ticked, VOTE_ALL.intro leads and each piece's copy gets its name as a heading. */
  var VOTE_ALL = {
    title: "Which of these need a vote",
    intro: '<p><strong>No vote:</strong> the yearly levy increase (set by the board within the state cap) and health ' +
      'and life safety bonds (issued by the board after state approval of the work).</p>' +
      '<p><strong>Vote required:</strong> a capital referendum (permission to borrow for buildings) and an operating ' +
      'referendum (permission to raise the capped levy itself).</p>',
    /* only when the ticked pieces mix the two kinds */
    mixed: '<p>That split matters for planning. Roughly half of what you see stacked here can happen through board ' +
      'votes alone, depending on the amounts you enter.</p>'
  };
  var BOARD_ONLY = { ptell: true, hls: true };
  var VOTE = {
    ptell: {
      title: "Why no vote is needed for this one",
      body: '<p>Under the Property Tax Extension Limitation Law, the board can raise the capped levy each year by the ' +
        'lesser of 5% or the prior year\'s inflation, plus taxes from new property. It holds a public hearing when the ' +
        'request is more than 5% above the prior year\'s extension, but no community vote is required.</p>' +
        '<p>Going above the cap is what an operating referendum does. Bond repayment for voter-approved and health and ' +
        'life safety bonds sits outside the cap entirely.</p>' +
        '<p>Because each year\'s levy becomes the base for the next, the increases compound. Seen one year at a time ' +
        'they look small. Over a decade they add up.</p>'
    },
    hls: {
      title: "Why a vote may not be required",
      body: '<p>Illinois school districts may levy for state-approved health and life safety work at up to 0.05% of ' +
        'district value per year. When that levy is not enough to finish approved work, the board may issue bonds ' +
        'without a referendum, repaid over as long as twenty years.</p>' +
        '<p>The work must be approved by the State Superintendent and, in Cook County, by the Executive Director of ' +
        'the Intermediate Service Center, and it proceeds under an order from that office. A public hearing is ' +
        'required before bonds are issued. Since a 2024 change in state law, taxes levied to repay these bonds sit ' +
        'outside the property tax cap that otherwise limits district revenue.</p>' +
        '<p>None of this is improper. It is the mechanism the legislature built for mandated safety work. It does ' +
        'mean a decision of this size can be made by a board vote rather than a community vote.</p>'
    },
    capital: {
      title: "How a capital referendum differs",
      body: '<p>A capital referendum asks voters directly for permission to borrow. If it passes, the debt service ' +
        'is a recognized exception to the property tax cap, so it is added on top of the capped levy rather than ' +
        'squeezed inside it.</p>' +
        '<p>Bond money arrives within months of approval, which is why capital questions and operating questions ' +
        'move on very different timelines.</p>'
    },
    operating: {
      title: "How an operating referendum differs",
      body: '<p>Operating money pays salaries, programs, and the daily cost of running schools. There is no borrowing ' +
        'and no interest, so the arithmetic is simpler: the district raises a set amount and your share is your ' +
        'property\'s share of the district.</p>' +
        '<p>Two differences matter more than the math. First, timing. Bond proceeds arrive within months of approval, ' +
        'while operating money does not reach the district until the following tax cycle. Second, duration. Bond debt ' +
        'service ends. An operating increase becomes the new base and continues to grow afterward under the tax cap ' +
        'formula, unless the question is written with a sunset.</p>'
    }
  };

  var ASSUME_COMMON =
    '<p><strong>Your share, two ways.</strong> If you enter your District 65 tax, your share is that amount divided by ' +
    'the $148.5 million District 65 extended for Tax Year 2025, the same year as your 2026 bill, so it already reflects ' +
    'the 2025 reassessment. If you enter an EAV or a market value, the tool divides by $4.98 billion, the total taxable ' +
    'value of District 65 for Tax Year 2025 from the Cook County Clerk, which also reflects the reassessment. Use the ' +
    'EAV from your 2026 bill or 2025 assessment notice so the two match.</p>' +
    '<p><strong>Your share stays put after that.</strong> At each reassessment, about every three years, your share ' +
    'moves if your property rises faster or slower than the rest of the district. In 2025, homes rose faster than ' +
    'commercial property and their share of Evanston\'s taxable value went from 69% to 70.4%. This tool does not ' +
    'project the next shift.</p>' +

    '<p><strong>District 65 only.</strong> Everything here is the District 65 line of your bill. Evanston Township High ' +
    'School District 202, the city, the library, the county, and every other taxing body are left out.</p>' +
    '<p><strong>Not a prediction.</strong> Only the yearly levy and the health and life safety bonds are under way. The ' +
    'referendum pieces are what-ifs, and actual terms would differ from whatever you entered.</p>';
  var ASSUME_RENT =
    '<p><strong>Renters: two estimates stacked.</strong> The property tax built into your rent is estimated as a share of ' +
    'rent (17% by default, following Minnesota\'s renter credit; Maine uses 25%), and District 65 is 41.25% of that. ' +
    'Every increase is then multiplied by the share your landlord passes on. Research ranges from about 15% to more than ' +
    '80%, so treat the result as a range. Increases usually show up at lease renewal, often a year or more after the tax ' +
    'bill.</p>' +
    '<p><strong>Your building matters.</strong> In the 2025 reassessment, the median bill for buildings with seven or ' +
    'more units fell 0.93% while homes rose 5.04%, so renters in large buildings may feel less of a reassessment than ' +
    'homeowners. Income-restricted and subsidized units have rents set by formula, so little of an increase would reach ' +
    'tenants.</p>';
  /* Shown for the ticked pieces only (see renderCopy). */
  var ASSUME = {
    together: '<p><strong>Increases over today, added together.</strong> Every figure is what each piece adds to your ' +
      'current District 65 tax in a given bill year. Bond repayment sits outside the tax cap, so it stacks on top. ' +
      'An operating increase joins the capped base and grows with it from then on.</p>',
    start: '<p><strong>Start years are estimates.</strong> Each bond or referendum starts in the bill year set in its ' +
      'own settings. Change them if the timing shifts.</p>',
    ptell: '<p><strong>Only the capped part grows at the cap.</strong> This applies the inflation cap to the 95% of your ' +
      'District 65 tax that is capped, and the district\'s estimated 2.88% drop to the 5% that repays existing bonds. ' +
      'After 2027 the existing bond part is held at that level, since later bond years are not in the levy memo. Your own bill can still rise faster or slower than that if your assessment changes relative to ' +
      'everyone else\'s, which happens most in reassessment years.</p>' +
      '<p><strong>New property is left out.</strong> Taxes collected from newly built property are paid by its owners, ' +
      'not by you, which is why the 4.99% request does not translate to a 4.99% increase on your bill.</p>',
    bond: '<p><strong>Level debt service.</strong> Real bond schedules are rarely perfectly level, so early and late ' +
      'years may differ from the average shown.</p>',
    /* capital referendum only: the in-pieces example is about the community v4 package */
    capital: '<p><strong>All at once, or in pieces.</strong> This treats the whole amount as borrowed in one issue, as the ' +
      'community model does. If the ' +
      'district instead borrows a piece each year as it spends, the cost starts small and builds to the full payment ' +
      'over several years. For the community v4 package, borrowing about $7.97 million a year would start near ' +
      '$0.6 million a year district-wide and reach the full $4.9 million after about eight issues. The $63.7 million ' +
      'covers about eight years of building work; continuing to borrow for repairs after that would add more payments ' +
      'on top.</p>',
    operating: '<p><strong>It grows with the cap.</strong> The first year uses the amount you entered. After that it ' +
      'grows each year at the later-year cap set under Yearly levy increase, because an approved increase ' +
      'becomes part of the capped base.</p>'
  };

  /* One polite status node for the whole tool. Debounced so typing isn't narrated. */
  var announceTimer;
  function announceResult(text) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(function () { $("resAnnounce").textContent = text; }, 800);
  }

  /* ---------- per-piece inputs ---------- */

  function estimateCurTax() {
    if (!curTaxTouched) curTax.value = Math.round(num(homeEav, 0) * D65_RATE / 10) * 10;
  }
  /* Read once per paint: pieceAt() calls this for every piece-year, so it's memoized for the
     length of one render() (cleared before and after) instead of re-parsing the DOM each time. */
  var ptellMemo = null;
  function ptellInputs() {
    return ptellMemo || (ptellMemo = { T0: renter ? renterD65() : num(curTax, 0),
      c1: Math.min(num(cpiNow, 2.7), 5) / 100, cf: Math.min(num(cpiFut, 3), 5) / 100 });
  }
  /* A bond piece's fields as entered, and as computed (capped at the fields' max attributes). */
  function bondRaw(k) {
    var e = BOND[k];
    return { P: num(e.num, 0), term: Math.max(1, Math.round(num(e.term, 20))), rate: num(e.rate, 4.5),
             start: clampYear(num(e.start, BOND_START[k]), BOND_START[k]) };
  }
  function bondEff(k) {
    var b = bondRaw(k), e = BOND[k];
    return { P: Math.min(b.P, parseFloat(e.num.max)), term: Math.min(b.term, parseFloat(e.term.max)),
             rate: b.rate, start: b.start };
  }
  function opRaised() {
    if (opStyle === "rate") return (num(opRate, 0) / 100) * DISTRICT_EAV;
    return Math.min(num(opDollars, 0), parseFloat(opDollars.max));
  }

  /* Dollars a household pays for piece `key` in bill year y, over today's bill. */
  function pieceAt(key, y, share) { return pieceRaw(key, y, share) * PT(); }
  function pieceRaw(key, y, share) {
    if (key === "ptell") {
      var p = ptellInputs(), k = y - FIRST_BILL;           /* k = 0 for 2027 */
      if (k < 0) return 0;
      /* capped part grows with the cap; existing bond & interest follows its schedule,
         held at the 2026 levy's level after that (later bond years aren't published here) */
      var bondPart = (1 - CAPPED_SHARE) * BOND_CHG_2026;
      if (ptellScope === "once") return p.T0 * (CAPPED_SHARE * p.c1 + bondPart);
      return p.T0 * (CAPPED_SHARE * ((1 + p.c1) * Math.pow(1 + p.cf, k) - 1) + bondPart);
    }
    if (key === "operating") {
      var s0 = clampYear(num(opStart, 2029), 2029);
      if (y < s0) return 0;
      return opRaised() * share * Math.pow(1 + ptellInputs().cf, y - s0);
    }
    var b = bondEff(key);
    if (y < b.start || y >= b.start + b.term) return 0;
    return ds(b.P, b.term, b.rate) * share;
  }

  function setOpStyle(st) {
    opStyle = st;
    document.querySelectorAll("#opModePresets [data-op]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.op === st));
    });
    $("opDollarField").classList.toggle("hidden", st !== "dollars");
    $("opRateField").classList.toggle("hidden", st !== "rate");
    render();
  }

  /* ---------- piece rows ---------- */

  /* The one-line note under each row's name. */
  function pieceSummary(key) {
    if (key === "ptell") {
      var p = ptellInputs();
      return ptellScope === "once"
        ? "Just the 2026 levy, " + (p.c1 * 100).toFixed(1) + "% of " + usd(p.T0) + " a year"
        : (p.c1 * 100).toFixed(1) + "% in 2027, then " + (p.cf * 100).toFixed(1) + "% a year, on " + usd(p.T0);
    }
    if (key === "operating") {
      return usdShort(opRaised()) + " a year district-wide, starting with bills paid in " +
        clampYear(num(opStart, 2029), 2029) + ", growing with the cap";
    }
    var b = bondEff(key);
    return usdShort(b.P) + " over " + b.term + " years at " + b.rate + "%, bills paid " + b.start + "–" +
      (b.start + b.term - 1);
  }
  /* The derivation note for a piece's line in "How that number is built" (HTML). */
  function pieceTrace(key) {
    if (key === "ptell") {
      var p = ptellInputs();
      return (p.c1 * 100).toFixed(1) + "% cap on the capped " + Math.round(CAPPED_SHARE * 100) + "% of " +
        (renter ? "the " + usd(p.T0) + " of District 65 tax in your rent" : "your " + usd(p.T0) + " District 65 tax") +
        (ptellScope === "once" ? ", the 2026 levy only" : ", then " + (p.cf * 100).toFixed(1) + "% a year, compounding") +
        "; existing bond payments " + (BOND_CHG_2026 < 0 ? "fall " : "rise ") +
        Math.abs(BOND_CHG_2026 * 100).toFixed(2) + "%";
    }
    if (key === "operating") {
      return (opStyle === "rate" ? "$" + num(opRate, 0).toFixed(2) + " per $100 of value raises " : "") +
        usd(opRaised()) + " district-wide &times; your share from " + clampYear(num(opStart, 2029), 2029) +
        ", growing " + (ptellInputs().cf * 100).toFixed(1) + "% a year with the cap";
    }
    var b = bondEff(key), annual = ds(b.P, b.term, b.rate);
    return usd(b.P) + " over " + b.term + " years at " + b.rate + "%: " + usd(annual) +
      " a year district-wide &times; your share, bills paid " + b.start + "–" + (b.start + b.term - 1);
  }
  /* textContent only when it changes, so a keystroke doesn't churn every row's text node */
  function setText(el, text) { if (el.textContent !== text) el.textContent = text; }

  /* Assumptions and "needs a vote" copy for the ticked pieces. Rebuilt only when the ticked set
     (or own/rent) changes, not on every keystroke. */
  var shownCopy = null;
  function renderCopy(keys) {
    var sig = keys.join() + (renter ? "|rent" : "");
    if (sig === shownCopy) return;
    shownCopy = sig;
    var has = function (k) { return keys.indexOf(k) >= 0; };
    var a = (keys.length > 1 ? ASSUME.together : "") + (has("ptell") ? ASSUME.ptell : "") +
      (has("hls") || has("capital") ? ASSUME.bond : "") + (has("capital") ? ASSUME.capital : "") +
      (has("operating") ? ASSUME.operating : "") +
      (has("hls") || has("capital") || has("operating") ? ASSUME.start : "");
    $("assumeBody").innerHTML = (renter ? ASSUME_RENT : "") + a + ASSUME_COMMON;

    $("detVote").classList.toggle("hidden", !keys.length);
    if (!keys.length) return;
    var multi = keys.length > 1;
    var mixed = keys.some(function (k) { return BOARD_ONLY[k]; }) && keys.some(function (k) { return !BOARD_ONLY[k]; });
    $("voteSummary").textContent = multi ? VOTE_ALL.title : VOTE[keys[0]].title;
    $("voteBody").innerHTML = (multi ? VOTE_ALL.intro + (mixed ? VOTE_ALL.mixed : "") : "") +
      keys.map(function (k) { return (multi ? "<h3>" + NAMES[k] + "</h3>" : "") + VOTE[k].body; }).join("");
  }

  /* ---------- chart + table ---------- */

  function niceMax(v) {
    if (v <= 0) return 100;
    var p = Math.pow(10, Math.floor(Math.log10(v))), f = v / p;
    var steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];   /* each divides cleanly into 4 gridlines */
    for (var i = 0; i < steps.length; i++) if (f <= steps[i]) return steps[i] * p;
    return 10 * p;
  }
  function topRounded(x, y, w, h, r) {
    r = Math.min(r, w / 2, h);
    return "M" + x + "," + (y + h) + "V" + (y + r) + "Q" + x + "," + y + " " + (x + r) + "," + y +
      "H" + (x + w - r) + "Q" + (x + w) + "," + y + " " + (x + w) + "," + (y + r) + "V" + (y + h) + "Z";
  }

  var chartData = null;
  function renderChart(years, series, spot) {
    chartData = { years: years, series: series };
    var W = 640, H = 280, L = 58, R = 10, T = 12, B = 30;
    var n = years.length, totals = years.map(function (_, i) {
      return series.reduce(function (s, se) { return s + se.values[i]; }, 0);
    });
    var max = niceMax(Math.max.apply(null, totals.concat([0])) * 1.05);
    var band = (W - L - R) / Math.max(n, 1), bw = Math.min(band * 0.72, 30);
    var yS = function (v) { return T + (H - T - B) * (1 - v / max); };
    var s = "";
    for (var t = 0; t <= 4; t++) {
      var v = max * t / 4, yy = yS(v);
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '" style="stroke:var(--line);' +
        'stroke-width:1' + (t ? ';stroke-dasharray:2 3' : '') + '"/>';
      s += '<text x="' + (L - 6) + '" y="' + (yy + 4) + '" text-anchor="end" class="levy-axis">' + usd(v) + '</text>';
    }
    var every = n > 24 ? 5 : n > 12 ? 3 : n > 8 ? 2 : 1;
    years.forEach(function (yr, i) {
      var x = L + band * i + (band - bw) / 2, base = H - B;
      var segs = series.filter(function (se) { return se.values[i] > 0; });
      segs.forEach(function (se, j) {
        var h = (H - T - B) * se.values[i] / max, top = base - h;
        var gap = 0, hh = Math.max(h - (j ? 2 : 0), 0);
        if (hh > 0) {
          var d = j === segs.length - 1 ? topRounded(x, top, bw, hh, 4)
            : "M" + x + "," + top + "h" + bw + "v" + hh + "h" + (-bw) + "Z";
          s += '<path d="' + d + '" style="fill:var(--series-' + se.idx + ')"/>';
        }
        base = top - gap;
      });
      if (i === spot && totals[i] > 0) {
        s += '<text x="' + (x + bw / 2) + '" y="' + (yS(totals[i]) - 6) + '" text-anchor="middle" ' +
          'class="levy-axis levy-spot">' + usd(totals[i]) + '</text>';
      }
      if (i % every === 0 || i === spot) {
        s += '<text x="' + (x + bw / 2) + '" y="' + (H - B + 18) + '" text-anchor="middle" class="levy-axis' +
          (i === spot ? ' levy-spot' : '') + '">' + yr + '</text>';
      }
      s += '<rect class="levy-hit" data-i="' + i + '" x="' + (L + band * i) + '" y="' + T + '" width="' + band +
        '" height="' + (H - T - B) + '" fill="transparent"/>';
    });
    $("chartSvg").innerHTML = s;

    /* legend only when there's more than one series; the title names a single one */
    $("chartLegend").innerHTML = series.length > 1 ? series.map(function (se) {
      return '<span class="levy-key cluster"><span class="levy-swatch" style="--swatch:var(--series-' + se.idx +
        ')"></span>' + se.name + '</span>';
    }).join("") : "";

    /* table view: short column heads with the chart's swatch keep six columns inside the
       card; the full piece name stays in the header for screen readers */
    var th = '<tr><th scope="col">Bill paid in</th>' + series.map(function (se) {
      return '<th scope="col"><span class="levy-key cluster"><span class="levy-swatch" style="--swatch:var(--series-' +
        se.idx + ')"></span><span aria-hidden="true">' + SHORT[se.key] + '</span><span class="visually-hidden">' +
        se.name + '</span></span></th>';
    }).join("") + (series.length > 1 ? '<th scope="col">Total</th>' : "") + "</tr>";
    var rows = years.map(function (yr, i) {
      return '<tr><th scope="row">' + yr + "</th>" + series.map(function (se) { return "<td>" + usd(se.values[i]) + "</td>"; })
        .join("") + (series.length > 1 ? "<td><strong>" + usd(totals[i]) + "</strong></td>" : "") + "</tr>";
    }).join("");
    $("chartTable").innerHTML = '<table><caption class="visually-hidden">' + $("chartTitle").textContent + ". " +
      $("chartSub").textContent + "</caption><thead>" + th + "</thead><tbody>" + rows + "</tbody></table>";
  }

  function showTip(i, evt) {
    if (!chartData) return;
    var tip = $("chartTip"), d = chartData, tot = 0, html = "<strong>Bills paid in " + d.years[i] + "</strong>";
    d.series.slice().reverse().forEach(function (se) {
      tot += se.values[i];
      html += '<span class="levy-tip-row cluster"><span class="levy-swatch" style="--swatch:var(--series-' + se.idx +
        ')"></span>' + se.name + '<b>' + usd(se.values[i]) + '</b></span>';
    });
    if (d.series.length > 1) html += '<span class="levy-tip-row cluster levy-tip-total">Total<b>' + usd(tot) + '</b></span>';
    tip.innerHTML = html;
    tip.classList.remove("hidden");
    var wrap = $("chartWrap").getBoundingClientRect(), rr = evt.target.getBoundingClientRect();
    var x = rr.left - wrap.left + rr.width / 2, w = tip.offsetWidth;
    tip.style.left = Math.max(0, Math.min(x - w / 2, wrap.width - w)) + "px";
  }
  $("chartSvg").addEventListener("mouseover", function (e) {
    if (e.target.classList.contains("levy-hit")) showTip(+e.target.dataset.i, e);
  });
  $("chartSvg").addEventListener("mouseleave", function () { $("chartTip").classList.add("hidden"); });

  /* ---------- main render ---------- */

  function yearsFrom(a, n) { var out = []; for (var i = 0; i < n; i++) out.push(a + i); return out; }
  function seriesFor(keys, years, share) {
    return keys.map(function (k) {
      return { key: k, idx: SERIES[k], name: NAMES[k],
               values: years.map(function (y) { return pieceAt(k, y, share); }) };
    });
  }
  function sum(a) { return a.reduce(function (s, v) { return s + v; }, 0); }

  /* Keep the control just used in the piece list where it is on screen. A change there can flip
     the scenario to "Custom", whose note above the list is much shorter than a scenario's, which
     would pull the row (and the pointer's target) up the page. Browser scroll anchoring doesn't
     catch it, and Safari has none, so render() measures the control before and after and scrolls
     back by the difference. keepEl is set by a capturing listener on #stackSummary (wiring). */
  var keepEl = null;
  function render() {
    var keep = keepEl, keepTop = keep && keep.getBoundingClientRect().top;
    keepEl = null;
    ptellMemo = null;
    paint();
    ptellMemo = null;
    if (keep) window.scrollBy(0, keep.getBoundingClientRect().top - keepTop);
  }
  function paint() {
    estimateCurTax();
    var he = num(homeEav, 0);
    var share = renter ? renterD65() / D65_EXT_2025
      : curTaxTouched ? num(curTax, 0) / D65_EXT_2025 : (DISTRICT_EAV > 0 ? he / DISTRICT_EAV : 0);
    var W = Math.max(1, Math.min(Math.round(num(opYears, 20)), 40));
    var keys = includedKeys(), steps = [];

    /* clamp-and-explain messages for every piece's own fields, ticked or not */
    ["hls", "capital"].forEach(function (k) {
      var e = BOND[k];
      capped(e.num, e.msg, amountCapMsg(e.num), 0);
      capped(e.term, e.termMsg, TERM_CAP_MSG[k], 20);
    });
    if (opStyle === "dollars") capped(opDollars, $("opMsg"), amountCapMsg(opDollars), 0);
    else setMsg($("opMsg"), "");

    var years = yearsFrom(FIRST_BILL, W);
    var series = seriesFor(keys, years, share), byKey = {};
    series.forEach(function (se) { byKey[se.key] = se; });
    var totals = years.map(function (_, i) { return sum(series.map(function (se) { return se.values[i]; })); });
    var peak = Math.max(0, Math.min(clampYear(num(stackYear, 2030), 2030) - FIRST_BILL, W - 1));
    var spotYear = years[peak], headline = totals[peak] || 0;
    var label = !keys.length ? "Nothing included"
      : keys.length === 1 ? NAMES[keys[0]] + ", added cost in " + spotYear
      : "Added cost in " + spotYear + ", " + (keys.length === PIECES.length ? "all four" : keys.length) +
        " pieces together";

    /* each row: what it is, and what it adds in the spotlight year (a dash when left out) */
    PIECES.forEach(function (k) {
      var on = included(k), note = pieceSummary(k);
      setText($(k + "Note"), on ? note : "Not included · " + note);
      setText($(k + "Amount"), on ? usd(byKey[k].values[peak]) : "—");
    });
    setText($("stackTotalLabel"), renter ? "Estimated added rent, " + spotYear + " bills" : "Added on your " + spotYear + " bill");
    setText($("stackTotal"), usd(headline));
    renderCopy(keys);

    steps.push(["A", renter ? "Your rent's share of what District 65 collects" : "Your property's share of the district",
      renter ? usd(renterD65()) + " of District 65 tax in your rent (" + usd(num(rent, 0)) + " &times; 12 &times; " +
        num(taxShare, 17) + "% &times; 41.25%) &divide; " + usd(D65_EXT_2025)
      : curTaxTouched ? usd(num(curTax, 0)) + " District 65 tax &divide; " + usd(D65_EXT_2025) + " District 65 collects in all"
        : usd(he) + " &divide; " + usd(DISTRICT_EAV) + " of total district value",
      share > 0 ? (share * 100).toFixed(4) + "%" : "0%"]);
    var letters = "BCDE";
    series.forEach(function (se, j) {
      steps.push([letters[j], NAMES[se.key] + " in " + spotYear, pieceTrace(se.key), usd(se.values[peak])]);
    });
    if (renter) {
      steps.push(["P", "Share your landlord passes on through rent", "already applied to the amounts above",
        Math.round(PT() * 100) + "%"]);
    }
    /* milestone totals: the spotlight year, 2035 and 2040 */
    [spotYear, 2035, 2040].filter(function (y, i, a) {
      return a.indexOf(y) === i && y - FIRST_BILL >= 0 && y - FIRST_BILL < W;
    }).sort(function (a, b) { return a - b; }).forEach(function (y) {
      steps.push(["=", (renter ? "Estimated added rent in " : keys.length === 1 ? "Your estimated cost in "
        : "Everything together in ") + y,
        renter ? "per year, on top of your current rent" : "added to what you pay today",
        usd(totals[y - FIRST_BILL])]);
    });

    $("chartSub").textContent = renter
      ? "Estimated added rent per year, by the year the tax bill is paid, at " + Math.round(PT() * 100) + "% pass-through."
      : "Added to what you pay on your 2026 bill, by the year the bill is paid.";

    /* fixed 2027–2032 view, independent of the window and start-year settings */
    var yrs32 = yearsFrom(FIRST_BILL, HORIZON - FIRST_BILL + 1);
    var tot32 = yrs32.map(function (y, i) {   /* reuse the series' years; compute only past the window */
      return i < W ? totals[i] : sum(keys.map(function (k) { return pieceAt(k, y, share); }));
    });
    $("out32Year").textContent = usd(tot32[tot32.length - 1]);
    $("out32Month").textContent = usd(tot32[tot32.length - 1] / 12);
    $("out32Total").textContent = usd(sum(tot32));

    $("resLabel").textContent = label;
    $("outYear").textContent = usd(headline);
    $("outMonth").textContent = usd(headline / 12);
    /* the phone bar's collapsed label, matching #resLabel / #stackTotalLabel */
    setText($("dockBarLabel"), !keys.length ? "Nothing included"
      : (renter ? "Added rent in " : "Added cost in ") + spotYear);

    $("chartTitle").textContent = keys.length > 1 ? "Year by year, stacked" : "Year by year";
    renderChart(years, series, peak);

    var html = "";
    steps.forEach(function (s) {
      var tot = (s[0] === "=");
      html += '<div class="step' + (tot ? " total" : "") + '">' +
        '<div class="step-n">' + s[0] + '</div>' +
        '<div class="step-label">' + s[1] + '<small class="step-note">' + s[2] + '</small></div>' +
        '<div class="step-value">' + s[3] + '</div></div>';
    });
    $("traceBody").innerHTML = html;

    ["hls", "capital"].forEach(function (k) {
      BOND[k].presets.querySelectorAll("[data-bond]").forEach(function (b) {
        b.setAttribute("aria-pressed", String(parseFloat(b.dataset.bond) === num(BOND[k].num, 0)));
      });
    });
    document.querySelectorAll("#passPresets [data-pass]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(parseFloat(b.dataset.pass) === num(passPct, 0)));
    });
    document.querySelectorAll("#opPresets [data-opamt]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(parseFloat(b.dataset.opamt) === num(opDollars, 0)));
    });
    syncScenario();

    /* District-wide financing costs for the two bond pieces */
    var finRows = "", finTot = { pay: 0, i1: 0, iavg: 0, itot: 0, P: 0 };
    ["hls", "capital"].forEach(function (k) {
      var fb = bondEff(k), pay = ds(fb.P, fb.term, fb.rate), itot = Math.max(0, pay * fb.term - fb.P);
      var i1 = fb.P * fb.rate / 100, iavg = fb.term ? itot / fb.term : 0;
      finTot.pay += pay; finTot.i1 += i1; finTot.iavg += iavg; finTot.itot += itot; finTot.P += fb.P;
      finRows += '<tr><th scope="row">' + NAMES[k] + (included(k) ? "" : " (not included above)") +
        "<small class=\"step-note\">" + usdShort(fb.P) + ", " + fb.term + " years at " + fb.rate + "%, bills paid " +
        fb.start + "–" + (fb.start + fb.term - 1) + "</small></th><td>" + usd(pay) + "</td><td>" + usd(i1) +
        "</td><td>" + usd(iavg) + "</td><td>" + usd(itot) + "</td></tr>";
    });
    finRows += '<tr><th scope="row"><strong>New borrowing, total</strong></th><td><strong>' + usd(finTot.pay) +
      "</strong></td><td><strong>" + usd(finTot.i1) + "</strong></td><td><strong>" + usd(finTot.iavg) +
      "</strong></td><td><strong>" + usd(finTot.itot) + "</strong></td></tr>";
    finRows += '<tr><th scope="row">Existing bonds, for scale<small class="step-note">bond and interest extended on ' +
      "2026 bills</small></th><td>" + usd(7425249) + "</td><td>not published</td><td>not published</td>" +
      "<td>not published</td></tr>";
    $("finTable").innerHTML = '<table><caption class="visually-hidden">What new borrowing would cost the district, ' +
      "per year and in total interest</caption><thead><tr><th scope=\"col\">Borrowing</th>" +
      '<th scope="col">Annual payment</th><th scope="col">Interest, first year</th>' +
      '<th scope="col">Interest, average per year</th><th scope="col">Total interest</th></tr></thead><tbody>' +
      finRows + "</tbody></table>";

    /* 2017 referendum: already in today's bill (renters: already in rent) */
    var base17 = renter ? renterD65() : num(curTax, 0);
    var r17Now = base17 * REF17_SHARE;
    $("r17Year").textContent = usd(r17Now);
    $("r17Month").textContent = usd(r17Now / 12);

    announceResult(label + ": " + usd(headline) + " per year, " + usd(headline / 12) + " per month.");
  }

  /* ---------- wiring ---------- */

  /* capture phase, so keepEl is set before the control's own handler calls render(); cleared once
     the event is done, so a click that doesn't render (opening a row) can't leave it stale */
  ["input", "change", "click"].forEach(function (t) {
    $("stackSummary").addEventListener(t, function (e) {
      if (!e.target.matches("input, select, button")) return;
      keepEl = e.target;
      setTimeout(function () { keepEl = null; });
    }, true);
  });

  PIECES.forEach(function (k) { $(k + "Include").addEventListener("change", render); });
  document.querySelectorAll("#opModePresets [data-op]").forEach(function (b) {
    b.addEventListener("click", function () { setOpStyle(b.dataset.op); });
  });
  document.querySelectorAll("#ptellScope [data-scope]").forEach(function (b) {
    b.addEventListener("click", function () {
      ptellScope = b.dataset.scope;
      document.querySelectorAll("#ptellScope [data-scope]").forEach(function (x) {
        x.setAttribute("aria-pressed", String(x.dataset.scope === ptellScope));
      });
      render();
    });
  });
  document.querySelectorAll("#opPresets [data-opamt]").forEach(function (b) {
    b.addEventListener("click", function () {
      opDollars.value = b.dataset.opamt; opRange.value = b.dataset.opamt; render();
    });
  });
  /* one option per scenario, in SCEN order, ahead of the static "Custom" option */
  var scenSel = $("scenario");
  Object.keys(SCEN).forEach(function (k) {
    scenSel.insertBefore(new Option(SCEN[k].label, k), scenSel.lastElementChild);
  });
  scenSel.addEventListener("change", function () {
    if (scenSel.value === "custom") { customPicked = true; render(); }   /* keeps the current numbers */
    else applyScenario(scenSel.value);
  });

  document.querySelectorAll("#tenure [data-tenure]").forEach(function (b) {
    b.addEventListener("click", function () {
      renter = b.dataset.tenure === "rent";
      document.querySelectorAll("#tenure [data-tenure]").forEach(function (x) {
        x.setAttribute("aria-pressed", String((x.dataset.tenure === "rent") === renter));
      });
      $("renterFields").classList.toggle("hidden", !renter);
      $("ownerFields").classList.toggle("hidden", renter);
      render();   /* renderCopy picks up the renter assumptions */
    });
  });
  document.querySelectorAll("#passPresets [data-pass]").forEach(function (b) {
    b.addEventListener("click", function () { passPct.value = b.dataset.pass; render(); });
  });
  /* each bond piece: slider and number field mirror each other; presets fill both */
  ["hls", "capital"].forEach(function (k) {
    var e = BOND[k];
    e.range.addEventListener("input", function () { e.num.value = e.range.value; render(); });
    e.num.addEventListener("input", function () { e.range.value = Math.min(num(e.num, 0), e.range.max); render(); });
    e.presets.querySelectorAll("[data-bond]").forEach(function (b) {
      b.addEventListener("click", function () {
        e.num.value = b.dataset.bond;
        e.range.value = Math.min(b.dataset.bond, e.range.max);
        render();
      });
    });
    [e.term, e.rate, e.start].forEach(function (el) {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
  });
  opRange.addEventListener("input", function () { opDollars.value = opRange.value; render(); });
  opDollars.addEventListener("input", function () { opRange.value = Math.min(num(opDollars, 0), opRange.max); render(); });
  mktVal.addEventListener("input", function () {
    var mv = parseFloat(mktVal.value);
    if (isFinite(mv) && mv > 0) { homeEav.value = Math.max(0, Math.round((mv * 0.10 * 3.03 - 10000) / 500) * 500); render(); }
  });
  homeEav.addEventListener("input", function () { mktVal.value = ""; render(); });
  curTax.addEventListener("input", function () {
    curTaxTouched = curTax.value !== "";
    $("curTaxHint").textContent = curTaxTouched
      ? "Using the amount you entered for every estimate, including your share of bond and referendum costs. Clear " +
        "the field to go back to the estimate from your EAV."
      : "The \"Evanston/Skokie School District 65\" line on your 2026 tax bill. If you enter it, every estimate on " +
        "this page uses it, which also picks up the 2025 reassessment. Until then, this is estimated from your EAV.";
    render();
  });
  [opRate, opStart, opYears, cpiNow, cpiFut, stackYear, rent, taxShare, passPct].forEach(function (el) {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  /* Phone bar: show the docked result (#result) only while the form sections are on screen. CSS
     ignores .is-visible on desktop, where the dock is sticky. While it shows, --dock-bar-size feeds
     scroll-padding so a focused field never lands under the collapsed bar. */
  var dock = $("result"), details = $("dockDetails");
  function setDockOpen(open) {
    dock.classList.toggle("is-open", open);
    details.setAttribute("aria-expanded", String(open));
    $("dockDetailsLabel").textContent = open ? "Hide details" : "Details";
  }
  details.addEventListener("click", function () { setDockOpen(!dock.classList.contains("is-open")); });
  dock.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && dock.classList.contains("is-open")) { setDockOpen(false); details.focus(); }
  });
  /* The bar stays up while it holds focus, even scrolled past the layout: hiding it
     (visibility: hidden) would drop focus to <body>. It goes once focus leaves. */
  var layoutOnScreen = false;
  function syncDock() {
    var show = layoutOnScreen || dock.contains(document.activeElement);
    dock.classList.toggle("is-visible", show);
    if (!show) setDockOpen(false);   /* scrolled away: come back to the slim bar */
  }
  dock.addEventListener("focusout", function (e) {
    if (!dock.contains(e.relatedTarget)) setTimeout(syncDock, 0);
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      layoutOnScreen = entries[entries.length - 1].isIntersecting;
      syncDock();
    }).observe(dock.parentNode);
  }
  /* track the collapsed bar's height as it settles (a ResizeObserver, so a measurement taken mid
     slide or mid collapse is replaced by the final one) */
  if ("ResizeObserver" in window) {
    new ResizeObserver(function () {
      if (dock.classList.contains("is-open")) return;
      /* only the fixed phone bar covers anything; sticky or in-flow (desktop, short
         screens, 150% text) it reserves nothing */
      var fixed = getComputedStyle(dock).position === "fixed";
      document.documentElement.style.setProperty("--dock-bar-size", (fixed ? dock.offsetHeight : 0) + "px");
    }).observe(dock);
  }

  /* Piece rows: each .include-panel is the <details>' sibling, so mirror the open state onto
     its .is-closed, which slides it (exclusive <details name> fires toggle on the one it
     closes, too). */
  document.querySelectorAll(".include-row > details").forEach(function (d) {
    var panel = d.parentNode.querySelector(".include-panel");
    function sync() { panel.classList.toggle("is-closed", !d.open); }
    d.addEventListener("toggle", sync);
    sync();
  });

  /* Open with the default scenario. This also sets the operating and capital inputs, overriding
     the placeholder values in the page's HTML, and renders. */
  applyScenario(DEFAULT_SCEN);
})();
