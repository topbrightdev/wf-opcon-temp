const m = require('mithril');
const { webConfig } = require('@timeplay/web-config');
const controller = require('./controller');
const rmb = require('./rmbController');
const Login = require('@timeplay/login-page');
const { profile } = require('@timeplay/login-page');
const Auditoriums = require('./views/1.0.auditoriums');
const Sessions = require('./views/1.1.sessions');
const SessionDetail = require('./views/1.2.session-detail');
const SessionDefinition = require('./views/1.3.session-definition');
const SessionCreate = require('./views/1.4.session-create');
const SessionLobby = require('./views/2.1.session-lobby');
const BingoGame = require('./views/3.1.bingo-game');
const BingoClaim = require('./views/3.2.bingo-claim');
const BingoWinners = require('./views/3.3.bingo-winners');
const BingoCloseSecond = require('./views/3.4.bingo-closesecond');
const BingoUnlucky = require('./views/3.5.bingo-unlucky');
const BingoOutro = require('./views/3.6.bingo-outro');
// const GoldenBall = require('./views/4.1.golden-ball');
const AudienceChoice = require('./views/5.1.audience-choice');
const Setting = require('./views/6.1.setting');
// const GigGame = require('./views/7.1.gig-game');
const TriviaGame = require('./views/7.2.trivia-game');
const Debug = require('./views/8.1.debug');
const WOFLobby = require('./views/2.2.wof-lobby');
const WOFStart = require('./views/2.3.wof-start');
const WOFContestant = require('./views/2.4.wof-contestant');
const WOFTossupStart = require('./views/2.5.wof-tossup-start');
const WOFTossupDetail = require('./views/2.6.wof-tossup-detail');
const WOFIntroGame = require('./views/2.7.wof-intro-game');
const WOFRoundPlay = require('./views/2.8.wof-round-play');
const WOFLeaderboard = require('./views/2.9.wof-leaderboard');

// Add Fragment component to Mithril, similar to React.Fragment
// https://kevinfiol.com/blog/mithriljs-esbuild-jsx/
// https://gitter.im/mithriljs/mithril.js?at=5b98ce1c51a02e2a261ac656
m.Fragment = { view: vnode => vnode.children };

console.log(`bingo-opcon v${VERSION}`);

Login.setPostLoginRoute('/sessions');

webConfig.getConfig().then(async config => {
    await profile.restoreSession();
    await controller.init();
    await rmb.initBus();
    m.route(document.body, '/auditoriums', {
        '/login': Login,
        '/auditoriums': Auditoriums,
        '/sessions': Sessions,
        '/session-detail': SessionDetail,
        '/session-definition': SessionDefinition,
        '/session-create': SessionCreate,
        '/session-lobby': SessionLobby,
        '/bingo-game': BingoGame,
        '/bingo-claim': BingoClaim,
        '/bingo-winners': BingoWinners,
        '/bingo-closesecond': BingoCloseSecond,
        '/bingo-unlucky': BingoUnlucky,
        '/bingo-outro': BingoOutro,
        // '/golden-ball': GoldenBall,
        '/audience-choice': AudienceChoice,
        '/setting': Setting,
        // '/gig-game': GigGame,
        '/trivia-game': TriviaGame,
        '/debug': Debug,
        '/wof-lobby': WOFLobby,
        '/wof-start': WOFStart,
        '/wof-contestant': WOFContestant,
        '/wof-tossup-start': WOFTossupStart,
        '/wof-tossup-detail': WOFTossupDetail,
        '/wof-intro-game': WOFIntroGame,
        '/wof-round-play': WOFRoundPlay,
        '/wof-leaderboard': WOFLeaderboard,
    });
})
