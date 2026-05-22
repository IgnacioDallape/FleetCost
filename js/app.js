// ══════════════════════════════════════════════════════════
//  FleetApp — Calculadora + Unidades
//  localStorage key compartida con Flujo: fleetcost_unidades
// ══════════════════════════════════════════════════════════

const UNITS_KEY = 'fleetcost_unidades';
const COLORS = ['#3B7DD8', '#D4820A', '#2BB89A', '#E05A2B', '#8B5CF6'];

function fmtN(n) { return Math.round(n).toLocaleString('es-AR'); }
function fmtM(n) { return '$ ' + fmtN(n); }

// ── GLOBALS ───────────────────────────────────────────────
let _totalKmG   = 0;
let _combustKmG = 0;
let _indKmG     = 0;
let _choferKmG  = 0;
let _hasRetorno = false;
let _fcPieChart = null;
let _costosBaseOpen = false;

// ── TABS ──────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('panel-calculadora').style.display = tab === 'calculadora' ? '' : 'none';
  document.getElementById('panel-unidades').style.display   = tab === 'unidades'    ? '' : 'none';
  document.getElementById('tab-calculadora').classList.toggle('active', tab === 'calculadora');
  document.getElementById('tab-unidades').classList.toggle('active',   tab === 'unidades');
  if (tab === 'unidades') renderUnidades();
}

// ── CALCULAR COSTOS BASE ──────────────────────────────────
function calcular() {
  const km = parseFloat(document.getElementById('km').value) || 0;
  const rubros = [
    { nombre: 'Seguro',           val: parseFloat(document.getElementById('seguro').value) || 0 },
    { nombre: 'Patente/Impuest.', val: parseFloat(document.getElementById('patente').value) || 0 },
    { nombre: 'Mantenimiento',    val: parseFloat(document.getElementById('manto').value) || 0 },
    { nombre: 'Aceite',           val: parseFloat(document.getElementById('aceite').value) || 0 },
    { nombre: 'Cubiertas',        val: parseFloat(document.getElementById('cubiertas').value) || 0 },
  ];
  const total = rubros.reduce((s, r) => s + r.val, 0);
  const anual = total * 12;
  const indKm = km > 0 ? total / km : null;
  const max = Math.max(...rubros.map(r => r.val), 1);

  document.getElementById('r-mensual').textContent = fmtN(total);
  document.getElementById('r-mensual-sub').textContent =
    total > 0
      ? `${rubros.filter(r => r.val > 0).length} rubros activos · anual ${fmtM(anual)}`
      : 'ingresá los valores para calcular';
  document.getElementById('r-anual').textContent = fmtM(anual);

  if (indKm !== null) {
    document.getElementById('r-km').textContent = fmtM(indKm);
    document.getElementById('r-km-sub').textContent = fmtN(km) + ' km / mes';
  } else {
    document.getElementById('r-km').textContent = '—';
    document.getElementById('r-km-sub').textContent = 'ingresá los km';
  }

  document.getElementById('r-total-rubros').textContent = fmtM(total);
  document.getElementById('breakdown-list').innerHTML = rubros.map((r, i) => {
    const pct = total > 0 ? Math.round(r.val / total * 100) : 0;
    const w   = Math.round(r.val / max * 100);
    return `<div class="b-row">
      <div class="b-pip" style="background:${COLORS[i]};"></div>
      <div class="b-name">${r.nombre}</div>
      <div class="b-bar-wrap"><div class="b-bar-fill" style="width:${w}%;background:${COLORS[i]};opacity:.7;"></div></div>
      <div class="b-pct">${pct}%</div>
      <div class="b-amt">${fmtM(r.val)}</div>
    </div>`;
  }).join('');

  const choferKm  = parseFloat(document.getElementById('chofer-km').value) || 0;
  const precioL   = parseFloat(document.getElementById('precio-litro').value) || 0;
  const rend      = parseFloat(document.getElementById('rendimiento').value) || 0;
  const combustKm = rend > 0 ? precioL / rend : 0;

  document.getElementById('r-chofer').textContent          = choferKm  > 0 ? fmtM(choferKm)  : '—';
  document.getElementById('r-chofer-sub').textContent      = choferKm  > 0 ? 'por km recorrido' : 'ingresá la tarifa';
  document.getElementById('r-combustible').textContent     = combustKm > 0 ? fmtM(combustKm) : '—';
  document.getElementById('r-combustible-sub').textContent = combustKm > 0 ? rend.toFixed(1) + ' km / litro' : 'ingresá precio y rendimiento';

  const totalKm = (indKm || 0) + choferKm + combustKm;
  _totalKmG   = totalKm;
  _combustKmG = combustKm;
  _choferKmG  = choferKm;
  _indKmG     = indKm || 0;

  if (km > 0 && totalKm > 0) {
    document.getElementById('r-total-km').textContent = fmtN(totalKm);
    document.getElementById('r-total-rows').innerHTML = [
      { label: 'Costos indirectos / km', val: indKm,     color: '#3B7DD8' },
      { label: 'Chofer / km',            val: choferKm,  color: '#2BB89A' },
      { label: 'Combustible / km',       val: combustKm, color: '#D4820A' },
    ].map(row => `<div class="t-row">
      <span class="t-row-label" style="color:${row.color};"><span class="t-pip" style="background:${row.color};"></span>${row.label}</span>
      <span class="t-row-val">${row.val > 0 ? fmtM(row.val) : '—'}</span>
    </div>`).join('');
  } else {
    document.getElementById('r-total-km').textContent = '—';
    document.getElementById('r-total-rows').innerHTML =
      '<div class="t-row"><span class="t-row-label" style="color:var(--muted);">Completá todos los datos para ver el total</span></div>';
  }

  const cbInd  = document.getElementById('cb-ind');
  const cbChof = document.getElementById('cb-chof');
  const cbComb = document.getElementById('cb-comb');
  const cbTot  = document.getElementById('cb-total');
  if (cbInd)  cbInd.textContent  = indKm    > 0 ? '$ ' + fmtN(indKm)    : '—';
  if (cbChof) cbChof.textContent = choferKm > 0 ? '$ ' + fmtN(choferKm) : '—';
  if (cbComb) cbComb.textContent = combustKm > 0 ? '$ ' + fmtN(combustKm) : '—';
  if (cbTot)  cbTot.textContent  = totalKm  > 0 ? '$ ' + fmtN(totalKm)  : '—';

  calcularViaje();
}

