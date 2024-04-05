const fetchData = async (action) => {
  const url = ajax_object.ajax_url;
  try {
    const response = await fetch(url+'?action='+action);

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
