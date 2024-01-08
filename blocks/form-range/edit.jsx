const { RichText } = wp.blockEditor;

const Edit = ({ attributes, setAttributes, className }) => {
  const { rvalue } = attributes;

  return (
    <>
      <RichText
        tagName="input"
        type="range"
        min="0"
        max="100"
        onChange={(rvalue) => setAttributes({ rvalue })}
      />
    </>
  );
};

export default Edit;
