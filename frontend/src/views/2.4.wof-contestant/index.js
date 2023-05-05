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

const contestants = [
    'Contestant #1',
    'Contestant #2',
    'Contestant #3'
]

module.exports = {
    oninit: async function ({ attrs }) {
        contestantActive = [false, false, false];
        this.totalUsers = 0;
        this.readyUsers = 0;

        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        // init the bus if it's not running now that we have session in the path
        rmb.initBus();

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

    getContestantName: function (index) {
        var name;
        const contestants = model.state.roundState.contestants;
        if (contestants.length <= index) {
            name = ""
        } else {
            if (contestants[index].revealed) {
                name = contestants[index].name;
            } else {
                name = "";
            }
        }
        return name;
    },

    getSelfRevealResult: function (index) {
        const contestants = model.state.roundState.contestants;
        if (contestants.length <= index) {
            return false;
        } else {
            return contestants[index].revealed;
        }
    },

    getBeforeRevealResult: function (index) {
        const contestants = model.state.roundState.contestants;
        if (contestants.length - 1 > index) {
            return false;
        }
        var result = false;
        if (contestants.length == index) {
            if (index == 0) {
                return true;
            } else {
                result = contestants[index - 1].revealed;
            }
        } else if (contestants.length > index) {
            result = true;
        } else {
            result = false;
        }
        return result;
    },

    getRevealedCount: function () {
        var count = 0;
        model.state.roundState.contestants.forEach(e => {
            if (e.revealed) {
                count++;
            }
        });
        return count;
    },

    onremove: function () {
        clearInterval(this.connectedPlayersInterval);
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        var roundState = model.state.roundState;
        var processWaiting = model.state.processWaiting;
        if (!session) {
            return;
        }

        return (
            <Body title='WOF Contestant Draw'>
                <div >
                    <div class="uk-flex uk-flex-bottom uk-flex-around uk-text-center uk-margin-remove uk-padding-remove">
                        {/* <button class="wof-btn wof-is-info wof-btn-medium wof-margin-small wof-size-large" onclick={() => {
                            controller.launchGameServerConfirm(session)
                                .catch((e) => {
                                    console.log(e.message);
                                });
                        }}>
                            Re-launch Big Screen
                        </button> */}
                        <button class="wof-btn wof-is-normal wof-btn-medium wof-margin-small wof-size-large" onclick={() => {
                            controller.cancelSessionConfirm(session, '/sessions');
                        }}>
                            Cancel Session
                        </button>
                    </div>
                    <div class="wof-body wof-container">
                        {contestants.map((contestantItem, index) => (
                            <div class="uk-flex uk-flex-bottom uk-flex-around uk-text-center uk-margin-remove uk-padding-remove">
                                <button class="wof-btn wof-size-large wof-is-info wof-btn-large wof-margin-small"
                                    onclick={() => {
                                        rmb.sendToActor(rmb.Message.Contestant_Draw, { num: index });
                                        //controller.stateConfirm(rmb.Message.Contestant_Draw, params);
                                    }}
                                    disabled={processWaiting || !this.getBeforeRevealResult(index)}
                                >
                                    {roundState.contestants.length >= index + 1 ? contestantItem + " ReDraw" : contestantItem + " Draw"}
                                </button>
                                <input class={roundState.contestants.length > index ? "wof-input" : "wof-hidden"}
                                    value={this.getContestantName(index)}
                                    readOnly />
                                <button class={roundState.contestants.length > index ? "wof-btn wof-is-primary wof-btn-medium wof-margin-small" : "wof-hidden"}
                                    onclick={() => {
                                        rmb.sendToActor(rmb.Message.Contestant_Reveal);
                                    }}
                                    disabled={processWaiting || this.getSelfRevealResult(index)}
                                >
                                    {contestantItem} Reveal
                                </button>
                                {/* <div class={contestantActive[index]?"uk-flex uk-flex-middle uk-flex-center wof-response-content":"wof-hidden"}>
                                    <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small" onclick={() => {
                                        const params = {}
                                        controller.stateConfirm(rmb.Message.Contestant_Reveal, params);
                                    }}>
                                        {contestantItem} Reveal
                                    </button>
                                    <input class="wof-input" value={model.state.contestants[index]} readOnly/>
                                </div> */}
                            </div>
                        ))
                        }
                        <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small uk-margin-medium-top"
                            onclick={() => {
                                controller.stateConfirmToActor(rmb.Message.PreRoundStage);
                            }}
                            disabled={processWaiting || this.getRevealedCount() != 3}
                        >
                            WOF Home
                        </button>
                    </div>
                </div>
            </Body>
        );
    },
};
