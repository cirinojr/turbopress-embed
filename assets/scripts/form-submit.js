document.addEventListener("DOMContentLoaded", (event) => {

  let utm_params = null;
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  let validated = true;

  const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  };

  [
    "utm_source",
    "utm_content",
    "utm_campaign",
    "utm_term",
    "utm_medium",
  ].forEach((utm) => {
    let valUtm = getQueryParam(utm);
    if (typeof valUtm === "string" && valUtm.length) {
      if (utm === "utm_campaign") {
        if (!valUtm.match(/^.+-p1$/)) {
          valUtm += "-p1";
        }
      }

      utm_params = valUtm;

    }
  });

  const isNull = (field) => {
    const result = '' !== field.value ? false : true;
    return result;
  };

  const removeAlert = (field) => {
    if (field.parentNode.getElementsByTagName('i')[0]) {
      field.parentNode.getElementsByTagName('i')[0].remove();
    }
  };

  const addAlert = (field, msg = opt_form.required) => {
    const span = document.createElement('i');
    span.innerHTML = msg;
    field.parentNode.insertBefore(span, field);
    field.focus();
    validated = false;
  }
  const isRequired = (field) => {

    const types = ['text', 'email'];
    const existsTypes = types.includes(field.type);

    if (isNull(field) && field.hasAttribute('required') && existsTypes) {
      addAlert(field);
    }
  };

  const verifyEmail = (field) => {
    if (!isNull(field) && 'email' === field.type && !emailPattern.test(field.value)) {
      addAlert(field, opt_form.email_format);
    }
  }

  const fetchData = async (action) => {

    const url = ajax_object.ajax_url;
    const name = document.querySelector('#name');
    const email = document.querySelector('#email');


    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          'action': action,
          'nonce': ajax_object.nonce,
          'name': name.value,
          'email': email.value,
          'params': utm_params
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

  const form_submit = document.querySelector('.form-submit');
  if (form_submit) {
    form_submit.addEventListener('click', async (e) => {
      e.preventDefault();
      validated = true;


      const inputs = document.querySelectorAll('input');
      inputs.forEach((field) => {
        removeAlert(field);
        isRequired(field);
        verifyEmail(field);
      });


      if (validated) {
        form_submit.innerHTML = opt_form.sending;
        form_submit.disabled = true;
        const result = await fetchData('send_form');

        if (result) {
          form_submit.innerHTML = opt_form.sucess_send;
          form_submit.style.backgroundColor = '#52c41a';
          console.log(result);
        } else {
          form_submit.innerHTML = opt_form.error_send;
          form_submit.disabled = false;
        }

      }
    });
  }
});
