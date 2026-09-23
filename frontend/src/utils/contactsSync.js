import { Capacitor } from '@capacitor/core';
import { apiClient } from '../services/api';

export function isNativePlatform() {
  try {
    return Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
}

// IMPORTANT: never `return`/resolve a Promise with the Capacitor plugin proxy
// itself as the value. The proxy answers ANY property access (including
// `then`) with a callable, so promise machinery mistakes it for a nested
// thenable and calls `.then()' on it — which crashes with "X.then() is not
// implemented on android/ios". Cache the plugin in a plain module variable
// instead, and only ever return/await plain data.
let cachedContacts = null;
async function ensureContactsPlugin() {
  if (cachedContacts) return;
  const mod = await import('@capacitor-community/contacts');
  cachedContacts = mod.Contacts;
}

export async function requestContactsPermission() {
  await ensureContactsPlugin();
  const Contacts = cachedContacts;
  const status = await Contacts.checkPermissions();
  if (status.contacts === 'granted') return true;
  const requested = await Contacts.requestPermissions();
  return requested.contacts === 'granted';
}

// Reads every contact off the phone and uploads a full snapshot to the cloud.
export async function backupPhoneContacts(token) {
  const granted = await requestContactsPermission();
  if (!granted) {
    throw new Error('Contacts permission was not granted');
  }
  await ensureContactsPlugin();
  const Contacts = cachedContacts;
  const { contacts } = await Contacts.getContacts({
    projection: { name: true, phones: true, emails: true },
  });

  const payload = contacts
    .map((c) => ({
      name: c.name?.display || '',
      phones: (c.phones || []).map((p) => p.number).filter(Boolean),
      emails: (c.emails || []).map((e) => e.address).filter(Boolean),
    }))
    .filter((c) => c.name || c.phones.length || c.emails.length);

  if (payload.length === 0) {
    throw new Error('No contacts found on this phone to back up');
  }

  const result = await apiClient.backupContacts(payload, token);
  return { uploaded: payload.length, ...result };
}

export async function getBackupStatus(token) {
  return apiClient.getContactBackupStatus(token);
}

// Pulls the cloud backup and writes each contact into the phone's native address book.
export async function restoreContactsToPhone(token) {
  const granted = await requestContactsPermission();
  if (!granted) {
    throw new Error('Contacts permission was not granted');
  }
  const { contacts } = await apiClient.getContactBackup(token);
  if (!contacts || contacts.length === 0) {
    throw new Error('No backup found to restore');
  }

  await ensureContactsPlugin();
  const Contacts = cachedContacts;
  let created = 0;
  for (const c of contacts) {
    try {
      await Contacts.createContact({
        contact: {
          name: { given: c.name || 'Unknown' },
          phones: (c.phones || []).map((number) => ({ type: 'mobile', number })),
          emails: (c.emails || []).map((address) => ({ type: 'home', address })),
        },
      });
      created += 1;
    } catch (e) {
      // Skip contacts the OS refuses (e.g. malformed number) and keep
      // restoring the rest, but log why — this used to fail silently with
      // no way to tell "nothing to restore" apart from "every contact was
      // rejected by the OS".
      console.warn('[restoreContactsToPhone] could not create contact', c?.name, e);
    }
  }
  return { restored: created, total: contacts.length };
}

// Pulls name/company/phones/emails off a CardFlow saved-card object (scanned
// or manually entered), matching the shape buildVCard() in utils/vcard.js reads.
function extractContactFields(card) {
  const name = card.person_name || card.personName || '';
  const company = card.company || card.company_name || '';
  const phones = (card.phones?.length ? card.phones.map((p) => p.raw || p) : [card.phone]).filter(Boolean);
  const emails = (card.emails?.length ? card.emails : [card.email]).filter(Boolean);
  return { name, company, jobTitle: card.designation || '', phones, emails };
}

// Saves one CardFlow business card into the phone's native contacts.
export async function saveContactToPhone(card) {
  const { name, company, jobTitle, phones, emails } = extractContactFields(card);
  const granted = await requestContactsPermission();
  if (!granted) {
    throw new Error('Contacts permission was not granted');
  }
  await ensureContactsPlugin();
  const Contacts = cachedContacts;
  const result = await Contacts.createContact({
    contact: {
      name: { given: name || company || 'Unknown' },
      organization: company || jobTitle ? { company: company || null, jobTitle: jobTitle || null } : undefined,
      phones: phones.map((number) => ({ type: 'mobile', number })),
      emails: emails.map((address) => ({ type: 'work', address })),
    },
  });
  return result;
}

// Bulk-imports every saved CardFlow business card into the phone's native contacts.
export async function saveAllCardsToPhone(cards) {
  const granted = await requestContactsPermission();
  if (!granted) {
    throw new Error('Contacts permission was not granted');
  }
  await ensureContactsPlugin();
  const Contacts = cachedContacts;
  let created = 0;
  let failed = 0;
  for (const card of cards) {
    const { name, company, jobTitle, phones, emails } = extractContactFields(card);
    if (!name && !company && phones.length === 0 && emails.length === 0) continue;
    try {
      await Contacts.createContact({
        contact: {
          name: { given: name || company || 'Unknown' },
          organization: company || jobTitle ? { company: company || null, jobTitle: jobTitle || null } : undefined,
          phones: phones.map((number) => ({ type: 'mobile', number })),
          emails: emails.map((address) => ({ type: 'work', address })),
        },
      });
      created += 1;
    } catch (e) {
      failed += 1;
    }
  }
  return { created, failed, total: cards.length };
}
