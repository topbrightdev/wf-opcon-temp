const m = require('mithril');
const { BusClient, BusClientOperation, BusCode, PeerType } = require('@timeplay/bus-client');
const { webConfig } = require('@timeplay/web-config');
const { profile } = require('@timeplay/login-page');
const model = require('./model');
const { parseUrl } = require('./util/url');

const RMBControllerState = {
    Disconnected: 'Disconnected',
    Connecting: 'Connecting',
    Connected: 'Connected',
    Disconnecting: 'Disconnecting',
};

let rmbControllerState = RMBControllerState.Disconnected;
let rmbRequestTimeout;
let reconnectNotification;

const deviceId = Math.uuid();
const busClient = new BusClient(deviceId, deviceId, WebSocket,
    (info) => console.log(info),
    (warn) => console.warn(warn),
    (err) => console.error(err)
);
busClient.peerType = PeerType.OpCon;

const rmbCallbacks = [];

busClient.setListener(BusClientOperation.Connected, () => {
    console.log("[RMB] Connected.");
    rmbControllerState = RMBControllerState.Connected;

    // ping RMB every minute to keep connection alive when there's no activity
    busClient.startKeepAlive(60000);

    // ask for what screen to go to
    module.exports.sendToGameServer(module.exports.Message.GetOpConScreen);
    module.exports.sendToGameServer(module.exports.Message.GetOpConScreenNew);
});

busClient.setListener(BusClientOperation.Closed, () => {
    console.log("[RMB] Connection Closed.");

    busClient.stopKeepAlive();

    switch (rmbControllerState) {
        case RMBControllerState.Connecting: {
            console.log("Client attempted to connect to RMB before it was ready");
            module.exports.initBus();
            break;
        }
        case RMBControllerState.Connected: {
            console.log("Client has unexpectedly disconnected");
            UIkit.modal.alert("It seems there was a problem. Press OK to re-establish connection.").then(handleDisconnect);
            break;
        }
        case RMBControllerState.Disconnecting:
            console.log("Client has disconnected");
            break;
    }

    rmbControllerState = RMBControllerState.Disconnected;
});

busClient.setListener(BusClientOperation.Data, (bytes) => {
    const str = String.fromCharCode.apply(String, bytes);
    console.log(`[RMB] data Received: ${str}`);
    const data = JSON.parse(str);

    handleScreenChangeEvents(data);
    handleOpConEvents(data);
    handleBingoEvents(data);
    handleWofEvents(data);

    for (let i = 0; i < rmbCallbacks.length; i += 1) {
        rmbCallbacks[i](data);
    }
});

busClient.setListener(BusClientOperation.PlayerId, (playerId) => {
    console.log(`[RMB] playerID received: ${playerId}`);
});

const handleDisconnect = function () {
    const { currentPage, sessionId } = parseUrl();

    if (sessionId) {
        if (currentPage == "session-lobby") {
            // need to reinit RMB connection here if disconnected at session lobby
            module.exports.initBus();
            console.log("Redrawing session lobby");
            return m.redraw();
        } else if (currentPage == "wof-lobby") {
            model.state.wofGameReady = false;
            model.initGameData();
            module.exports.initBus();
            console.log("Redrawing wof lobby");
            return m.redraw();
        }
        if (currentPage.indexOf('wof') >= 0) {
            model.state.wofGameReady = false;
            model.initGameData();
            console.log("Go back to wof lobby");
            m.route.set('/wof-lobby', { sessionId });
        } else {
            console.log("Go back to session lobby");
            model.state.wofGameReady = false;
            m.route.set('/session-lobby', { sessionId });
        }
    } else {
        console.log("Not in an active session. Will not redirect page");
    }
}

