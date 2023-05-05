const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');
const { webConfig } = require('@timeplay/web-config');

const RoundStepType = {
    none: 0,
    firstTurnStep: 1,
    normalStep: 2,
    callConsonantStep: 3,
    callVowelStep: 4,
    solveStep: 5,
    afterTurnStep: 6,
    onlyVowelsRemainStep: 7,
    loseTurnStep: 8,
    buyVowelStep: 9,
    end: 10
}

const buyVowelBalance = 20;

const consonants = [
    'B',
    'C',
    'D',
    'F',
    'G',
    'H',
    'J',
    'K',
    'L',
    'M',
    'N',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'V',
    'W',
    'X',
    'Y',
    'Z',
];

const vowels = ['A', 'E', 'I', 'O', 'U'];

module.exports = {
    oninit: async function ({ attrs }) {
        this.totalUsers = 0;
        this.readyUsers = 0;
        if (await profile.loginRequired()) {
            return m.route.set('/wof-contestant');
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

    getMatchCount: function (letter) {
        var letter_Count = 0;
        var puzzle = model.state.roundState.puzzleData.puzzle;
        for (var position = 0; position < puzzle.length; position++) {
            if (puzzle.charAt(position).toUpperCase() == letter.toUpperCase()) {
                letter_Count++;
            }
        }
        return letter_Count;
    },

    onremove: function () {
        clearInterval(this.connectedPlayersInterval);
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        var roundState = model.state.roundState;
        var finalBoardState = model.state.finalBoardState;
        console.log("final Board State from BG", finalBoardState); 


        var temp = roundState.contestants; 
        var balanceList = []; 
        temp.map((item, index) => {
            balanceList.push(item.balance); 
        }); 
        const maxBal = Math.max(...balanceList); 
        const minBal = Math.min(...balanceList);
        var displayData = []; 
        temp.map((item, i) => {
            item.balance == maxBal ? displayData.push(item) : ''
        }); 
        temp.map((item, i) => {
            item.balance != maxBal && item.balance != minBal ? displayData.push(item) : ''
        }); 
        temp.map((item, i) => {
            item.balance == minBal ? displayData.push(item) : ''
        }); 
        console.log("The data to display at the last of the game", displayData); 
        if (!session) {
            return;
        }
        return (
            <Body title='WOF Round Play'>
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
                        <div class='wof-container'>
                            <div class='uk-text-normal uk-text-default'>Puzzle Answer</div>
                            <div class='uk-text-bold uk-text-large'>{roundState.puzzleData.puzzle}</div>
                            <div class='uk-text-normal uk-text-default'>Category</div>
                            <div class='uk-text-bold uk-text-large'>{roundState.puzzleData.category}</div>
                        </div>
                        <div class={roundState.letterState.isNoneConsonant || roundState.letterState.isNoneVowel ? 'wof-container' : 'wof-hidden'}>
                            <div class={roundState.letterState.isNoneVowel ? 'uk-text-bold uk-text-large' : 'wof-hidden'}>None Vowel Letter</div>
                            <div class={roundState.letterState.isNoneConsonant ? 'uk-text-bold uk-text-large' : 'wof-hidden'}>None Consonant Letter</div>
                        </div>
                        {/* ContestantSelect-Group */}
                        <div class={roundState.roundStep == RoundStepType.loseTurnStep ? "wof-body wof-container" : "wof-hidden"}>
                            <button class="wof-btn wof-is-dark wof-btn-medium wof-margin-small"
                                disabled={roundState.currentContestantIndex < 2 || model.state.processWaiting}
                                onclick={() => {
                                    rmb.sendToActor(rmb.Message.Player_Select, { num: 0 });
                                }
                                }
                            >
                                {"#1: " + roundState.contestants[0].name}
                            </button>
                            <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small"
                                disabled={roundState.currentContestantIndex > 0 || model.state.processWaiting}
                                onclick={() => {
                                    rmb.sendToActor(rmb.Message.Player_Select, { num: 1 });
                                }
                                }
                            >
                                {"#2: " + roundState.contestants[1].name}
                            </button>
                            <button class="wof-btn wof-is-info wof-btn-medium wof-margin-small"
                                disabled={roundState.currentContestantIndex % 2 == 0 || model.state.processWaiting}
                                onclick={() => {
                                    rmb.sendToActor(rmb.Message.Player_Select, { num: 2 });
                                }
                                }
                            >
                                {"#3: " + roundState.contestants[2].name}
                            </button>
                        </div>

                        {/* Wheel-Group */}
                        <div class={roundState.roundStep == RoundStepType.normalStep || roundState.roundStep == RoundStepType.firstTurnStep ? "wof-body wof-container" : "wof-hidden"}>
                            <div class="uk-card uk-card-default uk-flex uk-flex-center">
                                <button class="wof-round-button wof-margin-small"
                                    disabled={model.state.processWaiting}
                                    onclick={() => {
                                        rmb.sendToActor(rmb.Message.SpinWheel, { num: 0 });
                                    }}
                                >
                                    Slow
                                </button>
                                <button class="wof-round-button wof-margin-small"
                                    disabled={model.state.processWaiting}
                                    onclick={() => {
                                        rmb.sendToActor(rmb.Message.SpinWheel, { num: 1 });
                                    }}
                                >
                                    Medium
                                </button>
                                <button class="wof-round-button wof-margin-small"
                                    disabled={model.state.processWaiting}
                                    onclick={() => {
                                        rmb.sendToActor(rmb.Message.SpinWheel, { num: 2 });
                                    }}
                                >
                                    Fast
                                </button>
                            </div>
                        </div>

                        {/* ConsonantLetter-Group */}
                        <div class={roundState.roundStep == RoundStepType.afterTurnStep ? "wof-body wof-container" : "wof-hidden"}>
                            {
                                consonants.map((consonant) => (
                                    <div style={{ display: 'inline-flex', flexDirection: "column" }}>

                                        <button onclick={() => {
                                            const params = {
                                                str: consonant
                                            }
                                            rmb.sendToActor(rmb.Message.CallLetter, params);
                                        }}
                                            disabled={roundState.letterState.usedLetters.find(x => x == consonant) || model.state.processWaiting ? true : false}
                                            class="wof-btn wof-letter-btn"
                                        >{consonant}</button>
                                        <span class={`wof-letter-span wof-text-bold${this.getMatchCount(consonant) != 0 ? '' : ' wof-text-red'}`}>{roundState.letterState.usedLetters.find(x => x == consonant) ? "" : this.getMatchCount(consonant)}</span>
                                    </div>
                                ))
                            }
                        </div>

                        {/* BuyVowel-Button */}
                        <div class={(roundState.roundStep == RoundStepType.normalStep || roundState.roundStep == RoundStepType.firstTurnStep)
                            && !roundState.letterState.isNoneVowel
                            && roundState.contestants[roundState.contestants.findIndex(element => element.contestantIndex == roundState.currentContestantIndex)].balance >= roundState.buyBowelCost

                            ? "wof-body wof-container" : "wof-hidden"}>
                            <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small" disabled={model.state.processWaiting} onclick={() => {
                                rmb.sendToActor(rmb.Message.BuyVowel);
                            }}>
                                Buy Vowel
                            </button>
                        </div>

                        {/* VowelLetter-Group */}
                        <div class={roundState.roundStep == RoundStepType.buyVowelStep && !roundState.letterState.isNoneVowel ? "wof-body wof-container" : "wof-hidden"}>
                            {
                                vowels.map((vowel) => (
                                    <div style={{ display: 'inline-flex', flexDirection: "column" }}>

                                        <button onclick={() => {
                                            const params = {
                                                str: vowel
                                            }
                                            rmb.sendToActor(rmb.Message.CallLetter, params);
                                        }}
                                            disabled={roundState.letterState.usedLetters.find(x => x == vowel) || model.state.processWaiting ? true : false}
                                            class="wof-btn wof-letter-btn"
                                        >{vowel}</button>
                                        <span class={`wof-letter-span wof-text-bold${this.getMatchCount(vowel) != 0 ? '' : ' wof-text-red'}`}>{roundState.letterState.usedLetters.find(x => x == vowel) ? "" : this.getMatchCount(vowel)}</span>
                                    </div>
                                ))
                            }
                        </div>

                        {/* Solve-Button */}
                        <div class={roundState.roundStep == RoundStepType.normalStep && !model.state.processWaiting ? "wof-body wof-container" : "wof-hidden"}>
                            <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small" disabled={model.state.processWaiting} onclick={() => {
                                model.state.roundState.roundStep = RoundStepType.solveStep;
                            }}>
                                Solve
                            </button>
                        </div>

                        {/* ShoutOut-Button */}
                        <div class={roundState.roundStep != RoundStepType.end && !model.state.processWaiting ? "wof-body wof-container" : "wof-hidden"}>
                            <button class="wof-btn wof-is-danger wof-btn-medium wof-margin-small" disabled={model.state.processWaiting} onclick={() => {
                                controller.stateConfirmToActor(rmb.Message.ShoutOut);
                            }}>
                                ShoutOut
                            </button>
                        </div>


                        {/* Wrong/Correct-Group */}
                        <div class={roundState.roundStep == RoundStepType.solveStep ? "wof-body wof-container" : "wof-hidden"}>
                            <button class="wof-btn wof-is-danger wof-btn-medium wof-margin-small"
                                disabled={model.state.processWaiting}
                                onclick={() => {
                                    model.state.roundState.roundStep = RoundStepType.loseTurnStep;
                                }}>
                                Wrong
                            </button>
                            <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small"
                                onclick={() => {
                                    rmb.sendToActor(rmb.Message.Solve);
                                    setTimeout(() => {
                                        model.state.isDisabled = false; 
                                    }, 7000);
                                }}
                                disabled={model.state.processWaiting}
                            >
                                Correct
                            </button>
                        </div>

                        {/* Leaderboard-Button */}
                        {/* <div class={roundState.roundStep == RoundStepType.end ? "wof-body wof-container" : "wof-hidden"}> */}
                        <div class={ roundState.roundStep == RoundStepType.end && roundState.currentRoundIndex == 3 ? "wof-body wof-container" : "wof-hidden" } >
                            {
                            displayData.map((player, index) => (
                                <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small"
                                    disabled={(finalBoardState.topPlayersCount - finalBoardState.pointIndex - 1) != index}
                                    onclick={() => {
                                        rmb.sendToActor(rmb.Message.RevealFinalPoint);
                                    }}
                                    >
                                    {`Rank #${index + 1}: #${player.name}: ${player.balance}`}
                                </button>
                            ))}        
                        </div>

                        <div class={ roundState.roundStep == RoundStepType.end ? 'wof-body wof-container' : 'wof-hidden'} 
                        // style = {`display: ${model.state.isDisabled ? "block" : "none"}`} 
                        id = "wof_board">
                            <div style = {`display: ${model.state.isDisabled || finalBoardState.topPlayersCount != finalBoardState.pointIndex ? "block" : "none"}`}><label>The scores of contestants are being displayed....</label></div>
                            {
                                roundState.currentRoundIndex < 3 ? 
                            <button class="wof-btn wof-is-info wof-btn-large wof-margin-small" onclick={() => { model.state.isDisabled = true; controller.stateConfirmToActor(rmb.Message.AudienceLeaderboardStage);
                                }} disabled = {model.state.isDisabled}>
                                    Audience Leaderboard
                            </button> : 
                            <button class="wof-btn wof-is-info wof-btn-large wof-margin-small" disabled={ finalBoardState.topPlayersCount != finalBoardState.pointIndex } 
                                onclick={() => { controller.stateConfirmToActor(rmb.Message.AudienceLeaderboardStage); model.state.isDisabled = true; }}>
                                    Final Leaderboard
                            </button>
                            }
                        </div>
                    </div>
                </div>
            </Body>
        );
    },
};
