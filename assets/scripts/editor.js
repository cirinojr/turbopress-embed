const getYouTubeVideoId = (url) => {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?feature=player_embedded&v=))([^&?]+)/;

  const match = url.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    return null;
  }
};

// const youtubeBt = document.querySelector('.epg-youtube-bt');

// youtubeBt.addEventListener('click', () => {
//   console.log('clicou');
//   const youtubeUrl = 'https://www.youtube.com/watch?v=vOL-AvxD9w4';
//   const videoId = getYouTubeVideoId(youtubeUrl);
//   console.log(videoId); // Output: "VIDEO_ID_HERE"
// });


const youtubeUrl = 'https://www.youtube.com/watch?v=vOL-AvxD9w4';
  const videoId = getYouTubeVideoId(youtubeUrl);
  console.log(videoId); // Output: "VIDEO_ID_HERE"
