const fetchBlocklist = async () => {
  try {
    const response = await fetch(
      'https://gist.githubusercontent.com/d0wnlore/02225088d95e278662dfbe2d92897c23/raw/75bdba35906d695382167dca030cf02345d458c8/infostealer-domains.json'
    );
    if (!response.ok) {
      throw new Error('Failed to fetch blocklist');
    }
    const data = await response.json();
    return data;
  } catch (err) {
    return [];
  }
};

export default fetchBlocklist;
