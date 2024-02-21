import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Popup.css';
import logo from '../../assets/img/logo.svg';
import skull from '../../assets/img/skull.svg';
import textSkull from '../../assets/img/text-skull.svg';
import {
  PHISH_THRESHOLD,
  HTML_KEYWORDS,
  WEAK_HTML_KEYWORDS,
  DOMAIN_KEYWORDS,
  WEAK_JS_KEYWORDS,
  JS_KEYWORDS,
  TLD_KEYWORDS,
} from '../../utils/constants';

function Popup() {
  const [siteData, setSiteData] = useState({
    hostname: null,
    pathname: null,
    title: null,
    content: null,
    metaTags: [null],
    jsTags: null,
  });
  const [isPhish, setIsPhish] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [scamSites, setScamSites] = useState(null);
  const [done, setDone] = useState(false);

  const blocklist = useRef(null);
  const score = useRef(0);
  const started = useRef(false);
  const isIncognito = useRef(true);

  const handleMessage = (message, sender, sendResponse) => {
    const results = message.results;
    if (results) {
      const [title, content, metaTags, scriptContents] = results;
      setSiteData((prevData) => ({
        ...prevData,
        title,
        content,
        metaTags,
        jsTags: scriptContents,
      }));

      chrome.runtime.onMessage.removeListener(handleMessage);
    }
  };

  const getUpdatedConditions = useCallback(() => {
    console.log(siteData);
    let tempScore = 0;

    if (
      siteData.hostname.split('.').some((part) => /-/.test(part)) ||
      WEAK_HTML_KEYWORDS.some((keyword) =>
        siteData.hostname.includes(keyword)
      ) ||
      DOMAIN_KEYWORDS.some((keyword) => siteData.hostname.includes(keyword)) ||
      /^([^.]+\.){3,}/.test(siteData.hostname)
    ) {
      tempScore += 1;
    }

    if (
      TLD_KEYWORDS.some((tld) =>
        siteData.hostname.split('.').slice(-2).join('.').endsWith(tld)
      )
    ) {
      tempScore += 1;
    }

    if (
      WEAK_HTML_KEYWORDS.some((keyword) => siteData.pathname.includes(keyword))
    ) {
      tempScore += 1;
    }

    if (
      siteData.title &&
      WEAK_HTML_KEYWORDS.some((keyword) => siteData.title.includes(keyword))
    ) {
      tempScore += 1;
    }

    if (
      (siteData.metaTags[0] !== null &&
        !siteData.metaTags[0].includes(siteData.hostname) &&
        siteData.metaTags[0] !== '/') ||
      false
    ) {
      tempScore += 1;
    }

    if (
      siteData.content &&
      WEAK_HTML_KEYWORDS.some((keyword) => siteData.content.includes(keyword))
    ) {
      tempScore += 1;
    }

    if (
      siteData.content &&
      HTML_KEYWORDS.some((keyword) => siteData.content.includes(keyword))
    ) {
      tempScore += 1;
    }

    if (siteData.jsTags && jsCheck(siteData.jsTags, WEAK_JS_KEYWORDS)) {
      tempScore += 1;
    }

    if (siteData.jsTags && jsCheck(siteData.jsTags, JS_KEYWORDS)) {
      tempScore += 2;
    }

    return tempScore;
  }, [siteData]);

  const evaluateUrl = async () => {
    const determinedScore = getUpdatedConditions();
    score.current = determinedScore;
    setBlocked(
      blocklist.current.some((blockitem) =>
        siteData.hostname.includes(blockitem)
      )
    );
    setIsPhish(determinedScore >= PHISH_THRESHOLD);

    if (
      (determinedScore >= PHISH_THRESHOLD || blocked) &&
      !isIncognito.current
    ) {
      if (scamSites.length === 0) {
        chrome.storage.sync.set({ scamSites: [siteData.hostname] });
        setScamSites([siteData.hostname]);
      } else if (!scamSites.includes(siteData.hostname)) {
        const newScamSites = [...scamSites, siteData.hostname];
        chrome.storage.sync.set({ scamSites: newScamSites });
        setScamSites(newScamSites);
      }
    }

    setDone(true);
  };

  useEffect(() => {
    if (score.current === 0 || !started.current) {
      started.current = true;
      chrome.windows.getCurrent((window) => {
        isIncognito.current = window.incognito;
      });

      fetch(
        'https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/hotlist.json'
      )
        .then(function (response) {
          if (response.status !== 200) {
            console.log(response.status);
            throw new Error('Failed to fetch hotlist');
          }

          response.json().then(function (data) {
            blocklist.current = data;
          });
        })
        .catch(function (err) {
          console.log('Fetch Error: ', err);
          blocklist.current = [];
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

      const queryOptions = { active: true, currentWindow: true };
      chrome.tabs.query(queryOptions, (tabs) => {
        const url = new URL(tabs[0].url);
        setSiteData((prevData) => ({
          ...prevData,
          hostname: url.hostname.toLowerCase(),
          pathname: url.pathname.toLowerCase(),
        }));

        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: invokeContentScript,
        });
      });
      chrome.runtime.onMessage.addListener(handleMessage);
    }
  }, []);

  useEffect(() => {
    if (score.current === 0 && blocklist.current && siteData.jsTags) {
      evaluateUrl();
    }
  }, [blocklist.current, siteData.jsTags, evaluateUrl, score.current]);

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
          <span>{siteData.hostname}</span>
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
            <>
              {done ? (
                <p className="is-benign">
                  Not enough scam indicators detected.
                </p>
              ) : (
                <h3 className="is-benign">ANALYZING…</h3>
              )}
            </>
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

  const scriptPromises = scripts.map((script) => {
    if (
      script.src.toLowerCase().includes(host) &&
      !script.src.toLowerCase().includes('_next')
    ) {
      return fetch(script.src)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .catch((error) => {
          console.error('Error fetching script:', error);
        });
    }
    return Promise.resolve(undefined);
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
