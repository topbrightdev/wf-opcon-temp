const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const List = require('../../components/list');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');
const PrizeBox = require('../../components/prize-box');

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        await controller.getReportData(attrs.sessionId);
        m.redraw();

        this.rmbOnData = (data) => {
            this.handleRMBEvent(data);
        };
        rmb.registerRMBData(this.rmbOnData);
        this.sendBingoClaimPing();
        this.bingoClaimInterval = setInterval(() => {
            this.sendBingoClaimPing();
        }, 3000);
    },

    sendBingoClaimPing: function () {
        console.log("[bingo-claim] sending request for bingo claims");
        rmb.sendToActor(rmb.Message.BingoClaim);
    },

    handleRMBEvent: function (data) {
        if (data.hasOwnProperty(rmb.Message.BingoClaim)) {
            console.log(`[bingo-claim] bingo claims ${JSON.stringify(data)}`);
            const payload = data[rmb.Message.BingoClaim];

            model.state.bingoClaims = payload.playersWithBingoClaimed;
            model.state.bingoUnclaims = payload.playersWithBingoUnclaimed;
        }
    },

    onremove: function () {
        clearInterval(this.bingoClaimInterval);
        rmb.unRegisterRMBData(this.rmbOnData);
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        const claims = model.state.bingoClaims;
        const unclaims = model.state.bingoUnclaims;
        const bingoPrize = model.state.bingoPrize;

        return (
            <Body title='Claim Bingo'>
                <div class="uk-flex uk-margin">
                    <List class="uk-width-1-2" title="The following players have claimed Bingo:" items={claims} mapFunction={player => player} />
                    <List class="uk-width-1-2" title="Waiting for the following players to claim Bingo:" items={unclaims} mapFunction={player => player} />
                </div>

                <PrizeBox prize={bingoPrize.prizingData}></PrizeBox>

                <div class="uk-container uk-margin uk-text-center">
                    <button class="uk-button uk-button-primary uk-button-small uk-padding uk-margin-right uk-text-large" onclick={(e) => {
                        rmb.sendToGameServer(rmb.Message.TriggerBingo);
                    }}>
                        Confirm
                    </button>
                </div>
            </Body>
        );
    },
};
