const fetchData = async (action, payload = {}) => {
  const normalizedPayload =
    typeof payload === 'string'
      ? { url: payload }
      : payload;

  try {
    const response = await fetch(turbopressEmbedConfig.ajaxUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        action,
        nonce: turbopressEmbedConfig.nonce,
        ...normalizedPayload,
      }),
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
};

export default fetchData;
