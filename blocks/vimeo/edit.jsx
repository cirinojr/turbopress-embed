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
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" data-play-icon="true" class="PlayButton_module_playIcon__fc6bec57"><path d="M19 12C19 12.3557 18.8111 12.6846 18.5039 12.8638L6.50387 19.8638C6.19458 20.0442 5.81243 20.0455 5.50194 19.8671C5.19145 19.6888 5 19.3581 5 19L5 5C5 4.64193 5.19145 4.3112 5.50194 4.13286C5.81243 3.95452 6.19458 3.9558 6.50387 4.13622L18.5039 11.1362C18.8111 11.3154 19 11.6443 19 12Z" fill="#ffffff"></path></svg>
            </span>
            <span className='ctrlbar'>
              <span className='progress'></span>
            <svg viewBox="0 0 24 24" data-volume-icon="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M20 12C20 15.7277 17.4505 18.8599 14 19.7479V21.7999C18.5645 20.8734 22 16.8379 22 12C22 7.16206 18.5645 3.12655 14 2.20001V4.25201C17.4505 5.1401 20 8.2723 20 12ZM18 12C18 9.38754 16.3304 7.16506 14 6.34139V8.53511C15.1956 9.22672 16 10.5194 16 12C16 13.4805 15.1956 14.7732 14 15.4648V17.6586C16.3304 16.8349 18 14.6124 18 12ZM6.58579 8.00396H4C2.89543 8.00396 2 8.89939 2 10.004V14.004C2 15.1085 2.89543 16.004 4 16.004H6.58579L10.2929 20.7111C10.9229 21.341 12 20.8949 12 20.004V4.00396C12 3.11305 10.9229 2.66689 10.2929 3.29685L6.58579 8.00396Z"></path></svg>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="PrefsButton_module_gearIcon__61ec289e"><path fill-rule="evenodd" clip-rule="evenodd" d="M9.16668 1.66699C8.2462 1.66699 7.50001 2.41318 7.50001 3.33366V4.72835C7.21484 4.86382 6.94241 5.02175 6.68499 5.19984L5.46953 4.4981C4.68103 4.04285 3.66009 4.31415 3.20034 5.11047L2.36526 6.55686C1.90707 7.35046 2.17605 8.3701 2.96953 8.82822L4.18535 9.53017C4.17298 9.68526 4.16668 9.84206 4.16668 10.0003C4.16668 10.1586 4.17298 10.3154 4.18535 10.4705L2.96953 11.1724C2.17605 11.6306 1.90707 12.6502 2.36526 13.4438L3.20034 14.8902C3.66009 15.6865 4.68103 15.9578 5.46953 15.5026L6.685 14.8008C6.94241 14.9789 7.21484 15.1368 7.50001 15.2723V16.667C7.50001 17.5875 8.2462 18.3337 9.16668 18.3337H10.8333C11.7538 18.3337 12.5 17.5875 12.5 16.667V15.2723C12.7851 15.1369 13.0574 14.979 13.3147 14.801L14.5298 15.5026C15.3183 15.9578 16.3393 15.6865 16.799 14.8902L17.6341 13.4438C18.0923 12.6502 17.8233 11.6306 17.0298 11.1724L15.8146 10.4708C15.827 10.3156 15.8333 10.1587 15.8333 10.0003C15.8333 9.84193 15.827 9.68501 15.8146 9.52981L17.0298 8.82822C17.8233 8.3701 18.0923 7.35046 17.6341 6.55686L16.799 5.11047C16.3393 4.31415 15.3183 4.04285 14.5298 4.4981L13.3147 5.19963C13.0574 5.02162 12.7851 4.86377 12.5 4.72835V3.33366C12.5 2.41318 11.7538 1.66699 10.8333 1.66699H9.16668ZM12.5 10.0003C12.5 11.381 11.3807 12.5003 10 12.5003C8.6193 12.5003 7.50001 11.381 7.50001 10.0003C7.50001 8.61961 8.6193 7.50033 10 7.50033C11.3807 7.50033 12.5 8.61961 12.5 10.0003Z"></path></svg>
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" data-vimeo-small-icon="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M18.7781 6.00913C18.6943 7.81161 17.4171 10.2795 14.9465 13.4122C12.3922 16.6841 10.231 18.3203 8.46324 18.3203C7.36838 18.3203 6.44133 17.3242 5.68438 15.331C5.17905 13.5043 4.67352 11.6776 4.168 9.85093C3.60591 7.8589 3.00305 6.86167 2.35829 6.86167C2.21771 6.86167 1.7259 7.1533 0.88381 7.73392L0 6.61152C0.927048 5.80871 1.84171 5.00589 2.74171 4.20176C3.9781 3.14879 4.90648 2.59501 5.52533 2.53908C6.98743 2.40059 7.88743 3.38562 8.22533 5.49419C8.5901 7.76902 8.84286 9.18398 8.98457 9.73796C9.40629 11.6253 9.86971 12.5681 10.3766 12.5681C10.7697 12.5681 11.3602 11.9557 12.148 10.7316C12.9345 9.50713 13.3562 8.57558 13.413 7.93547C13.5251 6.87875 13.1034 6.34917 12.148 6.34917C11.6981 6.34917 11.2345 6.45126 10.7575 6.65281C11.6808 3.67218 13.445 2.22456 16.0486 2.30695C17.9792 2.36287 18.8891 3.59693 18.7781 6.00913Z"></path></svg>
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
        src="/wp-content/plugins/turbopress-embed/build/vm_js.js"
      ></script>
    </>
  );
};

export default Edit;
