const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');
const List = require('../../components/list');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');
const PrizeBox = require('../../components/prize-box');
const { webConfig } = require('@timeplay/web-config');

let auditoriums = [];

module.exports = {
    oninit: async function ({ attrs }) {
        this.totalUsers = 0;
        this.readyUsers = 0;

        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        // init the bus if it's not running now that we have session in the path
        rmb.initBus();

        auditoriums = await controller.getAuditoriums();

        const session = controller.getCurrentSession(attrs.sessionId);
        await controller.getReportData(attrs.sessionId);

        const config = await webConfig.getConfig();
        const playerCountUpdateMs = config.playerCountUpdateInterval || 5000;

        await this.updatePlayerStats(session);
        this.connectedPlayersInterval = setInterval(async () => {
            const prevTotalUsers = this.totalUsers;
            await this.updatePlayerStats(session);
            // If the player count has changed, get new report data
            if (prevTotalUsers != this.totalUsers) {
                await controller.getReportData(attrs.sessionId);
            }
        }, playerCountUpdateMs);
    },

    updatePlayerStats: async function (session) {
        const { readyUsers, totalUsers } = await controller.getPlayerStats(session);
        this.totalUsers = totalUsers;
        this.readyUsers = readyUsers;
    },

    onremove: function () {
        clearInterval(this.connectedPlayersInterval);
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        const bingoPrize = model.state.bingoPrize;
        const reportData = model.state.reportData;
        const auditorium = auditoriums[model.state.auditoriumIndex];

        return (
            <Body title='Session Lobby'>
                <Field class="uk-text-center" key="Selected Auditorium" value={auditorium}></Field>
                <div class="uk-flex uk-flex-center">
                    <Field class="uk-text-center" key="Players Ready">
                        {`${this.readyUsers} / ${this.totalUsers}`}
                    </Field>
                </div>

                <div class="uk-flex uk-margin">
                    <List class="uk-width-1-2" title="Previous Winners" items={reportData.previousWinners} mapFunction={(player) => player} />
                    <List class="uk-width-1-2" title="Repeat Players" items={reportData.repeatPlayers} mapFunction={(player) => player} />
                </div>

                <PrizeBox prize={bingoPrize.prizingData}></PrizeBox>

                <div class="uk-flex">
                    <div class="uk-container uk-flex uk-flex-bottom uk-flex-left uk-text-center uk-margin-remove uk-padding-remove uk-width-1-2">
                        {/* <button class="uk-button uk-button-primary uk-padding-small uk-margin-right" onclick={() => {
                            controller.launchGameServerConfirm(session)
                                .catch((e) => {
                                    console.log(e.message);
                                });
                        }}>
                            Re-launch Big Screen
                        </button> */}
                        <button class="uk-button uk-button-normal uk-padding-small" onclick={() => {
                            controller.cancelSessionConfirm(session, '/auditoriums');
                        }}>
                            Cancel Session
                        </button>
                    </div>

                    <div class="uk-container uk-flex uk-flex-bottom uk-flex-right uk-text-center uk-margin-remove uk-padding-remove uk-width-1-2">
                        <button class="uk-button uk-button-primary uk-padding uk-text-large tp-green" onclick={() => {
                            controller.startRoundConfirm();
                        }}>
                            Start Round
                        </button>
                    </div>
                </div>
            </Body>
        );
    },
};
