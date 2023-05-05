const m = require('mithril');

const getMonetaryValue = (val) => val ? `$${val.toFixed(2)}` : `${val}`;

const getPrizeValue = (val) => typeof val === "string" ? val : getMonetaryValue(val);

module.exports = {
    view: function ({ attrs }) {
        const prize = attrs.prize;

        if (!prize || !prize.payouts || !prize.payouts.bingoplus) {
            return (<div />);
        }

        return (
            <div class="uk-container uk-section-secondary uk-margin uk-padding-small uk-width-1-1">
                {
                    prize ?
                        <div class="uk-flex uk-flex-center">
                            <div class="uk-flex uk-flex-center uk-padding uk-padding-remove-vertical uk-text-large">
                                Bingo Pool: {getPrizeValue(prize.payouts.bingoplus.pool)}
                            </div>
                            <div class="uk-flex uk-flex-center uk-padding uk-padding-remove-vertical uk-text-large">
                                Winner Prize: {getPrizeValue(prize.payouts.bingoplus.winnerExpectPayout)}
                            </div>
                            <div class="uk-flex uk-flex-center uk-padding uk-padding-remove-vertical uk-text-large">
                                Unlucky Prize: {getPrizeValue(prize.payouts.bingoplus.unluckyMinPayout)}
                            </div>
                        </div>
                        :
                        <div />
                }
            </div>
        );
    },
};
