---
layout: "page"
title: "¿Cuánto le costaría a mi hogar?"
eyebrow: "Estimador de impacto en los impuestos"
description: "Estima la parte que le corresponde a tu hogar del trabajo de seguridad del Distrito 65, un referéndum de capital o un referéndum operativo, usando el valor tasado de tu propia propiedad."
# Test page, should be hidden from search/sitemap
noindex: true      # emits <meta name="robots" content="noindex, follow"> (head.html)
sitemap: false     # omitted from sitemap.xml (jekyll-sitemap)
---

<p>Hay más de una forma en que el Distrito 65 puede recaudar dinero para edificios o para operaciones, y cada una
recae de manera distinta en tu factura de impuestos. Elige la que quieras entender y luego ingresa tus propios números.</p>

<fieldset class="field-set mt-l">
  <legend class="visually-hidden">Elige qué estimar</legend>
  <div class="choice-group">
    <button class="choice" type="button" data-mode="hls" aria-pressed="true">
      Salud y seguridad de vida
      <span class="choice-note">Reparaciones obligatorias. No se requiere referéndum.</span>
    </button>
    <button class="choice" type="button" data-mode="capital" aria-pressed="false">
      Referéndum de capital
      <span class="choice-note">Endeudamiento para edificios, aprobado por los votantes.</span>
    </button>
    <button class="choice" type="button" data-mode="operating" aria-pressed="false">
      Referéndum operativo
      <span class="choice-note">Dinero continuo para el funcionamiento de las escuelas.</span>
    </button>
  </div>
</fieldset>

<div class="callout" id="modeNote"></div>

<section class="card flow">
  <h2>Tus números</h2>
  <p class="text-deemphasized">Todo lo que aparece abajo se puede ajustar. Nada de lo que ingreses sale de tu navegador.</p>

  <div class="field">
    <label for="homeEav">El valor tasado equalizado (EAV) de tu propiedad</label>
    <div class="input-group">
      <span class="affix">$</span>
      <input id="homeEav" type="number" min="0" step="1000" value="140000" inputmode="numeric">
    </div>
    <p class="hint">En tu factura de impuestos sobre la propiedad o en el aviso de tasación del Condado de Cook. O estímalo a partir del valor de mercado más abajo.</p>
  </div>

  <div class="field">
    <label for="mktVal">O estima a partir del valor de mercado</label>
    <div class="input-group">
      <span class="affix">$</span>
      <input id="mktVal" type="number" min="0" step="10000" placeholder="p. ej. 465000" inputmode="numeric">
    </div>
    <p class="hint">El Condado de Cook tasa las viviendas al 10 % del valor de mercado, luego el estado aplica un factor de
      equalización cercano a 3.0, lo que sitúa el EAV en alrededor del 30 % del valor de mercado antes de exenciones.</p>
  </div>

  <!-- BORROWING (hls + capital) -->
  <div id="borrowBlock" class="flow">
    <fieldset class="field-set field">
      <legend id="bondLabel">Monto solicitado en préstamo</legend>
      <input id="bond" type="range" min="0" max="200000000" step="1000000" value="50000000"
             aria-label="Monto solicitado en préstamo, control deslizante">
      <div class="input-group mt-xs" style="--field-width: 16rem">
        <span class="affix">$</span>
        <input id="bondNum" type="number" min="0" max="200000000" step="1000000" value="50000000" inputmode="numeric"
               aria-label="Monto solicitado en préstamo, en dólares">
      </div>
      <p class="field-msg hidden" id="bondMsg" role="status" aria-live="polite"></p>
      <div class="choice-group compact mt-xs" id="bondPresets" role="group" aria-label="Montos predefinidos"></div>
      <p class="hint" id="bondHint"></p>
    </fieldset>

    <div class="grid-wide">
      <div class="field">
        <label for="term">Plazo de amortización</label>
        <div class="input-group">
          <input id="term" type="number" min="1" max="30" step="1" value="20" inputmode="numeric">
          <span class="affix">años</span>
        </div>
        <p class="hint" id="termHint"></p>
        <p class="field-msg hidden" id="termMsg" role="status" aria-live="polite"></p>
      </div>
      <div class="field">
        <label for="rate">Tasa de interés</label>
        <div class="input-group">
          <input id="rate" type="number" min="0" max="15" step="0.05" value="4.5" inputmode="decimal">
          <span class="affix">% / año</span>
        </div>
        <p class="hint">Del 4 % al 5 % es un rango común para el endeudamiento escolar.</p>
      </div>
    </div>
  </div>

  <!-- OPERATING -->
  <div id="operBlock" class="flow hidden">
    <fieldset class="field-set field">
      <legend>¿Cómo se describe el aumento?</legend>
      <div class="choice-group compact" id="opModePresets">
        <button class="choice compact" type="button" data-op="dollars" aria-pressed="true">Como dólares recaudados</button>
        <button class="choice compact" type="button" data-op="rate" aria-pressed="false">Como una tasa impositiva</button>
      </div>
    </fieldset>

    <div class="field" id="opDollarField">
      <label for="opDollars">Dinero adicional recaudado cada año, en todo el distrito</label>
      <input id="opRange" type="range" min="0" max="30000000" step="500000" value="10000000"
             aria-label="Dinero adicional recaudado cada año, control deslizante">
      <div class="input-group mt-xs" style="--field-width: 16rem">
        <span class="affix">$</span>
        <input id="opDollars" type="number" min="0" max="30000000" step="500000" value="10000000" inputmode="numeric">
      </div>
      <p class="field-msg hidden" id="opMsg" role="status" aria-live="polite"></p>
      <p class="hint">Las preguntas de referéndum suelen describirse de esta forma en la cobertura noticiosa y en los materiales del distrito.</p>
    </div>

    <div class="field hidden" id="opRateField">
      <label for="opRate">Aumento de la tasa</label>
      <div class="input-group">
        <input id="opRate" type="number" min="0" step="0.01" value="0.25" inputmode="decimal">
        <span class="affix">por cada $100 de EAV</span>
      </div>
      <p class="hint">Las preguntas de la boleta suelen escribirse como una tasa. Esta es la forma que aparece en la propia boleta.</p>
    </div>

    <div class="field">
      <label for="opYears">Muestra el total acumulado durante</label>
      <div class="input-group">
        <input id="opYears" type="number" min="1" max="40" step="1" value="10" inputmode="numeric">
        <span class="affix">años</span>
      </div>
      <p class="hint">Los aumentos operativos no expiran por sí solos. Esto es solo una ventana para comparar.</p>
    </div>
  </div>
