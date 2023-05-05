const m = require('mithril');

module.exports = {
    onConfirmClicked: function(attrs) {
        UIkit.modal(`#${attrs.id}`).hide().then(() => {
            const callback = attrs.onConfirmed;
            if (callback) {
                callback();
            }
        });
    },

    view: function({ attrs, children }) {
        return (
            <div id={attrs.id} uk-modal>
                <div class="uk-modal-dialog uk-modal-body">
                    <h2 class="uk-modal-title">{attrs.title}</h2>
                    <p>{children}</p>
                    <p class="uk-text-right">
                        <button class="uk-button uk-button-default uk-modal-close" type="button">Cancel</button>
                        <button class={`uk-button ${attrs.confirmButtonClass || 'uk-button-primary'} uk-margin-left`}
                                type="button"
                                onclick={() => {
                                    this.onConfirmClicked(attrs)
                                }}>{attrs.confirmLabel || 'Confirm'}</button>
                    </p>
                </div>
            </div>
        );
    }
}