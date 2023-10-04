const player=document.querySelectorAll('.vm-player');
player.forEach((p)=>{
  p.addEventListener('click',()=>{
    const videoId=p.getAttribute('vimeovideo');
    const playerOutput=`<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/${videoId}?h=07b77862e0&autoplay=1" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>`;
    p.innerHTML=playerOutput;
  });
});

