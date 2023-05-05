const m = require('mithril');

const playersListSummarized = players => players.map(player => player).join(", ");

module.exports = {
    view: function ({ attrs }) {
        const summaryData = attrs.summaryData;
        const totalPlayers = attrs.totalPlayers;

        const firstPlaceWinners = summaryData.winners;
        const closeSeconds = summaryData.leaderboard;
        const unluckyWinners = summaryData.unluckyWinners;

        return (
            <div class="uk-container uk-section-secondary uk-margin uk-padding-small">
                <div>
                    <div class="uk-flex uk-flex-center">
                        <h5 class="uk-text-large">Session Summary</h5>
                    </div>
                    {
                        firstPlaceWinners && firstPlaceWinners.length > 0 ?
                            <div class="uk-flex uk-flex-center uk-text-large">
                                <b>1st Place Winners</b>: {playersListSummarized(firstPlaceWinners)}
                            </div>
                            :
                            <div />
                    }
                    {
                        closeSeconds && closeSeconds.length > 0 ?
                            <div class="uk-flex uk-flex-center uk-text-large">
                                <b>Close Seconds</b>: {playersListSummarized(closeSeconds)}
                            </div>
                            :
                            <div />
                    }
                    {
                        unluckyWinners && unluckyWinners.length > 0 ?
                            <div class="uk-flex uk-flex-center uk-text-large">
                                <b>Unlucky Winners</b>: {playersListSummarized(unluckyWinners)}
                            </div>
                            :
                            <div />
                    }
                    {
                        typeof totalPlayers === "number" ?
                            <div class="uk-flex uk-flex-center uk-text-large">
                                <b>Total Players</b>: {totalPlayers}
                            </div>
                            :
                            <div />
                    }
                </div>
            </div>
        );
    },
};
