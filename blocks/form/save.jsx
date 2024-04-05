const { RichText } = wp.blockEditor;

const Save = ({ attributes, className }) => {
  const {
    name,
    email,
    button,
    required,
    email_format,
    sending,
    sucess_send,
    error_send,
  } = attributes;

  return (
    <>
      <script>const opt_form ={`{"required":"${required}", "email_format":"${email_format}","sending":"${sending}","sucess_send":"${sucess_send}","error_send":"${error_send}"}`}</script>
      <form class="f-container f-flex f-colunm" method="POST">
        <label>
          <RichText.Content tagName="span" value={name} />

          <input type="text" id="name" name="name" required />
        </label>
        <label>
          <RichText.Content tagName="span" value={email} />
          <input type="email" id="email" name="email" required />
        </label>
        <button id="form-submit" className="btn form-submit" >
        <RichText.Content
         
          value={button}
          
        />
        </button>
      </form>
    </>
  );
};

export default Save;
