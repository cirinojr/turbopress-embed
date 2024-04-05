const { RichText } = wp.blockEditor;
import Inspector from './inspector';

const Edit = ({ attributes, setAttributes, className }) => {
  const { name, email, button } = attributes;

  return (
    <>
      <Inspector attributes={attributes} setAttributes={setAttributes} />
      <form class="f-container f-flex f-colunm" method="POST">
        <label>
          <RichText
            tagName="span"
            value={name}
            onChange={(name) => setAttributes({ name })}
          />

          <input
            type="text"
            className="f-input"
            id="name"
            name="name"
            disabled
          />
        </label>
        <label>
          <RichText
            tagName="span"
            value={email}
            onChange={(email) => setAttributes({ email })}
          />

          <input
            type="email"
            className="f-input"
            id="email"
            name="email"
            disabled
          />
        </label>
        <button id="form-submit" className="btn form-submit" disabled>
          <RichText
            value={button}
            onChange={(button) => setAttributes({ button })}
          />
        </button>
      </form>
    </>
  );
};

export default Edit;
