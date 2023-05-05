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

var contestantSelectedState = false;
var solveStatus = false;
var startedTossUp = false;
var hiddenStatus = [false, false, false];
varendTossUp = false;

module.exports = {
    oninit: async function ({ attrs }) {
        this.totalUsers = 0;
        this.readyUsers = 0;

        contestantSelectedState = false;
        solveStatus = false;
        startedTossUp = false;
        hiddenStatus = [false, false, false];
        endTossUp = false;

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

    onremove: function () {
        clearInterval(this.connectedPlayersInterval);
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        return (
            <Body title='WOF Tossup Detail'>
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
                        <button class={(solveStatus && startedTossUp) || endTossUp ? "wof-hidden" : "wof-btn wof-is-primary wof-btn-large wof-margin-small"} onclick={() => {
                            const params = {}
                            if (startedTossUp) {
                                controller.stateConfirm(rmb.Message.Solve_Pause, params);
                                solveStatus = !solveStatus;

                            } else {
                                controller.stateConfirm(rmb.Message.StartTossUp, params);
                                startedTossUp = true;
                            }
                        }}>
                            {startedTossUp ? "Solve/Pause" : "StartTossUp"}
                        </button>
                    </div>
                    <div class="wof-body wof-container">
                        <div class='wof-container'>
                            <div class='uk-text-normal uk-text-default'>Puzzle Answer</div>
                            <div class='uk-text-bold uk-text-large'>{model.state.puzzleData.puzzle}</div>
                            <div class='uk-text-normal uk-text-default'>Category</div>
                            <div class='uk-text-bold uk-text-large'>{model.state.puzzleData.category}</div>
                        </div>
                        <div class={!startedTossUp || contestantSelectedState ? "wof-hidden" : "wof-body wof-container"}>
                            <button class={hiddenStatus[0] ? "wof-hidden" : "wof-btn wof-is-dark wof-btn-medium wof-margin-small"}
                                disabled={!solveStatus}
                                onclick={() => {
                                    hiddenStatus[0] = true;
                                    contestantSelectedState = true;
                                    const params = {}
                                    controller.stateConfirm(rmb.Message.Player1_Select, params);

                                }}>
                                {"#1: " + model.state.contestants[0]}
                            </button>
                            <button class={hiddenStatus[1] ? "wof-hidden" : "wof-btn wof-is-primary wof-btn-medium wof-margin-small"}
                                disabled={!solveStatus}
                                onclick={() => {
                                    hiddenStatus[1] = true;
                                    contestantSelectedState = true;
                                    const params = {}
                                    controller.stateConfirm(rmb.Message.Player2_Select, params);
                                }}>
                                {"#2: " + model.state.contestants[1]}
                            </button>
                            <button class={hiddenStatus[2] ? "wof-hidden" : "wof-btn wof-is-info wof-btn-medium wof-margin-small"}
                                disabled={!solveStatus}
                                onclick={() => {
                                    hiddenStatus[2] = true;
                                    contestantSelectedState = true;
                                    const params = {}
                                    controller.stateConfirm(rmb.Message.Player3_Select, params);
                                }}>
                                {"#3: " + model.state.contestants[2]}
                            </button>
                        </div>

                        <div class={contestantSelectedState ? "wof-body wof-container" : "wof-hidden"}>
                            <button class="wof-btn wof-is-danger wof-btn-medium wof-margin-small"
                                onclick={() => {
                                    solveStatus = false;
                                    const params = {}
                                    controller.stateConfirm(rmb.Message.Solve_Wrong_Unpause, params);
                                    contestantSelectedState = false;
                                    if (hiddenStatus[0] && hiddenStatus[1] && hiddenStatus[2]) {
                                        endTossUp = true;
                                    }
                                }}>
                                Wrong
                            </button>
                            <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small"
                                onclick={() => {
                                    solveStatus = false;
                                    const params = {}
                                    controller.stateConfirm(rmb.Message.Solve_Correct, params);
                                    contestantSelectedState = false;
                                    endTossUp = true;
                                }}>
                                Correct
                            </button>
                        </div>
                        <div class="wof-body wof-container">
                            <button class={endTossUp ? "wof-btn wof-is-primary wof-btn-large wof-margin-small" : "wof-hidden"} onclick={() => {
                                const nextPath = '/wof-intro-game'
                                const pathParams = { sessionId: attrs.sessionId };
                                controller.stateConfirmNavigate(rmb.Message.WoFHome, {}, nextPath, pathParams);
                            }}>
                                WOF Home
                            </button>
                        </div>
                    </div>
                </div>
            </Body>
        );
    },
};
