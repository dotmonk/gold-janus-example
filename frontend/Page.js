import Component, {
  html,
} from "janus-elements";
import "janus-elements/ui/base-theme";
import "./Clock.js";
import "./UsersTable.js";
import "./Chat.js";

class Page extends Component {

  render() {
    return html`
      <div
        style=${{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        <BaseTheme mode="system" />
        <h1
          style=${{
            margin: "0",
            fontSize: "1.75rem",
          }}
        >gold-janus-example</h1>
        <p
          style=${{
            margin: "0",
            color: "var(--janus-text-muted)",
          }}
        >gold-janus API + Janus Elements (Sunset)</p>
        <Clock />
        <UsersTable />
        <Chat />
      </div>
    `;
  }
}

Component.register(Page);
