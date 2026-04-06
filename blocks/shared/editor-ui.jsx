import { __ } from '@wordpress/i18n';
import { Button, Notice, Placeholder, Spinner, TextControl } from '@wordpress/components';

export const EmbedErrorNotice = ({ error }) => {
  if (!error) {
    return null;
  }

  return (
    <Notice status="error" isDismissible={false}>
      {error}
    </Notice>
  );
};

export const EmbedUrlPlaceholder = ({
  icon,
  label,
  instructions,
  inputLabel,
  placeholder,
  inputUrl,
  onInputChange,
  onSubmit,
  isLoading,
  error,
}) => (
  <Placeholder icon={icon} label={label} instructions={instructions} className="turbopress-embed__placeholder">
    <div className="turbopress-embed__controls">
      <TextControl
        label={inputLabel}
        value={inputUrl}
        onChange={onInputChange}
        placeholder={placeholder}
      />
      <Button variant="primary" onClick={onSubmit} disabled={isLoading || !inputUrl.trim()}>
        {isLoading ? __('Loading...', 'turbopress-embed') : __('Create Preview', 'turbopress-embed')}
      </Button>
    </div>
    <EmbedErrorNotice error={error} />
  </Placeholder>
);

export const EmbedEditorActions = ({ isLoading, onReset, resetLabel }) => (
  <div className="turbopress-embed__editor-actions">
    {isLoading && <Spinner />}
    <Button variant="secondary" onClick={onReset}>
      {resetLabel || __('Change URL', 'turbopress-embed')}
    </Button>
  </div>
);
