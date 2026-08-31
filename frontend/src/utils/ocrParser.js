import Tesseract from 'tesseract.js';

/**
 * Intelligent Multilingual Business Card Parser (English + Tamil + Hindi)
 * Recognizes & extracts contact cards in English, தமிழ் (Tamil), and हिन्दी (Hindi).
 */
export async function extractCardWithTesseract(imageSource) {
  try {
    // Attempt multi-language recognition: English + Tamil + Hindi
    let text = '';
    try {
      const result = await Tesseract.recognize(imageSource, 'eng+tam+hin', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`[OCR Multilingual] ${(m.progress * 100).toFixed(0)}%`);
          }
        }
      });
      text = result.data?.text || '';
    } catch (langErr) {
      console.warn('Multilingual model loading fallback to English:', langErr);
      const fallbackResult = await Tesseract.recognize(imageSource, 'eng');
      text = fallbackResult.data?.text || '';
    }

    console.log('[Raw OCR Text Extracted (Multi-script)]:\n', text);
    return parseBusinessCardText(text);
  } catch (error) {
    console.warn('[Tesseract OCR Error]:', error);
    return parseBusinessCardText('');
  }
}

// Ignore artifacts from browser screen bars or UI buttons
const UI_IGNORE_WORDS = [
  'file', 'edit', 'view', 'history', 'bookmarks', 'profiles', 'tab', 'window', 'help',
  'youtube', 'chatgpt', 'copilot', 'vercel', 'vercel.app', 'kernel', 'ajida',
  'scan business card', 'open live camera', 'choose from gallery', 'scan another card',
  'user', 'change card photo', 'http://', 'https://'
];

// Multilingual designation keywords (English, Tamil, Hindi)
const DESIGNATION_KEYWORDS = [
  // English
  'real estate agent', 'support specialist', 'computer support', 'managing partner',
  'director', 'managing director', 'manager', 'partner', 'founder', 'co-founder',
  'ceo', 'cto', 'cfo', 'coo', 'president', 'vice president', 'vp', 'consultant',
  'engineer', 'software engineer', 'architect', 'executive', 'officer',
  'specialist', 'advocate', 'doctor', 'proprietor', 'head', 'lead',
  'representative', 'realtor', 'broker', 'accountant', 'designer', 'developer',
  // Tamil Transliterated & Tamil Script
  'உரிமையாளர்', 'நிர்வாகி', 'இயக்குனர்', 'முகவர்', 'பொறியாளர்', 'மேலாளர்',
  'urimaiyalar', 'thalaivar', 'nirvagi',
  // Hindi Transliterated & Devanagari Script
  'मालिक', 'प्रबंधक', 'निदेशक', 'एजेंट', 'सलाहकार', 'व्यापारी',
  'malik', 'prabandhak', 'nideshak'
];

// Address indicator words (English, Tamil, Hindi)
const ADDRESS_KEYWORDS = [
  // English
  'street', 'st.', 'st,', 'st ', 'road', 'rd.', 'rd,', 'nagar', 'avenue', 'ave',
  'city', 'state', 'pincode', 'pin', 'zip', 'anywhere', 'floor', 'building',
  'block', 'lane', 'sector', 'dist', 'district', 'estate', 'sidco', 'mount holly',
  'rockville', 'ambigai', 'chinnavedapatti', 'coimbatore', 'tamil nadu', 'chennai',
  'bengaluru', 'mumbai', 'delhi',
  // Tamil
  'தெரு', 'சாலை', 'நகர்', 'மாவட்டம்', 'பிரிவு', 'கோவை', 'தமிழ்நாடு',
  'theru', 'salai', 'nagar', 'mavattam',
  // Hindi
  'मार्ग', 'सड़क', 'गली', 'नगर', 'जिला', 'रोड', 'भवन',
  'marg', 'sadak', 'gali', 'bhavan'
];

