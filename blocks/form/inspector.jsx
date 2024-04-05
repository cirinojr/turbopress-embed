const { InspectorControls } = wp.blockEditor;
const {  PanelBody,PanelRow, TextControl, SelectControl } = wp.components;
import fetchData from '../../assets/scripts/ajax';
const Inspector = ({ attributes, setAttributes }) => {
  const { required,email_format,sending,sucess_send,error_send,ac_acount } = attributes;

	const getAC = async () => {
    const data = await fetchData('load_ac');
		console.log(data);
   
  };

	getAC();

	return (
		<InspectorControls>
			<PanelBody title="Interação do formulário">
      <PanelRow>
						<TextControl
							label="Aviso de campo obrigatório"
							onChange={ ( required ) => setAttributes( { required } ) }
							value={ required }
						/>
      </PanelRow>
      <PanelRow>
            	<TextControl
							label="Aviso formato de email"
							onChange={ ( email_format ) => setAttributes( { email_format } ) }
							value={ email_format }
						/>
			</PanelRow>
      <PanelRow>
            	<TextControl
							label="Aviso enviando"
							onChange={ ( sending ) => setAttributes( { sending } ) }
							value={ sending }
						/>
			</PanelRow>
      <PanelRow>
            	<TextControl
							label="Aviso enviado com sucesso"
							onChange={ ( sucess_send ) => setAttributes( { sucess_send } ) }
							value={ sucess_send }
						/>
			</PanelRow>
      <PanelRow>
            	<TextControl
							label="Aviso erro no envio"
							onChange={ ( error_send ) => setAttributes( { error_send } ) }
							value={ error_send }
						/>
			</PanelRow>
			</PanelBody>
			<PanelBody title="Active Campaign">
      <PanelRow>
			<SelectControl
            label="Conta do Active Campaign"
            value={ ac_acount }
            options={ [
                { label: 'Big', value: '100%' },
                { label: 'Medium', value: '50%' },
                { label: 'Small', value: '25%' },
            ] }
            onChange={ ( newSize ) => setSize( newSize ) }
            __nextHasNoMarginBottom
        />
                        
      </PanelRow>
			</PanelBody>
		</InspectorControls>
	);
};

export default Inspector;