/* ================================================================
   UI HELPERS
================================================================ */
function showToast(msg, type) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show ' + (type || 'success');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso + 'T00:00:00');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return date.getDate() + ' ' + months[date.getMonth()];
}

function formatDateWithYear(iso) {
  if (!iso) return '—';
  const date = new Date(iso + 'T00:00:00');
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}

function formatCurrency(value, currencyCode) {
  const amount = Number(value || 0);
  const prefix = currencyCode ? ' ' + currencyCode : '';
  return '$' + amount.toLocaleString('es-MX') + prefix;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(value) {
  return String(value || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function buildOptionsHtml(options, selectedValue) {
  return (options || []).map(option =>
    '<option value="' + escapeAttr(option.value) + '"' + (option.value === selectedValue ? ' selected' : '') + '>' +
      escapeHtml(option.label || option.value) +
    '</option>'
  ).join('');
}
