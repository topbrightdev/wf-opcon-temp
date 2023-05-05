const m = require('mithril');
const moment = require('moment');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');
const PrizeBox = require('../../components/prize-box');

const ids = {
    countdown: 'drop-countdown',
}

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        await controller.getReportData(attrs.sessionId);
    },

    previousState: function (gameData) {
        for (let i = 0; i < gameData.states.length; i += 1) {
            const state = gameData.states[i];
            if (gameData.currentState === state.timeInSec) {
                const prevIndex = i - 1;
                if (prevIndex >= 0) {
                    return gameData.states[prevIndex].timeInSec;
                }
            }
        }

        return null;
    },

    nextState: function (gameData) {
        for (let i = 0; i < gameData.states.length; i += 1) {
            const state = gameData.states[i];
            if (gameData.currentState === state.timeInSec) {
                const nextIndex = i + 1;
                if (nextIndex < gameData.states.length) {
                    return gameData.states[nextIndex].timeInSec;
                }
            }
        }

        return null;
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        const gameData = model.state.gigGameData;

        return (
            <Body title='Generic Interactive Game' showBack={true}>

                <PrizeBox prize={gameData.prize}></PrizeBox>

                <div class="uk-container uk-margin uk-text-center">
                    <button class="uk-button uk-button-primary uk-button-small uk-padding-small" onclick={(e) => {
                        rmb.sendToGameServer(rmb.Message.ChangeGigState, {
                            state: gameData.currentState,
                            isPlaying: !gameData.isPlaying,
                        });
                    }}>
                        {gameData.isPlaying ? 'Pause' : 'Play'}
                    </button>
                </div>

                <div class="uk-container uk-margin uk-text-center">
                    <button class="uk-button uk-button-primary uk-button-small uk-padding-small uk-margin-right" onclick={(e) => {
                        rmb.sendToGameServer(rmb.Message.ChangeGigState, {
                            state: this.previousState(gameData),
                            isPlaying: true,
                        });
                    }}>
                        Back & Play
                    </button>
                    <button class="uk-button uk-button-primary uk-button-small uk-padding-small" onclick={(e) => {
                        rmb.sendToGameServer(rmb.Message.ChangeGigState, {
                            state: this.nextState(gameData),
                            isPlaying: true,
                        });
                    }}>
                        Forward & Play
                    </button>
                </div>

                <div class="uk-container uk-margin uk-text-center">
                    <button class="uk-button uk-button-primary uk-button-small uk-padding-small uk-margin-right" onclick={(e) => {
                        rmb.sendToGameServer(rmb.Message.ChangeGigState, {
                            state: this.previousState(gameData),
                            isPlaying: false,
                        });
                    }}>
                        Back & Pause
                    </button>
                    <button class="uk-button uk-button-primary uk-button-small uk-padding-small" onclick={(e) => {
                        rmb.sendToGameServer(rmb.Message.ChangeGigState, {
                            state: this.nextState(gameData),
                            isPlaying: false,
                        });
                    }}>
                        Forward & Pause
                    </button>
                </div>

                {gameData.btnInfo ?
                    <div class="uk-section-muted uk-container uk-margin uk-padding-small uk-text-center">
                        {gameData.btnInfo.hasOwnProperty(1300) ?
                            <button class="uk-button uk-button-primary uk-button-small uk-padding-small uk-margin-right" onclick={(e) => {
                                rmb.sendToGameServer(rmb.Message.Btn0Press);
                            }}>
                                {gameData.btnInfo[1300]}
                            </button>
                            :
                            <div />
                        }
                        {gameData.btnInfo.hasOwnProperty(1301) ?
                            <button class="uk-button uk-button-primary uk-button-small uk-padding-small uk-margin-right" onclick={(e) => {
                                rmb.sendToGameServer(rmb.Message.Btn1Press);
                            }}>
                                {gameData.btnInfo[1301]}
                            </button>
                            :
                            <div />
                        }
                        {gameData.btnInfo.hasOwnProperty(1302) ?
                            <button class="uk-button uk-button-primary uk-button-small uk-padding-small uk-margin-right" onclick={(e) => {
                                rmb.sendToGameServer(rmb.Message.Btn2Press);
                            }}>
                                {gameData.btnInfo[1302]}
                            </button>
                            :
                            <div />
                        }
                        {gameData.btnInfo.hasOwnProperty(1303) ?
                            <button class="uk-button uk-button-primary uk-button-small uk-padding-small uk-margin-right" onclick={(e) => {
                                rmb.sendToGameServer(rmb.Message.Btn3Press);
                            }}>
                                {gameData.btnInfo[1303]}
                            </button>
                            :
                            <div />
                        }
                    </div>
                    :
                    <div />
                }

                <div class="uk-section-muted uk-margin uk-padding-small">
                    <div class="uk-text-center">
                        States:
                    </div>
                    {
                        gameData.states && gameData.states.length > 0 ?
                            <Field class="uk-text-center" key={
                                `Current State at ${gameData.currentState}s`
                            }>
                                <div class="uk-panel uk-panel-scrollable">
                                    <ul class="uk-list">
                                        {
                                            gameData.states.map(state =>
                                                state.timeInSec === gameData.currentState ?
                                                    <li><b>{`${state.name} at ${state.timeInSec}s`}</b></li>
                                                    :
                                                    <li>{`${state.name} at ${state.timeInSec}s`}</li>
                                            )
                                        }
                                    </ul>
                                </div>
                            </Field>
                            :
                            <div class="uk-text-center">
                                None
                            </div>
                    }
                </div>

                <div class="uk-flex uk-flex-right">
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={async (e) => {
                        await controller.endSessionConfirm(session, '/auditoriums');
                    }}>
                        End Game
                    </button>
                </div>
            </Body>
        );
    },
};
