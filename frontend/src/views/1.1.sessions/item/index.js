const m = require('mithril');
const moment = require('moment');

module.exports = {
    toSessionDetail(path, session) {
        return m.route.set(path, { selectedSessionId: session.uid });
    },

    view: function ({ attrs }) {
        const session = attrs.session;
        const path = attrs.path;

        return (
            <div class="uk-container uk-section-primary uk-margin uk-padding-small tp-text-white tp-pointer" onclick={async (_) => {
                this.toSessionDetail(path, session);
            }}>
                <div class="uk-flex uk-flex-center uk-text-large uk-text-bold">
                    {session.playlistName}
                </div>
                <div class="uk-flex uk-flex-center uk-text-large">
                    {session.playStart ? moment(session.playStart).calendar() : '-'}
                </div>
            </div>
        );
    },
};