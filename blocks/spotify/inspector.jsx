const { InspectorControls } = wp.blockEditor;
const { ColorPicker, PanelBody } = wp.components;
const Inspector = ({ attributes, setAttributes }) => {
	const { bg } = attributes

	return (
		<InspectorControls>
			<PanelBody title="Background" initialOpen={true}>
				<ColorPicker
					color={bg}
					onChange={(value) => setAttributes({ bg: value })}
					enableAlpha
				/>
			</PanelBody>
		</InspectorControls>
	);
};

export default Inspector;