// ── PIE CHART ─────────────────────────────────────────────
function updatePieChart(slices, margen) {
  const canvas = document.getElementById('fc-pie-chart');
  const center = document.getElementById('fc-pie-center');
  const legend = document.getElementById('fc-pie-legend');
  if (!canvas || typeof Chart === 'undefined') return;

  const active = slices.filter(s => s.value > 0);
  if (!active.length) return;

  if (_fcPieChart) { _fcPieChart.destroy(); _fcPieChart = null; }

  _fcPieChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: active.map(s => s.label),
      datasets: [{
        data: active.map(s => s.value),
        backgroundColor: active.map(s => s.color),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 6
      }]
    },
    options: {
      cutout: '64%',
      responsive: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          bodyFont: { family: 'Outfit', size: 12 },
          callbacks: {
            label: function(ctx) {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (ctx.parsed / total * 100).toFixed(1) : 0;
              return `  ${fmtM(ctx.parsed)}  (${pct}%)`;
            }
          }
        }
      },
      animation: { duration: 350 }
    }
  });

  const mColor = margen >= 30 ? '#059669' : margen >= 15 ? '#D97706' : '#DC2626';
  if (center) {
    center.innerHTML = `
      <div style="font-size:19px;font-weight:700;color:${mColor};line-height:1;">${margen.toFixed(1)}%</div>
      <div style="font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.07em;margin-top:3px;">margen</div>
    `;
  }

  const total = active.reduce((a, s) => a + s.value, 0);
  if (legend) {
    legend.innerHTML = active.map(s => {
      const pct = total > 0 ? Math.round(s.value / total * 100) : 0;
      return `<div class="fc-leg-item">
        <div class="fc-leg-pip" style="background:${s.color};"></div>
        <span class="fc-leg-name">${s.label}</span>
        <span class="fc-leg-pct">${pct}%</span>
      </div>`;
    }).join('');
  }
}

// ── RETORNO ───────────────────────────────────────────────
function toggleRetorno() {
  _hasRetorno = !_hasRetorno;
  const check  = document.getElementById('rt-check');
  const icon   = document.getElementById('rt-check-icon');
  const fields = document.getElementById('retorno-fields');
  check.style.background  = _hasRetorno ? 'var(--accent)' : '';
  check.style.borderColor = _hasRetorno ? 'var(--accent)' : '';
  icon.style.display  = _hasRetorno ? 'block' : 'none';
  fields.style.display = _hasRetorno ? 'block' : 'none';
  calcularViaje();
}

