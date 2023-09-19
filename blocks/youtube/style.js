import styled from 'styled-components';

// Styled-components for .epg-youtube-editor
const EpgYoutubeEditor = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  flex-direction: column;
`;

// Styled-components for .epg-youtube-editor .label
const EpgYoutubeEditorLabel = styled.div`
  display: flex;
  align-items: center;
`;

// Styled-components for .epg-youtube-editor .label svg
const EpgYoutubeEditorLabelSvg = styled.svg`
  width: 64px;
  height: 64px;
`;

// Styled-components for .epg-youtube-editor .input-wrapper
const EpgYoutubeEditorInputWrapper = styled.div`
  width: 100%;
`;

// Styled-components for .epg-youtube-editor .input-wrapper input
const EpgYoutubeEditorInput = styled.input`
  width: 85%;
  max-width: 550px;
`;

// Styled-components for .epg-youtube-editor .input-wrapper .epg-youtube-bt
const EpgYoutubeEditorButton = styled.button`
  font-size: smaller;
  margin: 8px;
  background: #007cba;
  color: #fff;
  border: 0;
  padding: 6px;
  border-radius: 2px;
`;

// Styled-components for .epg-alert
const EpgAlert = styled.div`
  color: #f31e1e;
`;

// Styled-components for .yt-player
const YtPlayer = styled.div`
  background-position: center;
  background-size: cover;
`;

// Styled-components for .yt-player .gradient
const YtPlayerGradient = styled.div`
  display: flex;
  padding: 2.5%;
  gap: 16px;
  height: 49px;
  width: 95%;
  position: absolute;
  background-repeat: repeat-x;
  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==);
  transition: opacity 0.25s cubic-bezier(0, 0, 0.2, 1) 0s;
  pointer-events: none;
`;

// Styled-components for .yt-player .title
const YtPlayerTitle = styled.div`
  color: #fff;
  font-size: 18px;
`;

// Styled-components for .yt-player .logo
const YtPlayerLogo = styled.div`
  background: #ccc;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: block;
`;

// Styled-components for .yt-player .play-icon
const YtPlayerPlayIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 68px;
  height: 48px;
  margin-left: -34px;
  margin-top: -24px;
`;

// Styled-components for .yt-player .tag
const YtPlayerTag = styled.div`
  background: rgba(23, 23, 23, 0.8);
  color: #fff;
  height: 47px;
  width: 181px;
  font-size: 14px;
  display: flex;
  position: absolute;
  bottom: 10px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

// Styled-components for .yt-player .tag svg
const YtPlayerTagSvg = styled.svg`
  margin-left: 8px;
  width: fit-content;
  height: 16px;
  fill: #fff;
`;

// Styled-components for .isloadding
const IsLoading = styled.div`
  position: absolute;
  color: #fff;
  background: #0000007d;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

export {
  EpgYoutubeEditor,
  EpgYoutubeEditorLabel,
  EpgYoutubeEditorLabelSvg,
  EpgYoutubeEditorInputWrapper,
  EpgYoutubeEditorInput,
  EpgYoutubeEditorButton,
  EpgAlert,
  YtPlayer,
  YtPlayerGradient,
  YtPlayerTitle,
  YtPlayerLogo,
  YtPlayerPlayIcon,
  YtPlayerTag,
  YtPlayerTagSvg,
  IsLoading,
};
