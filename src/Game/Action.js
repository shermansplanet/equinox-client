import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { GetDocument, GetDocuments } from "../Utils/GameDataCache";
import {
  Subscribe,
  Unsubscribe,
  TimeString,
  ShortTimeString,
  RealTimeString
} from "../Utils/TimeUtils";
import { canTakeAction } from "../Utils/ServerCloneUtils";
import { TitleCase, defaultActionButton } from "../Utils/StyleUtils";
import Loader from "../Loader";

export default class Action extends React.Component {
  constructor(props) {
    super(props);
    var d = new Date();
    this.spawnTime = d.getTime();
    this.auth = app.auth();
    this.db = app.firestore();
    this.init();
    this.state = {
      loading: true,
      args: {}
    };
  }

  updateTime = minutes => {
    var minutesLeft = this.requiredMinutes - minutes;
    if (minutesLeft <= 0) {
      Unsubscribe(this.props.action);
      this.takeAction("softRefresh");
      return;
    }
    this.setState({ minutesLeft });
  };

  init = async () => {
    var data = await GetDocument("actions", this.props.action);
    var player = this.props.player;
    if (this.props.locked && canTakeAction(player, data)) {
      this.requiredMinutes = data.minutes;
      Subscribe(this.updateTime, this.props.action);
    }
    var skillData = null;
    if (data.check != undefined) {
      skillData = await GetDocument("skills", data.check.skill);
    }
    var items = await GetDocuments("items", [
      ...Object.keys(data.costs || {}),
      ...Object.keys(data.requirements || {})
    ]);
    this.setState({ loading: false, data, skillData, items });
  };

  componentWillUnmount() {
    Unsubscribe(this.props.action);
  }

  takeAction = action_id => {
    var uid = this.auth.currentUser.uid;
    this.db
      .collection("gameplay")
      .doc(uid)
      .set(
        {
          action: action_id,
          args: this.state.args
        },
        { merge: true }
      );
  };

  render() {
    if (this.state.loading) {
      return null;
    }
    var action = this.state.data;

    var updates = [];
    var skillData = this.state.skillData;
    if (skillData != null) {
      var playerSkill =
        this.props.player.skills === undefined
          ? 0
          : this.props.player.skills[skillData.id] || 0;
      var skillName = skillData.name;
      updates.push(
        <span>
          Your <b>{skillName}</b> {skillData.label} gives you a{" "}
          <b>
            {Math.min(
              100,
              Math.round((playerSkill / action.check.difficulty) * 100)
            )}
            %
          </b>{" "}
          chance of success.
        </span>
      );
    }
    if (action.costs != null) {
      for (var item in action.costs) {
        var count = this.props.player.inventory[item] || 0;
        var hasEnough = count >= action.costs[item];
        updates.push(
          <span>
            {hasEnough ? "This will cost you " : "Unlock this with "}
            <b>{action.costs[item] + " " + this.state.items[item].name}</b> (you
            have <b>{count}</b>).
          </span>
        );
      }
    }

    if (action.requirements != null) {
      for (var item in action.requirements) {
        if (item.startsWith("checkpoint")) {
          continue;
        }
        var count = this.props.player.inventory[item] || 0;
        var req = action.requirements[item];
        var hasEnough =
          count >= req.min && (req.max == undefined || count <= req.max);
        updates.push(
          <span>
            {hasEnough ? "You unlocked this with " : "Unlock this with "}
            {req.max == undefined
              ? `at least ${req.min} `
              : req.min == 0
              ? `at most ${req.max} `
              : req.min == req.max
              ? `exactly ${req.min} `
              : `between ${req.min} and ${req.max} `}
            <b>{this.state.items[item].name}</b> (you have <b>{count}</b>).
          </span>
        );
      }
    }

    if (action.ooc !== undefined) {
      updates.push(action.ooc);
    }

    var d = new Date();
    var timeElapsed = (d.getTime() - this.spawnTime) / 1000.0;

    var goText = defaultActionButton;
    if (action.minutes != undefined) {
      goText = ShortTimeString(action.minutes);
    }

    return (
      <div
        className={
          this.props.highlighted
            ? "highlighted action"
            : this.props.locked
            ? "locked action"
            : "action"
        }
        style={{ animationDelay: (this.props.delay || 0 - timeElapsed) + "s" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div className="actionBody">
            <div className="actionTitle">{action.name}</div>
            {action.text}
            {action.args?.map((label, i) => (
              <div>
                <span style={{ marginRight: "8px" }}>
                  <i>{TitleCase(label)}:</i>
                </span>
                <input
                  key={"arg_" + i}
                  value={this.state.args[label]}
                  onChange={e => {
                    const text = e.target.value;
                    this.setState(prevState => {
                      prevState.args[label] = text;
                      return prevState;
                    });
                  }}
                />
              </div>
            ))}
            {updates.length == 0 ? null : <div className="divider" />}
            {updates.map((data, id) => (
              <div key={id} className="update">
                {data}
              </div>
            ))}
            {this.state.minutesLeft == undefined ? null : (
              <div className="minutesLeft">
                {`Unlock this in ${TimeString(
                  this.state.minutesLeft
                )} (${RealTimeString(this.state.minutesLeft)} in real time).`}
              </div>
            )}
          </div>
          <button
            className="actionButton"
            disabled={!this.props.enabled}
            onClick={() => this.takeAction(this.props.action)}
          >
            {this.props.highlighted ? (
              <div style={{ position: "relative" }}>
                <span style={{ opacity: 0 }}>{goText}</span>
                <Loader unstyled={true} />
              </div>
            ) : (
              goText
            )}
          </button>
        </div>
      </div>
    );
  }
}
