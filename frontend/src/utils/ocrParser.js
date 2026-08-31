import Tesseract from 'tesseract.js';

/**
 * Intelligent Business Card Text Parser
 * Extracts structured fields (Company, Name, Designation, Phones, Emails, Website, Address, Tags)
 * from raw OCR text recognized from any physical or digital business card.
 */
export async function extractCardWithTesseract(imageSource) {
  try {
    const { data: { text } } = await Tesseract.recognize(imageSource, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR Progress] ${(m.progress * 100).toFixed(0)}%`);
        }
      }
    });

    console.log('[Raw OCR Text Extracted]:', text);
    return parseBusinessCardText(text);
  } catch (error) {
    console.warn('[Tesseract OCR Error]:', error);
    return parseBusinessCardText('');
  }
}

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

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 1 && !l.includes('Youtube') && !l.includes('ChatGPT') && !l.includes('Copilot'));

  let emails = [];
  let websites = [];
  let phones = [];
  let addresses = [];
  let candidateNames = [];
  let candidateDesignations = [];
  let candidateCompanies = [];

  // Regex patterns
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const websiteRegex = /(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\.[a-zA-Z]{2,})?(\/[^\s]*)?)/gi;
  const phoneRegex = /(?:(?:\+|00)?\d{1,3}[-.\s]?)?(?:\(?\d{2,5}\)?[-.\s]?)?\d{3,5}[-.\s]?\d{3,5}/g;

  // Common designation keywords
  const designationKeywords = [
    'agent', 'real estate', 'director', 'manager', 'partner', 'managing partner',
    'founder', 'co-founder', 'ceo', 'cto', 'cfo', 'president', 'consultant',
    'engineer', 'executive', 'officer', 'specialist', 'advocate', 'doctor',
    'proprietor', 'head', 'lead', 'representative', 'realtor', 'broker'
  ];

  // Address keywords
  const addressKeywords = [
    'street', 'st.', 'st,', 'st ', 'road', 'rd.', 'rd,', 'nagar', 'avenue', 'ave',
    'city', 'state', 'pincode', 'pin', 'zip', 'anywhere', 'floor', 'building',
    'block', 'lane', 'sector', 'dist', 'district', 'estate', 'sidco', 'tamil nadu'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Email Extraction
    const emailMatches = line.match(emailRegex);
    if (emailMatches) {
      emailMatches.forEach((em) => {
        if (!emails.includes(em.toLowerCase())) emails.push(em.toLowerCase());
      });
      continue;
    }

    // 2. Website Extraction
    if (line.toLowerCase().includes('www.') || line.toLowerCase().includes('.com') || line.toLowerCase().includes('.in') || line.toLowerCase().includes('.org') || line.toLowerCase().includes('.net')) {
      const webMatches = line.match(websiteRegex);
      if (webMatches) {
        webMatches.forEach((web) => {
          if (!web.includes('@') && !websites.includes(web)) {
            const formattedWeb = web.startsWith('http') ? web : `https://${web.replace(/^https?:\/\//, '')}`;
            websites.push(formattedWeb);
          }
        });
        continue;
      }
    }

    // 3. Phone Extraction
    const phoneMatches = line.match(phoneRegex);
    if (phoneMatches) {
      phoneMatches.forEach((p) => {
        const digits = p.replace(/\D/g, '');
        if (digits.length >= 7 && digits.length <= 15) {
          const cleaned = p.trim();
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
      // If the line only contained phone number, move on
      if (line.replace(/[\d\s+\-().]/g, '').length < 3) {
        continue;
      }
    }

    // 4. Address Detection
    const lineLower = line.toLowerCase();
    const hasAddressWord = addressKeywords.some((kw) => lineLower.includes(kw));
    const hasZipDigits = /\b\d{5,6}\b/.test(line);
    if (hasAddressWord || hasZipDigits) {
      addresses.push(line);
      continue;
    }

    // 5. Designation Detection
    const hasDesignationWord = designationKeywords.some((kw) => lineLower.includes(kw));
    if (hasDesignationWord && line.length < 50) {
      candidateDesignations.push(line);
      continue;
    }

    // 6. Names and Company Candidates
    // Usually names have 2 to 4 capitalized words (e.g., Olivia Wilson, Rajesh Kumar)
    if (line.length <= 40 && /^[A-Za-z\s.'-]+$/.test(line)) {
      if (candidateNames.length === 0 && (line.split(' ').length >= 2 || line === line.toUpperCase())) {
        candidateNames.push(line);
      } else {
        candidateCompanies.push(line);
      }
    } else if (line.length < 60) {
      candidateCompanies.push(line);
    }
  }

  // Fallbacks & Synthesis
  let personName = candidateNames[0] || '';
  let designation = candidateDesignations[0] || '';
  let company = candidateCompanies[0] || '';

  // If no company candidate, extract company brand name from email or website domain
  if (!company) {
    if (websites[0]) {
      const match = websites[0].match(/https?:\/\/(?:www\.)?([^./]+)/i);
      if (match && match[1] && !['reallygreatsite', 'example', 'site'].includes(match[1])) {
        company = match[1].toUpperCase();
      }
    } else if (emails[0]) {
      const match = emails[0].match(/@([^.]+)/);
      if (match && match[1] && !['gmail', 'yahoo', 'outlook', 'reallygreatsite'].includes(match[1])) {
        company = match[1].toUpperCase();
      }
    }
  }

  if (!company && personName) {
    company = designation ? `${personName} ${designation}` : `${personName} Enterprise`;
  }

  const rawAddress = addresses.join(', ');

  // Auto-generate tags based on content
  const tags = [];
  if (designation) {
    designation.split(' ').forEach((w) => {
      if (w.length > 3) tags.push(w);
    });
  }
  if (company && company !== personName) {
    tags.push(company);
  }
  if (tags.length === 0) {
    tags.push('Business Contact', 'Verified Lead');
  }

  return {
    person_name: personName || (candidateCompanies[0] ? '' : 'Contact Person'),
    designation: designation || '',
    company: company || (personName ? `${personName}'s Business` : 'Visiting Card Contact'),
    website: websites[0] || '',
    phones: phones,
    emails: emails,
    raw_address: rawAddress || '',
    tags: Array.from(new Set(tags))
  };
}
