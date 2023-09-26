const headLink=(href,id)=>{
  if(!getTagId(id)){
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
    console.log(href,id);
  }
}
const headJs=(src,id)=>{
  if(!getTagId(id)){
    const script = document.createElement('script');
    script.id=id;
    script.src = src;
    document.head.appendChild(script);
    console.log(src,id);
  }
}
const getTagId=(id)=>{
  const tag=document.getElementById(id);
  return tag ?? true;
}
