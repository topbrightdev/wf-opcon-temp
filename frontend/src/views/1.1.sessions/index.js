const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const model = require('../../model');
const controller = require('../../controller');
const SessionItem = require('./item');
const rmb = require('../../rmbController');
const Field = require('../../components/field');

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        await controller.init();
        rmb.disconnect();
    },

    view: function ({ attrs }) {
        if (!model.state.sessionReady) {
            return;
        }
        const auditorium = attrs.auditoriumName;
        const activeSessions = model.state.activeSessions;
        const comingSessions = model.state.comingSessions;

        return (
            <Body title='Active Sessions'>
                <Field class="uk-text-center" key="Selected Auditorium" value={auditorium}></Field>
                <ul class="uk-list uk-list-large">
                    {
                        activeSessions && activeSessions.length > 0 ?
                            activeSessions.map(item =>
                                <SessionItem session={item} path={'/session-detail'}></SessionItem>
                            )
                            :
                            <div class="uk-text-center uk-text-large">No active sessions</div>
                    }
                </ul>

                <hr class="uk-divider-icon" />

                <div class="uk-container uk-flex uk-flex-center">
                    <button class="uk-button uk-button-secondary uk-text-large uk-padding-small uk-margin-right" onclick={(e) => {
                        m.route.set('/session-definition');
                    }}
                    >
                        Create New Session
                    </button>
                </div>
            </Body>
        );
    }
};
