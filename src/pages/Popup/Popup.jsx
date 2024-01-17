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
  'Detected in HTML': null,
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
];

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
  const [ogUrl, setOgUrl] = useState(null);
  const [blocklist, setBlocklist] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [scamSites, setScamSites] = useState(null);

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

      chrome.scripting
        .executeScript({
          target: { tabId: tabs[0].id },
          function: getDOMContent,
        })
        .then((results) => {
          setTitle(results[0].result[0]);
          setContent(results[0].result[1]);
          setOgUrl(results[0].result[2]);
        });
    });
  }, []);

  useEffect(() => {
    if ((hostname || pathname) && blocklist) {
      evaluateUrl(hostname, pathname);
    }
  }, [hostname, blocklist]);

  const evaluateUrl = (hostname, pathname) => {
    const updatedConditions = getUpdatedConditions(hostname, pathname);
    const determinedGrade = determineGrade(updatedConditions);
    setConditions(updatedConditions);
    setGrade(determinedGrade);
    setBlocked(blocklist.some((blocklist) => hostname.includes(blocklist)));

    if (isPhishingGrade(grade) || blocked) {
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
  };

  const getUpdatedConditions = (hostname, pathname) => ({
    ...conditions,
    'Detected in domain':
      hostname.split('.').some((part) => /-/.test(part)) ||
      SUS_KEYWORDS.some((keyword) => hostname.includes(keyword)),
    'Detected in top-level domain': SUS_TLDS.some((tld) =>
      hostname.split('.').slice(-2).join('.').endsWith(tld)
    ),
    'Detected in pathname': SUS_KEYWORDS.some((keyword) =>
      pathname.includes(keyword)
    ),
    'Detected in title':
      title && SUS_KEYWORDS.some((keyword) => title.includes(keyword)),
    'Detected in HTML':
      (content && SUS_KEYWORDS.some((keyword) => content.includes(keyword))) ||
      (ogUrl && !ogUrl.includes(hostname)),
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

  const getDOMContent = () => {
    const metaOgUrl = document.querySelector('meta[property="og:url"]');

    return [
      document.title.toLowerCase(),
      document.body.textContent.toLowerCase(),
      metaOgUrl !== null && metaOgUrl.content,
    ];
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
        <span className="scam-count">
          <img src={textSkull} className="count-icon" alt="Skull" />
          <strong>{scamSites && scamSites.length}</strong>
        </span>
      </footer>
    </div>
  );
}

export default Popup;
