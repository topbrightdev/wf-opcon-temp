const m = require('mithril');

module.exports = {
    view: function({ attrs }) {
        const options = attrs.options && attrs.options.length > 0 ? 
            attrs.options : [{
                label: attrs.default || 'No options',
                value: null,
            }];

        return (
            <select id={attrs.id} class={`uk-select ${attrs.class}`} onchange={attrs.onchange}>
                {
                    options.map(o => {
                        if (o.label) {
                            return <option value={o.value}>{o.label}</option>
                        }
                    })
                }
            </select>
        );
    }
};