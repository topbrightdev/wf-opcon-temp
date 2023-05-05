const m = require('mithril');
const { webConfig } = require('@timeplay/web-config');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const Field = require('../../components/field');


module.exports = {
    oninit: async function ({ attrs }) {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }
    },

    view: function ({ attrs }) {
        return (
            <Body title='Settings' showBack={true}>
                <Field class="uk-text-center" key="User Name" value={profile.state.username}></Field>

                <div class="uk-container uk-flex uk-flex-column uk-width-2-3 uk-text-center uk-margin">
                    <button class="uk-button uk-button-primary uk-padding-small uk-text-large" onclick={async (e) => {
                        await profile.logout();
                        return m.route.set('/login');
                    }}>
                        Logout
                    </button>
                </div>

                <div class="uk-text-center">
                    v{VERSION}
                </div>
            </Body>
        );
    },
};
