import { useBlockProps } from '@wordpress/block-editor';
import TikTokPreview from './preview';

const Save = ( { attributes } ) => {
  const { url, videoId, embedHtml } = attributes;
  const blockProps = useBlockProps.save( {
    className: 'turbopress-embed turbopress-embed--tiktok',
    'data-provider': 'tiktok',
    'data-state': 'preview',
    'data-embed-url': url,
    'data-video-id': videoId,
    'data-embed-html': embedHtml,
  } );

  return (
    <div { ...blockProps }>
      <TikTokPreview attributes={ attributes } />
    </div>
  );
};

export default Save;
