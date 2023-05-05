const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const { webConfig } = require('@timeplay/web-config');
const Body = require('../../components/body');
const controller = require('../../controller');

module.exports = {
    oninit: async function () {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        const config = await webConfig.getConfig();
        if (!config.opconDebug) {
            return;
        }
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        return (
            <Body title='Debug' showBack={true}>
                <div class="uk-container uk-text-center uk-margin">
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={(e) => {
                        m.route.set('/session-lobby', { sessionId: attrs.sessionId });
                    }}>
                        Session Lobby
                    </button>
                </div>
                <div class="uk-container uk-text-center uk-margin">
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={(e) => {
                        m.route.set('/bingo-game', { sessionId: attrs.sessionId });
                    }}>
                        Bingo Active Round
                    </button>
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={(e) => {
                        m.route.set('/bingo-claim', { sessionId: attrs.sessionId });
                    }}>
                        Bingo Claim Screen
                    </button>
                </div>
                <div class="uk-container uk-text-center uk-margin">
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={(e) => {
                        m.route.set('/audience-choice', { sessionId: attrs.sessionId });
                    }}>
                        Audience Choice
                    </button>
                </div>
                <div class="uk-container uk-text-center uk-margin">
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={(e) => {
                        m.route.set('/bingo-winners', { sessionId: attrs.sessionId });
                    }}>
                        Bingo Winners
                    </button>
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={(e) => {
                        m.route.set('/bingo-closesecond', { sessionId: attrs.sessionId });
                    }}>
                        Close Second Leaderboard
                    </button>
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={(e) => {
                        m.route.set('/bingo-unlucky', { sessionId: attrs.sessionId });
                    }}>
                        Unlucky Winners
                    </button>
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={(e) => {
                        m.route.set('/bingo-outro', { sessionId: attrs.sessionId });
                    }}>
                        Outro
                    </button>
                </div>
            </Body>
        );
    },
};
