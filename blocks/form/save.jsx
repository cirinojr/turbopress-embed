const { RichText } = wp.blockEditor;

const Save = ({ attributes, className }) => {
  const { name, email,button } = attributes;

  return (
    <form class="f-container f-flex f-colunm" method='POST'>
      <label>
        <RichText.Content tagName="span" value={name} />

        <input type="text" id="name" name="name"  required />
      </label>
      <label>
        <RichText.Content tagName="span" value={email} />
        <input type="email" id="email" name="email" required />
      </label>

      <RichText.Content tagName="button" id="form-submit" value={button} className="btn form-submit" />
    

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

export default Save;
