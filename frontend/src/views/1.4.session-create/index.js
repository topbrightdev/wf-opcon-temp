const m = require('mithril');
const { webConfig } = require('@timeplay/web-config');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');

let sessionDef = null;
let playlists = [];
let auditoriums = [];

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        await controller.init();
        rmb.disconnect();

        const config = await webConfig.getConfig();
        const sessionDefs = config.sessionDefinitions;
        sessionDef = sessionDefs.find(x => x.name === attrs.sessionDef);
        playlists = await controller.getPlaylists(sessionDef.screenId);
        auditoriums = await controller.getAuditoriums();

        m.redraw();
    },

    view: function ({ attrs }) {
        if (!model.state.sessionReady) {
            return;
        }

        if (!sessionDef) {
            return;
        }

        const auditorium = auditoriums[model.state.auditoriumIndex];
        return (
            <Body title='Create Session' showSetting='true'>
                <Field class="uk-text-center" key="Selected Auditorium" value={auditorium}></Field>
                <Field class="uk-text-center" key="Category" value={sessionDef.name}></Field>
                {
                    playlists && playlists.length > 0 ? playlists.map(playlist =>
                        <div class="uk-container uk-text-center uk-padding-small">
                            <button class="uk-button uk-button-primary uk-text-large uk-padding-small" onclick={(e) => {
                                controller.createSessionConfirm(sessionDef, playlist);
                            }}>
                                {`${playlist.data.name} (${playlist.data.id})`}
                            </button>
                        </div>
                    )
                        :
                        <div class="uk-text-center uk-text-large">
                            There are no playlists of this category
                        </div>
                }
            </Body>
        );
    },
};