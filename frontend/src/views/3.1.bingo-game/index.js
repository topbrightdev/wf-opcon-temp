const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const List = require('../../components/list');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');
const PrizeBox = require('../../components/prize-box');
const { getBingoLetterByNumber } = require("../../util/bingo");
const Countdown = require('../../components/countdown');
const Timer = require('../../components/time-display');
const { webConfig } = require('@timeplay/web-config');

const getClosestPlayers = (players, ballsAway) => players ? players.filter(player => player.minDaubsUntilBingo === ballsAway) : [];

const autoDurations = [7, 10, 15, 20, 25, 30, 60];

module.exports = {
    oninit: async function ({ attrs }) {
        this.timeSinceLastDrop = 0;
        this.totalUsers = 0;
        this.readyUsers = 0;

        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        await controller.getReportData(attrs.sessionId);

        const session = controller.getCurrentSession(attrs.sessionId);

        const config = await webConfig.getConfig();
        const playerCountUpdateMs = config.playerCountUpdateInterval || 5000;

        this.updatePlayerStats(session);
        this.connectedPlayersInterval = setInterval(() => {
            this.updatePlayerStats(session);
        }, playerCountUpdateMs);

        this.rmbOnData = (data) => {
            this.handleRMBEvent(data);
        };
        rmb.registerRMBData(this.rmbOnData);
        this.sendBallsAwayPing();
        this.ballsAwayInterval = setInterval(() => {
            this.sendBallsAwayPing();
        }, 3000);

        this.isAutoEnabled = false;
        this.setCountdownInterval();
        this.setDropElapsedInterval();

        this.sendBingoClaimPing();
        this.bingoClaimInterval = setInterval(() => {
            this.sendBingoClaimPing();
        }, 3000);
    },

    sendBallsAwayPing: function () {
        console.log("[bingo-game] sending request for balls away");
        rmb.sendToActor(rmb.Message.BallsAway);
    },

    sendBingoClaimPing: function () {
        console.log("[bingo-claim] sending request for bingo claims");
        rmb.sendToActor(rmb.Message.BingoClaim);
    },

    handleRMBEvent: function (data) {
        if (data.hasOwnProperty(rmb.Message.SetBingoGame)) {
            const gameData = data[rmb.Message.SetBingoGame];
            // HACK: reset countdown if game is currently set to auto AND it wasn't manual in the previous update
            // Also reset the time since last dropped here as well, since the ball dropped
            if (gameData.auto && this.isAutoEnabled) {
                model.state.bingoBallDropped = true;
                this.setCountdownInterval();
                this.timeSinceLastDrop = 0;
                this.setDropElapsedInterval();
                m.redraw();
                // HACK: if game is set to manual and previous mode was also manual, then reset the time since last drop
                // Basically, whenever SetBingoGame isn't sent due to a change to mode (ie. it's sent because ball was dropped), reset the count
            } else if (!gameData.auto && !this.isAutoEnabled) {
                model.state.bingoBallDropped = true;
                this.timeSinceLastDrop = 0;
                this.setDropElapsedInterval();
                m.redraw();
            }
            this.isAutoEnabled = gameData.auto;
        }

        if (data.hasOwnProperty(rmb.Message.BallsAway)) {
            console.log(`[bingo-game] balls away ${JSON.stringify(data)}`);
            const payload = data[rmb.Message.BallsAway];

            model.state.bingoBallsAway = payload.ballAway;
            model.state.bingoPlayers = payload.playerList;
        }
        if (data.hasOwnProperty(rmb.Message.BingoClaim)) {
            console.log(`[bingo-game] bingo claims ${JSON.stringify(data)}`);
            const payload = data[rmb.Message.BingoClaim];

            model.state.bingoClaims = payload.playersWithBingoClaimed;
            model.state.bingoUnclaims = payload.playersWithBingoUnclaimed;
        }
    },

    updatePlayerStats: async function (session) {
        const { readyUsers, totalUsers } = await controller.getPlayerStats(session);
        this.totalUsers = totalUsers;
        this.readyUsers = readyUsers;
    },

    onremove: function () {
        clearInterval(this.connectedPlayersInterval);
        clearInterval(this.ballsAwayInterval);
        clearInterval(this.countdownInterval);
        clearInterval(this.bingoClaimInterval);
        clearInterval(this.dropElapsedInterval);
        clearInterval(this.autoOffInterval);
        rmb.unRegisterRMBData(this.rmbOnData);
    },

    setDropElapsedInterval: function () {
        if (this.dropElapsedInterval) {
            clearInterval(this.dropElapsedInterval);
        }
        this.dropElapsedInterval = setInterval(() => {
            this.timeSinceLastDrop += 1;
            m.redraw();
        }, 1000);
    },

    setCountdownInterval: function () {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        this.autoTimeElapsed = 0;
        this.countdownInterval = setInterval(() => {
            let { autoDuration, auto } = model.state.bingoGameData;
            // HACK: If auto mode is currently not enabled, then skip this interval
            if (!auto) {
                return;
            }
            if (!autoDuration) {
                autoDuration = 20;
            }
            this.autoTimeElapsed += 1;
            if (this.autoTimeElapsed >= autoDuration) {
                this.autoTimeElapsed = 0;
            }
            m.redraw();
        }, 1000);
    },

    increaseAutoInterval: function () {
        const gameData = model.state.bingoGameData;
        let { autoDuration } = gameData;
        const newDuration = autoDurations[Math.min(autoDurations.indexOf(autoDuration) + 1, autoDurations.length - 1)];
        rmb.sendToGameServer(rmb.Message.ToggleBallAutoDrop, {
            auto: gameData ? gameData.auto : true,
            newDuration,
        });
    },

    decreaseAutoInterval: function () {
        const gameData = model.state.bingoGameData;
        let { autoDuration } = gameData;
        const newDuration = autoDurations[Math.max(autoDurations.indexOf(autoDuration) - 1, 0)];
        rmb.sendToGameServer(rmb.Message.ToggleBallAutoDrop, {
            auto: gameData ? gameData.auto : true,
            newDuration,
        });
    },

    displayAutoView: function () {
        let { autoDuration } = model.state.bingoGameData;
        const autoDurationIndex = autoDurations.indexOf(autoDuration);
        return (
            <>
                <button class="uk-button tp-round-button uk-button-large uk-width-small uk-padding uk-text-large uk-text-bold tp-dark-blue" disabled={autoDurationIndex === 0} onclick={(_) => this.decreaseAutoInterval()}>
                    <span>
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <line stroke="white" stroke-width="10" x1="25" x2="75" y1="50" y2="50"></line>
                        </svg>
                    </span>
                </button>
                <div class="uk-width-small uk-text-center uk-text-large">
                    {autoDuration}
                </div>
                <button class="uk-button tp-round-button uk-button-large uk-width-small uk-padding uk-text-large uk-text-bold tp-dark-blue" disabled={autoDurationIndex === autoDurations.length - 1} onclick={(_) => this.increaseAutoInterval()}>
                    <span>
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <line stroke="white" stroke-width="10" x1="25" x2="75" y1="50" y2="50"></line>
                            <line stroke="white" stroke-width="10" x1="50" x2="50" y1="25" y2="75"></line>
                        </svg>
                    </span>
                </button>
            </>
        );
    },

    displayManualView: function () {
        return (
            <>
                <button class="uk-button uk-button-primary uk-width-medium uk-padding uk-text-large tp-green"
                    onclick={(e) => {
                        rmb.sendToGameServer(rmb.Message.DropBall);
                    }}>
                    Drop Ball
                </button>
            </>
        );
    },

    displayCountdown: function () {
        let { autoDuration } = model.state.bingoGameData;
        return <Countdown timeElapsed={this.autoTimeElapsed} duration={autoDuration} />;
    },

    displayLastDropped: function () {
        return (
            <>
                {model.state.bingoBallDropped && <div style={{
                    display: 'inline-block',
                    width: '180px',
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }} class="uk-text-center uk-margin-small">
                        <span class="uk-text-large">Time Since Last Drop:</span>
                        <Timer timeElapsed={this.timeSinceLastDrop} />
                    </div>
                </div>}
            </>
        );
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        const gameData = model.state.bingoGameData;
        const players = model.state.bingoPlayers;
        const ballsAway = model.state.bingoBallsAway;
        const bingoPrize = model.state.bingoPrize;

        const closestPlayers = getClosestPlayers(players, ballsAway);

        return (
            <Body title='Bingo Game'>
                <div class="uk-text-center">
                    Connected Players: {this.readyUsers} / {this.totalUsers}
                </div>

                <PrizeBox prize={bingoPrize.prizingData}></PrizeBox>

                <div class="uk-flex">
                    <div class="uk-section-muted uk-container uk-width-1-3">
                        {closestPlayers && closestPlayers.length > 0 && <List
                            title={ballsAway > 0 ?
                                `${closestPlayers.length} player${closestPlayers.length === 1 ? "" : "s"} ${closestPlayers.length === 1 ? "is" : "are"} ${ballsAway} ball${ballsAway === 1 ? "" : "s"} away`
                                :
                                `${closestPlayers.length} player${closestPlayers.length === 1 ? "" : "s"} ${closestPlayers.length === 1 ? "has" : "have"} unclaimed bingo`}
                            items={closestPlayers}
                            showList={ballsAway <= 1}
                            mapFunction={player => {
                                let remainingBalls = [];
                                if (player.minDaubsUntilBingo === 1) {
                                    const ballsToGetBingoUnique = Array.from(new Set(player.ballsToGetBingo));
                                    remainingBalls = remainingBalls.concat(ballsToGetBingoUnique.slice(0, 3).map(ball => `${getBingoLetterByNumber(ball)}${ball}`));
                                    if (ballsToGetBingoUnique.length > 3) {
                                        remainingBalls.push("...");
                                    }
                                }

                                return (
                                    <>
                                        {player.nickname}{remainingBalls.length > 0 ? ` - ${remainingBalls.join(", ")}` : ""}
                                    </>
                                );
                            }}
                        />}
                    </div>
                    <div class="uk-section-muted uk-container uk-width-1-3">
                        <div class="uk-flex uk-flex-center uk-flex-middle">
                            {gameData && gameData.auto ?
                                this.displayAutoView()
                                :
                                this.displayManualView()
                            }
                        </div>

                        <div class="uk-flex uk-flex-column uk-flex-center uk-flex-middle">
                            <span class="uk-text-large uk-padding-small uk-padding-remove-horizontal">
                                Current Drop Mode: <b>{gameData && gameData.auto ? 'Auto' : 'Manual'}</b>
                            </span>
                            <br />
                            <button class="uk-button uk-button-primary uk-width-medium uk-padding uk-text-large" onclick={(e) => {
                                if (!gameData.auto) {
                                    this.setCountdownInterval();
                                }
                                rmb.sendToGameServer(rmb.Message.ToggleBallAutoDrop, {
                                    auto: gameData ? !gameData.auto : false,
                                    newDuration: gameData.autoDuration,
                                });
                            }}>
                                Switch to {gameData && !gameData.auto ? 'Auto' : 'Manual'}
                            </button>
                        </div>
                    </div>
                    <div class="uk-section-muted uk-container uk-width-1-6">
                        <div class="uk-flex uk-flex-center uk-flex-middle uk-height-1-1">
                            <div class="uk-text-center uk-flex uk-flex-bottom uk-flex-right">
                                {gameData && gameData.auto ?
                                    this.displayCountdown()
                                    :
                                    this.displayLastDropped()
                                }
                            </div>
                        </div>
                    </div>
                    <div class="uk-section-muted uk-container uk-width-1-6">
                        <div class="uk-text-center uk-flex uk-flex-bottom uk-flex-right uk-flex-wrap uk-height-1-1">
                            <button class="uk-button uk-button-primary uk-padding-small" onclick={(e) => {
                                controller.cancelSessionConfirm(session, '/sessions');
                            }}>
                                Cancel Session
                            </button>
                            <button class="uk-button uk-button-primary uk-padding-small uk-margin-small uk-text-large" onclick={(e) => {
                                UIkit.modal.confirm(`Are you sure you want to trigger Audience Choice?`, { labels: { 'ok': 'Confirm', 'cancel': 'Cancel' } }).then(async (e) => {
                                    let shouldDisplayNumber = false;

                                    try {
                                        await UIkit.modal.confirm(`Show ball selections?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } });
                                        console.log("Showing balls");
                                        shouldDisplayNumber = true;
                                    } catch (e) {
                                        if (e) {
                                            console.log("Ball selections popup canceled", e);
                                        } else {
                                            console.log("Hiding balls");
                                        }
                                    }

                                    if (gameData && gameData.auto) {
                                        console.log("Auto mode enabled, turning it off for audience choice");
                                        rmb.sendToGameServer(rmb.Message.ToggleBallAutoDrop, {
                                            auto: false,
                                            newDuration: gameData.autoDuration,
                                        });

                                        // Check every half second for auto mode turned off before proceeding
                                        try {
                                            await new Promise((resolve, reject) => {
                                                let retries = 0;
                                                this.autoOffInterval = setInterval(() => {
                                                    if (retries > 20) {
                                                        return reject(new Error("Auto off check retries exceeded, cannot verify that auto has been turned off"));
                                                    }
                                                    const gameData = model.state.bingoGameData;
                                                    console.log("Checking for auto off");
                                                    if (gameData && !gameData.auto) {
                                                        console.log("Auto off, can now proceed...");
                                                        return resolve();
                                                    }
                                                    retries++;
                                                }, 500);
                                            });
                                        } catch (e) {
                                            console.error("Error occurred when activating Audience Choice:", e.message);
                                            return await UIkit.modal.alert("Could not activate Audience Choice. Please ensure Auto Mode is disabled and try again later.");
                                        }
                                    }

                                    console.log("Triggering audience choice...");

                                    rmb.sendToActor(rmb.Message.OpconTriggerAudienceChoice, {
                                        shouldDisplayNumber: shouldDisplayNumber,
                                    });
                                }, (e) => {
                                    console.log("Audience Choice canceled");
                                });
                            }}>
                                Trigger Audience Choice
                            </button>
                            {/* <button class="uk-button uk-button-primary uk-button-small uk-padding-small" onclick={(e) => {
                                controller.goldenBallConfirm();
                            }}>
                                Golden Ball
                            </button> */}
                        </div>
                    </div>
                </div>
            </Body >
        );
    },
};
