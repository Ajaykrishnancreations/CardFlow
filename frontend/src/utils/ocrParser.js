import Tesseract from 'tesseract.js';

const GSTIN_REGEX = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b/i;
const EMAIL_REGEX = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const WEBSITE_REGEX = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9.]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
const INDIAN_PHONE_REGEX = /(?:\+91|91|0)?[\s-]?[6-9]\d{4}[\s-]?\d{5}|\+\d{1,3}[\s-]?\d{6,12}/g;
const PINCODE_REGEX = /\b(\d{6})\b/;

const COMPANY_SUFFIXES = /\b(TRADERS|TRADING|ENTERPRISES|SOLUTIONS|TECHNOLOGIES|INDUSTRIES|WORKS|SERVICES|PVT\.?\s*LTD|LTD|LLP|INC|CORP|COMPANY|CO\.)\b/i;
const DESIGNATION_WORDS = /\b(Managing Partner|Director|Manager|Partner|Founder|CEO|CTO|Proprietor|Owner|Agent|Consultant|Engineer)\b/i;

function stripScripts(text) {
  if (!text) return '';
  // Remove Tamil, Devanagari and other non-Latin scripts from Latin fields
  return text
    .replace(/[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0B80-\u0BFF\u0C00-\u0C7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizePhone(raw) {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  if (digits.startsWith('91') && digits.length === 12) {
    return { raw: `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`, e164: `+${digits}`, digits };
  }
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return { raw: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`, e164: `+91${digits}`, digits };
  }
  if (digits.length >= 7 && digits.length <= 15) {
    return { raw: raw.trim(), e164: `+${digits}`, digits };
  }
  return null;
}

function extractPhonesFromText(text) {
  const found = [];
  const blob = text.replace(/\n/g, ' ');
  const matches = blob.match(INDIAN_PHONE_REGEX) || [];
  for (const m of matches) {
    const norm = normalizePhone(m);
    if (norm && !found.some((f) => f.digits === norm.digits)) {
      found.push({ raw: norm.raw, e164: norm.e164, type: 'mobile', is_whatsapp: true, confidence: 0.95 });
    }
  }
  // Also scan for spaced digit groups: 96555 87877
  const spaced = blob.match(/\b[6-9]\d{4}\s+\d{5}\b/g) || [];
  for (const m of spaced) {
    const norm = normalizePhone(m);
    if (norm && !found.some((f) => f.digits === norm.digits)) {
      found.push({ raw: norm.raw, e164: norm.e164, type: 'mobile', is_whatsapp: true, confidence: 0.95 });
    }
  }
  return found;
}

function extractEmailsFromText(text) {
  const blob = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  const matches = blob.match(EMAIL_REGEX) || [];
  return [...new Set(matches.map((e) => e.toLowerCase().replace(/[,;:]+$/, '')))];
}

function extractWebsitesFromText(text, emails) {
  const blob = text.replace(/\n/g, ' ');
  const matches = blob.match(WEBSITE_REGEX) || [];
  const emailDomains = new Set((emails || []).map((e) => e.split('@')[1]?.toLowerCase()).filter(Boolean));
  const sites = [];
  for (const w of matches) {
    if (w.includes('@')) continue;
    const clean = w.replace(/[,;:]+$/, '');
    const lower = clean.toLowerCase();
    if (lower.includes('gmail.com') || lower.includes('yahoo.')) continue;
    const formatted = clean.startsWith('http') ? clean : `https://${clean.replace(/^www\./, 'www.')}`;
    if (!sites.includes(formatted)) sites.push(formatted);
  }
  // Derive from email domain if no website
  if (sites.length === 0 && emails?.[0]) {
    const domain = emails[0].split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain)) {
      sites.push(`https://www.${domain}`);
    }
  }
  return sites;
}

function extractGstin(text) {
  const m = text.replace(/\s/g, '').match(GSTIN_REGEX);
  return m ? m[1].toUpperCase() : '';
}

function extractAddress(lines, fullText) {
  const addrLines = [];
  for (const line of lines) {
    const clean = stripScripts(line);
    const lower = clean.toLowerCase();
    if (
      PINCODE_REGEX.test(clean) ||
      lower.includes('nagar') ||
      lower.includes('road') ||
      lower.includes('street') ||
      lower.includes('coimbatore') ||
      lower.includes('tamil nadu') ||
      lower.includes('address') ||
      /\d+[\/\\]/.test(clean)
    ) {
      const addr = clean.replace(/^(address|addr)[:\s]*/i, '').trim();
      if (addr.length > 5) addrLines.push(addr);
    }
  }
  if (addrLines.length === 0) {
    const pinMatch = fullText.match(/[\d/]+[^,\n]*(?:nagar|road|street)[^,\n]*,[^,\n]*(?:\d{6})/i);
    if (pinMatch) return stripScripts(pinMatch[0]);
  }
  return addrLines.join(', ');
}

function extractCompany(lines) {
  for (const line of lines) {
    const clean = stripScripts(line);
    if (clean.length < 3) continue;
    if (COMPANY_SUFFIXES.test(clean) || (clean === clean.toUpperCase() && clean.length >= 4 && /[A-Z]/.test(clean))) {
      if (!clean.match(EMAIL_REGEX) && !clean.match(INDIAN_PHONE_REGEX)) {
        return clean.replace(/^(since|est\.?)\s*\d{4}\s*/i, '').trim();
      }
    }
  }
  // Longest ALL CAPS line
  const caps = lines
    .map(stripScripts)
    .filter((l) => l.length >= 4 && l === l.toUpperCase() && /[A-Z]/.test(l) && !l.match(EMAIL_REGEX));
  if (caps.length) return caps.sort((a, b) => b.length - a.length)[0];
  return '';
}

function extractPersonName(lines, emails, company) {
  for (const line of lines) {
    const clean = stripScripts(line);
    if (clean.length < 3 || clean.length > 40) continue;
    if (clean.match(EMAIL_REGEX) || clean.match(INDIAN_PHONE_REGEX) || clean.match(WEBSITE_REGEX)) continue;
    if (COMPANY_SUFFIXES.test(clean) || clean === clean.toUpperCase()) continue;
    if (DESIGNATION_WORDS.test(clean)) continue;
    if (PINCODE_REGEX.test(clean) || clean.toLowerCase().includes('nagar')) continue;
    const words = clean.split(/\s+/);
    if (words.length >= 1 && words.length <= 4 && /^[A-Za-z\s.']+$/.test(clean)) {
      return clean.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }
  // From email: lipi.d.sivakumar@gmail.com -> Sivakumar
  if (emails?.[0]) {
    const local = emails[0].split('@')[0];
    const parts = local.split(/[._-]/).filter(Boolean);
    const namePart = parts.find((p) => p.length > 2 && !['lipi', 'info', 'contact', 'sales'].includes(p.toLowerCase()));
    if (namePart) {
      return namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
    }
  }
  return '';
}

function extractDesignation(lines) {
  for (const line of lines) {
    const clean = stripScripts(line);
    const m = clean.match(DESIGNATION_WORDS);
    if (m) return m[0];
  }
  return '';
}

export function parseBusinessCardText(rawText) {
  const empty = {
    person_name: '',
    designation: '',
    company: '',
    website: '',
    gstin: '',
    phones: [],
    emails: [],
    raw_address: '',
    tags: ['Business Card']
  };

  if (!rawText || typeof rawText !== 'string') return empty;

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1)
    .filter((l) => !/^(file|edit|view|bookmarks|profiles|tab|window|help)/i.test(l));

  const fullText = lines.join('\n');

  const emails = extractEmailsFromText(fullText);
  const phones = extractPhonesFromText(fullText);
  const websites = extractWebsitesFromText(fullText, emails);
  const gstin = extractGstin(fullText);
  const company = extractCompany(lines) || '';
  const person_name = extractPersonName(lines, emails, company);
  const designation = extractDesignation(lines);
  const raw_address = extractAddress(lines, fullText);

  let finalCompany = company;
  if (!finalCompany && emails[0]) {
    const domain = emails[0].split('@')[1]?.split('.')[0];
    if (domain && domain !== 'gmail') finalCompany = domain.replace(/-/g, ' ').toUpperCase();
  }

  const tags = [];
  if (finalCompany) tags.push(finalCompany);
  if (designation) tags.push(designation);
  if (tags.length === 0) tags.push('Business Card');

  return {
    person_name,
    designation,
    company: finalCompany,
    website: websites[0] || '',
    gstin,
    phones,
    emails,
    raw_address,
    tags
  };
}

/** Score how complete/trustworthy an extraction is (0–100) */
export function scoreExtraction(data) {
  if (!data) return 0;
  let score = 0;
  if (data.company && data.company.length > 3 && !/[\u0900-\u0BFF]/.test(data.company)) score += 20;
  if (data.emails?.[0]?.includes('@') && data.emails[0].includes('.')) score += 20;
  if (data.phones?.[0]?.raw?.replace(/\D/g, '').length >= 10) score += 20;
  if (data.raw_address?.length > 10) score += 15;
  if (data.person_name && data.person_name.length > 2 && /^[A-Za-z\s.']+$/.test(data.person_name)) score += 15;
  if (data.website) score += 5;
  if (data.gstin) score += 5;
  return score;
}

/** Merge two extractions, preferring cleaner / more complete fields */
export function mergeExtractions(primary, secondary) {
  if (!secondary) return primary || {};
  if (!primary) return secondary;

  const isCleanLatin = (s) => s && !/[\u0900-\u0BFF]/.test(s);

  const strScore = (s, minLen = 1) => {
    if (!s || s.length < minLen) return 0;
    let sc = Math.min(s.length, 80);
    if (isCleanLatin(s)) sc += 40;
    if (/[\u0900-\u0BFF]/.test(s)) sc -= 120;
    return sc;
  };

  const pickStr = (a, b, minLen = 1) => (strScore(b, minLen) > strScore(a, minLen) ? b : a);

  const phoneScore = (phones) => {
    const digits = phones?.[0]?.raw?.replace(/\D/g, '').length || 0;
    return digits >= 10 ? digits + 20 : digits;
  };

  const pickPhones = (a, b) => (phoneScore(b) > phoneScore(a) ? b : a);

  const emailScore = (emails) => {
    const e = emails?.[0] || '';
    if (!e.includes('@') || !e.includes('.')) return e.length;
    return e.length + 30;
  };

  const pickEmails = (a, b) => (emailScore(b) > emailScore(a) ? b : a);

  return {
    person_name: pickStr(primary.person_name, secondary.person_name, 2),
    designation: pickStr(primary.designation, secondary.designation, 2),
    company: pickStr(primary.company, secondary.company, 3),
    website: pickStr(primary.website, secondary.website, 4),
    gstin: pickStr(primary.gstin, secondary.gstin, 15),
    phones: pickPhones(primary.phones, secondary.phones),
    emails: pickEmails(primary.emails, secondary.emails),
    raw_address: pickStr(primary.raw_address, secondary.raw_address, 8),
    tags: (primary.tags?.length > 1 ? primary : secondary).tags || ['Business Card']
  };
}

export async function extractCardWithTesseract(imageSource) {
  try {
    // English-first — avoids Hindi/Tamil script garbage on English cards
    const result = await Tesseract.recognize(imageSource, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] ${(m.progress * 100).toFixed(0)}%`);
        }
      }
    });
    const text = result.data?.text || '';
    console.log('[Raw OCR Text]:\n', text);
    return parseBusinessCardText(text);
  } catch (error) {
    console.warn('[Tesseract OCR Error]:', error);
    return parseBusinessCardText('');
  }
}
