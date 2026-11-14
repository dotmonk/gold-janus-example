import Component, {
  html,
} from "janus-elements";
import "janus-elements/ui/panel";
import {
  Clock as ClockApi,
} from "./client.js";

const formatTick = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.toDateString()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
};

class Clock extends Component {

  constructor() {
    super();
    this.state = {
      dateTime: "N/A",
    };
    this._stop = null;
  }

  componentDidMount() {
    this._stop = ClockApi.ticking(
      (tick) => {
        this.setState(
          {
            dateTime: formatTick(tick),
          },
        );
      },
    );
  }

  componentWillUnmount() {
    if (this._stop) this._stop();
    this._stop = null;
  }

  render() {
    return html`
      <Panel color="accent">
        <strong>Server time:</strong>
        ${this.state.dateTime}
      </Panel>
    `;
  }
}

Component.register(Clock);
