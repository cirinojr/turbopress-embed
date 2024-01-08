const { RichText } = wp.blockEditor;

const Save = ({ attributes, className }) => {
  const { rvalue } = attributes;

  return (
    <>
      <RichText.Content
        tagName="input"
        type="range"
        min="0"
        max="100"
        value={rvalue}
      />
    </>
  );
};

export default Save;
