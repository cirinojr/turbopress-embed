const ajaxurl =
  window.location.origin + '/wp-admin/admin-ajax.php';

  const contentContainer = document.getElementById('wp--skip-link--target');


const fetchData = async (url,action,id) => {
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

const isValidJSON=(str)=> {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
}

const formatDateAsMonYYYY=(date)=>{
  const options = { year: 'numeric', month: 'short' };
  return date.toLocaleString('en-US', options);
}

const millisecondsToTime=(milliseconds)=>{

  const hours = Math.floor(milliseconds / 3600000);
  milliseconds %= 3600000;
  const minutes = Math.floor(milliseconds / 60000);
  milliseconds %= 60000;
  const seconds = Math.floor(milliseconds / 1000);

  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return formattedTime;
}

const createIframe=(id)=>{

  return `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/episode/${id}?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;

}

const spotifyCard=(title,subtitle,cover,bg,releaseDate,duration,id)=>{
  const rdate = new Date(releaseDate);
  const formattedDate = formatDateAsMonYYYY(rdate);
  const timed= millisecondsToTime(duration);
  const cardBlock=document.createElement('div');
  cardBlock.classList.add('spotify-card');
  cardBlock.style.background=bg;
  cardBlock.innerHTML=
  `<div>
      <img src='${cover}' width="300" height="300" alt="" />
    </div>
    <div class="wrapper">
    <div class="right">
       <svg role="img" height="32" width="32" aria-hidden="true" viewBox="0 0 24 24" data-encore-id="icon" class="Svg-sc-ytk21e-0 haNxPq"><path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm5.045 15.866a.686.686 0 0 1-.943.228c-2.583-1.579-5.834-1.935-9.663-1.06a.686.686 0 0 1-.306-1.337c4.19-.958 7.785-.546 10.684 1.226a.686.686 0 0 1 .228.943zm1.346-2.995a.858.858 0 0 1-1.18.282c-2.956-1.817-7.464-2.344-10.961-1.282a.856.856 0 0 1-1.11-.904.858.858 0 0 1 .611-.737c3.996-1.212 8.962-.625 12.357 1.462a.857.857 0 0 1 .283 1.179zm.116-3.119c-3.546-2.106-9.395-2.3-12.78-1.272a1.029 1.029 0 0 1-.597-1.969c3.886-1.18 10.345-.952 14.427 1.471a1.029 1.029 0 0 1-1.05 1.77z" /></svg>
    </div>
      <div class="content">
        <a href="">${title}</a>
        <span>${formattedDate} . ${subtitle}</span>
        <button>Follow</button>
      </div>
    <div class="right">
    <span class="time">${timed}</span>
    <svg role="img" height="48" width="48" aria-hidden="false" class="Svg-sc-ytk21e-0 haNxPq PlayButton_playPauseIcon__T3hX3" viewBox="0 0 24 24" data-encore-id="icon"><title>Play</title><path d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12zm8.75-4.567a.5.5 0 0 0-.75.433v8.268a.5.5 0 0 0 .75.433l7.161-4.134a.5.5 0 0 0 0-.866L9.75 7.433z"></path></svg>
    </div>
    </div>
  `;

  cardBlock.addEventListener('click',(e)=>{
    contentContainer.innerHTML=createIframe(id);
  });

  contentContainer.appendChild(cardBlock);



}

(async () => {
  const Data = await fetchData(ajaxurl,'get_spotify','3TwnCBbcmvzZdvWwMK545r');

  let contentBody;
  let bg;
  let cover;
  let title;
  let subtitle;
  let releaseDate;
  let duration;
  let id;

  if(isValidJSON(Data)){
    const result=JSON.parse(Data);
    contentBody=result.props.pageProps.state.data.entity;
    bg=contentBody.coverArt.extractedColors.colorDark.hex;
    cover=contentBody.coverArt.sources[1].url;
    title=contentBody.title;
    subtitle=contentBody.subtitle;
    releaseDate=contentBody.releaseDate.isoString;
    duration=contentBody.duration;
    id=contentBody.id;
  }

  spotifyCard(title,subtitle,cover,bg,releaseDate,duration,id);
  console.log(bg);
  console.log(cover);
  console.log(title);
  console.log(subtitle);
  //console.log(sate);
  console.log(duration);

})();
