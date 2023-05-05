const m = require('mithril');

module.exports = {
    view: function({ attrs, children }) {
        return (
            <div class={`${attrs.class || ''} uk-padding-remove uk-margin-left uk-margin-small-bottom`}>
                <p class="uk-padding-remove uk-margin-remove uk-text-large uk-text-uppercase uk-text-meta">{attrs.key}</p>
                <p class="uk-padding-remove uk-margin-remove uk-text-large uk-text-break">{attrs.value || children}</p>
            </div>
        )
    }
}