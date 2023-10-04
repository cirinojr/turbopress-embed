const player=document.querySelectorAll('.spotify-card');
player.forEach((p)=>{
  p.addEventListener('click',()=>{
    const videoId=p.getAttribute('spotifyembed');
    const url=videoId.replace('https://open.spotify.com/', 'https://open.spotify.com/embed/');
    const playerOutput=`<iframe style="border-radius:12px" src="${url}?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    p.innerHTML=playerOutput;
  });
});
