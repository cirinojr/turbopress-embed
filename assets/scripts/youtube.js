const player=document.querySelectorAll('.yt-player');
player.forEach((p)=>{
  p.addEventListener('click',()=>{
    const videoId=p.getAttribute('ytvideo');
    const width=p.getAttribute('width');
    const height=p.getAttribute('height');
    const playerOutput=`<iframe width="${width}" height="${height}" src="https://www.youtube.com/embed/${videoId}?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    p.innerHTML=playerOutput;
  });
});

