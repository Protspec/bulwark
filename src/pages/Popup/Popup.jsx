import React, { useCallback, useEffect, useState } from 'react';
import './Popup.css';
import logo from '../../assets/img/logo.svg';
import skull from '../../assets/img/skull.svg';
import textSkull from '../../assets/img/text-skull.svg';
import {
  INITIAL_CONDITIONS,
  HTML_KEYWORDS,
  SUS_KEYWORDS,
  DOMAIN_KEYWORDS,
  JS_KEYWORDS,
  TLD_KEYWORDS,
} from '../../utils/constants';

function Popup() {
  const [conditions, setConditions] = useState(INITIAL_CONDITIONS);
  const [grade, setGrade] = useState(null);
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

  const getUpdatedConditions = useCallback(
    () => ({
      ...conditions,
      'Detected in domain':
        hostname.split('.').some((part) => /-/.test(part)) ||
        SUS_KEYWORDS.some((keyword) => hostname.includes(keyword)) ||
        DOMAIN_KEYWORDS.some((keyword) => hostname.includes(keyword)) ||
        /^([^.]+\.){3,}/.test(hostname),
      'Detected in top-level domain': TLD_KEYWORDS.some((tld) =>
        hostname.split('.').slice(-2).join('.').endsWith(tld)
      ),
      'Detected in pathname': SUS_KEYWORDS.some((keyword) =>
        pathname.includes(keyword)
      ),
      'Detected in title':
        title && SUS_KEYWORDS.some((keyword) => title.includes(keyword)),
      'Detected in metadata':
        (metaTags[0] !== null &&
          !metaTags[0].includes(hostname) &&
          metaTags[0] !== '/') ||
        false,
      'Detected in HTML':
        content && SUS_KEYWORDS.some((keyword) => content.includes(keyword)),
      'Detected in HTML (2)':
        content && HTML_KEYWORDS.some((keyword) => content.includes(keyword)),
      'Detected in JavaScript': jsTags ? jsCheck(jsTags) : false,
    }),
    [hostname, pathname, jsTags, conditions, metaTags, title, content]
  );

  const evaluateUrl = () => {
    const updatedConditions = getUpdatedConditions(hostname, pathname, jsTags);
    const determinedGrade = determineGrade(updatedConditions);
    setConditions(updatedConditions);
    setGrade(determinedGrade);
    setBlocked(blocklist.some((blocklist) => hostname.includes(blocklist)));

    if ((isPhishingGrade(determinedGrade) || blocked) && !isIncognito) {
      if (scamSites.length === 0) {
        chrome.storage.sync.set({ scamSites: [hostname] });
        setScamSites([hostname]);
      } else if (!scamSites.includes(hostname)) {
        let newScamSites = [...scamSites, hostname];
        chrome.storage.sync.set({ scamSites: newScamSites });
        setScamSites(newScamSites);
      }
    }
  };

  const determineGrade = (updatedConditions) => {
    const negativeConditionsCount =
      Object.values(updatedConditions).filter(Boolean).length;
    const grades = ['A', 'B', 'C', 'D', 'F'];
    return grades[Math.min(negativeConditionsCount, 4)];
  };

  const isPhishingGrade = (grade) => {
    const phishingGrades = ['C', 'D', 'F'];
    return phishingGrades.includes(grade);
  };

  useEffect(() => {
    if (grade === null || !started) {
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
    if (grade === null && blocklist && jsTags) {
      evaluateUrl();
    }
  }, [blocklist, jsTags, evaluateUrl, grade]);

  return (
    <div
      className={`App ${(isPhishingGrade(grade) || blocked) && 'is-phishing'}`}
    >
      <main
        style={{
          backgroundImage: `url(${
            (isPhishingGrade(grade) || blocked) && skull
          })`,
        }}
      >
        <h1 className="domain">
          <span>{hostname}</span>
        </h1>
        {isPhishingGrade(grade) || blocked ? (
          <>
            <h3 className="is-scam">DANGER</h3>
            <p className="is-scam">
              {blocked
                ? 'Flagged as malicious, do not interact.'
                : 'Scam indicators found, do not interact.'}
            </p>
          </>
        ) : (
          <p className="is-benign">Not enough scam indicators detected</p>
        )}
        <ul className="indicatorList">
          <li className={`${!blocked && 'null'}`}>
            <span>{blocked === null ? '❓' : blocked ? '❌' : '〰️'}</span>{' '}
            Recently added to blocklist
          </li>
          {Object.entries(conditions).map(([condition, value], index) => (
            <li key={index} className={`${!value && 'null'}`}>
              <span>{value === null ? '❓' : value ? '❌' : '〰️'}</span>{' '}
              {condition}
            </li>
          ))}
        </ul>
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
            // If the response is not successful (including CORS errors), don't process further.
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.text();
        })
        .catch((error) => {
          // Log the error, but don't add a rejected promise to `scriptPromises`.
          console.error('Error fetching script:', error);
        });

      // Only add promises that we know will either resolve successfully or not be added at all.
      scriptPromises.push(promise);
    }
  });

  // Filter out any undefined entries due to failed fetches before waiting for all promises.
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

function jsCheck(scripts) {
  const keywords = JS_KEYWORDS;
  let result = false;
  scripts.forEach((script) => {
    result =
      result ||
      keywords.some((keyword) => {
        if (script.toLowerCase().includes(keyword)) {
          if (
            keyword === 'drain' &&
            script.includes('drainKeysFoundInLookupTable')
          ) {
            return false;
          }
          return true;
        }
        return false;
      });
  });

  return result;
}

export default Popup;
