import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.auth = app.auth();
  }

  render() {
    return (
      <div className="header">
        <div style={{ marginRight: "8px" }}>
          Welcome, <b>{this.props.player.name}</b>!
        </div>
        <button onClick={() => this.auth.signOut()}>Sign Out</button>
        Server Debug Tools:
        <button
          onClick={() => {
            var uid = app.auth().currentUser.uid;
            app
              .firestore()
              .collection("gameplay")
              .doc(uid)
              .set(
                {
                  action: "reset"
                },
                { merge: true }
              );
          }}
        >
          Reset Cache
        </button>
        <button
          onClick={() => {
            var uid = app.auth().currentUser.uid;
            app
              .firestore()
              .collection("gameplay")
              .doc(uid)
              .set(
                {
                  action: "delete"
                },
                { merge: true }
              );
          }}
        >
          Reset Player
        </button>
      </div>
    );
  }
}