const handleScreenChangeEvents = function (data) {
    const { currentPage, sessionId } = parseUrl();

    if (data.hasOwnProperty(module.exports.Message.SetBingoLobby) && sessionId) {
        model.state.bingoLobbyData = data[module.exports.Message.SetBingoLobby];

        if (currentPage == 'session-summary' || currentPage == 'game-summary' ||
            currentPage == 'player-summary' || currentPage == 'purchase-summary') {
            return m.redraw();
        }

        if (currentPage == 'session-lobby') {
            return m.redraw();
        }

        console.log('Go to session lobby');
        return m.route.set('/session-lobby', { sessionId });
    }

    if (data.hasOwnProperty(module.exports.Message.SetBingoGame)) {
        model.state.bingoGameData = data[module.exports.Message.SetBingoGame];

        if (currentPage == 'bingo-game') {
            return m.redraw();
        }

        console.log('Go to bingo game');
        return m.route.set('/bingo-game', { sessionId });
    }

    if (data.hasOwnProperty(module.exports.Message.SetGoldenBall)) {
        model.state.goldenBallData = data[module.exports.Message.SetGoldenBall];

        if (currentPage == 'golden-ball') {
            return m.redraw();
        }

        console.log('Go to golden ball');
        return m.route.set('/golden-ball', { sessionId });
    }

    if (data.hasOwnProperty(module.exports.Message.SetPlayerBall)) {
        model.state.playerBallData = data[module.exports.Message.SetPlayerBall];

        if (currentPage == 'player-ball') {
            return m.redraw();
        }

        console.log('Go to player ball');
        return m.route.set('/player-ball', { sessionId });
    }

    if (data.hasOwnProperty(module.exports.Message.SetBingoClaim)) {
        model.state.bingoClaimData = data[module.exports.Message.SetBingoClaim];

        if (currentPage == 'bingo-claim') {
            return m.redraw();
        }

        console.log('Go to bingo claim');
        return m.route.set('/bingo-claim', { sessionId });
    }

    if (data.hasOwnProperty(module.exports.Message.SetBingoSummary)) {
        model.state.bingoSummaryData = data[module.exports.Message.SetBingoSummary];

        const leaderboardState = model.state.bingoSummaryData.currentLeaderboardState;
        let leaderboardPage;
        switch (leaderboardState) {
            case module.exports.LeaderboardState.RunnerUpLeaderboard: {
                leaderboardPage = "bingo-closesecond";
                break;
            }
            case module.exports.LeaderboardState.UnluckiestLeaderboard: {
                leaderboardPage = "bingo-unlucky";
                break;
            }
            case module.exports.LeaderboardState.WinnerLeaderboard:
            default: {
                leaderboardPage = "bingo-winners";
            }
        }

        if (leaderboardState === -1) {
            console.warn("Leaderboard state not specified from Game Server, defaulting to winners screen");
        }

        if (currentPage == leaderboardPage) {
            return m.redraw();
        }

        console.log(`Go to bingo summary - ${leaderboardPage}`);
        return m.route.set(`/${leaderboardPage}`, { sessionId });
    }

    if (data.hasOwnProperty(module.exports.Message.SetBingoGameOutro)) {
        model.state.bingoSummaryData = data[module.exports.Message.SetBingoGameOutro];

        if (currentPage == 'bingo-outro') {
            return m.redraw();
        }

        console.log('Go to bingo outro');
        return m.route.set('/bingo-outro', { sessionId });
    }

    if (data.hasOwnProperty(module.exports.Message.SetAudienceChoice)) {
        model.state.bingoAudienceChoiceData = data[module.exports.Message.SetAudienceChoice];

        if (currentPage == 'audience-choice') {
            return m.redraw();
        }

        console.log('Go to bingo audience choice');
        return m.route.set('/audience-choice', { sessionId });
    }

    if (data.hasOwnProperty(module.exports.Message.SetTriviaState)) {
        model.state.triviaGameData = data[module.exports.Message.SetTriviaState];

        if (currentPage == 'trivia-game') {
            return m.redraw();
        }

        console.log('Go to trivia game');
        return m.route.set('/trivia-game', { sessionId });
    }
};

