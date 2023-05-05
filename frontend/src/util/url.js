export const parseUrl = function () {
    const hash = window.location.hash.substr(3).split('?');
    const currentPage = hash[0];
    const session = hash.length > 1 ? hash[1].split('=') : null;
    let sessionId = null;
    if (session && session.length > 1 && session[0] == 'sessionId') {
        sessionId = session[1];
    }

    return {
        currentPage,
        sessionId,
    };
};
