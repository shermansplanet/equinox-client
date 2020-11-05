import React from "react";
import app from "firebase/app";
import "firebase/firestore";

export default class QuickActions extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    const quickActions = {}; //[{ action: "aw9iwzuNYuVh7Ug1INH1", label: "Spells" }];
    var buttons = [];
    for (var i in quickActions) {
      const qa = quickActions[i];
      const cid = qa.action;
      buttons.push(
        <button
          className="quickAction"
          disabled={this.props.action !== ""}
          key={i}
          onClick={() => {
            var uid = app.auth().currentUser.uid;
            this.props.setTab("spells");
            app
              .firestore()
              .collection("gameplay")
              .doc(uid)
              .set(
                {
                  action: cid
                },
                { merge: true }
              );
          }}
        >
          {qa.label}
        </button>
      );
    }
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
        {buttons}
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
