import Tesseract from 'tesseract.js';

const GSTIN_REGEX = /\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b/i;
const EMAIL_REGEX = /[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const WEBSITE_REGEX = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9.]{0,60}\.[a-zA-Z]{2,}(?:\/[^\s]*)?/gi;
const INDIAN_PHONE_REGEX = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;
const PINCODE_REGEX = /\b([1-9]\d{5})\b/;

// Devanagari (Hindi) and Tamil Unicode blocks \u2014 the two regional scripts
// CardFlow advertises OCR support for, alongside English/Latin.
const DEVANAGARI_RANGE = '\\u0900-\\u097F';
const TAMIL_RANGE = '\\u0B80-\\u0BFF';
const INDIC_SCRIPT_REGEX = new RegExp(`[${DEVANAGARI_RANGE}${TAMIL_RANGE}]`);
// A "name/company-safe" character: Latin letters, or Tamil/Devanagari letters.
const NAME_CHARS_REGEX = new RegExp(`^[A-Za-z${DEVANAGARI_RANGE}${TAMIL_RANGE}][A-Za-z${DEVANAGARI_RANGE}${TAMIL_RANGE}.'\\s-]*$`);

const COMPANY_SUFFIXES = /\b(TRADERS|TRADING|ENTERPRISES|SOLUTIONS|TECHNOLOGIES|INDUSTRIES|WORKS|SERVICES|PVT\.?\s*LTD\.?|PRIVATE\s+LIMITED|LTD\.?|LLP|INC\.?|CORP\.?|COMPANY|CO\.|AGENCY|STEELS?|FABRICS?|TOOLS?|REAL\s+ESTATE|CONSTRUCTIONS?)\b/i;
// Common Tamil/Hindi transliterations of the same business-type words above \u2014
// real regional cards usually print the English loanword in local script
// rather than translating it (e.g. "\u0B95\u0BA9\u0BCD\u0BB8\u0BCD\u0B9F\u0BCD\u0BB0\u0B95\u0BCD\u0BB7\u0BA9\u0BCD\u0BB8\u0BCD" for "Constructions").
const COMPANY_SUFFIXES_INDIC = /(\u0B95\u0BA9\u0BCD\u0BB8\u0BCD\u0B9F\u0BCD\u0BB0\u0B95\u0BCD\u0BB7\u0BA9\u0BCD\u0BB8\u0BCD|\u0B8E\u0BA3\u0BCD\u0B9F\u0BB0\u0BCD\u0BAA\u0BBF\u0BB0\u0BC8\u0B9A(\u0BB8\u0BCD|\u0BC6\u0BB8\u0BCD)|\u0B9F\u0BBF\u0BB0\u0BC7\u0B9F\u0BB0\u0BCD\u0BB8\u0BCD|\u0B87\u0BA3\u0BCD\u0B9F\u0BB8\u0BCD\u0B9F\u0BCD\u0BB0\u0BC0\u0BB8\u0BCD|\u0B9A\u0BCA\u0BB2\u0BC2\u0BB7\u0BA9\u0BCD\u0BB8\u0BCD|\u0B9F\u0BC6\u0B95\u0BCD\u0BA9\u0BBE\u0BB2\u0B9C\u0BC0\u0BB8\u0BCD|\u0BB0\u0BBF\u0BAF\u0BB2\u0BCD\s*\u0B8E\u0BB8\u0BCD\u0B9F\u0BC7\u0B9F\u0BCD|\u0B95\u0BAE\u0BCD\u0BAA\u0BC6\u0BA9\u0BBF|\u0907\u0902\u091F\u0930\u092A\u094D\u0930\u093E\u0907\u091C\u0947\u091C|\u091F\u094D\u0930\u0947\u0921\u0930\u094D\u0938|\u0907\u0902\u0921\u0938\u094D\u091F\u094D\u0930\u0940\u091C|\u0938\u0949\u0932\u094D\u092F\u0942\u0936\u0902\u0938|\u0915\u0902\u092A\u0928\u0940|\u092A\u094D\u0930\u093E\u0907\u0935\u0947\u091F\s*\u0932\u093F\u092E\u093F\u091F\u0947\u0921)/;
const DESIGNATION_WORDS = /\b(Managing\s+Partner|Managing\s+Director|General\s+Manager|Sales\s+Manager|Partner|Director|Manager|Founder|Proprietor|Owner|CEO|CTO|CFO|Consultant|Engineer|Agent)\b/i;
const NOISE_LINE = /^(file|edit|view|bookmarks|profiles|tab|window|help|chrome|safari|since\s+\d{4}|est\.?\s*\d{4}|phone|mobile|email|website|gstin?|gst|tel|fax|www)$/i;
const PRODUCT_WORDS = /\b(iron|scrap|steel|cnc|milling|fabric|textile|tools?|software|erp|cloud)\b/i;
const ADDRESS_WORDS = /\b(nagar|road|street|avenue|layout|estate|district|tamil\s*nadu|coimbatore|chennai|bangalore|bengaluru|\u0BA8\u0B95\u0BB0\u0BCD|\u0BA4\u0BC6\u0BB0\u0BC1|\u0B9A\u0BBE\u0BB2\u0BC8|\u0BAE\u0BBE\u0BB5\u0B9F\u0BCD\u0B9F\u0BAE\u0BCD|\u0928\u0917\u0930|\u092E\u093E\u0930\u094D\u0917|\u0930\u094B\u0921)\b/i;
// A line that opens with a personal honorific or a bare initial ("L.", "R.",
// "Er.A.", "Pro.", "Dr.", "Shri", "\u0936\u094D\u0930\u0940", "\u0921\u0949", "\u0BAA\u0BCA\u0BB1\u0BBF\u0BAF\u0BBE\u0BB3\u0BB0\u0BCD") is a person's
// name/title line, never the company name \u2014 even when it also contains
// Indic script and multiple words, which would otherwise score like one.
const HONORIFIC_OR_INITIAL_REGEX = /^(mr|mrs|ms|dr|er|eng|prof|pro|adv|shri|smt|\u0936\u094D\u0930\u0940|\u0936\u094D\u0930\u0940\u092E\u0924\u0940|\u0921\u0949|\u092A\u094D\u0930\u094B|\u0907\u0902\u091C\u0940|\u0BA4\u0BBF\u0BB0\u0BC1|\u0BA4\u0BBF\u0BB0\u0BC1\u0BAE\u0BA4\u0BBF|\u0B9A\u0BC6\u0BB2\u0BCD\u0BB5\u0BBF|\u0B9F\u0BBE\u0B95\u0BCD\u0B9F\u0BB0\u0BCD|\u0BAA\u0BCA\u0BB1\u0BBF\u0BAF\u0BBE\u0BB3\u0BB0\u0BCD)\.?\s|^[A-Za-z]\.[A-Za-z]?\.?\s*[A-Za-z\u0900-\u097F\u0B80-\u0BFF]/i;

