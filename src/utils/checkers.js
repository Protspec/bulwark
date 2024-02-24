import {
  HTML_KEYWORDS,
  WEAK_HTML_KEYWORDS,
  DOMAIN_KEYWORDS,
  WEAK_JS_KEYWORDS,
  STRONG_JS_KEYWORDS,
  JS_KEYWORDS,
  TLD_KEYWORDS,
} from './constants';

const determineScore = (
  hostname,
  pathname,
  jsTags,
  metaTags,
  title,
  content
) => {
  let tempScore = 0;
  let domain = '';

  const parts = hostname.split('.');

  if (parts.length > 2) {
    if (
      parts[parts.length - 2].length <= 3 &&
      parts[parts.length - 1].length === 2
    ) {
      domain = parts.slice(parts.length - 3).join('.');
    } else {
      domain = parts.slice(parts.length - 2).join('.');
    }
  } else {
    domain = hostname;
  }

  if (
    hostname &&
    (hostname.split('.').some((part) => /-/.test(part)) ||
      WEAK_HTML_KEYWORDS.some((keyword) => hostname.includes(keyword)) ||
      /^([^.]+\.){3,}/.test(hostname))
  ) {
    tempScore += 1;
    console.log('hostname');
  }

  if (
    hostname &&
    DOMAIN_KEYWORDS.some((keyword) => hostname.includes(keyword))
  ) {
    console.log('domain');
    tempScore += 1;
  }

  if (
    hostname &&
    TLD_KEYWORDS.some((tld) =>
      hostname.split('.').slice(-2).join('.').endsWith(tld)
    )
  ) {
    console.log('tld');
    tempScore += 1;
  }

  if (
    pathname &&
    WEAK_HTML_KEYWORDS.some((keyword) => pathname.includes(keyword))
  ) {
    console.log('pathname');
    tempScore += 1;
  }

  if (title && WEAK_HTML_KEYWORDS.some((keyword) => title.includes(keyword))) {
    console.log('title');
    tempScore += 1;
  }

  if (
    (metaTags[0] !== null &&
      !metaTags[0].includes(domain) &&
      metaTags[0] !== '/') ||
    false
  ) {
    console.log('meta');
    tempScore += 1;
  }

  if (
    content &&
    WEAK_HTML_KEYWORDS.some((keyword) => content.includes(keyword))
  ) {
    console.log('weak html');
    tempScore += 1;
  }

  if (content && HTML_KEYWORDS.some((keyword) => content.includes(keyword))) {
    console.log('html');
    tempScore += 1;
  }

  if (jsTags && jsCheck(jsTags, WEAK_JS_KEYWORDS)) {
    console.log('weak js');
    tempScore += 1;
  }

  if (jsTags && jsCheck(jsTags, JS_KEYWORDS)) {
    console.log('js');
    tempScore += 2;
  }

  if (jsTags && jsCheck(jsTags, STRONG_JS_KEYWORDS)) {
    console.log('strong js');
    tempScore += 3;
  }

  return tempScore;
};

const jsCheck = (scripts, list) => {
  const keywords = list;
  return scripts.some((script) => {
    return keywords.some((keyword) => {
      return script.toLowerCase().includes(keyword);
    });
  });
};

export default determineScore;
