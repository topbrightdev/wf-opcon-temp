const m = require('mithril');

module.exports = {
    view: function ({ attrs }) {
        const title = attrs.title;
        const items = attrs.items;
        const mapFunction = attrs.mapFunction;
        let showList = attrs.showList;
        if (showList == null) {
            showList = true;
        }
        return (
            <div class={`${attrs.class || ''} uk-section-muted uk-padding-small uk-text-center`}>
                <div class="uk-text-large">
                    {title}
                </div>
                {
                    items && items.length > 0 && showList ?
                        <div class="uk-panel uk-panel-scrollable no-resize">
                            <ul class="uk-list uk-text-large">
                                {
                                    items.map(item =>
                                        <li>{mapFunction(item)}</li>
                                    )
                                }
                            </ul>
                        </div>
                        :
                        <div>
                            {showList && "None"}
                        </div>
                }
            </div>
        );
    }
};
