import Component, { html } from "janus-elements";
import "janus-elements/ui/button";
import "janus-elements/ui/input";
import "janus-elements/ui/number-input";
import "janus-elements/ui/panel";
import "janus-elements/ui/feedback";
import { Users } from "./client.js";

const EMPTY_FORM = { name: "", age: 0 };

class UsersTable extends Component {
  constructor() {
    super();
    this.state = {
      users: [],
      form: { ...EMPTY_FORM },
      editIndex: null,
      editForm: { ...EMPTY_FORM },
      error: null,
    };
    this._stop = null;
  }

  componentDidMount() {
    this._stop = Users.streamListUsers((users) => {
      this.setState({ users });
    });
  }

  componentWillUnmount() {
    if (this._stop) this._stop();
    this._stop = null;
  }

  async handleCreate(event) {
    if (event && event.preventDefault) event.preventDefault();
    const { form } = this.state;
    try {
      await Users.createUser(form);
      this.setState({ form: { ...EMPTY_FORM }, error: null });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async handleUpdate(index) {
    const { editForm } = this.state;
    try {
      await Users.updateUser(index, editForm);
      this.setState({ editIndex: null, error: null });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async handleDelete(index) {
    try {
      await Users.deleteUser(index);
      this.setState({ error: null });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  startEdit(index, user) {
    this.setState({
      editIndex: index,
      editForm: { name: user.name, age: user.age },
    });
  }

  renderUserRow(user, index) {
    const { editIndex, editForm } = this.state;
    const cell = {
      padding: "6px 10px",
      borderBottom: "1px solid var(--janus-border)",
      textAlign: "left",
    };

    if (editIndex === index) {
      return html`
        <tr key=${`edit-${index}`}>
          <td style=${cell}>
            <Input
              value=${editForm.name}
              onInput=${(event) =>
                this.setState({
                  editForm: { ...editForm, name: event.target.value },
                })}
            />
          </td>
          <td style=${cell}>
            <NumberInput
              value=${editForm.age}
              min=${0}
              onChange=${(value) =>
                this.setState({
                  editForm: { ...editForm, age: value ?? 0 },
                })}
            />
          </td>
          <td style=${cell}>
            <Button color="accent" onClick=${() => void this.handleUpdate(index)}>
              Save
            </Button>
            <Button onClick=${() => this.setState({ editIndex: null })}>Cancel</Button>
          </td>
        </tr>
      `;
    }

    return html`
      <tr key=${`row-${index}`}>
        <td style=${cell}>${user.name}</td>
        <td style=${cell}>${user.age}</td>
        <td style=${cell}>
          <Button onClick=${() => this.startEdit(index, user)}>Edit</Button>
          <Button color="error" onClick=${() => void this.handleDelete(index)}>
            Delete
          </Button>
        </td>
      </tr>
    `;
  }

  render() {
    const { users, form, error } = this.state;
    const th = {
      padding: "6px 10px",
      borderBottom: "2px solid var(--janus-border-strong)",
      textAlign: "left",
    };

    return html`
      <Panel>
        <h2 style=${{ marginTop: "0" }}>Users</h2>
        ${error
          ? html`
              <Feedback
                color="error"
                title="Error"
                onClose=${() => this.setState({ error: null })}
              >${error}</Feedback>
            `
          : ""}
        <table style=${{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style=${th}>Name</th>
              <th style=${th}>Age</th>
              <th style=${th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${users.map((user, index) => this.renderUserRow(user, index))}
          </tbody>
        </table>
        <div
          style=${{
            marginTop: "1rem",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Input
            placeholder="Name"
            value=${form.name}
            onInput=${(event) =>
              this.setState({
                form: { ...form, name: event.target.value },
              })}
          />
          <NumberInput
            placeholder="Age"
            value=${form.age || undefined}
            min=${0}
            onChange=${(value) =>
              this.setState({
                form: { ...form, age: value ?? 0 },
              })}
          />
          <Button
            color="accent"
            onClick=${(event) => void this.handleCreate(event)}
          >Add user</Button>
        </div>
      </Panel>
    `;
  }
}

Component.register(UsersTable);