const handleOpConEvents = function (data) {
    if (data.hasOwnProperty(module.exports.Message.SetOpConInfo)) {
        const payload = data[module.exports.Message.SetOpConInfo];
        model.state.actorPeerID = payload.actorPeerID;
    }

    if (data.hasOwnProperty(module.exports.Message.OpconFailedAudienceChoice)) {
        console.log(`Could not activate Audience Choice due to not enough choices`);

        // NOTE: Currently OpconFailedAudienceChoice only gets sent if there's not enough choices for Audience Choice,
        // but this could change in the future.

        UIkit.modal.alert("Unable to trigger Audience Choice as there are only a few balls left to be called.");
    }
}

const handleBingoEvents = function (data) {
    if (data.hasOwnProperty(module.exports.Message.BingoPrize)) {
        model.state.bingoPrize = data[module.exports.Message.BingoPrize];
        console.log(`Got bingo prize: ${JSON.stringify(model.state.bingoPrize)}`);
    }
};

const handleWofEvents = async function (data) {
    const { sessionId } = parseUrl();
    console.log(`handleWofEvents >>` + data + ` >> sessionId >>` + sessionId);

    if (data.hasOwnProperty(module.exports.Message.WofSetOpConInfo)) {
        const payload = data[module.exports.Message.WofSetOpConInfo];
        model.state.actorPeerID = payload.actorPeerID;
        console.log(`handleWofEvents: SetOpConInfo >>` + model.state.actorPeerID);
        return m.redraw();
    }

    if (data.hasOwnProperty(module.exports.Message.WofSetOpConInfo)) {
        const payload = data[module.exports.Message.WofSetOpConInfo];
        model.state.actorPeerID = payload.actorPeerID;
        console.log(`handleWofEvents: SetOpConInfo >>` + model.state.actorPeerID);
        return m.redraw();
    }

    if (data.hasOwnProperty(module.exports.Message.WofSetGameState)) {
        const payload = data[module.exports.Message.WofSetGameState];
        const processResult = payload.processResult;
        model.state.actorPeerID = payload.actorPeerID;
        model.state.roundState = payload.roundState;
        if (processResult) {
            const gameStep = payload.gameStep;
            const currentGameStep = model.state.gameStep;
            model.state.wofGameReady = true;
            console.log('[rmbController:WofSetGameState]', gameStep, currentGameStep);
            if (gameStep == model.GameStepType.none) {
                console.log('[rmbController:WofSetGameState gameStep == none]');
                return m.route.set('/wof-lobby', { sessionId });
            }
            else if (gameStep == model.GameStepType.welcomeStep) {
                console.log('[rmbController:WofSetGameState gameStep == welcomeStep]');
                if (currentGameStep != model.GameStepType.welcomeStep) {
                    return m.route.set('/wof-start', { sessionId });
                } else {
                    return m.redraw();
                }
            } else if (gameStep == model.GameStepType.contestantDrawing || gameStep == model.GameStepType.contestantRevealed) {
                console.log('[rmbController:WofSetGameState gameStep == contestantDrawing]');
                if (currentGameStep != model.GameStepType.contestantDrawing) {
                    console.log('[handWofEvent] route set contestant');
                    return m.route.set('/wof-contestant', { sessionId });
                } else {
                    return m.redraw();
                }
            }
            else if (gameStep == model.GameStepType.roundStep) {
                if (currentGameStep != model.GameStepType.roundStep) {
                    return m.route.set('/wof-round-play', { sessionId });
                } else {
                    return m.redraw();
                }
            }
            else if (gameStep == model.GameStepType.leaderBoardStep) {
                if (currentGameStep != model.GameStepType.leaderBoardStep) {
                    return m.route.set('/wof-leaderboard', { sessionId });
                } else {
                    return m.redraw();
                }
            }
            else if (gameStep == model.GameStepType.thankYouStep) {
                if (currentGameStep != model.GameStepType.thankYouStep) {
                    return m.route.set('/wof-leaderboard', { sessionId });
                } else {
                    return m.redraw();
                }
            }
            else if (gameStep == model.GameStepType.endGameStep) {
                await controller.endSessionConfirm(session, '/auditoriums');
                return m.redraw();
            }
        }
        console.log(`handleWofEvents: SetOpConInfo >>` + model.state.actorPeerID);
        return m.redraw();
    }

    if (data.hasOwnProperty(module.exports.Message.Error)) {

        const payload = data[module.exports.Message.Error];
        UIkit.modal.alert(payload).then(model.state.processWaiting = false);
        console.log(`handleWofEvents: Error >>` + payload);
        return m.redraw();
    }

    if (data.hasOwnProperty(module.exports.Message.LaunchWof)) {
        model.state.processWaiting = false;
        const payload = data[module.exports.Message.LaunchWof];
        const processResult = payload.processResult;
        if (processResult == true) {
            model.state.roundState = data[module.exports.Message.LaunchWof].roundState;
            console.log(`handleWofEvents: LaunchWof : ${JSON.stringify(model.state.roundState)}`);
            model.state.gameStep = model.GameStepType.welcomeStep;
            return m.route.set('/wof-start', { sessionId });
        }
    }

    if (data.hasOwnProperty(module.exports.Message.Contestant_Draw)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.Contestant_Draw].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.Contestant_Draw].roundState;
            model.state.gameStep = model.GameStepType.contestantDrawing;
            console.log(`handleWofEvents: Contestant_Draw : ${JSON.stringify(model.state.roundState)}`);
            return m.redraw();
        }
    }

    if (data.hasOwnProperty(module.exports.Message.Contestant_Reveal)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.Contestant_Reveal].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.Contestant_Reveal].roundState;
            model.state.gameStep = model.GameStepType.contestantDrawing;
            console.log(`handleWofEvents: Contestant_Reveal : ${JSON.stringify(model.state.roundState)}`);
            return m.redraw();
        }
    }

    if (data.hasOwnProperty(module.exports.Message.PreRoundStage)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.PreRoundStage].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.PreRoundStage].roundState;
            console.log(`handleWofEvents: PreRoundStage : ${JSON.stringify(model.state.roundState)}`);
            return m.route.set('/wof-intro-game', { sessionId });
        }
    }

    if (data.hasOwnProperty(module.exports.Message.RevealPuzzle)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.RevealPuzzle].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.RevealPuzzle].roundState;
            model.state.gameStep = model.GameStepType.roundStep;
            console.log(`handleWofEvents: RevealPuzzle : ${JSON.stringify(model.state.roundState)}`);
            return m.route.set('/wof-round-play', { sessionId });
        }
    }

    if (data.hasOwnProperty(module.exports.Message.SpinWheel)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.SpinWheel].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.SpinWheel].roundState;
            console.log(`handleWofEvents: SpinWheel : ${JSON.stringify(model.state.roundState)}`);
            return m.redraw();
        }
    }

    if (data.hasOwnProperty(module.exports.Message.CallLetter)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.CallLetter].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.CallLetter].roundState;
            console.log(`handleWofEvents: CallLetter : ${JSON.stringify(model.state.roundState)}`);
            return m.redraw();
        }
    }

    if (data.hasOwnProperty(module.exports.Message.BuyVowel)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.BuyVowel].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.BuyVowel].roundState;
            console.log(`handleWofEvents: BuyVowel : ${JSON.stringify(model.state.roundState)}`);
            return m.redraw();
        }
    }

    if (data.hasOwnProperty(module.exports.Message.Solve)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.Solve].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.Solve].roundState;
            model.state.finalBoardState.pointIndex = 0;
            model.state.finalBoardState.topPlayersCount = 3;
            console.log(`handleWofEvents: Solve : ${JSON.stringify(model.state.roundState)}`);
            return m.redraw();
        }
    }

    if (data.hasOwnProperty(module.exports.Message.Player_Select)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.Player_Select].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.Player_Select].roundState;
            console.log(`handleWofEvents: Player_Select : ${JSON.stringify(model.state.roundState)}`);
            return m.redraw();
        }
    }

    if (data.hasOwnProperty(module.exports.Message.AudienceLeaderboardStage)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.AudienceLeaderboardStage].processResult;
        if (processResult) {
            model.state.roundResult = data[module.exports.Message.AudienceLeaderboardStage];
            model.state.gameStep = model.GameStepType.leaderBoardStep;
            model.state.leaderBoardState.pointIndex = 0;
            model.state.leaderBoardState.topPlayersCount = model.state.roundResult.topPlayers.length;
            console.log(`handleWofEvents: AudienceLeaderboardStage : true`);
            return m.route.set('/wof-leaderboard', { sessionId });
        }
    }

    if (data.hasOwnProperty(module.exports.Message.RevealAudiencePoint)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.RevealAudiencePoint].processResult;
        if (processResult) {
            model.state.leaderBoardState = data[module.exports.Message.RevealAudiencePoint];
            model.state.gameStep = model.GameStepType.thankYouStep;
            console.log(`handleWofEvents: RevealAudiencePoint : ${JSON.stringify(model.state.leaderBoardRevealPoint)}`);
            return m.redraw();
        }
    }
    if (data.hasOwnProperty(module.exports.Message.RevealFinalPoint)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.RevealFinalPoint].processResult;
        if (processResult) {
            model.state.finalBoardState = data[module.exports.Message.RevealFinalPoint];
            model.state.gameStep = model.GameStepType.leaderBoardStep;
            console.log(`handleWofEvents: RevealFinalPoint : ${JSON.stringify(model.state.finalBoardFinalPoint)}`);
            console.log(`handleWofEvents: RevealFinalPointData : ${model.state.finalBoardState.pointIndex}`);
            return m.redraw();
        }
    }

    if (data.hasOwnProperty(module.exports.Message.EndGame)) {
        model.state.processWaiting = false;
        const processResult = data[module.exports.Message.EndGame].processResult;
        if (processResult) {
            model.state.roundState = data[module.exports.Message.EndGame].roundState;
            console.log(`handleWofEvents: EndGame : ${JSON.stringify(model.state.roundState)}`);
            return m.redraw();
        }
    }

    if (data.hasOwnProperty(module.exports.Message.CurrentLeaderboardPointIndex)) {
        model.state.processWaiting = false;
        model.state.currentLeaderboardPointIndex = data[module.exports.Message.CurrentLeaderboardPointIndex].num;
        console.log(`handleWofEvents: CurrentLeaderboardPointIndex >>` + model.state.currentLeaderboardPointIndex);
    }


}

