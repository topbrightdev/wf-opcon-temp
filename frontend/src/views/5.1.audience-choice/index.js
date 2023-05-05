const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');
const { getBingoLetterByNumber } = require('../../util/bingo');

const letters = new Array(26).fill().map((_, i) => String.fromCharCode('A'.charCodeAt(0) + i));

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }
    },

    getAudienceChoiceOptionsOrdered: function (audienceChoiceOptions) {
        return Object.entries(audienceChoiceOptions).sort(([k1, _1], [k2, _2]) => k1 - k2);
    },

    displayOption: function (optionIndex, option, shouldDisplayNumber, shouldDisplayVotes) {
        const ballNumber = option.ballNumber;
        return (
            <div style={{
                margin: '10px',
            }}>
                <div class="uk-card uk-card-body uk-card-default">
                    <h3>{shouldDisplayNumber ? `${getBingoLetterByNumber(ballNumber)}${ballNumber}` : letters[optionIndex % 26]}</h3><br />
                    {shouldDisplayVotes && <span>Votes: {option.votesTotal} ({option.votesPercentage * 100}%)</span>}
                </div>
            </div>
        );
    },

    voting: function (audienceChoiceData) {
        const optionsAvailable = audienceChoiceData.optionsAvailable;
        return (
            <div class="uk-text-center">
                {optionsAvailable &&
                    <div class="uk-margin">
                        <span class="uk-text-large">Choices are:</span>
                        <div class="uk-flex uk-flex-center uk-flex-wrap">
                            {this.getAudienceChoiceOptionsOrdered(optionsAvailable.audienceChoiceOptions).map(([optionKey, _], i) => this.displayOption(i, optionsAvailable.audienceChoiceOptions[optionKey], optionsAvailable.shouldDisplayNumber, false))}
                        </div>
                    </div>
                }
                <div class="uk-margin uk-text-large">
                    Press the button below to end voting and reveal winning choice.
                </div>
                <div class="uk-margin">
                    <button class="uk-button uk-button-primary uk-padding-small uk-text-large" onclick={async (e) => {
                        rmb.sendToActor(rmb.Message.OpconEndAudienceChoice);
                    }}>
                        End Vote
                    </button>
                </div>
            </div>
        );
    },

    voted: function (audienceChoiceData) {
        const optionsAvailable = audienceChoiceData.optionsAvailable;
        const winningOption = audienceChoiceData.winningOption;
        const optionIndex = this.getAudienceChoiceOptionsOrdered(optionsAvailable.audienceChoiceOptions).map(([key, _]) => key).indexOf(winningOption.ballNumber.toString());
        return (
            <div class="uk-text-center uk-text-large" >
                <div>
                    Audience Choice is <div class="uk-flex uk-flex-center uk-flex-wrap">
                        {this.displayOption(optionIndex, audienceChoiceData.winningOption, optionsAvailable.shouldDisplayNumber, true)}
                    </div>
                </div>
                <div class="uk-margin uk-text-large">
                    Press the button below to drop Audience Choice ball and return to Bingo
                </div>
                <button class="uk-button uk-button-primary uk-padding-small uk-margin uk-text-large" onclick={async (e) => {
                    rmb.sendToActor(rmb.Message.OpconDropAudienceChoiceBall);
                }}>
                    Drop Audience Choice Ball
                </button>
            </div>
        );
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        const audienceChoiceData = model.state.bingoAudienceChoiceData;

        return (
            <Body title='Audience Choice'>
                {
                    !audienceChoiceData.winningOption ?
                        this.voting(audienceChoiceData)
                        :
                        this.voted(audienceChoiceData)
                }
            </Body>
        );
    },
};
