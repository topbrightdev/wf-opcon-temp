const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');
const List = require('../../components/list');
const controller = require('../../controller');
const model = require('../../model');
const rmb = require('../../rmbController');
const PrizeBox = require('../../components/prize-box');
const { webConfig } = require('@timeplay/web-config');

var launchedVideo
module.exports = {
    oninit: async function ({ attrs }) {
        this.totalUsers = 0;
        this.readyUsers = 0;
        launchedVideo = false;
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        // init the bus if it's not running now that we have session in the path
        rmb.initBus();

        const session = controller.getCurrentSession(attrs.sessionId);
        await controller.getReportData(attrs.sessionId);

        const config = await webConfig.getConfig();
        const playerCountUpdateMs = config.playerCountUpdateInterval || 5000;

        this.connectedPlayersInterval = setInterval(async () => {
            const prevTotalUsers = this.totalUsers;
            // If the player count has changed, get new report data
            if (prevTotalUsers != this.totalUsers) {
                await controller.getReportData(attrs.sessionId);
            }
        }, playerCountUpdateMs);
    },

    onremove: function () {
        clearInterval(this.connectedPlayersInterval);
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        return (
            <Body title='WOF Lobby'>
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
                        {/* <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small" 
                        onclick={() => {
                            controller.stateConfirm(rmb.Message.LaunchIntroVideo, {});
                            launchedVideo = true;
                        }}>
                            Launch Intro Video
                        </button> */}
                        <button class="wof-btn wof-is-primary wof-btn-medium wof-margin-small"
                            //disabled={!launchedVideo}
                            onclick={() => {
                                const nextPath = '/wof-contestant';
                                const pathParams = { sessionId: attrs.sessionId };
                                model.state.gameStep = model.GameStepType.contestantDrawing;
                                controller.stateConfirmNavigate(rmb.Message.IntroVideoStage, {}, nextPath, pathParams);
                            }}>
                            Launch Intro Video
                        </button>
                    </div>
                </div>
            </Body>
        );
    },
};