// Trims whitespace only \u2014 earlier versions of this parser deleted Tamil,
// Devanagari and other Indic-script runs here, which meant regional-language
// cards silently extracted nothing. Keep the text; only noise-filter it.
function normalizeLine(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

function isValidGstin(value) {
  if (!value) return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value || '');
}

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  let ten = digits;
  if (digits.length === 12 && digits.startsWith('91')) ten = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) ten = digits.slice(1);
  if (ten.length !== 10 || !/^[6-9]/.test(ten)) return null;
  return {
    raw: `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`,
    e164: `+91${ten}`,
    digits: ten,
    confidence: 0.92
  };
}

function extractPhonesFromText(text) {
  const found = [];
  const blob = text.replace(/\n/g, ' ');
  const matches = blob.match(INDIAN_PHONE_REGEX) || [];
  for (const m of matches) {
    const norm = normalizePhone(m);
    if (norm && !found.some((f) => f.digits === norm.digits)) {
      found.push({
        raw: norm.raw,
        e164: norm.e164,
        type: 'mobile',
        is_whatsapp: false,
        confidence: norm.confidence
      });
    }
  }
  return found;
}

function extractEmailsFromText(text) {
  const blob = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
  const matches = blob.match(EMAIL_REGEX) || [];
  return [...new Set(
    matches
      .map((e) => e.toLowerCase().replace(/[,;:]+$/, ''))
      .filter(isValidEmail)
  )];
}

function extractWebsitesFromText(text, emails) {
  const blob = text.replace(/\n/g, ' ');
  const matches = blob.match(WEBSITE_REGEX) || [];
  const sites = [];
  for (const w of matches) {
    if (w.includes('@')) continue;
    const clean = w.replace(/[,;:]+$/, '');
    const lower = clean.toLowerCase();
    if (/(gmail|yahoo|outlook|hotmail|whatsapp)\./.test(lower)) continue;
    if (!/\.[a-z]{2,}/i.test(clean)) continue;
    const formatted = clean.startsWith('http') ? clean : `https://${clean}`;
    if (!sites.includes(formatted)) sites.push(formatted);
  }
  // Only derive website from email when domain looks like a business site
  if (sites.length === 0 && emails?.[0]) {
    const domain = emails[0].split('@')[1];
    if (domain && !/(gmail|yahoo|outlook|hotmail|icloud)\./i.test(domain)) {
      sites.push(`https://www.${domain}`);
    }
  }
  return sites;
}