// ── CALCULAR VIAJE ────────────────────────────────────────
function calcularViaje() {
  const facturado      = parseFloat(document.getElementById('v-facturado').value) || 0;
  const vkm            = parseFloat(document.getElementById('v-km').value) || 0;
  const peajes         = parseFloat(document.getElementById('v-peajes').value) || 0;
  const litros         = parseFloat(document.getElementById('v-litros').value) || 0;
  const choferPago     = parseFloat(document.getElementById('v-chofer-pago').value) || 0;
  const precioL        = parseFloat(document.getElementById('precio-litro').value) || 0;
  const rendTeo        = parseFloat(document.getElementById('rendimiento').value) || 0;
  const retornoMonto   = _hasRetorno ? (parseFloat(document.getElementById('v-retorno-monto').value) || 0) : 0;
  const retornoKm      = _hasRetorno ? (parseFloat(document.getElementById('v-retorno-km').value) || 0) : 0;
  const totalKm        = vkm + retornoKm;
  const totalFacturado = facturado + retornoMonto;

  const elA       = document.getElementById('trip-result-a');
  const elB       = document.getElementById('trip-result-b');
  const emptyRow  = document.getElementById('trip-empty-row');
  const resultRow = document.getElementById('trip-result-row');

  if (facturado === 0 && vkm === 0 && peajes === 0 && litros === 0 && choferPago === 0) {
    if (emptyRow)  emptyRow.style.display  = 'flex';
    if (resultRow) resultRow.style.display = 'none';
    if (elA) elA.innerHTML = '';
    if (elB) { elB.style.display = 'none'; elB.innerHTML = ''; }
    if (_fcPieChart) { _fcPieChart.destroy(); _fcPieChart = null; }
    return;
  }

  if (emptyRow)  emptyRow.style.display  = 'none';
  if (resultRow) resultRow.style.display = 'grid';
  if (elB) elB.style.display = 'block';

  const costoLitros  = litros > 0 ? litros * precioL : null;
  const costoCombust = costoLitros !== null ? costoLitros : _combustKmG * totalKm;
  const choferCosto  = choferPago > 0 ? choferPago : _choferKmG * totalKm;
  const costoViaje   = _indKmG * totalKm + costoCombust + peajes + choferCosto;
  const ganancia     = totalFacturado - costoViaje;
  const margen       = totalFacturado > 0 ? ganancia / totalFacturado * 100 : 0;
  const isPos        = ganancia >= 0;

  const mColor = margen >= 30 ? '#059669' : margen >= 15 ? '#D97706' : '#DC2626';
  const mLabel = margen >= 30 ? 'Excelente' : margen >= 15 ? 'Aceptable' : 'Bajo';
  const mHint  = margen >= 30 ? 'Muy buen resultado para este viaje' : margen >= 15 ? 'Margen aceptable — revisá costos' : 'Margen bajo — considerá ajustar el precio';
  const barW   = Math.min(Math.abs(margen), 50) * 2;

  const litrosTeo  = (rendTeo > 0 && totalKm > 0) ? totalKm / rendTeo : null;
  const difLitros  = (litros > 0 && litrosTeo !== null) ? litros - litrosTeo : null;
  const isAlto     = difLitros !== null && difLitros > litrosTeo * 0.1;
  const costoExtra = (difLitros !== null && difLitros > 0 && precioL > 0) ? difLitros * precioL : 0;

  elA.innerHTML = `
    <div class="gh-card ${isPos ? 'pos' : 'neg'}">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;">
        <div class="gh-tag">${isPos ? 'ganancia neta' : 'pérdida neta'}</div>
        <div style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:20px;background:${mColor}18;color:${mColor};border:1px solid ${mColor}30;white-space:nowrap;">${margen.toFixed(1)}%</div>
      </div>
      <div class="gh-value">${isPos ? '' : '−'}${fmtM(Math.abs(ganancia))}</div>
      <div class="gh-sub">${fmtM(totalFacturado)} facturado${totalKm > 0 ? ' · ' + totalKm.toLocaleString('es-AR') + ' km' : ''}${_hasRetorno ? ' (ida + retorno)' : ''}</div>
    </div>

    ${_hasRetorno ? `
    <div class="trip-split">
      <div class="ts-item">
        <div class="ts-label">Ida</div>
        <div class="ts-value">${fmtM(facturado)}</div>
        <div class="ts-sub">${vkm.toLocaleString('es-AR')} km</div>
      </div>
      <div class="ts-arrow">→</div>
      <div class="ts-item">
        <div class="ts-label">Retorno</div>
        <div class="ts-value">${fmtM(retornoMonto)}</div>
        <div class="ts-sub">${(retornoKm||0).toLocaleString('es-AR')} km</div>
      </div>
    </div>` : ''}

    <div class="trip-metrics">
      <div class="tm-card">
        <div class="tm-tag">Costo total</div>
        <div class="tm-val">${fmtM(costoViaje)}</div>
        <div class="tm-sub">${totalKm > 0 ? totalKm.toLocaleString('es-AR') + ' km' : 'sin km'}</div>
      </div>
      <div class="tm-card">
        <div class="tm-tag">Costo / km</div>
        <div class="tm-val">${_totalKmG > 0 ? fmtM(_totalKmG) : '—'}</div>
        <div class="tm-sub">todos los rubros</div>
      </div>
    </div>

    <div style="padding:14px 16px;border-radius:var(--r-sm);background:var(--bg3);border:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);">Rentabilidad</div>
        <div style="display:flex;align-items:baseline;gap:7px;">
          <span style="font-size:22px;font-weight:700;color:${mColor};line-height:1;">${margen.toFixed(1)}%</span>
          <span style="font-size:11px;font-weight:600;color:${mColor};">${mLabel}</span>
        </div>
      </div>
      <div style="height:8px;border-radius:4px;background:var(--border2);overflow:hidden;">
        <div style="height:100%;width:${barW}%;background:${mColor};border-radius:4px;transition:width .4s ease;"></div>
      </div>
      <div style="margin-top:7px;font-size:11px;color:var(--muted);">${mHint}</div>
    </div>
  `;

  updatePieChart([
    { label: 'Costos indirectos', value: _indKmG * totalKm,    color: '#3B7DD8' },
    { label: 'Chofer',            value: choferCosto,           color: '#2BB89A' },
    { label: 'Combustible',       value: costoCombust,          color: '#D4820A' },
    { label: 'Peajes',            value: peajes,                color: '#8B5CF6' },
    { label: 'Ganancia',          value: Math.max(0, ganancia), color: '#ad8b32' },
  ], margen);

  const desgloseItems = [
    { label: 'Costos indirectos', value: _indKmG * totalKm, color: '#3B7DD8',
      note: (totalKm > 0 && _indKmG > 0) ? `${totalKm.toLocaleString('es-AR')} km × ${fmtM(_indKmG)}/km` : '' },
    { label: `Chofer${choferPago > 0 ? ' — pago real' : ''}`, value: choferCosto, color: '#2BB89A',
      note: choferPago > 0 ? 'pago real del viaje' : `${totalKm.toLocaleString('es-AR')} km × ${fmtM(_choferKmG)}/km` },
    { label: `Combustible${costoLitros !== null ? ' — real' : ' — teórico'}`, value: costoCombust, color: '#D4820A',
      note: costoLitros !== null ? `${litros} L × ${fmtM(precioL)}/L` : `${totalKm.toLocaleString('es-AR')} km × ${fmtM(_combustKmG)}/km` },
    { label: 'Peajes', value: peajes, color: '#8B5CF6', note: 'costo real' },
  ].filter(d => d.value > 0);

  const maxCosto = Math.max(...desgloseItems.map(d => d.value), 1);

  elB.innerHTML = `
    <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:14px;">Desglose de costos</div>
    <div class="trip-desglose">
      <div class="td-head"><span>Concepto</span><span>Monto</span></div>
      ${desgloseItems.map(d => {
        const pct  = costoViaje > 0 ? Math.round(d.value / costoViaje * 100) : 0;
        const barW = Math.round(d.value / maxCosto * 100);
        return `<div class="td-row">
          <div style="display:flex;align-items:center;gap:9px;flex:1;min-width:0;">
            <span class="td-pip" style="background:${d.color};"></span>
            <div style="min-width:0;flex:1;">
              <div style="font-size:12px;font-weight:600;color:var(--text2);">${d.label}</div>
              ${d.note ? `<div style="font-size:10px;color:var(--muted);margin-top:1px;">${d.note}</div>` : ''}
              <div style="margin-top:5px;height:3px;border-radius:2px;background:var(--bg4);overflow:hidden;max-width:140px;">
                <div style="height:100%;width:${barW}%;background:${d.color};opacity:.65;border-radius:2px;transition:width .4s;"></div>
              </div>
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;padding-left:12px;">
            <div class="td-val">${fmtM(d.value)}</div>
            <div style="font-size:10px;color:var(--muted);">${pct}% del costo</div>
          </div>
        </div>`;
      }).join('')}
      <div class="td-total">
        <span class="td-total-label">Total costos</span>
        <span class="td-total-val">${fmtM(costoViaje)}</span>
      </div>
    </div>

    <div style="margin-top:14px;padding:13px 16px;border-radius:var(--r-sm);background:${isPos ? '#05966908' : '#DC262608'};border:1px solid ${isPos ? '#05966920' : '#DC262620'};">
      <div style="font-size:10px;color:${isPos ? 'var(--green)' : 'var(--red)'};letter-spacing:.1em;text-transform:uppercase;margin-bottom:7px;">Resultado</div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;">
        <span style="font-size:12px;color:var(--muted2);">${fmtM(totalFacturado)} facturado − ${fmtM(costoViaje)} costos</span>
        <span style="font-size:18px;font-weight:700;color:${isPos ? 'var(--green)' : 'var(--red)'};">${isPos ? '+' : '−'}${fmtM(Math.abs(ganancia))}</span>
      </div>
    </div>

    ${costoViaje > 0 ? `
    <div style="margin-top:16px;">
      <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:10px;">Precio mínimo sugerido</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        <div class="tm-card" style="border-top:2px solid #9CA3AF;">
          <div class="tm-tag">Break-even</div>
          <div class="tm-val" style="font-size:13px;">${fmtM(costoViaje)}</div>
          <div class="tm-sub">0% — sin ganancia</div>
        </div>
        <div class="tm-card" style="border-top:2px solid var(--amber);">
          <div class="tm-tag">+20% margen</div>
          <div class="tm-val" style="font-size:13px;color:var(--amber);">${fmtM(costoViaje / 0.80)}</div>
          <div class="tm-sub">recomendado</div>
        </div>
        <div class="tm-card" style="border-top:2px solid var(--green);">
          <div class="tm-tag">+30% margen</div>
          <div class="tm-val" style="font-size:13px;color:var(--green);">${fmtM(costoViaje / 0.70)}</div>
          <div class="tm-sub">óptimo</div>
        </div>
      </div>
    </div>` : ''}

    ${litros > 0 ? `
    <div style="margin-top:16px;">
      <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
        <span>Control de combustible</span>
        ${difLitros !== null ? `<span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${isAlto ? 'var(--red-dim)' : 'var(--green-dim)'};color:${isAlto ? 'var(--red)' : 'var(--green)'};border:1px solid ${isAlto ? '#FECACA' : '#A7F3D0'};">${isAlto ? '⚠ Consumo elevado' : '✓ Consumo normal'}</span>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(${litrosTeo !== null ? 3 : 2},1fr);gap:8px;">
        <div class="tm-card">
          <div class="tm-tag">Litros cargados</div>
          <div class="tm-val ${difLitros !== null && isAlto ? 'alto' : difLitros !== null ? 'ok' : ''}">${litros} L</div>
          <div class="tm-sub">real del viaje</div>
        </div>
        ${litrosTeo !== null ? `
        <div class="tm-card">
          <div class="tm-tag">Litros esperados</div>
          <div class="tm-val">${litrosTeo.toFixed(1)} L</div>
          <div class="tm-sub">a ${rendTeo} km/L · ${totalKm} km</div>
        </div>` : ''}
        ${difLitros !== null ? `
        <div class="tm-card">
          <div class="tm-tag">Diferencia</div>
          <div class="tm-val ${isAlto ? 'alto' : 'ok'}">${difLitros > 0 ? '+' : ''}${difLitros.toFixed(1)} L</div>
          <div class="tm-sub">${difLitros > 0 ? 'más de lo esperado' : difLitros < 0 ? 'menos de lo esperado' : 'exacto'}</div>
          ${costoExtra > 0 ? `<div style="margin-top:6px;padding:5px 8px;border-radius:6px;background:var(--red-dim);border:1px solid #FECACA;font-size:10px;color:var(--red);">costo extra: ${fmtM(costoExtra)}</div>` : ''}
        </div>` : ''}
      </div>
    </div>` : ''}
  `;
}

// ── LIMPIAR VIAJE ─────────────────────────────────────────
function limpiarViaje() {
  ['v-facturado','v-km','v-peajes','v-litros','v-chofer-pago'].forEach(id => {
    document.getElementById(id).value = 0;
  });
  document.getElementById('v-desc').value = '';
  if (_hasRetorno) {
    document.getElementById('v-retorno-monto').value = 0;
    document.getElementById('v-retorno-km').value = 0;
    document.getElementById('v-retorno-cliente').value = '';
    toggleRetorno();
  }
  calcularViaje();
}

// ── COSTOS BASE TOGGLE ────────────────────────────────────
function toggleCostosBase() {
  _costosBaseOpen = !_costosBaseOpen;
  const panel = document.getElementById('costos-base-panel');
  const chev  = document.getElementById('cb-chev');
  const label = document.getElementById('cb-config-label');
  if (panel) panel.style.display = _costosBaseOpen ? 'block' : 'none';
  if (chev)  chev.classList.toggle('open', _costosBaseOpen);
  if (label) label.textContent = _costosBaseOpen ? 'Ocultar' : 'Costos base';
}

// ── UNIT SELECTOR ─────────────────────────────────────────
function loadUnitsFC() {
  try { return JSON.parse(localStorage.getItem(UNITS_KEY) || '[]'); }
  catch(e) { return []; }
}

function populateUnitSelector() {
  const units = loadUnitsFC();
  const wrap  = document.getElementById('unit-selector-wrap');
  const sel   = document.getElementById('unit-select');
  const panel = document.getElementById('costos-base-panel');
  if (!wrap || !sel) return;
  if (units.length === 0) {
    wrap.style.display = 'none';
    if (panel) { panel.style.display = 'block'; _costosBaseOpen = true; }
    return;
  }
  wrap.style.display = 'flex';
  sel.innerHTML = '<option value="">— seleccioná un camión —</option>' +
    units.map(u => `<option value="${u.id}">${u.nombre}</option>`).join('');
  if (panel) { panel.style.display = 'none'; _costosBaseOpen = false; }
}

function selectUnit(id) {
  if (!id) return;
  const u = loadUnitsFC().find(x => String(x.id) === String(id));
  if (!u) return;
  if (u.kmBase)      document.getElementById('km').value           = u.kmBase;
  if (u.seguro)      document.getElementById('seguro').value       = u.seguro;
  if (u.patente)     document.getElementById('patente').value      = u.patente;
  if (u.manto)       document.getElementById('manto').value        = u.manto;
  if (u.aceite)      document.getElementById('aceite').value       = u.aceite;
  if (u.cubiertas)   document.getElementById('cubiertas').value    = u.cubiertas;
  if (u.choferKm)    document.getElementById('chofer-km').value    = u.choferKm;
  if (u.precioLitro) document.getElementById('precio-litro').value = u.precioLitro;
  if (u.rendimiento) document.getElementById('rendimiento').value  = u.rendimiento;
  calcular();
}

// ── UNIDADES CRUD ─────────────────────────────────────────
function loadUnits() {
  try { return JSON.parse(localStorage.getItem(UNITS_KEY) || '[]'); }
  catch(e) { return []; }
}

function saveUnits(units) {
  localStorage.setItem(UNITS_KEY, JSON.stringify(units));
}

function renderUnidades() {
  const units = loadUnits();
  const container = document.getElementById('unidades-list');
  if (!container) return;
  if (units.length === 0) {
    container.innerHTML = `<div class="units-empty">No hay unidades. Agregá tu primer camión con el botón de arriba.</div>`;
    return;
  }
  container.innerHTML = units.map(u => `
    <div class="unit-card">
      <div class="unit-card-head">
        <div>
          <div class="unit-name">${u.nombre}</div>
          <div class="unit-meta">
            ${u.kmBase      ? `<span>${u.kmBase.toLocaleString('es-AR')} km/mes</span>` : ''}
            ${u.rendimiento ? `<span>· ${u.rendimiento} km/L</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="unit-btn-edit" onclick="openEditUnit(${u.id})">Editar</button>
          <button class="unit-btn-del"  onclick="deleteUnit(${u.id})">✕</button>
        </div>
      </div>
      <div class="unit-costs">
        <div class="uc-row"><span>Seguro</span><span>${fmtM(u.seguro||0)}</span></div>
        <div class="uc-row"><span>Patente</span><span>${fmtM(u.patente||0)}</span></div>
        <div class="uc-row"><span>Mantenimiento</span><span>${fmtM(u.manto||0)}</span></div>
        <div class="uc-row"><span>Aceite</span><span>${fmtM(u.aceite||0)}</span></div>
        <div class="uc-row"><span>Cubiertas</span><span>${fmtM(u.cubiertas||0)}</span></div>
        <div class="uc-row"><span>Chofer / km</span><span>${fmtM(u.choferKm||0)}</span></div>
        <div class="uc-row"><span>Precio litro</span><span>${fmtM(u.precioLitro||0)}</span></div>
      </div>
    </div>`).join('');
}

