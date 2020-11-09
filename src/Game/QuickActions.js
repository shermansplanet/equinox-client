import React from "react";
import app from "firebase/app";
import "firebase/firestore";

export default class QuickActions extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div className="quickActions buttonRow">
        <button
          disabled={this.props.action !== ""}
          onClick={() => this.props.setTab("actions")}
        >
          Actions
        </button>
        <button
          disabled={this.props.action !== ""}
          onClick={() => this.props.setTab("you")}
        >
          You
        </button>
        <button
          className="quickAction"
          disabled={this.props.action !== ""}
          onClick={() => {
            var uid = app.auth().currentUser.uid;
            this.props.setTab("alchemy");
            app
              .firestore()
              .collection("gameplay")
              .doc(uid)
              .set(
                {
                  action: "softRefresh",
                  args: { loadAlchemy: true }
                },
                { merge: true }
              );
          }}
        >
          Alchemy
        </button>
        <button
          className="mobileShow"
          disabled={this.props.action !== ""}
          onClick={() => this.props.showSidebars(true)}
        >
          Sidebars
        </button>
      </div>
    );
  }
}
