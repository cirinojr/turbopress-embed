// const ajaxurl =
//   window.location.origin + '/wp-admin/admin-ajax.php';

//   const contentContainer = document.getElementById('wp--skip-link--target');


// const fetchData = async (url,action,id) => {
//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded'
//       },
//       body: `action=${action}&id=${id}`
//   });

//     if (!response.ok) {
//       throw new Error('Internet connection error!');
//     }

//     const data = await response.text();
//     return data;
//   } catch (error) {
//     console.error('Fetch error:', error);
//   }
//   return false;
// };

