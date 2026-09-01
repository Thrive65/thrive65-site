/* Tax impact estimator (page: /tax-calculator/).
   This page requires JS: the controls have sensible HTML defaults, but the
   mode copy, the two disclosure bodies, the derivation and every result are
   rendered here, so with JS off the page shows empty panels and $0.
   All styling comes from main.css — the classes emitted here (choice, compact,
   step, step-n, step-label, step-note, step-value, total) never appear in the
   built HTML, so they are listed in the PurgeCSS safelist in postcss.config.cjs. */
(function () {
  "use strict";

  var DISTRICT_EAV = 4203686381;

  var $ = function (i) { return document.getElementById(i); };
  var mode = "hls", opStyle = "dollars";
  var homeEav = $("homeEav"), mktVal = $("mktVal"), bond = $("bond"), bondNum = $("bondNum"),
      term = $("term"), rate = $("rate"), opDollars = $("opDollars"), opRange = $("opRange"),
      opRate = $("opRate"), opYears = $("opYears");

  if (!homeEav) return;   // not on the calculator page

  function usd(n, dp) {
    if (!isFinite(n)) n = 0;
    return "$" + n.toLocaleString("en-US",
      { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 });
  }
  function num(el, f) { var v = parseFloat(el.value); return isFinite(v) && v >= 0 ? v : f; }
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
  /* Clamp-and-explain, the pattern the term field already used: the input
     keeps whatever was typed, the math uses the capped value, and a polite
     message says so. Nothing rewrites the field, so this is correct from the
     first keystroke and never waits on a blur. Returns the value to compute
     with. */
  function capped(el, msgEl, text, fallback) {
    var max = parseFloat(el.max), entered = parseFloat(el.value);
    var over = isFinite(max) && isFinite(entered) && entered > max;
    setMsg(msgEl, over ? text : "");
    return over ? max : num(el, fallback);
  }
  /* Built from the control's own max so the sentence can't drift from the cap */
  function amountCapMsg(el) {
    return "This tool caps the amount at " + usd(parseFloat(el.max)) +
           ", so the estimate below uses that.";
  }

  var CFG = {
    hls: {
      note: '<strong>No borrowing amount has been proposed.</strong> The district has not said how much it intends to ' +
        'levy or borrow for this work. This is a what-if tool so you can size the question before those numbers arrive.',
      alert: false,
      bondLabel: "Amount borrowed for safety work",
      bondHint: '$128.8 million is the full ten-year figure reported to the board in August 2026. Most of that work ' +
        'is classified as deferrable for up to a decade, so the full amount is a ceiling rather than a plan.',
      termHint: "Illinois caps these particular bonds at 20 years.",
      termMax: 20,
      termCapMsg: "Illinois caps health and life safety bonds at 20 years, so this estimate uses 20.",
      bondMax: 200e6,
      presets: [[25e6, "$25M"], [50e6, "$50M"], [100e6, "$100M"], [128.8e6, "$128.8M · full survey"]],
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
      note: '<strong>No capital referendum has been proposed.</strong> This estimates what one would cost if voters ' +
        'approved borrowing for building work that is not legally mandated.',
      alert: false,
      bondLabel: "Amount borrowed, approved by voters",
      bondHint: 'For scale, District 65 has identified about $409.6 million of facilities needs in the first ten years.',
      termHint: "Illinois caps voter-approved building bonds at 30 years. Terms of 20 to 25 years are common.",
      termMax: 30,
      termCapMsg: "Illinois caps voter-approved building bonds at 30 years, so this estimate uses 30.",
      bondMax: 410e6,
      presets: [[50e6, "$50M"], [100e6, "$100M"], [200e6, "$200M"], [409.6e6, "$409.6M · 10-yr needs"]],
      voteTitle: "How a capital referendum differs",
      vote: '<p>A capital referendum asks voters directly for permission to borrow. If it passes, the debt service ' +
        'is a recognized exception to the property tax cap, so it is added on top of the capped levy rather than ' +
        'squeezed inside it.</p>' +
        '<p>Bond money arrives within months of approval, which is why capital questions and operating questions ' +
        'move on very different timelines.</p>'
    },
    operating: {
      note: '<strong>An operating increase does not expire on its own.</strong> Unlike bonds, which end when they are ' +
        'repaid, an approved operating increase becomes part of the district\'s permanent tax base unless the ballot ' +
        'question sets an end date. District 65\'s 2017 referendum was presented as a time-limited bridge.',
      alert: true,
      voteTitle: "How an operating referendum differs",
      vote: '<p>Operating money pays salaries, programs, and the daily cost of running schools. There is no borrowing ' +
        'and no interest, so the arithmetic is simpler: the district raises a set amount each year and your share is ' +
        'your property\'s share of the district.</p>' +
        '<p>Two differences matter more than the math. First, timing. Bond proceeds arrive within months of approval, ' +
        'while operating money does not reach the district until the following tax cycle. Second, duration. Bond debt ' +
        'service ends. An operating increase becomes the new base and continues to grow afterward under the tax cap ' +
        'formula, unless the question is written with a sunset.</p>'
    }
  };

  var ASSUME_COMMON =
    '<p><strong>A fixed district value.</strong> Your share depends on the district\'s total equalized assessed value, ' +
    'which changes every year. This tool uses $4.20 billion, District 65\'s Tax Year 2024 value from its FY2025 ' +
    'audited financial report. Your 2026 tax bill reflects Evanston\'s 2025 reassessment, a newer year, so the ' +
    'district-wide total will shift once that figure is finalized.</p>' +
    '<p><strong>Your assessment stays put.</strong> If your property is reassessed, your share moves with it.</p>' +
    '<p><strong>District 65 only.</strong> This is one line on your tax bill. It excludes Evanston Township High School ' +
    'District 202, the city, the county, and every other taxing body.</p>' +
    '<p><strong>Not a prediction.</strong> Nothing here has been proposed. Actual terms would differ from whatever you entered.</p>';

  /* One polite status node for the whole tool. Results change on every
     keystroke, so announcing them live would be unusable — debounce instead. */
  var announceTimer;
  function announceResult(text) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(function () { $("resAnnounce").textContent = text; }, 800);
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll(".choice[data-mode]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.mode === m));
    });
    var c = CFG[m];
    $("modeNote").innerHTML = c.note;
    /* toggle only the stripe utility — never replace className, which would
       drop .callout itself along with any composition/utility classes */
    $("modeNote").classList.toggle("stripe-bloom", !!c.alert);
    $("voteSummary").textContent = c.voteTitle;
    $("voteBody").innerHTML = c.vote;
    $("assumeBody").innerHTML =
      (m === "operating"
        ? '<p><strong>A flat annual amount.</strong> This holds the increase constant. In practice an approved ' +
          'operating increase grows each year under the tax cap formula, so later years would run higher.</p>'
        : '<p><strong>Level debt service.</strong> Real bond schedules are rarely perfectly level, so early and late ' +
          'years may differ from the average shown.</p>') + ASSUME_COMMON;

    var borrowing = (m !== "operating");
    $("borrowBlock").classList.toggle("hidden", !borrowing);
    $("operBlock").classList.toggle("hidden", borrowing);
    $("totalKey").textContent = borrowing ? "Over the full term" : "Over the window below";

    if (borrowing) {
      $("bondLabel").textContent = c.bondLabel;
      $("bondHint").innerHTML = c.bondHint;
      $("termHint").textContent = c.termHint;
      term.max = c.termMax;
      bond.max = c.bondMax;
      /* Only the ceiling moves. The entered amount is left alone: if the new
         mode caps lower, render() clamps the math and says so, the same as
         when the number is typed. The slider mirrors the effective (capped)
         value, so the two controls always agree about what is being priced. */
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

  function render() {
    var he = num(homeEav, 0), share = DISTRICT_EAV > 0 ? he / DISTRICT_EAV : 0;
    var yearly = 0, windowYears = 0, steps = [];

    steps.push(["A", "Your property's share of the district",
      usd(he) + " &divide; " + usd(DISTRICT_EAV) + " of total district value",
      share > 0 ? (share * 100).toFixed(4) + "%" : "0%"]);

    var termMsg = $("termMsg"), bondMsg = $("bondMsg"), opMsg = $("opMsg");
    if (mode !== "operating") {
      setMsg(opMsg, "");   /* the other branch's field is hidden; clear its live region too */
      var P = capped(bondNum, bondMsg, amountCapMsg(bondNum), 0),
          yrs = Math.max(1, capped(term, termMsg, CFG[mode].termCapMsg, 20)),
          rt = num(rate, 4.5);
      var annual = ds(P, yrs, rt);
      yearly = annual * share;
      windowYears = yrs;
      if (P > 0) {
        steps.push(["B", "What the district would pay each year on " + usd(P),
          yrs + " years at " + rt + "%, level payments", usd(annual)]);
        steps.push(["C", "Your share of that annual payment",
          usd(annual) + " &times; your share", usd(yearly)]);
        steps.push(["D", "Interest included in the total",
          "total repaid " + usd(annual * yrs) + " &minus; borrowed " + usd(P),
          usd(Math.max(0, annual * yrs - P))]);
      }
    } else {
      setMsg(termMsg, ""); setMsg(bondMsg, "");
      windowYears = Math.max(1, num(opYears, 10));
      var raised;
      if (opStyle === "dollars") {
        raised = capped(opDollars, opMsg, amountCapMsg(opDollars), 0);
        steps.push(["B", "Additional money raised district-wide each year", "as entered above", usd(raised)]);
      } else {
        setMsg(opMsg, "");   /* the dollars field is hidden in rate mode */
        var rr = num(opRate, 0);
        raised = (rr / 100) * DISTRICT_EAV;
        steps.push(["B", "What that rate raises district-wide",
          "$" + rr.toFixed(2) + " per $100 &times; " + usd(DISTRICT_EAV) + " of district value", usd(raised)]);
      }
      yearly = raised * share;
      steps.push(["C", "Your share of that amount", usd(raised) + " &times; your share", usd(yearly)]);
    }

    steps.push(["=", "Your estimated cost", "per year, added to what you pay today", usd(yearly)]);

    $("outYear").textContent = usd(yearly);
    $("outMonth").textContent = usd(yearly / 12);
    $("outTotal").textContent = usd(yearly * windowYears);
    $("outShare").textContent = share > 0
      ? (share * 100).toFixed(4).replace(/0+$/, "").replace(/\.$/, "") + "%"
      : "0%";

    var html = "";
    steps.forEach(function (s) {
      var total = (s[0] === "=");
      html += '<div class="step' + (total ? " total" : "") + '">' +
        '<div class="step-n">' + s[0] + '</div>' +
        '<div class="step-label">' + s[1] + '<small class="step-note">' + s[2] + '</small></div>' +
        '<div class="step-value">' + s[3] + '</div></div>';
    });
    $("traceBody").innerHTML = html;

    document.querySelectorAll("#bondPresets [data-bond]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(parseFloat(b.dataset.bond) === num(bondNum, 0)));
    });

    announceResult("Estimated cost " + usd(yearly) + " per year, " + usd(yearly / 12) + " per month.");
  }

  document.querySelectorAll(".choice[data-mode]").forEach(function (b) {
    b.addEventListener("click", function () { setMode(b.dataset.mode); });
  });
  document.querySelectorAll("#opModePresets [data-op]").forEach(function (b) {
    b.addEventListener("click", function () { setOpStyle(b.dataset.op); });
  });

  /* The number field is the value render() reads; the slider only mirrors it.
     Nothing rewrites the number field — over-cap entries are handled by
     capped() in render(), which clamps the math and explains it. The slider
     mirrors the effective (capped) value, so the two controls always agree
     about the amount being priced, with no blur or commit step involved. */
  bond.addEventListener("input", function () { bondNum.value = bond.value; render(); });
  bondNum.addEventListener("input", function () { bond.value = Math.min(num(bondNum, 0), bond.max); render(); });
  opRange.addEventListener("input", function () { opDollars.value = opRange.value; render(); });
  opDollars.addEventListener("input", function () { opRange.value = Math.min(num(opDollars, 0), opRange.max); render(); });
  mktVal.addEventListener("input", function () {
    var mv = parseFloat(mktVal.value);
    if (isFinite(mv) && mv > 0) { homeEav.value = Math.round(mv * 0.30 / 1000) * 1000; render(); }
  });
  homeEav.addEventListener("input", function () { mktVal.value = ""; render(); });
  [term, rate, opRate, opYears].forEach(function (el) {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  setMode("hls");
})();
