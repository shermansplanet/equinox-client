import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import Action from "./Action";
import ManageHome from "./ManageHome";
import Market from "./Market";
import { defaultActionButton } from "../Utils/StyleUtils";

export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.db = app.firestore();
    this.state = {
      screen: ""
    };
  }

  render() {
    let player = this.props.player;
    var enabled = this.props.action == "" && player.result == -1;
    if (this.state.screen === "home") {
      return (
        <ManageHome
          enabled={enabled}
          player={player}
          closeHome={() => this.setState({ screen: "" })}
        />
      );
    }
    var actions = [
      ...player.availableActions.map(a => {
        return { action: a, locked: false };
      }),
      ...player.lockedActions.map(a => {
        return { action: a, locked: true };
      })
    ];
    let renderedActions = actions.map((a, id) => (
      <Action
        key={id + a.action + a.locked}
        highlighted={this.props.action == a.action}
        delay={id * 0.1}
        player={player}
        action={a.action}
        locked={a.locked}
        enabled={enabled && !a.locked}
      />
    ));
    if (player.actionSet === "0be1cnBUHoOu30Se1PT0") {
      renderedActions.push(
        <Market player={player} action={this.props.action} />
      );
    }
    if (player.actionSet === "home" && player.address) {
      renderedActions.push(
        <div
          className="action"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div className="actionTitle">Manage Your Home</div>
          <button
            className="actionButton"
            onClick={() => this.setState({ screen: "home" })}
          >
            {defaultActionButton}
          </button>
        </div>
      );
    }
    return renderedActions;
  }
}