const requestBus = async function (sessionId, currRequestAttempt) {
    const logPrefix = '[requestBus]';
    const config = await webConfig.getConfig();
    const rmbRetryTimeout = config.rmbRetryTimeout || 1000;
    const rmbMaxConnectionAttempts = config.rmbMaxConnectionAttempts || 60;
    if (!busClient) {
        // not configured to use rmb
        return;
    }
    if (busClient.isConnected()) {
        // already connected to rmb
        return;
    }
    if (rmbControllerState === RMBControllerState.Disconnecting) {
        console.log(`${logPrefix} skip, bus is disconnecting`);
        return;
    }
    if (rmbControllerState === RMBControllerState.Connecting) {
        // there's a chance that multiple requests cause infinite connection loop
        // we block it with this flag so only one request at a time
        console.log(`${logPrefix} skip, already requesting bus`);
        return;
    }
    if (currRequestAttempt >= rmbMaxConnectionAttempts) {
        // at this point, if there's still no successful connection, give up and provide error to user
        console.log(`${logPrefix} reach max attempts ${rmbMaxConnectionAttempts}`);
        if (reconnectNotification) {
            reconnectNotification.close(true);
        }
        reconnectNotification = UIkit.notification("Re-establishing connection to the game.", {
            timeout: 5000,
        });
        handleDisconnect();
        return;
    }

    rmbControllerState = RMBControllerState.Connecting;

    try {
        let response = await m.request({
            method: 'get',
            url: `${config.roomService}/bus/${sessionId}`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            json: true,
        });

        let busInfo = response.data;
        if (busInfo) {
            console.log(`${logPrefix} Found RMB, Connecting to RMB at ${busInfo.data.WebSocket}`);
            busClient.connect(busInfo.data.WebSocket);
        } else {
            console.error(`${logPrefix} room has no RMB`);
            rmbControllerState = RMBControllerState.Disconnected;
            rmbRequestTimeout = setTimeout(() => {
                requestBus(sessionId, currRequestAttempt + 1);
            }, rmbRetryTimeout);
        }
    } catch (err) {
        console.error(`${logPrefix} failed to get RMB: ${err}`);
        rmbControllerState = RMBControllerState.Disconnected;
        rmbRequestTimeout = setTimeout(() => {
            requestBus(sessionId, currRequestAttempt + 1);
        }, rmbRetryTimeout);
    }
}

