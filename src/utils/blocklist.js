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

export default fetchBlocklist;
