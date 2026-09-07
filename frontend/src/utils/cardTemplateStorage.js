const PREFIX = 'cf_card_template_';
const DEFAULT_TEMPLATE = 'classic';

export function getCardTemplate(businessId) {
  if (!businessId) return DEFAULT_TEMPLATE;
  try {
    return window.localStorage.getItem(PREFIX + businessId) || DEFAULT_TEMPLATE;
  } catch (e) {
    return DEFAULT_TEMPLATE;
  }
}

export function setCardTemplate(businessId, templateId) {
  if (!businessId) return;
  try {
    window.localStorage.setItem(PREFIX + businessId, templateId);
  } catch (e) {
    // localStorage unavailable — selection won't persist across reloads
  }
}