function extractGstin(text) {
  const compact = text.replace(/\s+/g, '');
  const m = compact.match(GSTIN_REGEX);
  if (!m) return { value: '', confidence: 0 };
  const value = m[1].toUpperCase();
  return {
    value: isValidGstin(value) ? value : '',
    confidence: isValidGstin(value) ? 0.95 : 0
  };
}

function extractPincode(text) {
  const m = text.match(PINCODE_REGEX);
  return m ? m[1] : '';
}

function extractAddress(lines, fullText) {
  const addrLines = [];
  for (const line of lines) {
    const clean = normalizeLine(line);
    if (clean.length < 6) continue;
    if (clean.match(EMAIL_REGEX) || clean.match(INDIAN_PHONE_REGEX) || clean.match(WEBSITE_REGEX)) continue;
    if (GSTIN_REGEX.test(clean.replace(/\s/g, ''))) continue;
    if (
      PINCODE_REGEX.test(clean) ||
      ADDRESS_WORDS.test(clean) ||
      /^\d+[\/\\-]/.test(clean)
    ) {
      const addr = clean.replace(/^(address|addr)[:\s]*/i, '').trim();
      if (addr.length > 5) addrLines.push(addr);
    }
  }
  if (addrLines.length) return { value: addrLines.join(', '), confidence: 0.75 };
  const pin = extractPincode(fullText);
  return { value: pin ? `PIN ${pin}` : '', confidence: pin ? 0.4 : 0 };
}

function extractCompany(lines) {
  const candidates = [];
  for (const line of lines) {
    const clean = normalizeLine(line);
    if (clean.length < 3 || clean.length > 60) continue;
    if (NOISE_LINE.test(clean)) continue;
    if (clean.match(EMAIL_REGEX) || clean.match(INDIAN_PHONE_REGEX) || clean.match(WEBSITE_REGEX)) continue;
    const hasSuffix = COMPANY_SUFFIXES.test(clean) || COMPANY_SUFFIXES_INDIC.test(clean);
    if (HONORIFIC_OR_INITIAL_REGEX.test(clean) && !hasSuffix) continue;
    if (DESIGNATION_WORDS.test(clean) && !hasSuffix) continue;
    if (PRODUCT_WORDS.test(clean) && !hasSuffix && clean.length < 20) continue;

    const isIndic = INDIC_SCRIPT_REGEX.test(clean);
    let score = 0;
    if (hasSuffix) score += 50;
    // The all-caps heuristic only means anything for cased (Latin) text —
    // Tamil/Devanagari have no case, so `clean.toUpperCase() === clean` is
    // trivially true for them and must not be read as "shouting company name".
    if (!isIndic && clean === clean.toUpperCase() && /[A-Z]{3,}/.test(clean)) score += 30;
    // A standalone Indic-script line with no phone/email/address/etc is very
    // likely the business name — give it a modest baseline signal.
    if (isIndic && !ADDRESS_WORDS.test(clean) && !PINCODE_REGEX.test(clean) && clean.split(/\s+/).length >= 2) score += 20;
    if (clean.split(/\s+/).length >= 2) score += 10;
    if (clean.length >= 8) score += 8;
    if (score >= 30) candidates.push({ value: clean.replace(/^(since|est\.?)\s*\d{4}\s*/i, '').trim(), score });
  }
  candidates.sort((a, b) => b.score - a.score);
  if (!candidates.length) return { value: '', confidence: 0 };
  return {
    value: candidates[0].value,
    confidence: Math.min(0.95, candidates[0].score / 80)
  };
}

