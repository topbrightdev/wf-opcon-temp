const m = require('mithril');
const { webConfig } = require('@timeplay/web-config');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');

let sessionDefs = null;
let auditoriums = [];

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        await controller.init();
        rmb.disconnect();

        const config = await webConfig.getConfig();
        sessionDefs = config.sessionDefinitions;
        auditoriums = await controller.getAuditoriums();

        for (let i = 0; i < sessionDefs.length; i += 1) {
            const def = sessionDefs[i];
            def.packageDetail = await controller.getPackages(def.packages);
        }

        m.redraw();
    },

    view: function ({ attrs }) {
        if (!model.state.sessionReady) {
            return;
        }

        if (!sessionDefs) {
            return;
        }
        
        const auditorium = auditoriums[model.state.auditoriumIndex];
        return (
            <Body title='Session Categories' showSetting='true'>
                <Field class="uk-text-center" key="Selected Auditorium" value={auditorium}></Field>
                {
                    sessionDefs.map(def =>
                        <div class="uk-container uk-section-default uk-margin uk-padding-small">
                            <Field class="uk-text-center" key="Category" value={def.name}></Field>
                            <Field class="uk-text-center" key="Available Purchases">
                                {
                                    def.packageDetail && def.packageDetail.map(p =>
                                        <div>
                                            <div>{p.sku} ${p.price ? p.price : '0.00'}</div>
                                        </div>
                                    )
                                }
                            </Field>
                            <Field class="uk-text-center" key="Age Limit">
                                <div>{def.ageLimit ? 'Yes' : 'No'}</div>
                            </Field>
                            <div class="uk-container uk-text-center">
                                <button class="uk-button uk-button-primary uk-text-large uk-padding-small" onclick={(e) => {
                                    m.route.set('/session-create', { sessionDef: def.name })
                                }}>
                                    {`View Playlists [${def.name}]`}
                                </button>
                            </div>
                        </div>
                    )
                }
            </Body>
        );
    },
};