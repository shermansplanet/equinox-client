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
      error: "",
      email: "",
      password: "",
      password2: "",
      newUser: false,
      clicked: false,
      resetPassword: false
    };
  }

  signIn = () => {
    this.setState({ clicked: true });
    this.auth
      .signInWithEmailAndPassword(this.state.email, this.state.password)
      .catch(error => {
        this.setState({ error: error.message, clicked: false });
      });
  };

  signUp = () => {
    if (this.state.password != this.state.password2) {
      this.setState({ error: "The passwords don't match.", clicked: false });
      return;
    }
    this.setState({ clicked: true });
    this.auth
      .createUserWithEmailAndPassword(this.state.email, this.state.password)
      .catch(error => {
        this.setState({ error: error.message, clicked: false });
      });
  };

  reset = () => {
    this.setState({ clicked: true });
    this.auth
      .sendPasswordResetEmail(this.state.email)
      .then(() => {
        this.setState({
          error: "Email sent!",
          clicked: false,
          resetPassword: false
        });
      })
      .catch(error => {
        this.setState({ error: error.message, clicked: false });
      });
  };

  render() {
    return (
      <div className="centered">
        <form
          className="login"
          onSubmit={e => {
            e.preventDefault();
            (this.state.resetPassword
              ? this.reset
              : this.state.newUser
              ? this.signUp
              : this.signIn)();
          }}
        >
          <h2>Welcome</h2>
          <input
            placeholder="email"
            value={this.state.email}
            onChange={e => this.setState({ error: "", email: e.target.value })}
          />
          {this.state.resetPassword ? null : (
            <input
              placeholder="password"
              type="password"
              value={this.state.password}
              onChange={e =>
                this.setState({ error: "", password: e.target.value })
              }
            />
          )}
          {this.state.newUser ? (
            <input
              placeholder="confirm password"
              type="password"
              value={this.state.password2}
              onChange={e =>
                this.setState({ error: "", password2: e.target.value })
              }
            />
          ) : this.state.resetPassword ? null : (
            <button
              type="button"
              className="linkButton"
              onClick={() => this.setState({ resetPassword: true })}
            >
              Forgot password?
            </button>
          )}
          {this.state.error == "" ? null : (
            <div className="errorText">{this.state.error}</div>
          )}
          <div style={{ height: "8px" }} />
          <button
            disabled={this.state.clicked}
            className="actionButton"
            style={{ alignSelf: "center" }}
            type="submit"
          >
            {this.state.resetPassword
              ? "Send Password Reset Email"
              : this.state.newUser
              ? "Create Account"
              : "Enter"}
          </button>
        </form>
        <button
          className="smallButton"
          onClick={() => {
            this.setState(prevState => {
              return { error: "", newUser: !prevState.newUser };
            });
          }}
        >
          {this.state.newUser
            ? "Sign in with an existing account"
            : "Create a new account"}
        </button>
      </div>
    );
  }
}
