import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Popup.css';
import logo from '../../assets/img/logo.svg';
import skull from '../../assets/img/skull.svg';
import textSkull from '../../assets/img/text-skull.svg';
import determineScore from '../../utils/checkers';
import { PHISH_THRESHOLD } from '../../utils/constants';
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
  const [scamSites, setScamSites] = useState([]);
  const [cantScan, setCantScan] = useState(false);
  const [done, setDone] = useState(false);

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

  const clearScamSites = () => {
    chrome.storage.sync.set({ scamSites: [] });
    setScamSites([]);
  };

  const evaluateUrl = async () => {
    const determinedScore = determineScore(
      hostname,
      pathname,
      jsTags,
      metaTags,
      title,
      content
    );
    score.current = determinedScore;
    setIsPhish(determinedScore >= PHISH_THRESHOLD);

    if (determinedScore >= PHISH_THRESHOLD && !isIncognito.current) {
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

  useEffect(() => {
    if (score.current === null || !started.current) {
      started.current = true;

      const queryOptions = { active: true, currentWindow: true };
      chrome.tabs.query(queryOptions, (tabs) => {
        const url = new URL(tabs[0].url);

        if (url.protocol === 'file:') {
          setCantScan(true);
          return undefined;
        }

        setHostname(url.hostname.toLowerCase());
        setPathname(url.pathname.toLowerCase());

        chrome.scripting
          .executeScript({
            target: { tabId: tabs[0].id },
            function: invokeContentScript,
          })
          .catch((error) => {
            console.log(error);
            setCantScan(true);
            return undefined;
          });

        chrome.windows.getCurrent((window) => {
          isIncognito.current = window.incognito;
        });

        chrome.storage.sync.get(['scamSites'], (result) => {
          if (result.scamSites) {
            setScamSites(result.scamSites);
          } else {
            setScamSites([]);
          }
        });

        chrome.runtime.onMessage.addListener(handleMessage);
      });
    }
  }, [score, started]);

  useEffect(() => {
    if (score.current === null && content && hostname) {
      evaluateUrl();
    }
  }, [content, hostname, evaluateUrl]);

  return (
    <div className={`App ${isPhish && 'is-phishing'}`}>
      <main
        style={{
          backgroundImage: `url(${isPhish && skull})`,
          backgroundPosition: `center 50px`,
          backgroundSize: `50%`,
        }}
      >
        {cantScan
          ? renderBlockedScan()
          : renderMainContent(hostname, isPhish, done)}
      </main>
      <footer className="footer">
        <span
          className="settings-button side-icon"
          data-text="Info & Data"
          onClick={clearScamSites}
        >
          <span>⚙</span>
        </span>
        <a href="https://protspec.com" target="_blank" rel="noreferrer">
          <img src={logo} className="App-logo" alt="Bulwark logo" />
        </a>
        <span
          className="scam-count side-icon"
          data-text="Scams detected (click to reset)"
          onClick={clearScamSites}
        >
          <strong>{scamSites && scamSites.length}</strong>
          <img src={textSkull} className="count-icon" alt="Skull" />
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

const renderMainContent = (hostname, firstCondition, secondCondition) => {
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
              Indicators that this site is a crypto phishing scam were detected.
            </p>
            <p className="is-scam">Do not interact with this site.</p>
          </>
        ) : (
          <>
            {secondCondition ? (
              <>
                <h3 className="is-benign">BENIGN</h3>
                <p className="is-benign">
                  Not enough indicators found to classify this site as a crypto
                  phishing scam.
                </p>
              </>
            ) : (
              <>
                <h3 className="is-benign">ANALYZING…</h3>
                <p className="is-benign">
                  All site data needs to load before analysis can be completed.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

const invokeContentScript = async () => {
  const metaOgUrl = document.querySelector('meta[property="og:url"]');

  const domMetaTags = [
    metaOgUrl && metaOgUrl.content ? metaOgUrl.content : null,
  ];
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

  const validScripts = scripts
    .sort((a, b) => {
      const aIncludesHost = a.src.toLowerCase().includes(host);
      const bIncludesHost = b.src.toLowerCase().includes(host);

      if (aIncludesHost && !bIncludesHost) {
        return -1;
      }
      if (!aIncludesHost && bIncludesHost) {
        return 1;
      }
      return 0;
    })
    .filter((script) => !script.src.toLowerCase().includes('_next'));

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

export default Popup;
