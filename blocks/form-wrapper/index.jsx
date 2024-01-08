import Edit from './edit';
import Save from './save';
import attributes from './attributes';

const { registerBlockType } = wp.blocks;

registerBlockType('skl/form-template', {
    title: 'Skallar Form Template v6',
    icon: 'welcome-widgets-menus',
    category: 'embed',
    attributes,
    edit: props => <Edit {...props} />,
    save: props => <Save {...props} />
});
