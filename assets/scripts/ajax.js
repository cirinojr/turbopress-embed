const fetchData = async (action,id) => {
  const url = ajax_object.ajax_url;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'action': action,
        'id': id,
        'nonce': ajax_object.nonce
    })
  });

    if (!response.ok) {
      throw new Error('Internet connection error!');
    }

    const data = await response.text();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
  return false;
};

export default fetchData;
