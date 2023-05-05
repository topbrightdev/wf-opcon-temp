const m = require('mithril');
const moment = require('moment');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        rmb.disconnect();
    },

    view: function ({ attrs }) {
        if (!model.state.sessionReady) {
            return;
        }

        const session = model.state.sessions.find(x => x.uid == attrs.selectedSessionId);
        if (!session) {
            return;
        }
        return (
            <Body title='Session Detail'>
                <Field class="uk-text-center" key="Title" value={session.playlistName}></Field>
                <Field class="uk-text-center" key="Game" value={session.name}></Field>
                <Field class="uk-text-center" key="Start Time" value={session.playStart ? moment(session.playStart).calendar() : '-'}></Field>
                <Field class="uk-text-center" key="Purchased">
                    {
                        session.purchases ?
                            session.purchases.map(pkg =>
                                <div>
                                    <div>{pkg.sku} x{pkg.tickets.length}</div>
                                </div>
                            )
                            :
                            <div />
                    }
                </Field>
                <Field class="uk-text-center" key="Playlists">
                    {
                        session.playlists ?
                            session.playlists.map(p =>
                                <div>
                                    <div>{p}</div>
                                </div>
                            )
                            :
                            <div />
                    }
                </Field>
                <Field class="uk-text-center" key="ID" value={session.uid}></Field>

                <div class="uk-container uk-text-center uk-margin">
                    <button class="uk-button uk-button-primary uk-text-large uk-padding-small uk-margin-right" onclick={(e) => {
                        if (!session.playStart) {
                            controller.startSessionConfirm(session);
                        } else {
                            model.state.auditoriumIndex = session.auditoriumIndex;
                            m.route.set('/session-lobby', { sessionId: session.uid });
                        }
                    }}
                    >
                        {!session.playStart ? "Start Session" : "Enter Session"}
                    </button>
                    <button class="uk-button uk-button-primary uk-text-large uk-padding-small " onclick={(e) => {
                        model.state.auditoriumIndex = session.auditoriumIndex;
                        controller.cancelSessionConfirm(session, '/auditoriums');
                    }}
                    >
                        Cancel Session
                    </button>
                </div>
            </Body>
        );
    },
};