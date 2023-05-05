const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const controller = require('../../controller');
const model = require('../../model');
const SummaryBox = require('../../components/summary-box');

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        const usersCount = await controller.getUsersCount({
            uid: attrs.sessionId,
        });
        this.totalUsers = usersCount ? usersCount.connected : 0;
        m.redraw();
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        const summaryData = model.state.bingoSummaryData;

        return (
            <Body title='Bingo Outro'>
                <div class="uk-section-muted uk-margin uk-padding-small uk-text-center uk-text-large">
                    <div>
                        Thanks for playing
                    </div>
                </div>

                <SummaryBox summaryData={summaryData} totalPlayers={this.totalUsers}></SummaryBox>

                <div class="uk-flex uk-flex-right">
                    <button class="uk-button uk-button-primary uk-padding-small uk-text-large" onclick={async (e) => {
                        await controller.endSessionConfirm(session, '/auditoriums');
                    }}>
                        End Game
                    </button>
                </div>
            </Body>
        );
    },
};
