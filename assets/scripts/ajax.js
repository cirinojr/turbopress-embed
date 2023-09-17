const fetchData = async (action,id) => {
  const url = '/wp-admin/admin-ajax.php';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `action=${action}&id=${id}`
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
