import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import DisableDevtool from 'disable-devtool';

chrome.management.getSelf((self) => {
  if (self.installType !== 'development') {
    DisableDevtool({ disableMenu: true });
  }
});

function Popup() {
  const [hostname, setHostname] = useState(null);
  const [pathname, setPathname] = useState(null);
  const [title, setTitle] = useState(null);
  const [content, setContent] = useState(null);
  const [metaTags, setMetaTags] = useState([null]);
  const [jsTags, setJsTags] = useState(null);
  const [isPhish, setIsPhish] = useState(false);
  const [blocked, setBlocked] = useState(null);
  const [scamSites, setScamSites] = useState([]);
  const [cantScan, setCantScan] = useState(false);
  const [done, setDone] = useState(false);

  const blocklist = useRef([]);
  const score = useRef(null);
  const started = useRef(false);
  const isIncognito = useRef(true);

  const handleMessage = useCallback((message, sender, sendResponse) => {
    const results = message.results;

    if (results) {
      const [title, content, metaTags, scriptContents] = results;
      setTitle(title);
      setContent(content);
      setMetaTags(metaTags);
      setJsTags(scriptContents);

      chrome.runtime.onMessage.removeListener(handleMessage);
    }
  });

  const getUpdatedConditions = useMemo(() => {
    let tempScore = 0;

    if (
      hostname &&
      (hostname.split('.').some((part) => /-/.test(part)) ||
        WEAK_HTML_KEYWORDS.some((keyword) => hostname.includes(keyword)) ||
        DOMAIN_KEYWORDS.some((keyword) => hostname.includes(keyword)) ||
        /^([^.]+\.){3,}/.test(hostname))
    ) {
      tempScore += 1;
    }

    if (
      hostname &&
      TLD_KEYWORDS.some((tld) =>
        hostname.split('.').slice(-2).join('.').endsWith(tld)
      )
    ) {
      tempScore += 1;
    }

    if (
      pathname &&
      WEAK_HTML_KEYWORDS.some((keyword) => pathname.includes(keyword))
    ) {
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
    const determinedScore = getUpdatedConditions;
    score.current = determinedScore;
    setBlocked(
      blocklist.current.some((blockitem) => hostname.includes(blockitem))
    );
    setIsPhish(determinedScore >= PHISH_THRESHOLD);

    if (
      (determinedScore >= PHISH_THRESHOLD || blocked) &&
      !isIncognito.current
    ) {
      if (scamSites.length === 0) {
        chrome.storage.sync.set({ scamSites: [hostname] });
        setScamSites([hostname]);
      } else if (!scamSites.includes(hostname)) {
        const newScamSites = [...scamSites, hostname];
        chrome.storage.sync.set({ scamSites: newScamSites });
        setScamSites(newScamSites);
      }
    }

    setDone(true);
  };

  const fetchBlocklist = async () => {
    try {
      const response = await fetch(
        'https://raw.githubusercontent.com/phishfort/phishfort-lists/master/blacklists/hotlist.json'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch hotlist');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      return [];
    }
  };

  useEffect(() => {
    if (score.current === null || !started.current) {
      started.current = true;

      const queryOptions = { active: true, currentWindow: true };
      chrome.tabs.query(queryOptions, (tabs) => {
        const url = new URL(tabs[0].url);

        if (url.toString().startsWith('chrome://')) {
          setCantScan(true);
          return undefined;
        } else {
          setHostname(url.hostname.toLowerCase());
          setPathname(url.pathname.toLowerCase());

          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: invokeContentScript,
          });

          chrome.windows.getCurrent((window) => {
            isIncognito.current = window.incognito;
          });

          fetchBlocklist().then((data) => {
            blocklist.current = data;
          });

          chrome.storage.sync.get(['scamSites'], (result) => {
            if (result.scamSites) {
              setScamSites(result.scamSites);
            } else {
              setScamSites([]);
            }
          });

          chrome.runtime.onMessage.addListener(handleMessage);
        }
      });
    }
  }, [score, started]);

  useEffect(() => {
    if (score.current === null && blocklist.current && title) {
      evaluateUrl();
    }
  }, [blocklist.current, title, evaluateUrl]);

  return (
    <div className={`App ${(isPhish || blocked) && 'is-phishing'}`}>
      <main
        style={{
          backgroundImage: `url(${(isPhish || blocked) && skull})`,
          backgroundPosition: `center 50px`,
          backgroundSize: `50%`,
        }}
      >
        {cantScan
          ? renderBlockedScan()
          : renderMainContent(hostname, blocked, isPhish || blocked, done)}
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

const renderBlockedScan = () => {
  return (
    <>
      <h1 className="domain">
        <span>Restricted browser page</span>
      </h1>
      <div className="explanation">
        <p className="is-benign">This page cannot be scanned.</p>
      </div>
    </>
  );
};

const renderMainContent = (
  hostname,
  blocked,
  firstCondition,
  secondCondition
) => {
  return (
    <>
      <h1 className="domain">
        <span>{hostname}</span>
      </h1>
      <div className="explanation">
        {firstCondition ? (
          <>
            <h3 className="is-scam">DANGER</h3>
            <p className="is-scam">
              {blocked
                ? 'This site has been reported as a crypto phishing scam by PhishFort.'
                : 'Indicators that this site is a crypto phishing scam were detected.'}
            </p>
            <p className="is-scam">Do not interact with this site.</p>
          </>
        ) : (
          <>
            {secondCondition ? (
              <p className="is-benign">Not enough scam indicators detected.</p>
            ) : (
              <h3 className="is-benign">ANALYZING…</h3>
            )}
          </>
        )}
      </div>
    </>
  );
};

const invokeContentScript = async () => {
  const metaOgUrl = document.querySelector('meta[property="og:url"]');

  const domMetaTags = [metaOgUrl ? metaOgUrl.content : null];

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const host = window.location.host;

  const fetchScripts = async (script) => {
    try {
      const response = await fetch(script.src);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    } catch (error) {
      console.error('Error fetching script:', error);
    }
  };

  const validScripts = scripts.filter(
    (script) =>
      script.src.toLowerCase().includes(host) &&
      !script.src.toLowerCase().includes('_next')
  );

  const scriptPromises = validScripts.map(fetchScripts);

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
};

const jsCheck = (scripts, list) => {
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
};

export default Popup;
