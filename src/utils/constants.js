export const PHISH_THRESHOLD = 3;

export const TIMEOUT = 4000;

export const HTML_KEYWORDS = [
  'function _0x',
  '(function(_0x',
  'unescape(',
  'partner-address',
  'data-wf-domain',
  'obfuscation',
  'lorem.ipsum/npm/fallback.js',
];

export const STRONG_HTML_KEYWORDS = [
  'data-scrapbook-',
  'data-savepage-',
  'saved with singlefile',
  'httrack website copier',
  'window.open(',
];

export const WEAK_HTML_KEYWORDS = [
  'web.archive.org',
  'unprecedented',
  'limited time',
  'embrace',
  'kindly',
  'victim',
  'drain',
];

export const DOMAIN_KEYWORDS = [
  'web.app',
  'vercel.app',
  'pages.dev',
  'netlify.app',
  'wl',
  'claim',
  'whitelist',
  'usdt',
  'usdc',
];

export const JS_KEYWORDS = [
  'draineraddress',
  'victim',
  'static async[T(',
  'data:application/wasm;base64',
  'enter your private key',
  'enter your recovery phrase',
  '#privatekey',
];

export const STRONG_JS_KEYWORDS = [
  '(function(_0x',
  'function _0x',
  'victim_to_pay',
  'minimaldrainvalue',
  'useWarningBypass1',
  'logDrainingStrategy',
  'is_victim_on_mobile',
  '@redacted/enterprise-plugin',
  '\\u0064\\u0065\\u0062\\u0075',
  '\\x64\\x65\\x62\\x75',
  'debugger;',
  'debugger ;',
  'constructor("debugger")',
  "constructor('debugger')",
  'drainer.gg',
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
