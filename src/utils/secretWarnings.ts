/**
 * Heuristic secret-risk analyzer.
 *
 * This module detects text that *looks* like a password, TOTP seed, or
 * recovery seed phrase. Detection is intentionally heuristic and imperfect;
 * it is meant to show a warning, never to block saving.
 */

export interface SecretRisk {
  concern: boolean;
  reasons: string[];
}

/**
 * First 200 words of the BIP-39 English word list. Used only for local,
 * client-side heuristic checks. No secrets are stored or transmitted.
 */
const BIP39_WORDS = new Set([
  'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
  'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
  'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
  'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
  'advice', 'aerobic', 'affair', 'afford', 'afraid', 'after', 'age', 'agency',
  'agenda', 'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle',
  'alarm', 'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow',
  'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur',
  'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger',
  'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer',
  'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple',
  'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm',
  'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow',
  'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset',
  'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude',
  'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn',
  'average', 'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful',
  'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance',
  'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain',
  'barrel', 'base', 'baseball', 'basic', 'basket', 'battle', 'beach', 'bean',
  'beauty', 'because', 'become', 'beef', 'before', 'begin', 'behave', 'behind',
  'believe', 'below', 'belt', 'bench', 'benefit', 'best', 'betray', 'better',
  'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird',
  'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak',
  'bless', 'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush',
  'board', 'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book',
]);

function looksLikeRandomString(text: string): boolean {
  if (text.length < 12) return false;
  const ratio = (text.match(/[A-Za-z0-9]/g) ?? []).length / text.length;
  const entropy = new Set(text.toLowerCase()).size / text.length;
  return ratio > 0.9 && entropy > 0.6 && /\d/.test(text) && /[a-zA-Z]/.test(text);
}

function looksLikeBase32(text: string): boolean {
  if (text.length < 16) return false;
  return /^[A-Z2-7]+=*$/i.test(text) && text.length % 8 === 0;
}

function looksLikeSeedPhrase(text: string): boolean {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length < 6) return false;
  const bipMatches = words.filter(w => BIP39_WORDS.has(w)).length;
  return bipMatches >= Math.min(words.length * 0.7, 6);
}

export function analyzeSecretRisk(text: string): SecretRisk {
  const reasons: string[] = [];
  const t = text.trim();

  if (looksLikeRandomString(t)) {
    reasons.push('This looks like a random password or recovery code.');
  }
  if (looksLikeBase32(t)) {
    reasons.push('This looks like a TOTP/MFA seed.');
  }
  if (looksLikeSeedPhrase(t)) {
    reasons.push('This looks like a recovery seed phrase.');
  }

  return { concern: reasons.length > 0, reasons };
}
