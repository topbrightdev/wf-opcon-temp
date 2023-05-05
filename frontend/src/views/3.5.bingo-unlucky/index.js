const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const List = require('../../components/list');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');
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
            <Body title='Bingo Unlucky Players'>
                <List title="Most Unlucky Players" items={summaryData.unluckyWinners} mapFunction={player => player} />

                <SummaryBox summaryData={summaryData} totalPlayers={this.totalUsers}></SummaryBox>

                <div class="uk-flex uk-flex-right">
                    <button class="uk-button uk-button-primary uk-padding-small uk-text-large" onclick={(e) => {
                        rmb.sendToGameServer(rmb.Message.TriggerOutro);
                    }}>
                        Next
                    </button>
                </div>
            </Body>
        );
    },
};
