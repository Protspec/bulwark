import React, { useCallback, useEffect, useState } from 'react';
import './Popup.css';
import logo from '../../assets/img/logo.svg';
import skull from '../../assets/img/skull.svg';
import textSkull from '../../assets/img/text-skull.svg';
import {
  HTML_KEYWORDS,
  WEAK_HTML_KEYWORDS,
  DOMAIN_KEYWORDS,
  WEAK_JS_KEYWORDS,
  JS_KEYWORDS,
  TLD_KEYWORDS,
} from '../../utils/constants';

function Popup() {
  const [score, setScore] = useState(0);
  const [isPhish, setIsPhish] = useState(false);
  const [hostname, setHostname] = useState(null);
  const [pathname, setPathname] = useState(null);
  const [title, setTitle] = useState(null);
  const [content, setContent] = useState(null);
  const [metaTags, setMetaTags] = useState([null]);
  const [jsTags, setJsTags] = useState(null);
  const [blocklist, setBlocklist] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [scamSites, setScamSites] = useState(null);
  const [isIncognito, setIsIncognito] = useState(true);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  const handleMessage = (message, sender, sendResponse) => {
    const results = message.results;
    if (results) {
      const [title, content, metaTags, scriptContents] = results;
      setTitle(title);
      setContent(content);
      setMetaTags(metaTags);
      setJsTags(scriptContents);

      chrome.runtime.onMessage.removeListener(handleMessage);
    }
  };

  const getUpdatedConditions = useCallback(() => {
    let tempScore = 0;

    if (
      hostname.split('.').some((part) => /-/.test(part)) ||
      WEAK_HTML_KEYWORDS.some((keyword) => hostname.includes(keyword)) ||
      DOMAIN_KEYWORDS.some((keyword) => hostname.includes(keyword)) ||
      /^([^.]+\.){3,}/.test(hostname)
    ) {
      tempScore += 1;
    }

    if (
      TLD_KEYWORDS.some((tld) =>
        hostname.split('.').slice(-2).join('.').endsWith(tld)
      )
    ) {
      tempScore += 1;
    }

    if (WEAK_HTML_KEYWORDS.some((keyword) => pathname.includes(keyword))) {
      tempScore += 1;
    }

    if (
      title &&
      WEAK_HTML_KEYWORDS.some((keyword) => title.includes(keyword))
    ) {
      tempScore += 1;
    }

    if (
      (metaTags[0] !== null &&
        !metaTags[0].includes(hostname) &&
        metaTags[0] !== '/') ||
      false
    ) {
      tempScore += 1;
    }

    if (
      content &&
      WEAK_HTML_KEYWORDS.some((keyword) => content.includes(keyword))
    ) {
      tempScore += 1;
    }

    if (content && HTML_KEYWORDS.some((keyword) => content.includes(keyword))) {
      tempScore += 1;
    }

    if (jsTags && jsCheck(jsTags, WEAK_JS_KEYWORDS)) {
      tempScore += 1;
    }

    if (jsTags && jsCheck(jsTags, JS_KEYWORDS)) {
      tempScore += 2;
    }

    return tempScore;
  }, [hostname, pathname, jsTags, metaTags, title, content]);

  const evaluateUrl = async () => {
    const determinedScore = getUpdatedConditions();
    setScore(determinedScore);
    setBlocked(blocklist.some((blocklist) => hostname.includes(blocklist)));
    setIsPhish(determinedScore >= 3); // Use determinedScore instead of score

    if ((determinedScore >= 3 || blocked) && !isIncognito) {
      // Use determinedScore instead of isPhish
      if (scamSites.length === 0) {
        chrome.storage.sync.set({ scamSites: [hostname] });
        setScamSites([hostname]);
      } else if (!scamSites.includes(hostname)) {
        let newScamSites = [...scamSites, hostname];
        chrome.storage.sync.set({ scamSites: newScamSites });
        setScamSites(newScamSites);
      }
    }

    setDone(true);
  };

  useEffect(() => {
    if (score === 0 || !started) {
      setStarted(true);
      setIsIncognito(chrome.windows.getCurrent.isIncognito);

      fetch(
        'https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/hotlist.json'
      )
        .then(function (response) {
          if (response.status !== 200) {
            console.log(response.status);
            return;
          }

          response.json().then(function (data) {
            setBlocklist(data);
          });
        })
        .catch(function (err) {
          console.log('Fetch Error: ', err);
        });

      if (scamSites === null) {
        chrome.storage.sync.get(['scamSites'], (result) => {
          if (result.scamSites) {
            setScamSites(result.scamSites);
          } else {
            setScamSites([]);
          }
        });
      }

      let queryOptions = { active: true, currentWindow: true };
      chrome.tabs.query(queryOptions, (tabs) => {
        const url = new URL(tabs[0].url);
        setHostname(url.hostname.toLowerCase());
        setPathname(url.pathname.toLowerCase());

        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: invokeContentScript,
        });
      });
      chrome.runtime.onMessage.addListener(handleMessage);
    }
  }, []);

  useEffect(() => {
    if (score === 0 && blocklist && jsTags) {
      evaluateUrl();
    }
  }, [blocklist, jsTags, evaluateUrl, score]);

  return (
    <div className={`App ${(isPhish || blocked) && 'is-phishing'}`}>
      <main
        style={{
          backgroundImage: `url(${(isPhish || blocked) && skull})`,
          backgroundPosition: `center 50px`,
          backgroundSize: `50%`,
        }}
      >
        <h1 className="domain">
          <span>{hostname}</span>
        </h1>
        <div className="explanation">
          {isPhish || blocked ? (
            <>
              <h3 className="is-scam">DANGER</h3>
              <p className="is-scam">
                {blocked
                  ? 'This site has been reported as a crypto phishing scam.'
                  : 'Indicators that this site is a crypto phishing scam were detected.'}
              </p>
              <p className="is-scam">Do not interact with this site.</p>
            </>
          ) : (
            <p className="is-benign">
              {done ? (
                <p className="is-benign">Not enough indicators detected</p>
              ) : (
                <h3 className="is-benign">ANALYZING…</h3>
              )}
            </p>
          )}
        </div>
      </main>
      <footer className="footer">
        <a href="https://protspec.com" target="_blank" rel="noreferrer">
          <img src={logo} className="App-logo" alt="Bulwark logo" />
        </a>
        <span className="scam-count" data-text="Scams detected">
          <img src={textSkull} className="count-icon" alt="Skull" />
          <strong>{scamSites && scamSites.length}</strong>
        </span>
      </footer>
    </div>
  );
}

async function invokeContentScript() {
  const metaOgUrl = document.querySelector('meta[property="og:url"]');

  const domMetaTags = [metaOgUrl ? metaOgUrl.content : null];

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const host = window.location.host;
  const scriptPromises = [];

  scripts.forEach((script) => {
    if (
      script.src.toLowerCase().includes(host) &&
      !script.src.toLowerCase().includes('_next')
    ) {
      const promise = fetch(script.src)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .catch((error) => {
          console.error('Error fetching script:', error);
        });

      scriptPromises.push(promise);
    }
  });

  const scriptContents = (await Promise.all(scriptPromises)).filter(
    (content) => content !== undefined
  );

  const results = [
    document.title.toLowerCase(),
    document.documentElement.outerHTML.toLowerCase(),
    domMetaTags,
    scriptContents,
  ];

  chrome.runtime.sendMessage({ results });
}

function jsCheck(scripts, list) {
  const keywords = list;
  let result = false;
  scripts.forEach((script) => {
    result =
      result ||
      keywords.some((keyword) => {
        return script.toLowerCase().includes(keyword);
      });
  });

  return result;
}

export default Popup;
