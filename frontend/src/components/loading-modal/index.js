const m = require('mithril');

module.exports = {
    view: function () {
        return (
            <div style={{
                height: '100%',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
            }}>
                <div style={{
                    position: 'absolute',
                    transform: 'translate(-50%,-50%)',
                    top: '50%',
                    left: '50%',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <div uk-spinner style={{
                        margin: 'auto',
                    }}></div>
                </div>
            </div>
        );
    },
};
