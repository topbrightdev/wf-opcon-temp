const GameStepType =
{
    none: 0,
    welcomeStep: 1,
    contestantDrawing: 2,
    contestantRevealed: 3,
    roundStep: 4,
    leaderBoardStep: 5,
    thankYouStep: 6,
    endGameStep: 7
}

const state = {
    sessions: [],
    actorPeerID: undefined,
    bingoLobbyData: {},
    bingoGameData: {},
    bingoClaimData: {},
    bingoSummaryData: {},
    bingoAudienceChoiceData: {},
    goldenBallData: {},
    playerBallData: {},
    reportData: {},
    // gigGameData: {},
    triviaGameData: {},
    bingoClaims: [],
    bingoUnclaims: [],
    bingoBallsAway: 0,
    bingoPlayers: [],
    bingoPrize: {},
    auditoriumIndex: 0,
    // WOF
    processWaiting: false,
    wofGameReady: false,
    gameStep: GameStepType.none,
    roundState: {},
    roundResult: {},
    leaderBoardState: {},
    finalBoardState: {}, 
    isDisabled: true, // Audience point state after contestants scores are displayed.
    currentLeaderboardPointIndex: 9,
    lastSendedCommand: 0,
};

const initBingoData = () => {
    state.bingoLobbyData = {};
    state.bingoGameData = {};
    state.bingoClaimData = {};
    state.bingoSummaryData = {};
    state.bingoAudienceChoiceData = {};
    state.bingoClaims = [];
    state.bingoUnclaims = [];
    state.bingoBallsAway = 0;
    state.bingoPlayers = [];
    state.bingoPrize = {};
    state.bingoBallDropped = false;
};

const initWofData = () => {
    state.wofGameReady = false;
    state.processWaiting = true;
    state.gameStep = GameStepType.none;
    state.roundState = {};
    state.roundResult = {};
    state.leaderBoardState = {};
    state.finalBoardState = {}; 
    state.currentLeaderboardPointIndex = 9;
    state.lastSendedCommand = 0;
}

const initMockData = () => {
    // state.reportData.revenue = {
    //     current: 100.95,
    //     gross: 2080.81,
    //     // target: 0.00,
    // };

    // state.reportData.previousWinners = [
    //     "player 1",
    //     "player 2",
    // ];

    // state.reportData.previousPlayers = [
    //     "player 1",
    //     "player 2",
    // ];

    // state.bingoBallsAway = 1;
    // state.bingoPlayers = [
    //     {
    //         nickname: "TEST G",
    //         ballsToGetBingo: [2, 23, 23],
    //         minDaubsUntilBingo: 1,
    //     }
    // ];

    // state.bingoAudienceChoiceData = {
    //     "optionsAvailable": {
    //         "shouldDisplayNumber": false,
    //         "audienceChoiceOptions": {
    //             "1": {
    //                 "ballNumber": 1,
    //                 "votesTotal": 30,
    //                 "votesPercentage": 0.3
    //             },
    //             "33": {
    //                 "ballNumber": 33,
    //                 "votesTotal": 0,
    //                 "votesPercentage": 0
    //             },
    //             "36": {
    //                 "ballNumber": 36,
    //                 "votesTotal": 0,
    //                 "votesPercentage": 0
    //             },
    //             "70": {
    //                 "ballNumber": 70,
    //                 "votesTotal": 60,
    //                 "votesPercentage": 0.6
    //             }
    //         }
    //     },
    //     "winningOption": null
    // };
};

const initGameData = () => {
    initBingoData();
    initMockData();
    initWofData();
};

initMockData();

module.exports = {
    state,
    initGameData,
    GameStepType
};
