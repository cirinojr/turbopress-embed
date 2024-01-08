const { RichText } = wp.blockEditor;

const Edit = ({ attributes, setAttributes, className }) => {
  const { name,email,button } = attributes;

  return (
    <form class="f-container f-flex f-colunm" method='POST'>
      <label>
        <RichText
          tagName="span"
          value={name}
          onChange={(name) => setAttributes({ name })}
         
        />

        <input type="text" className="f-input" id='name' name="name" disabled />
      </label>
      <label>
        <RichText
          tagName="span"
          value={email}
          onChange={(email) => setAttributes({ email })}
         
        />
        <input type="email" className="f-input" id="email" name="email" disabled />
      </label>

      <RichText
          tagName="button"
          value={button}
          id="form-submit"
          className="btn form-submit"
          onChange={(button) => setAttributes({ button })}
         
        />
      

      <div class="checks-box">
        <input
          type="checkbox"
          name="renda"
          id="srenda"
          value="Sem renda mínima"
        />
        <label for="srenda">Sem renda mínima</label>
        <input
          type="checkbox"
          name="prog"
          id="prog"
          value="Programa de Pontos"
        />
        <label for="prog">Programa de Pontos</label>
        <input
          type="checkbox"
          name="limite"
          id="limite"
          value="Limite de R$ 25.000"
        />
        <label for="limite">Limite de R$ 25.000</label>
      </div>
    </form>
  );
};

export default Edit;
