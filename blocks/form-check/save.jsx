const { RichText } = wp.blockEditor;

const Save = ({ attributes, className }) => {
  const { label1,label2,label3 } = attributes;

  return (
    <div class="checks-box">
      <RichText.content tagName="input" type="checkbox" name="renda" id="srenda" />
      <RichText.content
        tagName="label"
        for="srenda"
        value={label1}
     
      />

      <RichText.content tagName="input" type="checkbox" name="prog" id="prog" />
      <RichText.content
        tagName="label"
        for="prog"
        value={label2}
       
      />

      <RichText.content tagName="input" type="checkbox" name="limite" id="limite" />
      <RichText.content
        tagName="label"
        for="limite"
        value={label3}
   
      />
    </div>
  );
};

export default Save;