</section>

<section class="card surface-feature">
  <p class="text-eyebrow" id="resLabel">Costo estimado para tu hogar</p>
  <p class="stat-value" style="--stat-step: var(--step-6)">
    <span id="outYear">$0</span><span class="stat-unit"> / año</span>
  </p>
  <div class="stat-grid fit rule-above" id="resSplit" style="--stat-step: var(--step-2)">
    <div class="stat">
      <p class="text-eyebrow">Por mes</p>
      <p class="stat-value" id="outMonth">$0</p>
    </div>
    <div class="stat">
      <p class="text-eyebrow" id="totalKey">Durante todo el plazo</p>
      <p class="stat-value" id="outTotal">$0</p>
    </div>
    <div class="stat">
      <p class="text-eyebrow">Tu parte del distrito</p>
      <p class="stat-value" id="outShare">0%</p>
    </div>
  </div>
</section>

<section class="card surface-quiet">
  <h2>Cómo se calcula ese número</h2>
  <div id="traceBody"></div>
</section>

<details class="accordion" id="detAssume">
  <summary class="cluster">
    <h2>Qué supone esta estimación</h2>
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
    <h2><span id="voteSummary">Por qué puede no requerirse una votación</span></h2>
    <span class="accordion-icon" aria-hidden="true"></span>
  </summary>
  <div class="accordion-body" id="voteBody"></div>
</details>

<p class="visually-hidden" id="resAnnounce" role="status" aria-live="polite"></p>

<hr>

<div class="text-meta text-deemphasized">
  <p><strong>Fuentes</strong></p>
  <ol>
    <li>Informe financiero anual del Distrito 65 del año fiscal 2025 (año fiscal que termina el 30 de junio de 2025), página de
      Información del Perfil Financiero, que reporta una valuación tasada equalizada del Año Fiscal 2024 de $4,203,686,381 y un
      principal de deuda a largo plazo pendiente de $99,111,300 al 30 de junio de 2025.</li>
    <li>Distrito 65, Aprobación de HLS para su presentación a ISBE, memorando de la junta (4 de agosto de 2026), que reporta $128.8&nbsp;millones
      en trabajo identificado de salud y seguridad de vida.</li>
    <li>Memorando del presupuesto preliminar del Año Fiscal 2027 del Distrito 65 (22 de junio de 2026), ingresos del impuesto a la propiedad del Fondo de Salud y Seguridad de Vida
      de $136,600.</li>
    <li>105 ILCS 5/17-2.11, autoridad de la junta escolar para imponer impuestos o emitir bonos con fines de prevención de incendios, seguridad y
      reparaciones específicas, con dichos bonos requeridos a vencer dentro de 20 años.</li>
    <li>Proyecto de Ley 4582 de la Cámara de Illinois (103.ª Asamblea General), vigente el 1 de julio de 2024, que establece un vencimiento máximo
      de 30 años para los bonos escolares aprobados por los votantes emitidos para comprar, construir o mejorar bienes inmuebles, para
      referéndums celebrados el 5 de noviembre de 2024 o después.</li>
  </ol>
  <p class="mt-s">
    Thrive65 es una coalición comunitaria independiente y no está afiliada ni es operada por el Distrito 65.
    Estas son estimaciones, no asesoría fiscal ni legal. Si encuentras un error, avísanos y lo corregiremos.
  </p>
</div>

<script src="{{ '/assets/js/tax-calculator.js' | relative_url }}" defer></script>
