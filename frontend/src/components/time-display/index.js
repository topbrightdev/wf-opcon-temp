const m = require('mithril');

const padTimeValue = time => `${time}`.padStart(2, "0");

const getTimeString = (min, sec) => `${padTimeValue(min)}:${padTimeValue(sec)}`;

module.exports = {
    view: function ({ attrs }) {
        const timeElapsed = attrs.timeElapsed || 0;
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        return (
            <div style={{
                display: 'inline-block',
            }}>
                <span style={{
                    fontSize: '32px',
                }}>
                    {getTimeString(minutes, seconds)}
                </span>
            </div>
        );
    }
};
