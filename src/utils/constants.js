export const PHISH_THRESHOLD = 3;

export const WEAK_HTML_KEYWORDS = [
  'web.archive.org',
  'victim',
  'drain',
  'ico',
  'index.php',
];

export const HTML_KEYWORDS = [
  'function _0x',
  '(function(_0x',
  'unescape(',
  'partner-address',
  'data-wf-domain',
  'obfuscation',
  'lorem.ipsum/npm/fallback.js',
  'sweetalert',
  'window.open(',
];

export const STRONG_HTML_KEYWORDS = [
  'data-scrapbook-',
  'data-savepage-',
  'saved with singlefile',
  'httrack website copier',
  'wix.com website builder',
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

export const WEAK_JS_KEYWORDS = [
  'draining',
  'seaport',
  'x2y2', // may appear in hashes
  'moonbird',
  'moon_bird',
  'cryptopunk',
  'location=no',
];

export const JS_KEYWORDS = [
  'data:application/wasm;base64',
  'draineraddress',
  'victim',
  'static async[t(',
  'enter your private key',
  'enter your recovery phrase',
  '#privatekey',
];

export const STRONG_JS_KEYWORDS = [
  'minimaldrainvalue',
  '(function(_0x',
  'function _0x',
  'victim_to_pay',
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
  'riddance-',
  'riddancelog',
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
  '.cm',
  '.live',
];