function extractPersonName(lines, emails, company) {
  const companyLower = (company || '').toLowerCase();
  for (const line of lines) {
    const clean = normalizeLine(line);
    if (clean.length < 3 || clean.length > 36) continue;
    if (NOISE_LINE.test(clean)) continue;
    if (clean.match(EMAIL_REGEX) || clean.match(INDIAN_PHONE_REGEX) || clean.match(WEBSITE_REGEX)) continue;
    if (COMPANY_SUFFIXES.test(clean) || COMPANY_SUFFIXES_INDIC.test(clean)) continue;
    // "ALL CAPS = company shouting its name" only applies to cased (Latin)
    // text — Tamil/Devanagari have no case, so this must not fire for them.
    if (!INDIC_SCRIPT_REGEX.test(clean) && clean === clean.toUpperCase()) continue;
    if (DESIGNATION_WORDS.test(clean)) continue;
    if (PRODUCT_WORDS.test(clean)) continue;
    if (PINCODE_REGEX.test(clean) || ADDRESS_WORDS.test(clean)) continue;
    if (companyLower && companyLower.includes(clean.toLowerCase())) continue;
    if (!NAME_CHARS_REGEX.test(clean)) continue;
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length < 1 || words.length > 3) continue;
    // Reject single short tokens that look like OCR noise ("Test", "Lipi", "Ltd")
    if (words.length === 1 && words[0].length < 4) continue;
    if (words.length === 1 && /^(test|demo|sample|name|card)$/i.test(words[0])) continue;
    return {
      value: words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      confidence: words.length >= 2 ? 0.8 : 0.55
    };
  }

  // Soft fallback from email local-part — only multi-part names
  if (emails?.[0]) {
    const local = emails[0].split('@')[0];
    const parts = local.split(/[._-]/).filter((p) => p.length > 2);
    const skip = new Set(['lipi', 'info', 'contact', 'sales', 'admin', 'office', 'mail']);
    const nameParts = parts.filter((p) => !skip.has(p.toLowerCase()) && /^[a-z]+$/i.test(p));
    if (nameParts.length >= 1) {
      const pick = nameParts[nameParts.length - 1];
      if (pick.length >= 4 && !/^(test|demo)$/i.test(pick)) {
        return {
          value: pick.charAt(0).toUpperCase() + pick.slice(1).toLowerCase(),
          confidence: 0.45
        };
      }
    }
  }
  return { value: '', confidence: 0 };
}

function extractDesignation(lines) {
  for (const line of lines) {
    const clean = normalizeLine(line);
    if (clean.length > 40) continue;
    const m = clean.match(DESIGNATION_WORDS);
    if (!m) continue;
    // Require the matched title to dominate the line (avoid random matches)
    const title = m[0];
    if (clean.length > title.length + 18) continue;
    return { value: title.replace(/\s+/g, ' '), confidence: 0.85 };
  }
  return { value: '', confidence: 0 };
}

function companyFromEmail(emails) {
  if (!emails?.[0]) return { value: '', confidence: 0 };
  const domain = emails[0].split('@')[1] || '';
  const root = domain.split('.')[0] || '';
  if (!root || /(gmail|yahoo|outlook|hotmail|icloud)/i.test(root)) return { value: '', confidence: 0 };
  if (root.length < 4) return { value: '', confidence: 0 };
  return {
    value: root.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    confidence: 0.35
  };
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
    city: '',
    state: '',
    pincode: '',
    tags: ['Business Card'],
    field_confidence: {}
  };

  if (!rawText || typeof rawText !== 'string') return empty;

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1)
    .filter((l) => !NOISE_LINE.test(l));

  const fullText = lines.join('\n');
  const emails = extractEmailsFromText(fullText);
  const phones = extractPhonesFromText(fullText);
  const websites = extractWebsitesFromText(fullText, emails);
  const gst = extractGstin(fullText);
  const companyHit = extractCompany(lines);
  const emailCompany = companyFromEmail(emails);
  const company =
    companyHit.confidence >= 0.5
      ? companyHit
      : (emailCompany.confidence > companyHit.confidence ? emailCompany : companyHit);
  const person = extractPersonName(lines, emails, company.value);
  const designation = extractDesignation(lines);
  const address = extractAddress(lines, fullText);
  const pincode = extractPincode(fullText);

  // Prefer blank over garbage
  const pick = (hit, minConfidence = 0.45) =>
    hit.confidence >= minConfidence ? hit.value : '';

  const field_confidence = {
    person_name: person.confidence,
    designation: designation.confidence,
    company: company.confidence,
    phone: phones[0]?.confidence || 0,
    email: emails[0] ? 0.95 : 0,
    website: websites[0] ? 0.7 : 0,
    gstin: gst.confidence,
    address: address.confidence,
    pincode: pincode ? 0.8 : 0
  };

  return {
    person_name: pick(person, 0.45),
    designation: pick(designation, 0.7),
    company: pick(company, 0.35),
    website: (websites[0] || '').replace(/^https?:\/\//, ''),
    gstin: gst.value,
    phones,
    emails,
    raw_address: pick(address, 0.4),
    city: '',
    state: '',
    pincode,
    tags: company.value ? [company.value, 'Business Card'] : ['Business Card'],
    field_confidence
  };
}

