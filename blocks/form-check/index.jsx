import Edit from './edit';
import Save from './save';
import attributes from './attributes';

const { registerBlockType } = wp.blocks;

registerBlockType('skl/check', {
    title: 'Skallar check',
    icon: 'welcome-widgets-menus',
    category: 'embed',
    attributes,
    edit: props => <Edit {...props} />,
    save: props => <Save {...props} />
});
