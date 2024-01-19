import React, { useEffect, useState } from 'react';
import './Popup.css';
import logo from '../../assets/img/logo.svg';
import skull from '../../assets/img/skull.svg';
import textSkull from '../../assets/img/text-skull.svg';

const INITIAL_CONDITIONS = {
  'Detected in domain': null,
  'Detected in top-level domain': null,
  'Detected in pathname': null,
  'Detected in title': null,
  'Detected in metadata': null,
  'Detected in HTML': null,
  'Detected in JavaScript': null,
};

const SUS_KEYWORDS = [
  'usdc',
  'usdt',
  'whitelist',
  'airdrop',
  'apecoin',
  'starknet',
  'celestia',
  'unprecedented',
  'potential',
  'embrace',
  'zeros',
  'distribution',
  'disable vpn',
  'disable your vpn',
  'limited time',
  'token',
  'embrace',
  'kindly',
  'migrat',
  'claim',
  'victim',
  'poor',
];

const JS_KEYWORDS = ['drain', 'victim', 'victim', 'poor', 'seaport'];

const SUS_TLDS = [
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
];

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
  const [isDone, setIsDone] = useState(false);

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

  useEffect(() => {
    if (grade === null || !isDone) {
      setIsIncognito(chrome.windows.getCurrent.isIncognito);

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
          function: getDOMContent,
        });
      });
    }
  }, []);

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

  chrome.runtime.onMessage.addListener(handleMessage);

  useEffect(() => {
    if (grade === null && blocklist && jsTags) {
      evaluateUrl(hostname, pathname, jsTags);
    }
  }, [hostname, blocklist, jsTags]);

  const evaluateUrl = (hostname, pathname, jsTags) => {
    console.log(jsTags);
    const updatedConditions = getUpdatedConditions(hostname, pathname, jsTags);
    const determinedGrade = determineGrade(updatedConditions);
    setConditions(updatedConditions);
    setGrade(determinedGrade);
    setBlocked(blocklist.some((blocklist) => hostname.includes(blocklist)));

    if ((isPhishingGrade(grade) || blocked) && !isIncognito) {
      let newScamSites = [...scamSites, hostname];

      if (scamSites.length === 0) {
        chrome.storage.sync.set({ scamSites: [hostname] });
        setScamSites([hostname]);
      } else if (!scamSites.includes(hostname)) {
        let newScamSites = [...scamSites, hostname];
        chrome.storage.sync.set({ scamSites: newScamSites });
        setScamSites(newScamSites);
      }
    }

    setIsDone(true);
  };

  const getUpdatedConditions = (hostname, pathname, jsTags) => ({
    ...conditions,
    'Detected in domain':
      hostname.split('.').some((part) => /-/.test(part)) ||
      SUS_KEYWORDS.some((keyword) => hostname.includes(keyword)) ||
      /^([^.]+\.){3,}/.test(hostname),
    'Detected in top-level domain': SUS_TLDS.some((tld) =>
      hostname.split('.').slice(-2).join('.').endsWith(tld)
    ),
    'Detected in pathname': SUS_KEYWORDS.some((keyword) =>
      pathname.includes(keyword)
    ),
    'Detected in title':
      title && SUS_KEYWORDS.some((keyword) => title.includes(keyword)),
    'Detected in metadata':
      (metaTags[0] !== null && !metaTags[0].includes(hostname)) ||
      metaTags[1] ||
      metaTags[2] ||
      false,
    'Detected in HTML':
      content && SUS_KEYWORDS.some((keyword) => content.includes(keyword)),
    'Detected in JavaScript': jsTags ? jsCheck(jsTags, JS_KEYWORDS) : false,
  });

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

  const getDOMContent = async () => {
    const metaOgUrl = document.querySelector('meta[property="og:url"]');
    const saveUrl = document.querySelector('meta[name="savepage-url"]');
    const scrapUrl = document
      .querySelector('html')
      .getAttribute('data-scrapbook-source');

    const domMetaTags = [
      metaOgUrl ? metaOgUrl.content : null,
      saveUrl ? saveUrl.content : null,
      scrapUrl || null,
    ];

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const host = window.location.host;
    const scriptPromises = scripts
      .filter(
        (script) =>
          script.src.toLowerCase().includes(host) &&
          !script.src.toLowerCase().includes('_next')
      )
      .map((script) =>
        fetch(script.src)
          .then((response) => response.text())
          .catch((error) => null)
      );

    const scriptContents = await Promise.all(scriptPromises);

    const results = [
      document.title.toLowerCase(),
      document.body.textContent.toLowerCase(),
      domMetaTags,
      scriptContents,
    ];

    chrome.runtime.sendMessage({ results });
  };

  const jsCheck = (scripts, keywords) => {
    let result = false;
    scripts.forEach((script) => {
      if (keywords.some((keyword) => script.toLowerCase().includes(keyword))) {
        console.log('keyword found');
        result = true;
      } else {
        console.log('keyword not found');
      }
    });

    return result;
  };

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
        <a href="https://protspec.com" target="_blank">
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

export default Popup;
