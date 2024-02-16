export const INITIAL_CONDITIONS = {
  'Detected in domain': null,
  'Detected in top-level domain': null,
  'Detected in pathname': null,
  'Detected in title': null,
  'Detected in metadata': null,
  'Detected in HTML': null,
  'Detected in HTML (STRONG)': null,
  'Detected in JS': null,
  'Detected in JS (STRONG)': null,
};

export const STRONG_HTML_KEYWORDS = [
  'data-scrapbook-',
  'data-savepage-',
  'obfuscation',
  'unescape(',
  'partner-address',
  'lorem.ipsum/npm/fallback.js',
];

export const WEAK_HTML_KEYWORDS = [
  'unprecedented',
  'embrace',
  'limited time',
  'embrace',
  'kindly',
  'poor',
  'victim',
  'drain',
];

export const DOMAIN_KEYWORDS = ['usdt', 'usdc', 'wl', 'claim', 'whitelist'];

export const STRONG_JS_KEYWORDS = [
  'draining',
  'minimalDrainValue',
  'victim',
  'cryptopunk',
];

export const WEAK_JS_KEYWORDS = ['seaport', 'x2y2', 'moonbird', 'moon_bird'];

export const TLD_KEYWORDS = [
  '.ru',
  '.gift',
  '.cf',
  '.online',
  '.gq',
  '.biz',
  '.icu',
  '.yt',
  '.gr',
  '.claims',
  '.cl',
  '.af',
  '.cfd',
  '.pw',
  '.click',
  '.info',
  '.store',
  '.website',
  '.link',
  '.my',
  '.bid',
  '.estate',
  '.digital',
];
