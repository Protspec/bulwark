export const PHISH_THRESHOLD = 3;

export const TIMEOUT = 4000;

export const HTML_KEYWORDS = [
  'obfuscation',
  'unescape(',
  'partner-address',
  'data-wf-domain',
  'lorem.ipsum/npm/fallback.js',
  'function _0x',
  '(function(_0x',
];

export const STRONG_HTML_KEYWORDS = [
  'data-scrapbook-',
  'data-savepage-',
  'saved with singlefile',
  'httrack website copier',
];

export const WEAK_HTML_KEYWORDS = [
  'unprecedented',
  'limited time',
  'embrace',
  'kindly',
  'victim',
  'drain',
  'web.archive.org',
];

export const DOMAIN_KEYWORDS = [
  'usdt',
  'usdc',
  'wl',
  'claim',
  'whitelist',
  'web.app',
  'vercel.app',
  'pages.dev',
  'netlify.app',
];

export const JS_KEYWORDS = [
  'draineraddress',
  'victim',
  'enter your private key',
  'enter your recovery phrase',
  '#privatekey',
  'static async[T(',
  'data:application/wasm;base64',
];

export const STRONG_JS_KEYWORDS = [
  'victim_to_pay',
  'minimaldrainvalue',
  'useWarningBypass1',
  '@redacted/enterprise-plugin',
  'debugger;',
  'debugger ;',
  'constructor("debugger")',
  'drainer.gg',
  'logDrainingStrategy',
  'is_victim_on_mobile',
  '\\u0064\\u0065\\u0062\\u0075',
  'function _0x',
  '(function(_0x',
];

export const WEAK_JS_KEYWORDS = [
  'draining',
  'seaport',
  'x2y2', // may appear in hashes
  'moonbird',
  'moon_bird',
  'cryptopunk',
];

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
  '.support',
  '.nl',
  '.pl',
  '.run',
  '.events',
];
