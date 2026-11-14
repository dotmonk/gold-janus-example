import Component, {
  html,
} from "janus-elements";
import "janus-elements/ui/file-input";
import "janus-elements/ui/textarea";
import "janus-elements/ui/panel";
import {
  Chat as ChatApi,
} from "./client.js";

class Chat extends Component {

  constructor() {
    super();
    this.state = {
      chat: "",
      image: "",
    };
    this._stops = [];
  }

  componentDidMount() {
    this._stops.push(
      ChatApi.streamChat(
        (chat) => this.setState(
          {
            chat,
          },
        ),
      ),
      ChatApi.streamBase64ImageUrl(
        (image) => this.setState(
          {
            image,
          },
        ),
      ),
    );
  }

  componentWillUnmount() {
    for (const stop of this._stops) stop();
    this._stops = [];
  }

  render() {
    const {
      chat,
      image,
    } = this.state;
    return html`
      <Panel>
        <h2
          style=${{
            marginTop: "0",
          }}
        >Chat</h2>
        <FileInput
          multiple=${false}
          accept="image/*"
          onChange=${(files) => {
            const file = files[0];
            if (file) void ChatApi.setImage(file);
          }}
        />
        <div
          style=${{
            marginTop: "0.75rem",
          }}
        >
          <Textarea
            style=${{
              width: "100%",
              minHeight: "200px",
            }}
            onInput=${(event) => {
              void ChatApi.setChat(event.target.value);
            }}
          >${chat}</Textarea>
        </div>
        ${image
          ? html`
              <img
                src=${image}
                alt="Uploaded"
                style=${{
                  marginTop: "0.75rem",
                  maxWidth: "100%",
                  borderRadius: "var(--janus-radius)",
                }}
              />
            `
          : ""}
      </Panel>
    `;
  }
}

Component.register(Chat);
