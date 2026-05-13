/* ================================================================
   AGENT BITACORA
================================================================ */
function labelType(t) {
  return getCatalogLabel('activityTypes', t);
}

function labelResult(r) {
  return getCatalogLabel('activityResults', r);
}

function getActivityTypeTone(type) {
  return getCatalogSemanticKeyForValue('activityTypes', type);
}

function getActivityResultTone(result) {
  return getCatalogSemanticKeyForValue('activityResults', result);
}

function renderANFIndicator(act) {
  const nec = (act.anfNecesidades || []).length;
  const monto = (act.anfMonto || '').trim();
  const nota = (act.anfNota || '').trim();
  const summary = (act.anfSummary || '').trim();
  const tooltipParts = [];
  if (nec > 0) tooltipParts.push('Necesidades: ' + act.anfNecesidades.join(', '));
  if (monto) tooltipParts.push('Monto: ' + monto);
  if (nota) tooltipParts.push('Nota: ' + nota);
  if (summary) tooltipParts.push('Resumen: ' + summary);
  const tooltip = tooltipParts.join(' · ');
  let result = '';
  if (nec > 0) {
    result = '<span class="anf-pill has-summary" title="' + escapeHtml(tooltip) + '">✓ ' + nec + ' nec.' + (monto ? ' · $' + escapeHtml(monto) : '') + '</span>';
  } else if (summary || monto || nota) {
    result = '<span class="anf-pill has-summary" title="' + escapeHtml(tooltip) + '">✎ Resumen</span>';
  } else if (act.anfFileName) {
    result = '<span class="anf-pill has-pdf" title="' + escapeHtml(act.anfSummary || 'PDF cargado') + '">📎 PDF</span>';
  } else {
    result = '<span class="anf-pill none">—</span>';
  }
  if (act.fumador === 'no') result += ' <span class="fumador-pill no">🚭 No fuma</span>';
  if (act.fumador === 'si') result += ' <span class="fumador-pill si">🚬 Fuma</span>';
  return result;
}

