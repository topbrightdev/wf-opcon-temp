const m = require('mithril');
const { profile } = require('@timeplay/login-page');
const Body = require('../../components/body');
const model = require('../../model');
const controller = require('../../controller');
const rmb = require('../../rmbController');

let auditoriums = [];

module.exports = {
    oninit: async function () {
        if (await profile.loginRequired()) {
            return m.route.set('/login');
        }

        await controller.init();
        auditoriums = await controller.getAuditoriums();
        rmb.disconnect();

        m.redraw();
    },

    view: function () {
        if (model.state.auditoriumIndex) {
            m.route.set('/sessions', { auditoriumName: auditoriums[model.state.auditoriumIndex] });
            return;
        }
        
        return (
            <Body title='Select Auditorium'>
                <ul class="uk-list uk-list-large">
                    {
                        auditoriums && auditoriums.length > 0 ?
                            auditoriums.map((auditorium, i) =>
                                <div class="uk-container uk-text-center uk-padding-small">
                                    <button class="uk-button uk-button-primary uk-text-large uk-padding-small" onclick={(e) => {
                                        model.state.auditoriumIndex = i;
                                        m.route.set('/sessions', { auditoriumName: auditorium });
                                    }}>
                                        {auditorium}
                                    </button>
                                </div>
                            )
                            :
                            <div class="uk-text-center uk-text-large">No Auditoriums Available</div>
                    }
                </ul>
            </Body>
        );
    }
};