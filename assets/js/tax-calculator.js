/* Tax impact estimator (page: /tax-calculator/).
   This page requires JS: the controls have sensible HTML defaults, but the
   mode copy, the two disclosure bodies, the derivation, the chart and every
   result are rendered here, so with JS off the page shows empty panels and $0.

   Five views share one form:
     ptell     the yearly increase allowed under the property tax cap
     hls       health and life safety bonds (no referendum)
     capital   a voter-approved building bond
     operating a voter-approved operating (limiting-rate) increase
     city      the City of Evanston's own levy increase (not D65), for context
   An own/rent toggle switches the starting point: renters start from rent and a
   pass-through rate instead of an EAV or tax bill.
     stack     all of the above, added together by the year the bill is paid

   hls and capital share one set of bond controls on screen, so each keeps its
   own saved settings in BONDS; switching tabs swaps them in and out. That is
   what lets the stacked view price both at once.

   All styling comes from main.css. Classes emitted only from here (choice,
   compact, step*, total, stripe-bloom, levy-*) are listed in the PurgeCSS
   safelist in postcss.config.cjs. The chart's --series-N colors are theme
   tokens on :root. */
(function () {
  "use strict";

  /* Tax Year 2024 EAV from the audited FY2025 AFR (source 1). */
  var DISTRICT_EAV = 4203686381;
  /* Tax Year 2024 District 65 levy: $150.43M TY2025 less the $4.58M increase,
     per the Cook County Treasurer via the RoundTable (source 6). Used only to
     estimate a household's current D65 tax until they type in their own. */
  var D65_RATE = 145.85e6 / DISTRICT_EAV;
  /* City of Evanston + General Assistance rates, Tax Year 2023, per the city's
     "Property Tax Bill Explanation" page. Estimate only, until the user enters
     their own city line. Rates fell after the 2025 reassessment, so this may run high. */
  var CITY_RATE = (1.269 + 0.029) / 100;
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
  /* City-only share of an Evanston bill relative to D65's: the city + library
     take 18.87% ($62.68M); the library levied about $10.03M ($9.48M operating +
     $0.55M debt), leaving the city about 15.85% vs D65's 41.25%. Used to estimate
     the city line from an entered D65 line. */
  var CITY_PER_D65 = (18.87 * (62.68 - 10.03) / 62.68) / 41.25;
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
  var PIECES = ["ptell", "hls", "capital", "operating", "city"];
  var NAMES = { ptell: "Yearly levy increase", hls: "Health & life safety bonds",
                capital: "Capital referendum", operating: "Operating referendum",
                city: "City of Evanston levy" };
  var SERIES = { ptell: 1, hls: 2, capital: 3, operating: 4, city: 5 };   /* color follows the piece */

  var $ = function (i) { return document.getElementById(i); };
  var homeEav = $("homeEav");
  if (!homeEav) return;   // not on the calculator page

  var mode = "stack", opStyle = "dollars", ptellScope = "every", curTaxTouched = false, cityTaxTouched = false;
  var mktVal = $("mktVal"), bond = $("bond"), bondNum = $("bondNum"), term = $("term"), rate = $("rate"),
      bondStart = $("bondStart"), opDollars = $("opDollars"), opRange = $("opRange"), opRate = $("opRate"),
      opStart = $("opStart"), opYears = $("opYears"), curTax = $("curTax"), cpiNow = $("cpiNow"),
      cpiFut = $("cpiFut"), stackYear = $("stackYear"),
      cityTax = $("cityTax"), cityPct = $("cityPct"), cityLater = $("cityLater"),
      rent = $("rent"), taxShare = $("taxShare"), passPct = $("passPct");
  var renter = false;
  var D65_BILL_SHARE = 0.4125;   /* D65's share of an Evanston bill, TY2025 (Treasurer via RoundTable) */
  /* Property tax built into rent, D65 portion: rent × 12 × share-of-rent × D65's share of the bill */
  function renterD65() { return num(rent, 0) * 12 * Math.min(num(taxShare, 17), 40) / 100 * D65_BILL_SHARE; }
  /* Pass-through factor: 1 for owners, the landlord pass-through for renters */
  function PT() { return renter ? Math.min(num(passPct, 50), 100) / 100 : 1; }

  var BONDS = {
    hls:     { P: 22e6,  term: 20, rate: 4.5, start: 2028 },
    capital: { P: 100e6, term: 25, rate: 4.5, start: 2030 }
  };
  var include = { ptell: true, hls: true, capital: true, operating: true, city: true };

  /* Referendum scenarios for the stack tab. v4 = For a Brighter Evanston, "D65 Ten-Year
     Financial Model, v4" (New_Money tab): $17M operating from FY30 (first bills paid 2029
     after a November 2028 vote), and $63,737,800 of bonds replacing the $7.97M/yr capital
     transfers, level debt service at 4.5% over 20 years ($4.90M/yr), first repaid 2030.
     page = this page's own defaults. */
  var SCEN = {
    v4:   { op: 17e6, opStart: 2029, cap: { P: 63737800, term: 20, rate: 4.5, start: 2030 } },
    page: { op: 10e6, opStart: 2029, cap: { P: 100e6, term: 25, rate: 4.5, start: 2030 } }
  };
  function applyScenario(k) {
    var s = SCEN[k];
    if (!s) return;
    opDollars.value = s.op; opRange.value = s.op; opStart.value = s.opStart;
    BONDS.capital = { P: s.cap.P, term: s.cap.term, rate: s.cap.rate, start: s.cap.start };
    if (mode === "capital") loadBond("capital");
    include.operating = true; include.capital = true;
    document.querySelectorAll("#stackPieces [data-piece]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(include[b.dataset.piece]));
    });
    setOpStyle("dollars");   /* also renders */
  }
  function scenarioMatch(k) {
    var s = SCEN[k], b = BONDS.capital;
    return opStyle === "dollars" && num(opDollars, 0) === s.op &&
      clampYear(num(opStart, 2029), 2029) === s.opStart && b.P === s.cap.P && b.term === s.cap.term &&
      b.rate === s.cap.rate && b.start === s.cap.start;
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

  var CFG = {
    stack: {
      note: '<strong>This adds every piece together.</strong> Each one is an increase over what you pay District 65 ' +
        'today, placed in the year the bill is paid. Bonds stop when they are repaid. Levy and operating increases ' +
        'keep building. Turn pieces on or off below, and open any tab to change its settings.',
      alert: false,
      voteTitle: "Which of these need a vote",
      vote: '<p><strong>No vote:</strong> the yearly levy increase (set by the board within the state cap) and health ' +
        'and life safety bonds (issued by the board after state approval of the work).</p>' +
        '<p><strong>Vote required:</strong> a capital referendum (permission to borrow for buildings) and an operating ' +
        'referendum (permission to raise the capped levy itself).</p>' +
        '<p>That split matters for planning. Roughly half of what you see stacked here can happen through board votes ' +
        'alone, depending on the amounts you enter.</p>'
    },
    ptell: {
      note: '<strong>The district requested a 4.99% increase, but existing homeowners should expect closer to ' +
        '2.4%.</strong> State law caps growth on existing property at inflation, 2.7% for taxes paid in 2027, and that cap ' +
        'covers about 95% of the District 65 tax. The other 5%, existing bond payments, is estimated to fall 2.88%. The ' +
        'district\'s own memo estimates capped extensions will actually rise about 3%, with the extra coming from newly ' +
        'built property, billed to its owners rather than to you. The levy is set to be adopted December 14.',
      alert: false,
      voteTitle: "Why no vote is needed for this one",
      vote: '<p>Under the Property Tax Extension Limitation Law, the board can raise the capped levy each year by the ' +
        'lesser of 5% or the prior year\'s inflation, plus taxes from new property. It holds a public hearing when the ' +
        'request is more than 5% above the prior year\'s extension, but no community vote is required.</p>' +
        '<p>Going above the cap is what an operating referendum does. Bond repayment for voter-approved and health and ' +
        'life safety bonds sits outside the cap entirely.</p>' +
        '<p>Because each year\'s levy becomes the base for the next, the increases compound. Seen one year at a time ' +
        'they look small. Over a decade they add up.</p>'
    },
    hls: {
      note: '<strong>The district has started to borrow for this work.</strong> Its FY2027 budget anticipates about ' +
        '$22.1 million in health and life safety bond proceeds, and the proposed summer 2027 repairs use $5 million of ' +
        'these bonds alongside $3.85 million of district funds. The full $128.8 million survey is a ten-year ceiling, ' +
        'not a plan.',
      alert: false,
      bondLabel: "Amount borrowed for safety work",
      bondHint: '$22 million is the bond amount in the FY2027 budget. $128.8 million is the full ten-year survey reported to ' +
        'the board in August 2026, much of which can be deferred for up to a decade.',
      termHint: "Illinois caps these particular bonds at 20 years.",
      startHint: "Bonds sold during 2027 would most likely first appear on bills paid in 2028.",
      termMax: 20,
      termCapMsg: "Illinois caps health and life safety bonds at 20 years, so this estimate uses 20.",
      bondMax: 200e6,
      presets: [[5e6, "$5M · summer 2027"], [22e6, "$22M · FY27 budget"], [50e6, "$50M"],
                [128.8e6, "$128.8M · full survey"]],
      voteTitle: "Why a vote may not be required",
      vote: '<p>Illinois school districts may levy for state-approved health and life safety work at up to 0.05% of ' +
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
      note: '<strong>No capital referendum has been proposed.</strong> The district has said it is exploring a bond ' +
        'referendum in November 2028 to build two new or significantly renovated schools and invest in the buildings ' +
        'that remain. It has not named an amount.',
      alert: false,
      bondLabel: "Amount borrowed, approved by voters",
      bondHint: 'For scale, District 65 has identified about $409.6 million of facilities needs in the first ten years.',
      termHint: "Illinois caps voter-approved building bonds at 30 years. Terms of 20 to 25 years are common.",
      startHint: "This assumes a November 2028 vote, with bonds sold in 2029 and first repaid on bills paid in 2030.",
      termMax: 30,
      termCapMsg: "Illinois caps voter-approved building bonds at 30 years, so this estimate uses 30.",
      bondMax: 410e6,
      presets: [[50e6, "$50M"], [63737800, "$63.7M · community v4 model"], [100e6, "$100M"], [200e6, "$200M"],
                [409.6e6, "$409.6M · 10-yr needs"]],
      voteTitle: "How a capital referendum differs",
      vote: '<p>A capital referendum asks voters directly for permission to borrow. If it passes, the debt service ' +
        'is a recognized exception to the property tax cap, so it is added on top of the capped levy rather than ' +
        'squeezed inside it.</p>' +
        '<p>Bond money arrives within months of approval, which is why capital questions and operating questions ' +
        'move on very different timelines.</p>'
    },
    operating: {
      note: '<strong>No operating referendum has been proposed, and an operating increase does not expire on its ' +
        'own.</strong> Unlike bonds, which end when they are repaid, an approved operating increase becomes part of the ' +
        'district\'s permanent tax base unless the ballot question sets an end date. District 65\'s 2017 referendum was ' +
        'presented as a time-limited bridge.',
      alert: true,
      voteTitle: "How an operating referendum differs",
      vote: '<p>Operating money pays salaries, programs, and the daily cost of running schools. There is no borrowing ' +
        'and no interest, so the arithmetic is simpler: the district raises a set amount and your share is your ' +
        'property\'s share of the district.</p>' +
        '<p>Two differences matter more than the math. First, timing. Bond proceeds arrive within months of approval, ' +
        'while operating money does not reach the district until the following tax cycle. Second, duration. Bond debt ' +
        'service ends. An operating increase becomes the new base and continues to grow afterward under the tax cap ' +
        'formula, unless the question is written with a sunset.</p>'
    }
  };

  CFG.city = {
    note: '<strong>This is the city, not District 65.</strong> It is a separate line on the same bill, set by the City ' +
      'Council. The budget introduced November 9 raises the city\'s levy 4.1%, down from the 10.1% first proposed, with ' +
      'a final vote scheduled for later in November. The library sets its own levy separately and is not included here.',
    alert: false,
    voteTitle: "Why no vote is needed for this one",
    vote: '<p>Evanston is a home rule city, so the property tax cap that limits District 65 does not apply to it. The ' +
      'City Council sets the levy each year as part of the budget, after a Truth in Taxation hearing. No community ' +
      'vote is required.</p>' +
      '<p>That cuts both ways. The city can raise its levy by more than inflation in a hard year, as it proposed for ' +
      '2027, and it can also hold it flat, as it did from 2021 through 2025.</p>'
  };

  var ASSUME_COMMON =
    '<p><strong>Your share, two ways.</strong> If you enter your District 65 tax, your share is that amount divided by ' +
    'the $148.5 million District 65 extended for Tax Year 2025, the same year as your 2026 bill, so it already reflects ' +
    'the 2025 reassessment. If you enter only an EAV, the tool divides by $4.20 billion, District 65\'s Tax Year 2024 ' +
    'value, which predates the reassessment. An EAV taken from your 2026 bill will then read somewhat high, because ' +
    'homes rose about 18% in that reassessment.</p>' +
    '<p><strong>Your share stays put after that.</strong> At each reassessment, about every three years, your share ' +
    'moves if your property rises faster or slower than the rest of the district. In 2025, homes rose faster than ' +
    'commercial property and their share of Evanston\'s taxable value went from 69% to 70.4%. This tool does not ' +
    'project the next shift.</p>' +

    '<p><strong>Two lines of your bill at most.</strong> Everything here is District 65, except the City of Evanston ' +
    'levy, which is the city\'s own line. Evanston Township High School District 202, the library, the county, and ' +
    'every other taxing body are left out.</p>' +
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
  var ASSUME = {
    stack: '<p><strong>Increases over today, added together.</strong> Every figure is what each piece adds to your ' +
      'current District 65 tax in a given bill year. Bond repayment sits outside the tax cap, so it stacks on top. ' +
      'An operating increase joins the capped base and grows with it from then on.</p>' +
      '<p><strong>Start years are estimates.</strong> Each piece starts in the bill year set on its own tab. Change them ' +
      'if the timing shifts.</p>',
    ptell: '<p><strong>Only the capped part grows at the cap.</strong> This applies the inflation cap to the 95% of your ' +
      'District 65 tax that is capped, and the district\'s estimated 2.88% drop to the 5% that repays existing bonds. ' +
      'After 2027 the existing bond part is held at that level, since later bond years are not in the levy memo. Your own bill can still rise faster or slower than that if your assessment changes relative to ' +
      'everyone else\'s, which happens most in reassessment years.</p>' +
      '<p><strong>New property is left out.</strong> Taxes collected from newly built property are paid by its owners, ' +
      'not by you, which is why the 4.99% request does not translate to a 4.99% increase on your bill.</p>',
    bond: '<p><strong>Level debt service.</strong> Real bond schedules are rarely perfectly level, so early and late ' +
      'years may differ from the average shown.</p>',
    city: '<p><strong>Applied to your city line.</strong> The percentage is applied to your current City of Evanston ' +
      'tax. If your assessment moves relative to everyone else\'s, your own change will differ.</p>' +
      '<p><strong>Estimated starting point.</strong> Until you enter your own city tax, it is estimated from your EAV ' +
      'at the city\'s Tax Year 2023 rates. Rates fell after the 2025 reassessment, so the estimate may run high.</p>',
    operating: '<p><strong>It grows with the cap.</strong> The first year uses the amount you entered. After that it ' +
      'grows each year at the later-year inflation rate on the Yearly levy increase tab, because an approved increase ' +
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
  function estimateCityTax() {
    if (!cityTaxTouched) cityTax.value = Math.round((curTaxTouched ? num(curTax, 0) * CITY_PER_D65
      : num(homeEav, 0) * CITY_RATE) / 10) * 10;
  }
  function cityInputs() {
    return { C0: renter ? renterD65() * CITY_PER_D65 : num(cityTax, 0), p1: num(cityPct, 4.1) / 100, pl: num(cityLater, 0) / 100 };
  }
  function ptellInputs() {
    return { T0: renter ? renterD65() : num(curTax, 0), c1: Math.min(num(cpiNow, 2.7), 5) / 100,
             cf: Math.min(num(cpiFut, 3), 5) / 100 };
  }
  /* Read the on-screen bond controls into BONDS[m] (only while a bond tab is showing). */
  function saveBond(m) {
    BONDS[m] = { P: num(bondNum, 0), term: Math.max(1, Math.round(num(term, 20))), rate: num(rate, 4.5),
                 start: clampYear(num(bondStart, BONDS[m].start), BONDS[m].start) };
  }
  function loadBond(m) {
    var b = BONDS[m];
    bondNum.value = b.P; term.value = b.term; rate.value = b.rate; bondStart.value = b.start;
  }
  function bondEff(m) {
    var b = BONDS[m], c = CFG[m];
    return { P: Math.min(b.P, c.bondMax), term: Math.min(b.term, c.termMax), rate: b.rate, start: b.start };
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
    if (key === "city") {
      var c = cityInputs(), kc = y - FIRST_BILL;
      if (kc < 0) return 0;
      return c.C0 * ((1 + c.p1) * Math.pow(1 + c.pl, kc) - 1);
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

  /* ---------- mode switching ---------- */

  function setMode(m) {
    if (mode === "hls" || mode === "capital") saveBond(mode);
    mode = m;
    document.querySelectorAll(".choice[data-mode]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.mode === m));
    });
    var c = CFG[m];
    $("modeNote").innerHTML = c.note;
    /* toggle only the stripe utility — never replace className */
    $("modeNote").classList.toggle("stripe-bloom", !!c.alert);
    $("voteSummary").textContent = c.voteTitle;
    $("voteBody").innerHTML = c.vote;
    $("assumeBody").innerHTML =
      (m === "hls" || m === "capital" ? ASSUME.bond : ASSUME[m]) +
      (m === "stack" ? ASSUME.bond + ASSUME.operating + ASSUME.city : "") + ASSUME_COMMON;
    if (renter) $("assumeBody").innerHTML = ASSUME_RENT + $("assumeBody").innerHTML;

    var borrowing = (m === "hls" || m === "capital");
    $("borrowBlock").classList.toggle("hidden", !borrowing);
    $("operBlock").classList.toggle("hidden", m !== "operating");
    $("ptellBlock").classList.toggle("hidden", m !== "ptell");
    $("stackBlock").classList.toggle("hidden", m !== "stack");
    $("cityBlock").classList.toggle("hidden", m !== "city");
    $("windowField").classList.toggle("hidden", borrowing);
    $("windowHint").textContent = m === "operating"
      ? "Counted from the first bill that includes it. Operating increases do not expire on their own, so this is " +
        "just a window for comparison."
      : "Counted from bills paid in 2027. Levy and operating increases do not expire on their own, so this is just " +
        "a window for comparison.";
    $("totalKey").textContent = borrowing ? "Over the full term" : "Over the window below";

    if (borrowing) {
      loadBond(m);
      $("bondLabel").textContent = c.bondLabel;
      $("bondHint").innerHTML = c.bondHint;
      $("termHint").textContent = c.termHint;
      $("startHint").textContent = c.startHint;
      term.max = c.termMax;
      bond.max = c.bondMax;
      bondNum.max = c.bondMax;
      bond.value = Math.min(num(bondNum, 0), c.bondMax);
      var ph = "";
      c.presets.forEach(function (p) {
        ph += '<button class="choice compact" type="button" data-bond="' + p[0] + '">' + p[1] + '</button>';
      });
      $("bondPresets").innerHTML = ph;
      $("bondPresets").querySelectorAll("[data-bond]").forEach(function (b) {
        b.addEventListener("click", function () {
          bondNum.value = b.dataset.bond;
          bond.value = Math.min(b.dataset.bond, bond.max);
          render();
        });
      });
    }
    render();
  }

  function setOpStyle(s) {
    opStyle = s;
    document.querySelectorAll("#opModePresets [data-op]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.op === s));
    });
    $("opDollarField").classList.toggle("hidden", s !== "dollars");
    $("opRateField").classList.toggle("hidden", s !== "rate");
    render();
  }

  /* ---------- summary of each piece (stack tab) ---------- */

  function pieceSummary(key) {
    if (key === "ptell") {
      var p = ptellInputs();
      return ptellScope === "once"
        ? "Just the 2026 levy, " + (p.c1 * 100).toFixed(1) + "% of " + usd(p.T0) + " a year"
        : (p.c1 * 100).toFixed(1) + "% in 2027, then " + (p.cf * 100).toFixed(1) + "% a year, on " + usd(p.T0);
    }
    if (key === "city") {
      var c = cityInputs();
      return (c.p1 * 100).toFixed(1) + "% for 2027" + (c.pl > 0 ? ", then " + (c.pl * 100).toFixed(1) + "% a year" : "") +
        ", on " + usd(c.C0) + " of city tax (not District 65)";
    }
    if (key === "operating") {
      return usdShort(opRaised()) + " a year district-wide, starting with bills paid in " +
        clampYear(num(opStart, 2029), 2029) + ", growing with the cap";
    }
    var b = bondEff(key);
    return usdShort(b.P) + " over " + b.term + " years at " + b.rate + "%, bills paid " + b.start + "–" +
      (b.start + b.term - 1);
  }
  function renderStackSummary() {
    var html = "";
    PIECES.forEach(function (k, i) {
      html += '<div class="step"><div class="step-n"><span class="levy-swatch" style="background:var(--series-' +
        SERIES[k] + ')"></span></div><div class="step-label">' + NAMES[k] +
        (include[k] ? "" : " (left out)") + '<small class="step-note">' + pieceSummary(k) + '</small></div>' +
        '<div class="step-value"><button class="choice compact" type="button" data-edit="' + k +
        '">Edit</button></div></div>';
    });
    $("stackSummary").innerHTML = html;
    $("stackSummary").querySelectorAll("[data-edit]").forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.dataset.edit); });
    });
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
      return '<span class="levy-key cluster"><span class="levy-swatch" style="background:var(--series-' + se.idx +
        ')"></span>' + se.name + '</span>';
    }).join("") : "";

    /* table view */
    var th = "<tr><th>Bill paid in</th>" + series.map(function (se) { return "<th>" + se.name + "</th>"; }).join("") +
      (series.length > 1 ? "<th>Total</th>" : "") + "</tr>";
    var rows = years.map(function (yr, i) {
      return "<tr><td>" + yr + "</td>" + series.map(function (se) { return "<td>" + usd(se.values[i]) + "</td>"; })
        .join("") + (series.length > 1 ? "<td><strong>" + usd(totals[i]) + "</strong></td>" : "") + "</tr>";
    }).join("");
    $("chartTable").innerHTML = "<table><thead>" + th + "</thead><tbody>" + rows + "</tbody></table>";
  }

  function showTip(i, evt) {
    if (!chartData) return;
    var tip = $("chartTip"), d = chartData, tot = 0, html = "<strong>Bills paid in " + d.years[i] + "</strong>";
    d.series.slice().reverse().forEach(function (se) {
      tot += se.values[i];
      html += '<span class="levy-tip-row cluster"><span class="levy-swatch" style="background:var(--series-' + se.idx +
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

  function render() {
    estimateCurTax();
    estimateCityTax();
    var he = num(homeEav, 0);
    var share = renter ? renterD65() / D65_EXT_2025
      : curTaxTouched ? num(curTax, 0) / D65_EXT_2025 : (DISTRICT_EAV > 0 ? he / DISTRICT_EAV : 0);
    var W = Math.max(1, Math.min(Math.round(num(opYears, 20)), 40));
    var headline = 0, total = 0, monthBase = 0, label = "Estimated cost to your household", steps = [];
    var years, series, spot = -1;

    steps.push(["A", renter ? "Your rent's share of what District 65 collects" : "Your property's share of the district",
      renter ? usd(renterD65()) + " of District 65 tax in your rent (" + usd(num(rent, 0)) + " &times; 12 &times; " +
        num(taxShare, 17) + "% &times; 41.25%) &divide; " + usd(D65_EXT_2025)
      : curTaxTouched ? usd(num(curTax, 0)) + " District 65 tax &divide; " + usd(D65_EXT_2025) + " District 65 collects in all"
        : usd(he) + " &divide; " + usd(DISTRICT_EAV) + " of total district value",
      share > 0 ? (share * 100).toFixed(4) + "%" : "0%"]);

    var termMsg = $("termMsg"), bondMsg = $("bondMsg"), opMsg = $("opMsg");
    if (mode !== "hls" && mode !== "capital") { setMsg(termMsg, ""); setMsg(bondMsg, ""); }
    if (mode !== "operating") setMsg(opMsg, "");

    if (mode === "hls" || mode === "capital") {
      capped(bondNum, bondMsg, amountCapMsg(bondNum), 0);
      capped(term, termMsg, CFG[mode].termCapMsg, 20);
      saveBond(mode);
      var b = bondEff(mode), annual = ds(b.P, b.term, b.rate);
      years = yearsFrom(b.start, b.term);
      series = seriesFor([mode], years, share);
      headline = series[0].values[0] || 0; total = headline * b.term;
      if (b.P > 0) {
        steps.push(["B", "What the district would pay each year on " + usd(b.P),
          b.term + " years at " + b.rate + "%, level payments", usd(annual)]);
        steps.push(["C", "Your share of that annual payment", usd(annual) + " &times; your share", usd(annual * share)]);
        steps.push(["D", "Interest included in the total",
          "total repaid " + usd(annual * b.term) + " &minus; borrowed " + usd(b.P),
          usd(Math.max(0, annual * b.term - b.P))]);
      }
      steps.push(["=", "Your estimated cost", "per year, on bills paid " + b.start + "–" + (b.start + b.term - 1),
        usd(headline)]);
    } else if (mode === "operating") {
      var raised = opStyle === "dollars" ? capped(opDollars, opMsg, amountCapMsg(opDollars), 0) : opRaised();
      var s0 = clampYear(num(opStart, 2029), 2029), cf = ptellInputs().cf;
      years = yearsFrom(s0, W);
      series = seriesFor(["operating"], years, share);
      headline = series[0].values[0]; total = sum(series[0].values);
      label = "Estimated cost in the first year (" + s0 + ")";
      steps.push(["B", opStyle === "dollars" ? "Additional money raised district-wide in the first year"
        : "What that rate raises district-wide",
        opStyle === "dollars" ? "as entered above"
        : "$" + num(opRate, 0).toFixed(2) + " per $100 &times; " + usd(DISTRICT_EAV) + " of district value",
        usd(raised)]);
      steps.push(["C", "Your share in " + s0, usd(raised) + " &times; your share", usd(raised * share)]);
      steps.push(["D", "Growing with the cap, by " + years[W - 1],
        (cf * 100).toFixed(1) + "% a year after it starts", usd(series[0].values[W - 1] / PT())]);
      steps.push(["=", "Your estimated cost", "in the first year, added to what you pay today", usd(headline)]);
    } else if (mode === "ptell") {
      var p = ptellInputs();
      years = yearsFrom(FIRST_BILL, W);
      series = seriesFor(["ptell"], years, share);
      headline = series[0].values[0]; total = sum(series[0].values);
      label = "Added to bills paid in 2027 by the 2026 levy";
      steps.push(["B", renter ? "District 65 tax built into your rent" : "Your current District 65 tax",
        renter ? usd(num(rent, 0)) + " &times; 12 &times; " + num(taxShare, 17) + "% &times; 41.25%"
        : curTaxTouched ? "as entered above"
        : usd(he) + " &times; the district's Tax Year 2024 rate of " + (D65_RATE * 100).toFixed(3) + "%", usd(p.T0)]);
      steps.push(["C", "Capped funds (" + Math.round(CAPPED_SHARE * 100) + "% of the tax) at the " +
        (p.c1 * 100).toFixed(1) + "% cap", usd(p.T0 * CAPPED_SHARE) + " &times; " + (p.c1 * 100).toFixed(1) + "%",
        usd(p.T0 * CAPPED_SHARE * p.c1)]);
      steps.push(["C2", "Existing bond payments (" + Math.round((1 - CAPPED_SHARE) * 100) + "% of the tax)",
        "estimated to " + (BOND_CHG_2026 < 0 ? "fall " : "rise ") + Math.abs(BOND_CHG_2026 * 100).toFixed(2) + "% on the 2026 levy",
        (BOND_CHG_2026 < 0 ? "&minus;" : "") + usd(Math.abs(p.T0 * (1 - CAPPED_SHARE) * BOND_CHG_2026))]);
      if (ptellScope === "every" && W > 1) {
        steps.push(["D", "After " + W + " years at the cap, by " + years[W - 1],
          (p.cf * 100).toFixed(1) + "% a year after 2027, compounding", usd(series[0].values[W - 1] / PT())]);
      }
      steps.push(["=", "Added in 2027", "on top of what you pay today", usd(headline)]);
    } else if (mode === "city") {
      var c = cityInputs();
      years = yearsFrom(FIRST_BILL, W);
      series = seriesFor(["city"], years, share);
      headline = series[0].values[0]; total = sum(series[0].values);
      label = "Added to your city line on bills paid in 2027";
      steps.splice(0, 1);   /* district share doesn't apply to the city line */
      steps.push(["A", renter ? "City tax built into your rent" : "Your current City of Evanston tax",
        renter ? usd(renterD65()) + " D65 part &times; " + CITY_PER_D65.toFixed(3) + " (city vs. D65 share of the bill)"
        : cityTaxTouched ? "as entered above"
        : usd(he) + " &times; the city's Tax Year 2023 rate of " + (CITY_RATE * 100).toFixed(3) + "%", usd(c.C0)]);
      steps.push(["B", "The 2027 levy increase", usd(c.C0) + " &times; " + (c.p1 * 100).toFixed(1) + "%", usd(c.C0 * c.p1)]);
      if (c.pl > 0 && W > 1) {
        steps.push(["C", "After " + W + " years, by " + years[W - 1],
          (c.pl * 100).toFixed(1) + "% a year after 2027, compounding", usd(series[0].values[W - 1] / PT())]);
      }
      steps.push(["=", "Added in 2027", "on top of what you pay the city today", usd(headline)]);
    } else {   /* stack */
      var keys = PIECES.filter(function (k) { return include[k]; });
      years = yearsFrom(FIRST_BILL, W);
      series = seriesFor(keys, years, share);
      var totals = years.map(function (_, i) { return sum(series.map(function (se) { return se.values[i]; })); });
      var peak = Math.max(0, Math.min(clampYear(num(stackYear, 2030), 2030) - FIRST_BILL, W - 1));
      spot = peak;
      headline = totals[peak] || 0; total = sum(totals);
      label = keys.length ? "Added cost in " + years[peak] + ", all selected pieces together" : "Nothing selected";
      var letters = "BCDEF";
      series.forEach(function (se, j) {
        var nz = se.values.map(function (v, i) { return v > 0 ? i : -1; }).filter(function (i) { return i >= 0; });
        var note = nz.length
          ? "bills paid " + years[nz[0]] + "–" + years[nz[nz.length - 1]] + "; " + usd(se.values[nz[0]]) +
            " in the first year"
          : "nothing in this window";
        steps.push([letters[j], NAMES[se.key] + " in " + years[peak], note, usd(se.values[peak])]);
      });
      steps.push(["=", "Everything together in " + years[peak], "added to what you pay today" +
        (peak < W - 1 ? "; by " + years[W - 1] + ", the last year shown, " + usd(totals[W - 1]) : ""), usd(headline)]);
      renderStackSummary();
    }

    if (renter) {
      steps.splice(steps.length - 1, 0, ["P", "Share your landlord passes on through rent",
        mode === "stack" ? "already applied to the amounts above" : "applied to the amount above",
        Math.round(PT() * 100) + "%"]);
      steps[steps.length - 1][1] = "Estimated added rent";
    }
    $("chartSub").textContent = renter
      ? "Estimated added rent per year, by the year the tax bill is paid, at " + Math.round(PT() * 100) + "% pass-through."
      : "Added to what you pay on your 2026 bill, by the year the bill is paid.";

    /* fixed 2027–2032 view, independent of the window and start-year settings */
    var keys32 = mode === "stack" ? PIECES.filter(function (k) { return include[k]; }) : [mode];
    var yrs32 = yearsFrom(FIRST_BILL, HORIZON - FIRST_BILL + 1);
    var tot32 = yrs32.map(function (y) {
      return sum(keys32.map(function (k) { return pieceAt(k, y, share); }));
    });
    $("by32Label").textContent = (mode === "stack" ? "All selected pieces through 2032" :
      NAMES[mode] + " through 2032") + ", the end of the district's current projections";
    $("out32Year").textContent = usd(tot32[tot32.length - 1]);
    $("out32Month").textContent = usd(tot32[tot32.length - 1] / 12);
    $("out32Total").textContent = usd(sum(tot32));

    $("resLabel").textContent = label;
    $("outYear").textContent = usd(headline);
    $("outMonth").textContent = usd(headline / 12);
    $("outTotal").textContent = usd(total);
    $("outShare").textContent = mode === "city" ? "n/a" : share > 0
      ? (share * 100).toFixed(4).replace(/0+$/, "").replace(/\.$/, "") + "%"
      : "0%";

    $("chartTitle").textContent = mode === "stack" ? "Year by year, stacked" : "Year by year";
    renderChart(years, series, spot);

    var html = "";
    steps.forEach(function (s) {
      var tot = (s[0] === "=");
      html += '<div class="step' + (tot ? " total" : "") + '">' +
        '<div class="step-n">' + s[0] + '</div>' +
        '<div class="step-label">' + s[1] + '<small class="step-note">' + s[2] + '</small></div>' +
        '<div class="step-value">' + s[3] + '</div></div>';
    });
    $("traceBody").innerHTML = html;

    document.querySelectorAll("#bondPresets [data-bond]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(parseFloat(b.dataset.bond) === num(bondNum, 0)));
    });
    document.querySelectorAll("#passPresets [data-pass]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(parseFloat(b.dataset.pass) === num(passPct, 0)));
    });
    document.querySelectorAll("#cityPresets [data-citypct]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(parseFloat(b.dataset.citypct) === num(cityPct, 0)));
    });
    document.querySelectorAll("#opPresets [data-opamt]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(parseFloat(b.dataset.opamt) === num(opDollars, 0)));
    });
    document.querySelectorAll("#scenarioPresets [data-scenario]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(scenarioMatch(b.dataset.scenario)));
    });

    /* District-wide financing costs for the two bond pieces */
    var finRows = "", finTot = { pay: 0, i1: 0, iavg: 0, itot: 0, P: 0 };
    ["hls", "capital"].forEach(function (k) {
      var fb = bondEff(k), pay = ds(fb.P, fb.term, fb.rate), itot = Math.max(0, pay * fb.term - fb.P);
      var i1 = fb.P * fb.rate / 100, iavg = fb.term ? itot / fb.term : 0;
      finTot.pay += pay; finTot.i1 += i1; finTot.iavg += iavg; finTot.itot += itot; finTot.P += fb.P;
      finRows += "<tr><td>" + NAMES[k] + (mode === "stack" && !include[k] ? " (left out above)" : "") +
        "<small class=\"step-note\">" + usdShort(fb.P) + ", " + fb.term + " years at " + fb.rate + "%, bills paid " +
        fb.start + "–" + (fb.start + fb.term - 1) + "</small></td><td>" + usd(pay) + "</td><td>" + usd(i1) +
        "</td><td>" + usd(iavg) + "</td><td>" + usd(itot) + "</td></tr>";
    });
    finRows += "<tr><td><strong>New borrowing, total</strong></td><td><strong>" + usd(finTot.pay) + "</strong></td><td><strong>" +
      usd(finTot.i1) + "</strong></td><td><strong>" + usd(finTot.iavg) + "</strong></td><td><strong>" + usd(finTot.itot) +
      "</strong></td></tr>";
    finRows += "<tr><td>Existing bonds, for scale<small class=\"step-note\">bond and interest extended on 2026 bills</small></td>" +
      "<td>" + usd(7425249) + "</td><td>not published</td><td>not published</td><td>not published</td></tr>";
    $("finTable").innerHTML = "<table><thead><tr><th>Borrowing</th><th>Annual payment</th><th>Interest, first year</th>" +
      "<th>Interest, average per year</th><th>Total interest</th></tr></thead><tbody>" + finRows + "</tbody></table>";

    /* 2017 referendum: already in today's bill (renters: already in rent) */
    var base17 = renter ? renterD65() : num(curTax, 0);
    var r17Now = base17 * REF17_SHARE;
    var pi17 = ptellInputs();
    var yC = clampYear(num(stackYear, 2030), 2030);
    var r17At = r17Now * (yC >= FIRST_BILL ? (1 + pi17.c1) * Math.pow(1 + pi17.cf, yC - FIRST_BILL) : 1);
    var newRef = (mode !== "stack" || include.operating ? pieceAt("operating", yC, share) : 0) +
                 (mode !== "stack" || include.capital ? pieceAt("capital", yC, share) : 0);
    $("r17Year").textContent = usd(r17Now);
    $("r17Month").textContent = usd(r17Now / 12);
    $("r17ComboLabel").textContent = "Referendums only: 2017 + new operating and capital, bills paid " + yC;
    $("r17Combo").textContent = usd(r17At + newRef);

    announceResult(label + ": " + usd(headline) + " per year, " + usd(headline / 12) + " per month.");
  }

  /* ---------- wiring ---------- */

  document.querySelectorAll(".choice[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.dataset.mode); });
  });
  document.querySelectorAll("#opModePresets [data-op]").forEach(function (b) {
    b.addEventListener("click", function () { setOpStyle(b.dataset.op); });
  });
  document.querySelectorAll("#stackPieces [data-piece]").forEach(function (b) {
    b.addEventListener("click", function () {
      include[b.dataset.piece] = !include[b.dataset.piece];
      b.setAttribute("aria-pressed", String(include[b.dataset.piece]));
      render();
    });
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
  document.querySelectorAll("#scenarioPresets [data-scenario]").forEach(function (b) {
    b.addEventListener("click", function () { applyScenario(b.dataset.scenario); });
  });

  document.querySelectorAll("#cityPresets [data-citypct]").forEach(function (b) {
    b.addEventListener("click", function () { cityPct.value = b.dataset.citypct; render(); });
  });
  document.querySelectorAll("#tenure [data-tenure]").forEach(function (b) {
    b.addEventListener("click", function () {
      renter = b.dataset.tenure === "rent";
      document.querySelectorAll("#tenure [data-tenure]").forEach(function (x) {
        x.setAttribute("aria-pressed", String((x.dataset.tenure === "rent") === renter));
      });
      $("renterFields").classList.toggle("hidden", !renter);
      $("ownerFields").classList.toggle("hidden", renter);
      $("cityTaxField").classList.toggle("hidden", renter);
      setMode(mode);   /* rebuilds the assumptions copy, then renders */
    });
  });
  document.querySelectorAll("#passPresets [data-pass]").forEach(function (b) {
    b.addEventListener("click", function () { passPct.value = b.dataset.pass; render(); });
  });
  cityTax.addEventListener("input", function () {
    cityTaxTouched = cityTax.value !== "";
    $("cityTaxHint").textContent = cityTaxTouched
      ? "Using the amount you entered. Clear the field to go back to the estimate from your EAV."
      : "Add the \"City of Evanston\" and \"General Assistance\" lines on your bill for the most accurate figure. " +
        "Until you enter one, this is estimated from your EAV.";
    render();
  });
  bond.addEventListener("input", function () { bondNum.value = bond.value; render(); });
  bondNum.addEventListener("input", function () { bond.value = Math.min(num(bondNum, 0), bond.max); render(); });
  opRange.addEventListener("input", function () { opDollars.value = opRange.value; render(); });
  opDollars.addEventListener("input", function () { opRange.value = Math.min(num(opDollars, 0), opRange.max); render(); });
  mktVal.addEventListener("input", function () {
    var mv = parseFloat(mktVal.value);
    if (isFinite(mv) && mv > 0) { homeEav.value = Math.round(mv * 0.30 / 1000) * 1000; render(); }
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
  [term, rate, bondStart, opRate, opStart, opYears, cpiNow, cpiFut, stackYear, cityPct, cityLater, rent, taxShare, passPct].forEach(function (el) {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  setMode("stack");
})();
