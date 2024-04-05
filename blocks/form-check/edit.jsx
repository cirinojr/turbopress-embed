const { RichText } = wp.blockEditor;

const Edit = ({ attributes, setAttributes, className }) => {
  const { label1, label2, label3 } = attributes;

  return (
    <div class="checks-box">
      <RichText tagName="input" type="checkbox" name="renda" id="srenda" checked />
      <RichText
        tagName="label"
        for="srenda"
        value={label1}
        onChange={(label1) => setAttributes({ label1 })}
      />

      <RichText tagName="input" type="checkbox" name="prog" id="prog" checked />
      <RichText
        tagName="label"
        for="prog"
        value={label2}
        onChange={(label2) => setAttributes({ label2 })}
      />

      <RichText tagName="input" type="checkbox" name="limite" id="limite" checked />
      <RichText
        tagName="label"
        for="limite"
        value={label3}
        onChange={(label3) => setAttributes({ label3 })}
      />
    </div>
  );
};

export default Edit;
