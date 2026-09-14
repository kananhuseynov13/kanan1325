'use strict';
document.querySelector('#az-lead-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const params = new URLSearchParams(location.search);
  const source = params.get('utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'Direct');
  const lines = [
    'Salam Bridge Properties, Dubayda əmlakla maraqlanıram.', '',
    `Ad: ${form.elements.name.value.trim()}`,
    `Telefon: ${form.elements.phone.value.trim()}`,
    `Məqsəd: ${form.elements.goal.value}`,
    `Büdcə: ${form.elements.budget.value}`,
    `Alış vaxtı: ${form.elements.timeframe.value}`,
    `İstəklər: ${form.elements.message.value.trim() || 'Qeyd edilməyib'}`,
    `Mənbə: ${source}`
  ];
  location.assign('https://wa.me/971561422113?text=' + encodeURIComponent(lines.join('\n')));
});