function renderAgentBitacora_v5(agentId) {
  const container = document.getElementById('bitacoraContent_' + agentId);
  if (!container) return;

  let html = '';
  const grouped = groupActivitiesByProspect_v5(agentId);
  const withProspect = grouped.withProspect;
  const withoutProspect = grouped.withoutProspect;
  const allOrphans = withProspect.length === 0 && withoutProspect.length > 0;

  if (bitacoraViewMode_v5 === 'grouped' && allOrphans) {
    html += '<div class="duplicates-banner" style="margin-bottom:12px">' +
      '<div class="duplicates-banner-icon" style="color:var(--blue)">ℹ</div>' +
      '<div class="duplicates-banner-body">' +
        '<div class="duplicates-banner-title">Actividades sin nombre de prospecto</div>' +
        '<div class="duplicates-banner-text">Todas las actividades de este agente están registradas sin nombre de prospecto, o con el campo vacío. El agrupado no puede organizarlas por prospecto. Puedes verlas en lista simple o editarlas para agregar el nombre.</div>' +
        '<div class="duplicates-banner-actions">' +
          '<button class="duplicates-btn" style="border-color:var(--blue);color:var(--blue)" onclick="setBitacoraViewMode_v5(\'plain\')">Ver en lista simple</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  if (bitacoraViewMode_v5 === 'grouped' && !allOrphans) {
    const dups = detectProspectDuplicates_v5(agentId);
    const dismissed = dismissedDuplicates_v5[agentId] || [];
    const activeDups = dups.filter(g => !dismissed.includes(g.key));
    if (activeDups.length > 0) {
      html += '<div class="duplicates-banner">' +
        '<div class="duplicates-banner-icon">⚠</div>' +
        '<div class="duplicates-banner-body">' +
          '<div class="duplicates-banner-title">Posibles prospectos duplicados</div>' +
          '<div class="duplicates-banner-text">Se detectaron ' + activeDups.length + ' grupo' + (activeDups.length === 1 ? '' : 's') + ' con nombres parecidos escritos de forma distinta.</div>' +
          '<div class="duplicates-banner-actions">' +
            '<button class="duplicates-btn" onclick="openDupUnifyModal_v5(\'' + agentId + '\')">Revisar y unificar</button>' +
            '<button class="duplicates-btn dismiss" onclick="dismissAllDuplicates_v5(\'' + agentId + '\')">Ignorar por ahora</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }
  }

  if (bitacoraViewMode_v5 === 'plain') {
    html += renderAgentBitacoraPlain_v5(agentId);
  } else {
    html += renderAgentBitacoraGrouped_v5(agentId);
  }

  container.innerHTML = html;
}

function renderAgentBitacoraGrouped_v5(agentId) {
  const grouped = groupActivitiesByProspect_v5(agentId);
  const withProspect = grouped.withProspect;
  const withoutProspect = grouped.withoutProspect;

  if (withProspect.length === 0 && withoutProspect.length === 0) {
    return '<div class="prospect-card-empty" style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius)">Sin actividad. Usa "+ Nueva actividad" para empezar.</div>';
  }

  let html = '';

  if (withoutProspect.length > 0) {
    html += '<div class="prospect-group-header">Sin prospecto asignado · ' + withoutProspect.length + ' actividad' + (withoutProspect.length === 1 ? '' : 'es') + '</div>';
    const cardKey = agentId + '::__noProspect__';
    if (!(cardKey in openProspectCards_v5)) {
      openProspectCards_v5[cardKey] = true;
    }
    const isOpen = openProspectCards_v5[cardKey] === true;
    html += '<div class="prospect-card no-assigned ' + (isOpen ? 'open' : '') + '">' +
      '<div class="prospect-card-head" onclick="toggleProspectCard_v5(\'' + agentId + '\', \'__noProspect__\')">' +
        '<span class="prospect-card-chevron">▶</span>' +
        '<div class="prospect-card-main">' +
          '<div class="prospect-card-name"><span class="prospect-card-name-text">Actividades sin nombre de prospecto</span></div>' +
          '<div class="prospect-card-sub"><span class="prospect-card-sub-item">' + withoutProspect.length + ' actividades</span></div>' +
        '</div>' +
        '<div class="prospect-card-activities-count">' + withoutProspect.length + ' act.</div>' +
      '</div>' +
      '<div class="prospect-card-body">' +
        '<div class="prospect-card-activities">' +
          withoutProspect.map(renderProspectActivity_v5).join('') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  if (withProspect.length > 0) {
    if (withoutProspect.length > 0) {
      html += '<div class="prospect-group-header">Prospectos · ' + withProspect.length + '</div>';
    }
    withProspect.forEach(g => {
      const cardKey = agentId + '::' + g.key;
      if (!(cardKey in openProspectCards_v5)) openProspectCards_v5[cardKey] = true;
      const isOpen = openProspectCards_v5[cardKey] === true;
      const pct = g.progress.pct;
      const isComplete = pct === 100;
      const st = g.progress.stages;
      const onclickKey = escapeAttr(g.key);
      html += '<div class="prospect-card ' + (isOpen ? 'open' : '') + '">' +
        '<div class="prospect-card-head" onclick="toggleProspectCard_v5(\'' + agentId + '\', \'' + onclickKey + '\')">' +
          '<span class="prospect-card-chevron">▶</span>' +
          '<div class="prospect-card-main">' +
            '<div class="prospect-card-name">' +
              '<span class="prospect-card-name-text">' + escapeHtml(g.displayName) + '</span>' +
              (isComplete ? '<span class="prospect-card-badge complete">Ciclo completo</span>' : '') +
              (g.variants.length > 1 ? '<span class="prospect-card-badge" style="background:var(--amber-faint);color:var(--amber)" title="' + escapeAttr(g.variants.join(' · ')) + '">' + g.variants.length + ' variantes</span>' : '') +
            '</div>' +
            '<div class="prospect-card-sub">' +
              '<span class="prospect-card-sub-item">' + g.activities.length + ' actividad' + (g.activities.length === 1 ? '' : 'es') + '</span>' +
              (g.productoCotizado ? '<span class="prospect-card-sub-item">◆ ' + escapeHtml(g.productoCotizado) + '</span>' : '') +
              (g.montoCotizado ? '<span class="prospect-card-sub-item">$' + escapeHtml(g.montoCotizado) + '</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="prospect-stages-mini">' +
            '<div class="prospect-stage-dot' + (st.inicial ? ' done' : '') + '" title="Inicial">I</div>' +
            '<div class="prospect-stage-dot' + (st.cierre ? ' done' : '') + '" title="Cierre">C</div>' +
            '<div class="prospect-stage-dot' + (st.solicitud ? ' done' : '') + '" title="Solicitud">S</div>' +
            '<div class="prospect-stage-dot' + (st.poliza ? ' done final' : '') + '" title="Póliza">P</div>' +
          '</div>' +
          '<div class="prospect-card-progress">' +
            '<div class="prospect-progress-bar-track">' +
              '<div class="prospect-progress-bar-fill' + (isComplete ? ' complete' : '') + '" style="width:' + pct + '%"></div>' +
            '</div>' +
            '<span class="prospect-progress-pct">' + pct + '%</span>' +
          '</div>' +
        '</div>' +
        '<div class="prospect-card-body">' +
          renderProspectCardMetadata_v5(g) +
          '<div class="prospect-card-activities">' +
            g.activities.map(renderProspectActivity_v5).join('') +
          '</div>' +
        '</div>' +
      '</div>';
    });
  }

  return html;
}

function renderProspectCardMetadata_v5(g) {
  const items = [];
  if (g.productoCotizado) items.push({ label: 'Producto cotizado', value: g.productoCotizado });
  if (g.montoCotizado) items.push({ label: 'Monto', value: '$' + g.montoCotizado });
  if (g.progress.lastDate) items.push({ label: 'Última actividad', value: formatDate(g.progress.lastDate) + ' · ' + labelType(g.progress.lastType) });
  if (items.length === 0) return '';
  return '<div class="prospect-card-metadata">' +
    items.map(it =>
      '<div class="prospect-card-meta-item">' +
        '<div class="prospect-card-meta-label">' + escapeHtml(it.label) + '</div>' +
        '<div class="prospect-card-meta-value">' + escapeHtml(it.value) + '</div>' +
      '</div>'
    ).join('') +
  '</div>';
}

function renderProspectActivity_v5(act) {
  return '<div class="prospect-card-activity">' +
      '<div class="prospect-card-activity-date">' + formatDate(act.date) + '</div>' +
    '<div class="prospect-card-activity-main">' +
      '<div class="prospect-card-activity-row1">' +
        '<span class="type-pill ' + getActivityTypeTone(act.type) + '">' + labelType(act.type) + '</span>' +
        '<span class="result-pill ' + getActivityResultTone(act.result) + '">' + labelResult(act.result) + '</span>' +
        renderANFIndicator(act) +
      '</div>' +
      (act.note ? '<div class="prospect-card-activity-note">' + escapeHtml(act.note) + '</div>' : '') +
    '</div>' +
    '<div class="prospect-card-activity-actions">' +
      '<button class="icon-btn" onclick="event.stopPropagation(); editActivity(\'' + act.id + '\')" title="Editar">✎</button>' +
      '<button class="icon-btn danger" onclick="event.stopPropagation(); confirmDeleteActivity(\'' + act.id + '\')" title="Eliminar">×</button>' +
    '</div>' +
  '</div>';
}

function renderAgentBitacoraPlain_v5(agentId) {
  const acts = state.activities.filter(a => a.agent === agentId).sort((x, y) => (y.date || '').localeCompare(x.date || ''));
  if (acts.length === 0) {
    return '<div class="prospect-card-empty" style="background:white; border:1px solid var(--gray-200); border-radius:var(--radius)">Sin actividad.</div>';
  }
  return acts.map(act => {
    const nec = act.anfNecesidades || [];
    const monto = (act.anfMonto || '').trim();
    const nota = (act.anfNota || '').trim();
    const summary = (act.anfSummary || '').trim();
    const hasANF = nec.length > 0 || monto || nota || summary;
    return '<div style="background:white;border:1px solid var(--gray-200);border-radius:var(--radius-sm);padding:12px 16px;margin-bottom:8px">' +
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:' + (hasANF || act.note ? '8px' : '0') + '">' +
        '<span style="font-family:\'DM Mono\',monospace;font-size:11px;color:var(--text-muted);min-width:46px">' + formatDate(act.date) + '</span>' +
        '<span class="type-pill ' + getActivityTypeTone(act.type) + '">' + labelType(act.type) + '</span>' +
        '<span class="result-pill ' + getActivityResultTone(act.result) + '">' + labelResult(act.result) + '</span>' +
        '<strong style="font-size:13px;color:var(--navy)">' + escapeHtml(act.prospect || '(sin nombre)') + '</strong>' +
        (act.fumador === 'no' ? '<span class="fumador-pill no">🚭 No fuma</span>' : '') +
        (act.fumador === 'si' ? '<span class="fumador-pill si">🚬 Fuma</span>' : '') +
        '<div style="margin-left:auto;display:flex;gap:4px">' +
          '<button class="icon-btn" onclick="editActivity(\'' + act.id + '\')" title="Editar">✎</button>' +
          '<button class="icon-btn danger" onclick="confirmDeleteActivity(\'' + act.id + '\')" title="Eliminar">×</button>' +
        '</div>' +
      '</div>' +
      (hasANF ?
        '<div style="background:var(--teal-faint);border-radius:var(--radius-sm);padding:10px 12px;font-size:12px;color:var(--navy);display:flex;flex-wrap:wrap;gap:12px;margin-bottom:' + (act.note ? '6px' : '0') + '">' +
          (nec.length > 0 ? '<span><strong>Necesidades:</strong> ' + escapeHtml(nec.join(', ')) + '</span>' : '') +
          (monto ? '<span><strong>Monto:</strong> $' + escapeHtml(monto) + '</span>' : '') +
          (nota ? '<span><strong>Nota:</strong> ' + escapeHtml(nota) + '</span>' : '') +
          (summary ? '<div style="width:100%;margin-top:2px"><strong>ANF:</strong> ' + escapeHtml(summary) + '</div>' : '') +
        '</div>' : '') +
      (act.note ? '<div style="font-size:12px;color:var(--text-muted);padding-top:6px;border-top:1px solid var(--gray-200)">' + escapeHtml(act.note) + '</div>' : '') +
    '</div>';
  }).join('');
}

function toggleProspectCard_v5(agentId, prospectKey) {
  const cardKey = agentId + '::' + prospectKey;
  openProspectCards_v5[cardKey] = !openProspectCards_v5[cardKey];
  try { localStorage.setItem(PROSPECT_OPEN_KEY_V5, JSON.stringify(openProspectCards_v5)); } catch (error) {}
  renderAgentBitacora_v5(agentId);
}

function dismissAllDuplicates_v5(agentId) {
  const dups = detectProspectDuplicates_v5(agentId);
  dismissedDuplicates_v5[agentId] = dups.map(g => g.key);
  try { localStorage.setItem(DUP_DISMISS_KEY_V5, JSON.stringify(dismissedDuplicates_v5)); } catch (error) {}
  renderAgentBitacora_v5(agentId);
}

let dupUnifyContext_v5 = null;

function openDupUnifyModal_v5(agentId) {
  const dups = detectProspectDuplicates_v5(agentId);
  if (dups.length === 0) {
    showToast('No hay duplicados detectados');
    return;
  }
  dupUnifyContext_v5 = { agentId, groups: dups };
  const list = document.getElementById('dupList');
  list.innerHTML = dups.map((g, i) => {
    const variantCounts = {};
    g.activities.forEach(a => {
      const v = (a.prospect || '').trim();
      variantCounts[v] = (variantCounts[v] || 0) + 1;
    });
    return '<div class="dup-group">' +
      '<div class="dup-group-head">Grupo ' + (i + 1) + ' · ' + g.variants.length + ' variantes, ' + g.activities.length + ' actividades</div>' +
      '<div class="dup-group-variants">' +
        Object.entries(variantCounts).map(([name, count]) =>
          '<div class="dup-group-variant">' +
            '<span class="dup-group-variant-name">"' + escapeHtml(name) + '"</span>' +
            '<span class="dup-group-variant-count">' + count + ' actividad' + (count === 1 ? '' : 'es') + '</span>' +
          '</div>'
        ).join('') +
      '</div>' +
      '<div class="dup-group-canonical">' +
        '<label>Unificar como:</label>' +
        '<input type="text" data-group-idx="' + i + '" value="' + escapeAttr(g.displayName) + '">' +
      '</div>' +
    '</div>';
  }).join('');
  document.getElementById('dupUnifyModal').classList.add('open');
}

function closeDupUnifyModal() {
  document.getElementById('dupUnifyModal').classList.remove('open');
  dupUnifyContext_v5 = null;
}

function confirmUnifyDuplicates() {
  const ctx = dupUnifyContext_v5;
  if (!ctx) {
    closeDupUnifyModal();
    return;
  }
  const inputs = document.querySelectorAll('#dupList input[data-group-idx]');
  const updates = [];
  inputs.forEach(input => {
    const idx = parseInt(input.getAttribute('data-group-idx'), 10);
    const canonical = input.value.trim();
    if (!canonical) return;
    const group = ctx.groups[idx];
    if (!group) return;
    updates.push({ canonical, activities: group.activities });
  });
  const unifiedCount = unifyProspectActivities(updates);
  closeDupUnifyModal();
  refreshUI('all');
  showToast(unifiedCount + ' actividades unificadas');
}
