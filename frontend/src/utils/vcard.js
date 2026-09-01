export function buildVCard(card) {
  const name = card.person_name || card.personName || '';
  const company = card.company || card.company_name || '';
  const phone = card.phones?.[0]?.raw || card.phone || '';
  const email = card.emails?.[0] || card.email || '';
  const address = card.raw_address || card.rawAddress || '';
  const website = card.website || '';
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${name || company || 'CardFlow Contact'}`,
    name ? `N:${name};;;;` : '',
    company ? `ORG:${company}` : '',
    card.designation ? `TITLE:${card.designation}` : '',
    phone ? `TEL;TYPE=CELL:${phone}` : '',
    email ? `EMAIL:${email}` : '',
    address ? `ADR:;;${address};;;;` : '',
    website ? `URL:${website}` : '',
    'END:VCARD'
  ].filter(Boolean);
  return lines.join('\r\n');
}

export function buildVCardBook(cards) {
  return (cards || []).map(buildVCard).join('\r\n');
}

export function downloadTextFile(filename, contents, mime = 'text/vcard') {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