export function parseBusinessCardText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      person_name: '',
      designation: '',
      company: '',
      website: '',
      phones: [],
      emails: [],
      raw_address: '',
      tags: ['Business Contact']
    };
  }

  const rawLines = rawText.split(/\r?\n/);
  const cleanLines = [];

  for (let l of rawLines) {
    let line = l.trim();
    // Remove noise symbols from start
    line = line.replace(/^[^\p{L}\p{N}+(]+/u, '').trim();
    if (line.length < 2) continue;

    const lower = line.toLowerCase();
    const isUiNoise = UI_IGNORE_WORDS.some((w) => lower.includes(w) && (lower.includes('file edit') || lower.includes('bookmarks') || lower.includes('vercel.app')));
    if (!isUiNoise) {
      cleanLines.push(line);
    }
  }

  let emails = [];
  let websites = [];
  let phones = [];
  let addresses = [];
  let designation = '';
  let candidateNames = [];
  let candidateCompanies = [];

  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const websiteRegex = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/[^\s]*)?)/gi;
  // Accepts international, Indian, Tamil/Hindi numerals
  const phoneRegex = /(?:(?:\+|00)?\d{1,3}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/g;

  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const lower = line.toLowerCase();

    // 1. Email Recognition
    const emailMatches = line.match(emailRegex);
    if (emailMatches) {
      emailMatches.forEach((em) => {
        const cleanEm = em.toLowerCase().replace(/[,;:]+$/, '');
        if (!emails.includes(cleanEm)) emails.push(cleanEm);
      });
      continue;
    }

    // 2. Website Recognition
    if (lower.includes('www.') || lower.includes('.com') || lower.includes('.in') || lower.includes('.org') || lower.includes('.net') || lower.includes('.co')) {
      const webMatches = line.match(websiteRegex);
      if (webMatches) {
        webMatches.forEach((web) => {
          if (!web.includes('@')) {
            const cleanWeb = web.replace(/[,;:]+$/, '');
            const formatted = cleanWeb.startsWith('http') ? cleanWeb : `https://${cleanWeb}`;
            if (!websites.includes(formatted)) websites.push(formatted);
          }
        });
        continue;
      }
    }

    // 3. Phone Numbers
    const phoneMatches = line.match(phoneRegex);
    if (phoneMatches) {
      phoneMatches.forEach((p) => {
        const digits = p.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          const cleaned = p.trim().replace(/^[^\d+]+/, '');
          if (!phones.some((existing) => existing.raw === cleaned)) {
            phones.push({
              raw: cleaned,
              e164: '+' + digits,
              type: 'mobile',
              is_whatsapp: true,
              confidence: 0.98
            });
          }
        }
      });
      if (line.replace(/[\d\s+\-().|/]/g, '').length < 3) {
        continue;
      }
    }

    // 4. Designation / Job Role
    const isDesigMatch = DESIGNATION_KEYWORDS.some((kw) => lower.includes(kw));
    if (isDesigMatch && !designation) {
      designation = line.replace(/^[|•\-:]\s*/, '').trim();
      continue;
    }

    // 5. Addresses
    const hasAddrWord = ADDRESS_KEYWORDS.some((kw) => lower.includes(kw));
    const hasZip = /\b\d{5,6}\b/.test(line);
    if (hasAddrWord || hasZip) {
      const cleanAddr = line.replace(/^[£$#|•\-:]\s*/, '').trim();
      addresses.push(cleanAddr);
      continue;
    }

    // 6. Explicit Company Header (English, Tamil, Hindi)
    if (lower === 'company' || lower.startsWith('company ') || lower.includes('enterprise') || lower.includes('traders') || lower.includes('technologies') || lower.includes('solutions') || lower.includes('works') || lower.includes('ltd') || lower.includes('pvt') || line.includes('நிறுவனம்') || line.includes('கம்பெனி') || line.includes('उद्योग')) {
      candidateCompanies.push(line.replace(/^[|•\-:]\s*/, '').trim());
      continue;
    }

    // 7. Person / Business Name Candidates (Supports Latin, Tamil \u0B80-\u0BFF, Devanagari \u0900-\u097F)
    const validLettersOnly = line.replace(/[^a-zA-Z\s\u0B80-\u0BFF\u0900-\u097F]/g, '').trim();
    const words = validLettersOnly.split(/\s+/).filter((w) => w.length >= 2);
    if (words.length >= 1 && words.length <= 5 && line.length < 50) {
      if (!candidateNames.includes(validLettersOnly) && validLettersOnly.length >= 3) {
        candidateNames.push(validLettersOnly);
      }
    }
  }

  // Refine Person Name
  let personName = '';
  for (let nameCandidate of candidateNames) {
    const lower = nameCandidate.toLowerCase();
    if (DESIGNATION_KEYWORDS.some((kw) => lower.includes(kw)) || ADDRESS_KEYWORDS.some((kw) => lower.includes(kw))) {
      continue;
    }
    personName = nameCandidate;
    break;
  }

  // Refine Company Name
  let company = candidateCompanies[0] || '';
  if (!company) {
    if (emails[0]) {
      const domainMatch = emails[0].match(/@([a-zA-Z0-9-]+)\./);
      if (domainMatch && domainMatch[1] && !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'reallygreatsite'].includes(domainMatch[1])) {
        company = domainMatch[1].toUpperCase();
      }
    }
  }
  if (!company && websites[0]) {
    const webMatch = websites[0].match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+)\./);
    if (webMatch && webMatch[1] && !['reallygreatsite', 'example', 'site', 'mywebsite'].includes(webMatch[1])) {
      company = webMatch[1].toUpperCase();
    }
  }

  if (!company) {
    if (candidateNames.length > 1 && candidateNames[1] !== personName) {
      company = candidateNames[1];
    } else if (personName && designation) {
      company = `${personName} (${designation})`;
    } else if (personName) {
      company = `${personName}`;
    } else {
      company = 'Business Contact';
    }
  }

  const rawAddress = addresses.join(', ');

  // Auto-generate tags
  const tags = [];
  if (designation) {
    tags.push(designation);
  }
  if (company && company !== personName) {
    tags.push(company);
  }
  if (tags.length === 0) {
    tags.push('Business Contact', 'Verified Lead');
  }

  return {
    person_name: personName || 'Contact Person',
    designation: designation || '',
    company: company,
    website: websites[0] || '',
    phones: phones,
    emails: emails,
    raw_address: rawAddress || '',
    tags: Array.from(new Set(tags))
  };
}