export function scoreExtraction(data) {
  if (!data) return 0;
  let score = 0;
  if (data.company && data.company.length > 3) score += 20;
  if (data.emails?.[0] && isValidEmail(data.emails[0])) score += 20;
  if (data.phones?.[0]?.raw?.replace(/\D/g, '').length >= 10) score += 20;
  if (data.raw_address?.length > 10) score += 15;
  if (data.person_name && data.person_name.length > 2) score += 15;
  if (data.website) score += 5;
  if (data.gstin && isValidGstin(data.gstin)) score += 5;
  return score;
}

export function mergeExtractions(primary, secondary) {
  if (!secondary) return primary || {};
  if (!primary) return secondary;

  const conf = (obj, key) => obj?.field_confidence?.[key] || 0;

  const pickStr = (key, minLen = 1) => {
    const a = primary[key] || '';
    const b = secondary[key] || '';
    if (!a && !b) return '';
    if (!a) return b.length >= minLen ? b : '';
    if (!b) return a.length >= minLen ? a : '';
    return conf(secondary, key) > conf(primary, key) ? b : a;
  };

  const phoneMap = new Map();
  [...(primary.phones || []), ...(secondary.phones || [])].forEach((p) => {
    if (!p?.digits && !p?.e164) return;
    const key = p.digits || p.e164;
    const prev = phoneMap.get(key);
    if (!prev || (p.confidence || 0) > (prev.confidence || 0)) phoneMap.set(key, p);
  });
  const phones = Array.from(phoneMap.values()).sort(
    (a, b) => (b.confidence || 0) - (a.confidence || 0)
  );
  const emails = [...new Set([...(primary.emails || []), ...(secondary.emails || [])])];

  const field_confidence = { ...(primary.field_confidence || {}) };
  Object.keys(secondary.field_confidence || {}).forEach((k) => {
    field_confidence[k] = Math.max(field_confidence[k] || 0, secondary.field_confidence[k] || 0);
  });
  if (phones[0]) field_confidence.phone = phones[0].confidence || field_confidence.phone || 0;
  if (emails[0]) field_confidence.email = 0.95;

  return {
    person_name: pickStr('person_name', 2),
    designation: pickStr('designation', 3),
    company: pickStr('company', 3),
    website: pickStr('website', 4),
    gstin: pickStr('gstin', 15),
    phones,
    emails,
    raw_address: pickStr('raw_address', 6),
    city: pickStr('city', 2),
    state: pickStr('state', 2),
    pincode: pickStr('pincode', 6),
    tags: (primary.tags?.length > 1 ? primary : secondary).tags || ['Business Card'],
    field_confidence
  };
}

/** Create a brighter, higher-contrast canvas for OCR without mutating the original. */
export async function preprocessImageForOcr(imageSource) {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1600;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.35 + 128));
          d[i] = d[i + 1] = d[i + 2] = contrasted;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve(imageSource);
      img.src = imageSource;
    } catch (_) {
      resolve(imageSource);
    }
  });
}

// Recognizing English and Indic scripts in ONE combined Tesseract pass
// (e.g. 'eng+tam+hin') makes the engine hallucinate Tamil/Devanagari glyphs
// out of ordinary Latin text — a purely English card came back with a
// Devanagari name and garbage company field once all three were loaded
// together. Instead, run English and Tamil+Hindi as two INDEPENDENT passes
// (each only ever tries to match its own script, so neither can corrupt the
// other) and merge the two structured results field-by-field, keeping
// whichever pass produced the more confident value — the same confidence
// merge already used to combine front/back scans.
async function runOcrPass(imageSource, lang) {
  try {
    const result = await Tesseract.recognize(imageSource, lang, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR ${lang}] ${(m.progress * 100).toFixed(0)}%`);
        }
      }
    });
    const text = result.data?.text || '';
    console.log(`[Raw OCR Text (${lang})]:\n`, text);
    return parseBusinessCardText(text);
  } catch (error) {
    console.warn(`[Tesseract OCR Error] (${lang}):`, error);
    return parseBusinessCardText('');
  }
}

export async function extractCardWithTesseract(imageSource) {
  const processed = await preprocessImageForOcr(imageSource);
  const [englishPass, indicPass] = await Promise.all([
    runOcrPass(processed, 'eng'),
    runOcrPass(processed, 'tam+hin')
  ]);
  const merged = mergeExtractions(englishPass, indicPass);
  console.log('[Structured OCR]:', merged);
  return merged;
}
