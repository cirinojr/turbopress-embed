const { InnerBlocks } = wp.blockEditor;

const Edit = ({ attributes, setAttributes, className }) => {
  const { titulo, paragrafo_1, paragrafo_2, paragrafo_3, image } = attributes;
  return (
    <InnerBlocks
      template={[
        [
          'core/group',
          {
            className: 'f-container f-flex f-colunm',
          },
          [
            ['core/image', { url: `${image.src}` }],
            ['core/heading', { content: `${titulo}`, level: '2' }],
            ['core/paragraph', { content: `${paragrafo_1}` }],
            ['skl/range', {  }],
            ['core/paragraph', { content: `${paragrafo_2}` }],
            ['core/paragraph', { content: `${paragrafo_3}` }],
          ],
        ],
        [
          'core/group',
          {
            className: 'f-container f-flex f-colunm',
          },
          [
            ['skl/form'],
            ['skl/check', {  }]
          ],
        ],
      ]}
    />
  );
};

export default Edit;
