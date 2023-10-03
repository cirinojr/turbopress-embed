const { RichText } = wp.blockEditor;
const { useState } = wp.element;
import fetchData from '../../assets/scripts/ajax';

const Edit = ({ attributes, setAttributes, className }) => {
  const { videoId, title, cover, duration, css } = attributes;
  const [inputText, setInputText] = useState('');
  const [isLoadding, setIsLoadding] = useState(false);

  const handleChange = (e) => {
    setInputText(e.target.value);
  };

  const getSpotifyId = (videoId) => {
    const regex =
      /^https:\/\/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)(\?.*)?$/;

    const match = videoId.match(regex);

    if (match && match[2]) {
      return match[2];
    } else {
      return null;
    }
  };

  const getSpotifyData = async () => {
    const data = await fetchData('get_spotify', videoId);

    const json = JSON.parse(data);

    setAttributes({ title: json.title });
    setAttributes({ cover: json.cover });
    setAttributes({ duration: json.duration });

    setIsLoadding(true);
  };

  const createPreview = () => {
    getSpotifyData();

    return (
      <>
        <style>{`@import "${css}"`}</style>
        <div className="spotify-card">
          <div className='cover'>
            <img src={cover} width="30%"  alt="" />
          </div>
          <div class="sp-wrapper">
            <div class="right">
              <svg
                role="img"
                height="32"
                width="32"
                aria-hidden="true"
                viewBox="0 0 24 24"
                data-encore-id="icon"
                class="Svg-sc-ytk21e-0 haNxPq"
              >
                <path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm5.045 15.866a.686.686 0 0 1-.943.228c-2.583-1.579-5.834-1.935-9.663-1.06a.686.686 0 0 1-.306-1.337c4.19-.958 7.785-.546 10.684 1.226a.686.686 0 0 1 .228.943zm1.346-2.995a.858.858 0 0 1-1.18.282c-2.956-1.817-7.464-2.344-10.961-1.282a.856.856 0 0 1-1.11-.904.858.858 0 0 1 .611-.737c3.996-1.212 8.962-.625 12.357 1.462a.857.857 0 0 1 .283 1.179zm.116-3.119c-3.546-2.106-9.395-2.3-12.78-1.272a1.029 1.029 0 0 1-.597-1.969c3.886-1.18 10.345-.952 14.427 1.471a1.029 1.029 0 0 1-1.05 1.77z" />
              </svg>
            </div>
            <div class="content">
              <a href="">{title}</a>
              <span></span>
              <button>Follow</button>
            </div>
            <div class="right">
              <span class="time">{duration}</span>
              <svg
                role="img"
                height="48"
                width="48"
                aria-hidden="false"
                class="Svg-sc-ytk21e-0 haNxPq PlayButton_playPauseIcon__T3hX3"
                viewBox="0 0 24 24"
                data-encore-id="icon"
              >
                <title>Play</title>
                <path d="M1 12C1 5.925 5.925 1 12 1s11 4.925 11 11-4.925 11-11 11S1 18.075 1 12zm8.75-4.567a.5.5 0 0 0-.75.433v8.268a.5.5 0 0 0 .75.433l7.161-4.134a.5.5 0 0 0 0-.866L9.75 7.433z"></path>
              </svg>
            </div>
          </div>
        </div>
      </>
    );
  };
  const handleSpotify = () => {
    setAttributes({ videoId: inputText });
  };

  return (
    <>
      {!videoId ? (
        <div className="tbe-yt-editor">
          <div className="label">
            <span>
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="#1db954"
                  d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2m4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.434-5.305-1.76-8.786-.963-.335.077-.67-.133-.746-.47-.077-.334.132-.67.47-.745 3.808-.87 7.076-.496 9.712 1.115.293.18.386.563.206.857M17.81 13.7c-.226.367-.706.482-1.072.257-2.687-1.652-6.785-2.13-9.965-1.166-.413.127-.848-.106-.973-.517-.125-.413.108-.848.52-.973 3.632-1.102 8.147-.568 11.234 1.328.366.226.48.707.256 1.072m.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.13-1.166-.624-.148-.495.13-1.017.625-1.167 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.443-.838.59-1.282.325"
                ></path>
              </svg>
            </span>
            Spotify URL
          </div>
          <div className="input-wrapper">
            <input
              type="text"
              name="spotify-url"
              onChange={handleChange}
              value={inputText}
            />
            <button className="epg-spotify-bt" onClick={handleSpotify}>
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
        src="/wp-content/plugins/turbopress-embed/build/sf_js.js"
      ></script>
    </>
  );
};

export default Edit;
