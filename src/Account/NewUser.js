import React from "react";
import app from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

export default class Main extends React.Component {
  constructor(props) {
    super(props);
    this.auth = app.auth();
    this.db = app.firestore();
    this.state = {
      name: "",
      loading: false
    };
  }

  makeAccount = () => {
    if (this.state.name.length < 3 || this.state.loading) {
      return;
    }
    this.setState({ loading: true });
    this.db
      .collection("gameplay")
      .doc(this.auth.currentUser.uid)
      .set({
        action: "init",
        args: { name: this.state.name }
      });
  };

  render() {
    return (
      <div className="centered">
        <form
          className="login"
          onSubmit={e => {
            e.preventDefault();
            this.makeAccount();
          }}
        >
          <h2>New Player</h2>
          <div>Choose a name:</div>
          <input
            placeholder="name"
            value={this.state.name}
            onChange={e => this.setState({ error: "", name: e.target.value })}
          />
          <button
            className="actionButton"
            type="submit"
            style={{ alignSelf: "center" }}
            disabled={this.state.name.length < 3 || this.state.loading}
          >
            Enter
          </button>
        </form>
        <button className="smallButton" onClick={() => this.auth.signOut()}>
          Sign Out
        </button>
      </div>
    );
  }
}
