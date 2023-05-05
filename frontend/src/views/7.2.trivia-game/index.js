const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');
const controller = require('../../controller');
const model = require('../../model');

const state = {
    roomData: null,
}

module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        state.roomData = await controller.getRoom(attrs.sessionId);
    },

    view: function ({ attrs }) {
        const session = controller.getCurrentSession(attrs.sessionId);
        if (!session) {
            return;
        }

        let games = [];
        let currentGame = {};
        let canSkip = false;
        let isEnd = false;
        let playlistName = null;
        if (state.roomData && state.roomData.data.playlists) {
            const currPlaylistId = state.roomData.data.playlistId;
            const playlist = state.roomData.data.playlists.find(x => x.id === currPlaylistId);
            if (playlist) {
                playlistName = playlist.name;
                games = playlist.games;
                const gameData = model.state.triviaGameData;
                if (gameData) {
                    currentGame = games.find(x => x.id == gameData.ContentId) || {};
                    canSkip = gameData.CanSkip;
                    isEnd = games.map(x => x.id).indexOf(currentGame.id) === games.length - 1;
                }
            }
        }

        return (
            <Body title='Trivia Game'>

                <div class="uk-section-muted uk-margin uk-padding-small">
                    <div class="uk-text-center">
                        {playlistName}
                    </div>
                    {
                        games.length > 0 ?
                            <Field class="uk-text-center" key={
                                `Current game: ${currentGame.display_name}`
                            }>
                                <div class="uk-panel uk-panel-scrollable">
                                    <ul class="uk-list">
                                        {
                                            games.map(game =>
                                                game.id == currentGame.id ?
                                                    <li><b>{game.display_name}</b></li>
                                                    :
                                                    <li>{game.display_name}</li>
                                            )
                                        }
                                    </ul>
                                </div>
                            </Field>
                            :
                            <div class="uk-text-center">
                                Playlist is empty
                            </div>
                    }
                </div>

                {canSkip && !isEnd ?
                    <div class="uk-flex uk-flex-center uk-margin">
                        <button class="uk-button uk-button-primary uk-padding-small" onclick={async (e) => {
                            await controller.nextGameConfirm(currentGame);
                        }}>
                            Next Game
                        </button>
                    </div>
                    :
                    <div class="uk-flex uk-flex-center uk-margin">
                        <button class="uk-button uk-button-primary uk-padding-small button-disabled" onclick={async (e) => {
                            UIkit.modal.alert(isEnd ? "This is the last game in the playlist. Please end session." : "Sorry, you cannot advance while this game is running.");
                        }}>
                            Next Game
                        </button>
                    </div>
                }

                <div class="uk-flex uk-flex-center uk-margin">
                    {games.length > 0 && games[games.length - 1].id === currentGame.id ?
                        <button class="uk-button uk-button-primary uk-padding-small" onclick={async (e) => {
                            await controller.endSessionConfirm(session, '/auditoriums');
                        }}>
                            End Session
                        </button>
                        :
                        <button class="uk-button uk-button-primary uk-padding-small" onclick={async () => {
                            await controller.cancelSessionConfirm(session, '/auditoriums');
                        }}>
                            Cancel Session
                        </button>}
                </div>
            </Body>
        );
    },
};
