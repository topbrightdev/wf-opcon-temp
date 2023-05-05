const m = require('mithril');
const { webConfig } = require('@timeplay/web-config');
const { parseUrl } = require('../../util/url');
const model = require('../../model');
const rmb = require('../../rmbController');
const LoadingModal = require('../loading-modal');

const getRMBConnectionColour = (rmbControllerState) => {
    switch (rmbControllerState) {
        case rmb.RMBControllerState.Disconnected:
            return "red";
        case rmb.RMBControllerState.Connecting:
            return "yellow";
        case rmb.RMBControllerState.Connected:
            return "green";
        case rmb.RMBControllerState.Disconnecting:
            return "grey";
    }
}

module.exports = {
    oninit: async function (vnode) {
        this.title = vnode.attrs.title;

        const config = await webConfig.getConfig();

        this.opconDebug = config.opconDebug;
        m.redraw();
    },

    renderSessionId: function (sessionId) {
        return (
            <span onclick={() => {
                if (!this.opconDebug) {
                    return;
                }
                if (!navigator.clipboard) {
                    console.error("Cannot copy session id, unsupported by browser");
                    return;
                }
                navigator.clipboard.writeText(sessionId).then(() => {
                    UIkit.notification("Copied session id to clipboard");
                }).catch((e) => {
                    console.error("Could not copy session id to clipboard due to error", e);
                });
            }}>
                {sessionId}
            </span>
        );
    },

    view: function ({ attrs, children }) {
        const { sessionId } = parseUrl();
        const session = model.state.sessions.find(x => x.uid == sessionId);
        return (
            <div>
                <nav class="uk-navbar-container tp-dark-grey uk-sticky uk-sticky-fixed" uk-navbar>
                    {attrs.showBack && <div class="uk-navbar-left uk-padding-small">
                        <span class="tp-pointer" uk-icon="icon: arrow-left; ratio: 1.0"
                            onclick={async (e) => { window.history.back() }}
                        />
                    </div>}
                    <div class="uk-navbar-center uk-padding-small">
                        <div>
                            <p class="uk-margin-remove uk-text-center uk-text uk-text-bold">{this.title}</p>
                        </div>
                    </div>
                    <div class="uk-navbar-right uk-padding-small">
                        <button className="uk-button uk-button-secondary uk-button-small" type="submit" onclick={() => {
                            return m.route.set('/auditoriums');
                        }}>
                            <span uk-icon="home"></span>
                        </button>
                        {this.opconDebug && <button className="uk-button uk-button-secondary uk-button-small" type="submit" onclick={async event => {
                            const params = {};

                            if (sessionId) {
                                params.sessionId = sessionId;
                            }

                            return m.route.set('/debug', params);
                        }}>
                            <span uk-icon="lifesaver"></span>
                        </button>}
                        <button className="uk-button uk-button-secondary uk-button-small" type="submit" onclick={async event => {
                            const params = {};

                            if (sessionId) {
                                params.sessionId = sessionId;
                            }

                            return m.route.set('/setting', params);
                        }}>
                            <span uk-icon="cog"></span>
                        </button>
                    </div>
                </nav>
                {session && <nav class="uk-navbar-container tp-grey uk-sticky uk-sticky-fixed" uk-navbar>
                    <div class="uk-navbar-center uk-padding-small">
                        <div>
                            <p class="uk-margin-remove uk-text-center uk-text">{session.playlistName} ({this.renderSessionId(session.uid)})</p>
                            <p class="uk-margin-remove uk-text-center uk-text">Message Bus: <div style={{
                                display: 'inline-block',
                                width: '12px',
                                height: '12px',
                                backgroundColor: getRMBConnectionColour(rmb.getState()),
                                borderRadius: '8em',
                            }}></div> {rmb.getState()}</p>
                        </div>
                    </div>
                </nav>}
                <div class="uk-container-expand uk-padding">
                    {!model.state.isLoading ? children : <LoadingModal />}
                </div>
            </div>
        );
    }
}