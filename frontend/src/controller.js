const m = require('mithril');
const model = require('./model');
const rmb = require('./rmbController');
const { webConfig } = require('@timeplay/web-config');
const { profile } = require('@timeplay/login-page');
const moment = require('moment');

const showLoading = () => {
    model.state.isLoading = true;
    m.redraw();
};

const hideLoading = () => {
    model.state.isLoading = false;
    m.redraw();
};

module.exports = {
    init: async function () {
        try {
            model.state.sessionReady = false;

            model.state.sessions = await module.exports.getSessions();
            model.state.activeSessions = model.state.sessions.filter(x => x.playStart && !x.playEnd && !x.cancelled);
            model.state.comingSessions = model.state.sessions.filter(x => !x.playStart && !x.playEnd && !x.cancelled);

            for (let i = 0; i < model.state.activeSessions.length; i += 1) {
                const session = model.state.activeSessions[i];
                if (session && session.packages) {
                    session.purchases = [];
                    for (let j = 0; j < session.packages.length; j += 1) {
                        const sku = session.packages[j];
                        const meta = {
                            sessionId: session.uid,
                        }
                        try {
                            const tickets = await module.exports.getTickets(sku, meta);
                            session.purchases.push({ sku, tickets });
                        } catch (err) {
                            console.error('Failed to get tickets', err);
                        }
                    }
                }
            }

            model.state.sessionReady = true;

            // m.redraw();
            console.log(`sessions`, model.state.activeSessions);
        } catch (err) {
            model.state.sessionReady = false;
        }
    },

    getCurrentSession(sessionId) {
        if (!model.state.sessionReady) {
            return null;
        }

        const session = model.state.sessions.find(x => x.uid == sessionId);
        if (session) {
            if (session.playStart && !session.playEnd && !session.cancelled) {
                return session;
            }

            // session is not active, reroute to create page
            m.route.set('/session-definition');
            return null;
        }

        return null;
    },

    getAuditoriums: async function () {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'GET',
            url: `${config.roomService}/auditoriumDefinitions`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            json: true,
        })
            .then((response) => {
                return response;
            });
    },

    getPackages: async function (skus) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'post',
            url: `${config.webClientService}/apps/ships/packages`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: {
                sku: skus,
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    getTickets: async function (sku, meta) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'post',
            url: `${config.webClientService}/apps/ships/all-tickets`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: {
                meta,
                sku
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    getSessions: async function () {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'get',
            url: `${config.sessionService}/session`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    createSessionConfirm(sessionDef, playlist) {
        UIkit.modal.confirm(`Start session [${playlist.data.name}]?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            const json = JSON.stringify(sessionDef);
            const copy = JSON.parse(json);
            copy.playlistName = playlist.data.name;
            copy.playlists = [playlist.id];
            copy.playlistIds = [playlist.id];
            copy.auditoriumIndex = model.state.auditoriumIndex;
            session = await module.exports.createSession(copy);
            try {
                showLoading();
                await module.exports.createGameplaySession(session);
                await module.exports.init();
                await module.exports.launchGameServer(playlist.id, session.uid, false, session.auditoriumIndex);
                await rmb.requestBus(session.uid);
            } catch (err) {
                UIkit.modal.alert(err.toString());
            } finally {
                hideLoading();
            }
            // still go to session lobby regardless of error
            m.route.set('/session-lobby', { sessionId: session.uid });
        }, (e) => {
            console.log('Create session canceled');
        });
    },

    createSession: async function (session) {
        // set start of session to now
        session.playStart = moment();
        const config = await webConfig.getConfig();
        return m.request({
            method: 'post',
            url: `${config.sessionService}/session`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: session,
            json: true,
        })
            .then((response) => {
                model.initGameData();
                console.log("[controller] create session : ", response)
                return response.data;
            });
    },

    createGameplaySession: async function (session) {
        console.log('session', session);
        const config = await webConfig.getConfig();
        return m.request({
            method: 'post',
            url: `${config.sessionManager}/${session.uid}`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: session,
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    startSessionConfirm(session) {
        UIkit.modal.confirm(`Start session ${session.name}?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                await module.exports.startSession(session);
                await module.exports.launchGameServer(session.playlists[0], session.uid, false, model.state.auditoriumIndex);
                await rmb.requestBus(session.uid);
            } catch (err) {
                UIkit.modal.alert(err.toString());
            }
        }, (e) => {
            console.log('Start session canceled');
        });
    },

    startSession: async function (session) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'post',
            url: `${config.sessionService}/session`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: {
                uid: session.uid,
                playStart: Date.now(),
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    resumeSessionConfirm(session) {
        UIkit.modal.confirm(`Resume session ${session.name}?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                await module.exports.resumeSession(session);
                await module.exports.launchGameServer(session.playlists[0], session.uid, false, model.state.auditoriumIndex);
                await rmb.requestBus(session.uid);
            } catch (err) {
                UIkit.modal.alert(err.toString());
            }
        }, (e) => {
            console.log('Resume session canceled');
        });
    },

    resumeSession: async function (session) {
        return await module.exports.startSession(session);
    },

    endSessionConfirm(session, path) {
        UIkit.modal.confirm(`End session ${session.name}?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                showLoading();
                await module.exports.endSession(session);
                await module.exports.init();
                return m.route.set(path);
            } catch (err) {
                UIkit.modal.alert(err.toString());
            } finally {
                hideLoading();
            }
        }, (e) => {
            console.log('End session canceled');
        });
    },

    endSession: async function (session) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'post',
            url: `${config.sessionService}/session`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: {
                uid: session.uid,
                playEnd: Date.now(),
            },
            json: true,
        })
            .then(async (response) => {
                try {
                    await module.exports.killGameServer(model.state.auditoriumIndex);
                } catch (err) {
                    // gameserver may not be running, consume the error
                    console.log('killGameServer err:', err);
                    // send EndGame signal to GameServer to end the game if GameServer cannot be killed
                    rmb.sendToGameServer(rmb.Message.EndGame);
                }
                rmb.stopRequestingBus();
                rmb.disconnect();
                return response.data;
            });
    },

    cancelSessionConfirm(session, path) {
        UIkit.modal.confirm(`Cancel session ${session.name}?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                showLoading();
                await module.exports.cancelSession(session);
                await module.exports.init();
                return m.route.set(path);
            } catch (err) {
                console.error(err);
                UIkit.modal.alert(err.toString());
            } finally {
                hideLoading();
            }
        }, (e) => {
            console.log('Cancel session canceled');
        });
    },

    cancelSession: async function (session) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'post',
            url: `${config.sessionService}/session`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: {
                uid: session.uid,
                cancelled: Date.now(),
            },
            json: true,
        })
            .then(async (response) => {
                try {
                    await module.exports.killGameServer(model.state.auditoriumIndex);
                } catch (err) {
                    // gameserver may not be running, consume the error
                    console.log('killGameServer err:', err);
                    // send EndGame signal to GameServer to end the game if GameServer cannot be killed
                    rmb.sendToGameServer(rmb.Message.EndGame);
                }
                rmb.stopRequestingBus();
                rmb.disconnect();
                return response.data;
            });
    },

    nextGameConfirm(currentGame) {
        UIkit.modal.confirm(`Advance to next game?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                await rmb.sendToGameServerNew(rmb.Message.ToNextGame, {
                    ContentID: currentGame.id,
                });
            } catch (err) {
                UIkit.modal.alert(err.toString());
            }
        }, (e) => {
            console.log('Advance to next game canceled');
        });
    },

    startRoundConfirm() {
        UIkit.modal.confirm(`Start Round?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                console.log('============== Start Round ====================');
                await rmb.sendToGameServer(rmb.Message.StartGame);
            } catch (err) {
                UIkit.modal.alert(err.toString());
            }
        }, (e) => {
            console.log('Start round canceled');
        });
    },

    launchGameServerConfirm(session) {
        return UIkit.modal.confirm(`Re-launch Big Screen?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                // await module.exports.killGameServer();
                // await module.exports.deleteRoom(session);
                return await module.exports.replaceGameServer(session.playlists[0], session.uid, true, model.state.auditoriumIndex);
            } catch (err) {
                UIkit.modal.alert(err.toString());
            }
        }, (e) => {
            throw new Error("Re-launch Big Screen canceled");
        });
    },

    launchGameServer: async function (playlistId, sessionId, isRecovery, gsHost = 0) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'post',
            url: `${config.roomService}/gameserver?gsHost=${gsHost}`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: {
                inst: 0,
                args: [
                    '-single-instance',
                    '-direct',
                    '-playlist',
                    playlistId.toString(),
                    '-sessionid',
                    sessionId,
                    isRecovery ? '-recovery' : '',
                ],
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    replaceGameServer: async function (playlistId, sessionId, isRecovery, gsHost = 0) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'put',
            url: `${config.roomService}/gameserver/0?gsHost=${gsHost}`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: {
                inst: 0,
                args: [
                    '-single-instance',
                    '-direct',
                    '-playlist',
                    playlistId,
                    '-sessionid',
                    sessionId,
                    isRecovery ? '-recovery' : '',
                ],
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    killGameServer: async function (gsHost = 0) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'delete',
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            url: `${config.roomService}/gameserver/0?gsHost=${gsHost}`,
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    playerBallConfirm() {
        UIkit.modal.confirm(`Trigger Audience Choice?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                rmb.sendToGameServer(rmb.Message.TriggerPlayerBallVote);
            } catch (err) {
                UIkit.modal.alert(err.toString());
            }
        }, (e) => {
            console.log('Player ball canceled');
        });
    },

    goldenBallConfirm() {
        UIkit.modal.confirm(`Trigger Golden Ball?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                rmb.sendToGameServer(rmb.Message.RevealGoldenBall);
            } catch (err) {
                UIkit.modal.alert(err.toString());
            }
        }, (e) => {
            console.log('Golden ball canceled');
        });
    },

    getRoom: async function (sessionID) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'get',
            url: `${config.roomService}/room/${sessionID}`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    getUsers: async function (session) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'get',
            url: `${config.roomService}/room/${session.uid}/users`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    getUsersCount: async function (session) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'get',
            url: `${config.roomService}/room/${session.uid}/users/count`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    getAssetStatus: async function (session) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'get',
            url: `${config.roomService}/room/${session.uid}/asset-status`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    getPlayerStats: async function (session) {
        let readyUsers = 0;
        let totalUsers = 0;

        if (!session) {
            return {
                readyUsers: 0,
                totalUsers: 0,
            };
        }

        const userCounts = await this.getUsersCount(session);
        if (userCounts) {
            totalUsers = userCounts.connected;
        }

        const status = await this.getAssetStatus(session);
        if (status) {
            sum = 0;
            const keys = Object.keys(status);
            if (keys.length > 0) {
                for (const key of keys) {
                    sum += status[key].count;
                }
                readyUsers = sum / keys.length;
            }
        }

        return {
            readyUsers,
            totalUsers,
        };
    },

    // deleteRoom: async function (session) {
    //     const config = await webConfig.getConfig();
    //     return m.request({
    //         method: 'delete',
    //         url: `${config.roomService}/room/${session.uid}`,
    //         headers: {
    //             Authorization: `Bearer ${profile.state.account.access_token}`,
    //         },
    //         json: true,
    //     })
    //     .then((response) => {
    //         return response.data;
    //     });
    // },

    getPlaylists: async function (screenID) {
        const config = await webConfig.getConfig();
        return m.request({
            method: 'post',
            url: `${config.playlistManager}/playlist`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            data: {
                key: 'filter.screen_ids',
                value: [screenID],
            },
            json: true,
        })
            .then((response) => {
                return response.data;
            });
    },

    getReportData: async function (sessionId) {
        // get revenue
        const config = await webConfig.getConfig();
        const res = await m.request({
            method: 'get',
            url: `${config.webClientService}/apps/ships/purchase/sales?sessionId=${sessionId}`,
            headers: {
                Authorization: `Bearer ${profile.state.account.access_token}`,
            },
            json: true,
        });

        model.state.reportData.revenue = {};
        model.state.reportData.revenue.current = res.data.sessionSales;
        model.state.reportData.revenue.gross = res.data.totalSales;

        // get previous session
        const currSession = module.exports.getCurrentSession(sessionId);
        if (currSession) {
            const prevSessions = model.state.sessions.filter(x => x.playStart && x.playEnd && !x.cancelled && x.name === currSession.name && x.uid !== currSession.uid);
            if (prevSessions && prevSessions.length > 0) {
                // TODO: previous session may not be bingo game, should look up by playlist id
                const prevSession = prevSessions[prevSessions.length - 1];

                try {
                    // get purchase tokens
                    const currentTokensRes = await m.request({
                        method: 'get',
                        url: `${config.webClientService}/apps/ships/purchase?sessionId=${currSession.uid}`,
                        headers: {
                            Authorization: `Bearer ${profile.state.account.access_token}`,
                        },
                        json: true,
                    });
                    const previousTokensRes = await m.request({
                        method: 'get',
                        url: `${config.webClientService}/apps/ships/purchase?sessionId=${prevSession.uid}`,
                        headers: {
                            Authorization: `Bearer ${profile.state.account.access_token}`,
                        },
                        json: true,
                    });
                    const current = currentTokensRes.data;
                    const previous = previousTokensRes.data;

                    // find current players that appear in previous players
                    model.state.reportData.repeatPlayers = [];
                    current.forEach(x => {
                        if (!x.meta || !x.meta.nickname) {
                            return;
                        }
                        const found = previous.find(y => {
                            if (!y.meta || !y.meta.nickname) {
                                return false;
                            }
                            return x.meta.nickname === y.meta.nickname;
                        });
                        if (found && !model.state.reportData.repeatPlayers.includes(x.meta.nickname)) {
                            model.state.reportData.repeatPlayers.push(x.meta.nickname);
                        }
                    });

                    // find previous winner
                    model.state.reportData.previousWinners = [];
                    const prevRewardRes = await m.request({
                        method: 'get',
                        url: `${config.rewardService}/sessions/${prevSession.uid}`,
                        headers: {
                            Authorization: `Bearer ${profile.state.account.access_token}`,
                        },
                        json: true,
                    });
                    const players = prevRewardRes.data.players;
                    if (players) {
                        const winners = players.filter(x => x.actions.some(action => action.bingoplusWinner));
                        winners.forEach(winner => {
                            const prevWinner = previous.find(x => {
                                return x.deviceId === winner.deviceId;
                            });
                            if (prevWinner) {
                                model.state.reportData.previousWinners.push(prevWinner.meta.nickname);
                            }
                        });
                        // TODO: find trivia winners too
                    }
                } catch (err) {
                    console.error('Failed to get reporting data', err);
                }
            }
        }
    },

    stateConfirm(state, params) {
        rmb.sendToGameServer(state, params);
        // UIkit.modal.confirm(`Send this State?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
        //     try {
        //         await rmb.sendToGameServer(state, params);
        //     } catch (err) {
        //         UIkit.modal.alert(err.toString());
        //     }
        // }, (e) => {
        //     console.log('State canceled');
        // });
    },

    stateConfirmNavigate(state, params, nextPath, pathParams) {
        UIkit.modal.confirm(`Send this State?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                await rmb.sendToGameServer(state, params);
                if (nextPath != null) {
                    await m.route.set(nextPath, pathParams);
                }
                model.state.lastSendedCommand = state;
                console.log("set lastSendedCommand >> " + model.state.lastSendedCommand);
                return m.redraw();

            } catch (err) {
                UIkit.modal.alert(err.toString());
            }
        }, (e) => {
            console.log('State canceled');
        });
    },

    stateConfirmToActor(state, params) {
        UIkit.modal.confirm(`Send this State?`, { labels: { 'ok': 'Yes', 'cancel': 'No' } }).then(async (e) => {
            try {
                await rmb.sendToActor(state, params);
            } catch (err) {
                UIkit.modal.alert(err.toString());
            }
        }, (e) => {
            console.log('State canceled');
        });
    }
}