const getState = function () {
    return rmbControllerState;
}

module.exports = {
    getState,
    RMBControllerState,

    Message: {
        //////////////////////////////
        /// negative value for common msg
        GetOpConScreenNew: -101, // request what page should opcon display
        ToNextGame: -102, // request current game to end (not all games support this)
        //////////////////////////////


        //////////////////////////////
        /// 1xxx bingo msg
        // Bingo Game should send one of the bingo screen message as a response
        GetOpConScreen: 1000, // TODO: to remove
        SetOpConInfo: 1001,
        // trigger players to vote for patterns
        // TriggerPlayerVote: 1001,
        // SetBingoPattern: 1002,
        // TriggerUpsell: 1003,
        // TriggerUpgrade: 1004,
        DropBall: 1005,
        // TriggerDoubleDown: 1006,
        StartGame: 1007,

        PauseBingo: 1008,
        ResumeBingo: 1009,
        TriggerBingo: 1010,
        // EndPlayerVote: 1011,
        // TriggerVerifyBingo: 1012,
        // CancelVerifyBingo: 1013,
        EndGame: 1014,
        // ReturnToIdleState: 1016,
        ToggleBallAutoDrop: 1017,

        // TriggerPlayerBallVote: 1018,
        // EndPlayerBallVote: 1019,
        // EndPlayerBall: 1020,

        RevealGoldenBall: 1021,
        RevealGoldenBallParticipants: 1022,
        TriggerGoldenBallSpin: 1023,
        EndGoldenBall: 1024,

        ShowCloseSecond: 1025,
        ShowMiniGameWinners: 1026,
        ShowUnluckyWinners: 1027,
        TriggerOutro: 1030,

        BingoPrize: 1051,

        SetBingoLobby: 1100,
        SetBingoGame: 1101,
        SetBingoSummary: 1102,
        // SetPlayerPattern: 1103,
        SetGoldenBall: 1104,
        SetPlayerBall: 1105,
        SetBingoClaim: 1106,
        SetBingoGameOutro: 1107,
        SetAudienceChoice: 1108,
        EndAudienceChoice: 1109,

        BallsAway: 1401,
        BingoClaim: 1403,

        OpconTriggerAudienceChoice: 1405,
        OpconEndAudienceChoice: 1406,
        OpconDropAudienceChoiceBall: 1407,

        OpconFailedAudienceChoice: 1910,
        //////////////////////////////


        //////////////////////////////
        /// 2xxx msg for all trivia games
        /// Use this msg group to collectively control trivia games
        /// Each trivia game can direct opcon to other page (ex. 3xxx for gig) if configured to do so
        SetTriviaState: 2001, // display trivia page
        //////////////////////////////


        //////////////////////////////
        /// 3xxx msg for gig
        ChangeGigState: 3001, // opcon -> big screen
        SetGigState: 3102, // big screen -> opcon
        Btn0Press: 3300,
        Btn1Press: 3301,
        Btn2Press: 3302,
        Btn3Press: 3303,
        //////////////////////////////

        //////wof state
        GetGameState: 4099,
        LaunchWof: 4100,
        IntroVideoStage: 4101,
        Contestant_Draw: 4102,
        Contestant_Reveal: 4103,
        // TossUp: 4006,
        // StartTossUp: 4007,
        // Solve_Pause: 4008,
        // Solve_Wrong_Unpause: 4009,
        // Solve_Correct: 4010,

        PreRoundStage: 4104,
        AudienceGameIntroStage: 4105,
        RevealPuzzle: 4106,
        SpinWheel: 4107,
        BuyVowel: 4108,
        Solve: 4109,
        CallLetter: 4110,
        Player_Select: 4111,
        AudienceLeaderboardStage: 4112,
        RevealAudiencePoint: 4113,
        ThankYouStage: 4114,
        EndGame: 4115,
        Back: 4116,
        ShoutOut: 4117,
        RevealFinalPoint: 4118,

        //BigScreen -> opcon
        WofSetOpConInfo: 4305,
        WofSetGameState: 4307,

        Error: 4999
    },

    LeaderboardState: {
        WinnerLeaderboard: 0,
        RunnerUpLeaderboard: 1,
        UnluckiestLeaderboard: 2,
    },

    initBus: async function () {
        const { sessionId } = parseUrl();
        if (sessionId) {
            const session = model.state.sessions.find(x => x.uid == sessionId);
            if (session) {
                requestBus(session.uid, 0);
            }
        }
    },

    requestBus: async function (sessionId) {
        requestBus(sessionId, 0);
    },

    stopRequestingBus() {
        clearInterval(rmbRequestTimeout);
    },

    sendToGameServer(message, data) {
        const payload = {};
        // TODO(POBPINGO-326) Remove stringify from payload info and check that all handlers on bingoplus also remove their extra parse
        payload[message] = JSON.stringify(data ? data : {});
        const str = JSON.stringify(payload);
        console.log('[RMB] Sending to Game Server', str);
        busClient.sendString(str);
    },

    sendToGameServerNew(message, data) {
        const payload = {};
        payload[message] = data ? data : {};
        const str = JSON.stringify(payload);
        console.log('[RMB] Sending to Game Server', str);
        busClient.sendString(str);
    },

    sendToActor(message, data) {
        model.state.processWaiting = true;
        const payload = {};
        payload[message] = data ? data : {};
        const str = JSON.stringify(payload);
        const actorPeerID = model.state.actorPeerID;
        if (actorPeerID != undefined) {
            console.log(`[RMB] Sending to Actor ${actorPeerID}`, str);
            busClient.sendString(str, actorPeerID);
        } else {
            console.log(`[RMB] Invalid Actor. Sending to Game Server`, str);
            busClient.sendString(str);
        }
    },

    registerRMBData(callback) {
        if (rmbCallbacks.indexOf(callback) < 0) {
            rmbCallbacks.push(callback);
        }
        console.log('[RMB] Register, current callbacks:', rmbCallbacks);
    },

    unRegisterRMBData(callback) {
        const index = rmbCallbacks.indexOf(callback);
        if (index >= 0 && index < rmbCallbacks.length) {
            rmbCallbacks.splice(index, 1);
        }
        console.log('[RMB] Unregister, current callbacks', rmbCallbacks);
    },

    disconnect() {
        console.log("User has initiated disconnection");
        // Intentional disconnect
        this.stopRequestingBus();
        if (busClient.isConnected()) {
            rmbControllerState = RMBControllerState.Disconnecting;
            busClient.disconnect();
        } else {
            // BusClientOperation.Closed will not trigger, set to idle directly
            rmbControllerState = RMBControllerState.Disconnected;
        }
    },
};