function openAddUnit() {
  document.getElementById('unit-form-title').textContent = 'Nueva unidad';
  document.getElementById('unit-edit-id').value = '';
  ['unit-f-nombre','unit-f-seguro','unit-f-patente','unit-f-manto','unit-f-aceite',
   'unit-f-cubiertas','unit-f-km','unit-f-chofer','unit-f-litro','unit-f-rend'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('unit-form-wrap').style.display = 'block';
  document.getElementById('unit-f-nombre').focus();
}

function openEditUnit(id) {
  const u = loadUnits().find(x => x.id === id);
  if (!u) return;
  document.getElementById('unit-form-title').textContent    = 'Editar unidad';
  document.getElementById('unit-edit-id').value             = id;
  document.getElementById('unit-f-nombre').value            = u.nombre      || '';
  document.getElementById('unit-f-seguro').value            = u.seguro      || '';
  document.getElementById('unit-f-patente').value           = u.patente     || '';
  document.getElementById('unit-f-manto').value             = u.manto       || '';
  document.getElementById('unit-f-aceite').value            = u.aceite      || '';
  document.getElementById('unit-f-cubiertas').value         = u.cubiertas   || '';
  document.getElementById('unit-f-km').value                = u.kmBase      || '';
  document.getElementById('unit-f-chofer').value            = u.choferKm    || '';
  document.getElementById('unit-f-litro').value             = u.precioLitro || '';
  document.getElementById('unit-f-rend').value              = u.rendimiento  || '';
  document.getElementById('unit-form-wrap').style.display   = 'block';
  document.getElementById('unit-f-nombre').focus();
}

function saveUnit() {
  const nombre = document.getElementById('unit-f-nombre').value.trim();
  if (!nombre) { alert('Ingresá el nombre de la unidad'); return; }
  const editId = parseInt(document.getElementById('unit-edit-id').value);
  const unit = {
    id:          editId || Date.now(),
    nombre,
    seguro:      parseFloat(document.getElementById('unit-f-seguro').value)    || 0,
    patente:     parseFloat(document.getElementById('unit-f-patente').value)   || 0,
    manto:       parseFloat(document.getElementById('unit-f-manto').value)     || 0,
    aceite:      parseFloat(document.getElementById('unit-f-aceite').value)    || 0,
    cubiertas:   parseFloat(document.getElementById('unit-f-cubiertas').value) || 0,
    kmBase:      parseFloat(document.getElementById('unit-f-km').value)        || 0,
    choferKm:    parseFloat(document.getElementById('unit-f-chofer').value)    || 0,
    precioLitro: parseFloat(document.getElementById('unit-f-litro').value)     || 0,
    rendimiento: parseFloat(document.getElementById('unit-f-rend').value)      || 0,
  };
  let units = loadUnits();
  if (editId) {
    units = units.map(u => u.id === editId ? unit : u);
  } else {
    units.push(unit);
  }
  saveUnits(units);
  document.getElementById('unit-form-wrap').style.display = 'none';
  renderUnidades();
  populateUnitSelector(); // actualizar selector de la calculadora
}

function cancelUnit() {
  document.getElementById('unit-form-wrap').style.display = 'none';
}

function deleteUnit(id) {
  if (!confirm('¿Eliminar esta unidad?')) return;
  saveUnits(loadUnits().filter(u => u.id !== id));
  renderUnidades();
  populateUnitSelector();
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('footer-date').textContent =
    new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  populateUnitSelector();
  calcular();
});
