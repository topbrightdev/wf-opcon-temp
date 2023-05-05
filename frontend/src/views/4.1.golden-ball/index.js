const m = require('mithril');
const moment = require('moment');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }
    },

    noParticipants: function (goldenBallData) {
        return (
            <div class="uk-container uk-text-center">
                <div class="uk-flex uk-flex-center uk-margin">
                    There is no winner for Golden Ball {goldenBallData.goldenBall}
                </div>
                <button class="uk-button uk-button-primary uk-padding-small uk-margin" onclick={async (e) => {
                    rmb.sendToGameServer(rmb.Message.RevealGoldenBall);
                }}>
                    Drop New Golden Ball
                </button>
                <button class="uk-button uk-button-primary uk-padding-small uk-margin" onclick={async (e) => {
                    rmb.sendToGameServer(rmb.Message.EndGoldenBall);
                }}>
                    Return To Bingo
                </button>
            </div>
        );
    },

    revealParticipants: function (goldenBallData) {
        return (
            <div class="uk-text-center">
                <div class="uk-margin">
                    The Golden Ball is {goldenBallData.goldenBall}
                </div>

                <div>
                    Participants
                </div>
                <div class="uk-panel uk-panel-scrollable">
                    <ul class="uk-list">
                        {
                            goldenBallData.winners.map(player =>
                                <li>{player}</li>
                            )
                        }
                    </ul>
                </div>
                <button class="uk-button uk-button-primary uk-padding-small" onclick={async (e) => {
                    rmb.sendToGameServer(rmb.Message.RevealGoldenBallParticipants);
                }}>
                    Reveal Participants
                </button>

                <div class="uk-margin">
                    <div>
                        Spin the wheel to select Golden Ball winner
                    </div>
                    <button class="uk-button uk-button-primary uk-padding-small" onclick={async (e) => {
                        rmb.sendToGameServer(rmb.Message.TriggerGoldenBallSpin);
                    }}>
                        Wheel Spin
                    </button>
                </div>
            </div>
        );
    },

    hasWinner: function (goldenBallData) {
        return (
            <div class="uk-text-center">
                <div>
                    Golden Ball winner is {goldenBallData.winners[0]}
                </div>
                <div>
                    Prize: ${goldenBallData.prize.goldenBall}
                </div>
                <button class="uk-button uk-button-primary uk-padding-small uk-margin" onclick={async (e) => {
                    rmb.sendToGameServer(rmb.Message.EndGoldenBall);
                }}>
                    Return To Bingo
                </button>
            </div>
        );
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        const goldenBallData = model.state.goldenBallData;

        return (
            <Body title='Golden Ball' showBack={true}>
                {
                    !goldenBallData.winners || goldenBallData.winners.length == 0 ?
                        this.noParticipants(goldenBallData)
                        :
                        goldenBallData.winners && goldenBallData.winners.length > 1 ?
                            this.revealParticipants(goldenBallData)
                            :
                            goldenBallData.winners && goldenBallData.winners.length == 1 ?
                                this.hasWinner(goldenBallData)
                                :
                                <div />
                }
            </Body>
        );
    },
};
