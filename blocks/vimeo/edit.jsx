const { RichText } = wp.blockEditor;
const { useState } = wp.element;
import fetchData from '../../assets/scripts/ajax';

const Edit = ({ attributes, setAttributes, className }) => {
  const { videoId, title, icon, width, height,cover, css } = attributes;
  const [inputText, setInputText] = useState('');
  const [isLoadding, setIsLoadding] = useState(false);

  const handleChange = (e) => {
    setInputText(e.target.value);
  };

  const getVimeoVideoId = (videoId) => {
    const regex =/vimeo\.com\/(\d+)/;

    const match = videoId.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      return null;
    }
  };

  const getWightHeight = (iframe) => {
    const regex = /width="(\d+)" height="(\d+)"/;
    const match = iframe.match(regex);

    if (match) {
      setAttributes({ width: match[1] });
      setAttributes({ height: match[2] });
    }
  };

  const getVimeoData = async () => {
    const data = await fetchData('get_vimeo', videoId);
    const json = JSON.parse(data);

    setAttributes({ title: json.title });
    setAttributes({ cover: json.thumb });
    // setAttributes({ icon: json.thumb });
    setIsLoadding(true);
  };

  const createPreview = () => {
    getVimeoData();

    return (
      <>
        <style>{`@import "${css}"`}</style>
        <div
          vimeovideo={videoId}
          width={width}
          height={height}
          className="vm-player"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            backgroundImage: `url(${cover})`,
          }}
        >
          <div className='icons'>
          <svg viewBox="0 0 20 20" class="like-icon" focusable="false"><path d="M10 18a1 1 0 0 1-.81-.42 15.8 15.8 0 0 0-4.35-3.71C2.46 12.3 0 10.68 0 7.5a5.38 5.38 0 0 1 1.61-3.92A6 6 0 0 1 6 2a5.54 5.54 0 0 1 4.05 1.88A5.74 5.74 0 0 1 14 2c2.9 0 6 2.21 6 5.5s-2.46 4.8-4.84 6.37a15.8 15.8 0 0 0-4.35 3.71A1 1 0 0 1 10 18zM5.78 4A4 4 0 0 0 3 5a3.37 3.37 0 0 0-1 2.5c0 2 1.5 3.09 3.94 4.7A20.94 20.94 0 0 1 10 15.42a20.94 20.94 0 0 1 4.06-3.22C16.5 10.59 18 9.5 18 7.5 18 5.22 15.68 4 14 4c-1.44 0-2.78 1.49-3.17 2.06a1 1 0 0 1-.92.44 1 1 0 0 1-.82-.58A3.65 3.65 0 0 0 6 4z" fill="#ffffff"></path></svg>
          <svg viewBox="0 0 20 20" class="watch-later-icon" focusable="false"><path d="M10 20C4.477 20 0 15.523 0 10S4.477 0 10 0s10 4.477 10 10-4.477 10-10 10zm0-1.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM10.75 5v4.69l3.075 3.075a.75.75 0 1 1-1.06 1.06L9.25 10.311V5a.75.75 0 0 1 1.5 0z" fill="#ffffff"></path></svg>
          <svg viewBox="0 0 18.1 20.95" class="share-icon ShareButton_module_shareIcon__da819942" focusable="false"><path d="M18.11 0L-.01 12.07l8 4v4.88l2.26-3.75 6.65 3.32zm-3 17.37l-3.93-2 1.81-6.42-5 4.91-4-2.03 11.9-7.93z" fill="#ffffff"></path></svg>
          </div>


          <div className='controls'>
            <span className='play'>
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-play-icon="true" class="PlayButton_module_playIcon__fc6bec57"><path d="M19 12C19 12.3557 18.8111 12.6846 18.5039 12.8638L6.50387 19.8638C6.19458 20.0442 5.81243 20.0455 5.50194 19.8671C5.19145 19.6888 5 19.3581 5 19L5 5C5 4.64193 5.19145 4.3112 5.50194 4.13286C5.81243 3.95452 6.19458 3.9558 6.50387 4.13622L18.5039 11.1362C18.8111 11.3154 19 11.6443 19 12Z" class="fill"></path></svg>
            </span>
          </div>

        </div>
      </>
    );
  };
  const handleVimeo = () => {
    setAttributes({ videoId: getVimeoVideoId(inputText) });
    getWightHeight(inputText);
  };

  return (
    <>
      <style>{`@import "${css}"`}</style>
      {!videoId ? (
        <div className="tbe-yt-editor">
          <div className="label">
            <span>
            <svg fill="#1ab7ea" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><g><path d="M22.396 7.164c-.093 2.026-1.507 4.8-4.245 8.32C15.323 19.16 12.93 21 10.97 21c-1.214 0-2.24-1.12-3.08-3.36-.56-2.052-1.118-4.105-1.68-6.158-.622-2.24-1.29-3.36-2.004-3.36-.156 0-.7.328-1.634.98l-.978-1.26c1.027-.903 2.04-1.806 3.037-2.71C6 3.95 7.03 3.328 7.716 3.265c1.62-.156 2.616.95 2.99 3.32.404 2.558.685 4.148.84 4.77.468 2.12.982 3.18 1.543 3.18.435 0 1.09-.687 1.963-2.064.872-1.376 1.34-2.422 1.402-3.142.125-1.187-.343-1.782-1.4-1.782-.5 0-1.013.115-1.542.34 1.023-3.35 2.977-4.976 5.862-4.883 2.14.063 3.148 1.45 3.024 4.16z"></path></g></svg>
            </span>
            Vimeo URL
          </div>
          <div className="input-wrapper">
            <input
              type="text"
              name="youtube-url"
              onChange={handleChange}
              value={inputText}
            />
            <button className="epg-youtube-bt" onClick={handleVimeo}>
              Embed
            </button>
          </div>
        </div>
      ) : (
        createPreview()
      )}
      <script
        defer
        async
        src="/wp-content/plugins/turbopress-embed/assets/scripts/youtube.js"
      ></script>
    </>
  );
};

export default Edit;
