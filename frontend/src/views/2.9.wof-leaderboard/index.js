const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');
const controller = require('../../controller');
const rmb = require('../../rmbController');
const { webConfig } = require('@timeplay/web-config');
const model = require('../../model');

const players = [
    'Rank 1',
    'Rank 2',
    'Rank 3',
    'Rank 4',
    'Rank 5',
    'Rank 6',
    'Rank 7',
    'Rank 8',
    'Rank 9',
    'Rank 10',
];

module.exports = {
    oninit: async function ({ attrs }) {
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

    onremove: function () {
        clearInterval(this.connectedPlayersInterval);
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        var roundResult = model.state.roundResult;
        var leaderboardState = model.state.leaderBoardState;
        if (!session) {
            return;
        }
        return (
            <Body title='WOF Leaderboard'>
                <div class="uk-flex uk-flex-center">
                    <Field class="uk-text-center" key="Players Ready">
                        {`${this.readyUsers} / ${this.totalUsers}`}
                    </Field>
                </div>

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
                        {roundResult.topPlayers.map((player, index) => (
                            <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small"
                                disabled={(leaderboardState.topPlayersCount - leaderboardState.pointIndex - 1) != index}
                                onclick={() => {
                                    rmb.sendToActor(rmb.Message.RevealAudiencePoint);
                                }}>
                                {`Rank #${index + 1}: #${player.name}`}
                            </button>
                        ))}
                    </div>
                    <div class={model.state.roundState.gameStep == model.GameStepType.endGameStep ? "wof-hidden" :"wof-body wof-container"}>
                        <button class={model.state.roundState.currentRoundIndex < 3 ? "wof-btn wof-is-info wof-btn-medium wof-margin-small" : "wof-hidden"}
                            disabled={leaderboardState.topPlayersCount > leaderboardState.pointIndex}
                            onclick={() => {
                                controller.stateConfirmToActor(rmb.Message.RevealPuzzle);
                            }}>
                            {`Round #${model.state.roundState.currentRoundIndex + 2}: Reveal Puzzle`}
                        </button>
                        <button class={model.state.roundState.currentRoundIndex >= 3 ? "wof-btn wof-is-info wof-btn-medium wof-margin-small" : "wof-hidden"}
                            disabled={leaderboardState.topPlayersCount > leaderboardState.pointIndex}
                            onclick={() => {
                                controller.stateConfirmToActor(rmb.Message.ThankYouStage);
                            }}>
                            Thank You Screen
                        </button>
                        {/* <button class="wof-btn wof-is-info wof-btn-medium wof-margin-small" onclick={async (e) => {
                                await controller.endSessionConfirm(session, '/auditoriums');
                            }}>
                            End Game
                        </button> */}
                    </div>
                </div>
            </Body>
        );
    },
};
