const m = require('mithril');
require("./style.css");

// Countdown component
// Adapted from https://css-tricks.com/how-to-create-an-animated-countdown-timer-with-html-css-and-javascript/

module.exports = {
    oninit: function ({ attrs }) {
        this.infoColor = attrs.infoColor || "green";
        this.warningColor = attrs.warningColor || "green";
        this.alertColor = attrs.alertColor || "green";
        // TODO adjust viewbox of svg element to accomodate countdowns of larger radius
        this.radius = 45;
        this.perimeter = 2 * Math.PI * this.radius;
        this.circleDashArray = `${this.perimeter} ${this.perimeter}`;
        this.color = this.infoColor;
    },
    getRemainingLength: function (timeLeft, duration) {
        const fraction = timeLeft / duration;
        const modifiedFraction = fraction - (1 / duration) * (1 - fraction);
        return (modifiedFraction * this.perimeter).toFixed(0);
    },
    updateStroke: function (timeElapsed, duration) {
        this.circleDashArray = `${this.getRemainingLength(duration - timeElapsed, duration)} ${this.perimeter}`;
    },
    updateColor: function (timeElapsed, duration) {
        if (timeElapsed > 0.65 * duration) {
            this.color = this.infoColor;
        } else if (timeElapsed > 0.4 * duration) {
            this.color = this.warningColor;
        } else {
            this.color = this.alertColor;
        }
    },
    view: function ({ attrs }) {
        const timeElapsed = attrs.timeElapsed || 0;
        const duration = attrs.duration || 20;
        this.updateStroke(timeElapsed, duration);
        this.updateColor(timeElapsed, duration);

        return (
            <div class="base-countdown" style={{
                display: 'inline-block',
                margin: '1em',
            }}>
                <svg class="base-countdown__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g class="base-countdown__circle">
                        <circle class="base-countdown__path-elapsed" cx="50" cy="50" r={this.radius} />
                        <path
                            id="base-countdown-path-remaining"
                            stroke-dasharray={this.circleDashArray}
                            class="base-countdown__path-remaining"
                            style={{
                                color: this.color,
                                transition: timeElapsed === 0 ? '0s' : '1s linear all',
                            }}
                            d={`M 50, 50
                            m -${this.radius}, 0
                            a ${this.radius},${this.radius} 0 1,0 ${this.radius * 2},0
                            a ${this.radius},${this.radius} 0 1,0 -${this.radius * 2},0
                            `}
                        ></path>
                    </g>
                </svg>
                <span id="base-countdown-label" class="base-countdown__label" style={{
                    fontSize: `${this.radius / 100 * 72}px`
                }}>
                    {duration - timeElapsed}
                </span>
            </div>
        );
    }
};
