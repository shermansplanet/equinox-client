import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { GetDocument, GetDocuments, GetPlace } from "../Utils/GameDataCache";

export default class Result extends React.Component {
  constructor(props) {
    super(props);
    this.db = app.firestore();

    this.auth = app.auth();

    this.state = {
      loading: true
    };
    this.init();
  }

  init = async () => {
    var actionData = await GetDocument("actions", this.props.action);
    var resultData = actionData.results[this.props.player.result];

    var location = null;
    if (resultData.location != undefined) {
      location = await GetPlace(this.props.player, resultData.location);
    }

    var itemKeys = [];
    for (var itemKey in resultData.items || []) {
      itemKeys.push(itemKey);
    }
    for (var itemKey in actionData.costs || []) {
      itemKeys.push(itemKey);
    }
    var items = await GetDocuments("items", itemKeys);

    var skillids = [];
    if (actionData.check != undefined) {
      skillids.push(actionData.check.skill);
    }

    if (resultData.skills != undefined) {
      for (var skillUpdate in resultData.skills) {
        skillids.push(skillUpdate);
      }
    }

    var skills = await GetDocuments("skills", skillids);

    this.setState({
      loading: false,
      actionData,
      resultData,
      location,
      items,
      skills
    });
  };

  takeAction = () => {
    var uid = this.auth.currentUser.uid;
    this.db
      .collection("gameplay")
      .doc(uid)
      .set(
        {
          action: ""
        },
        { merge: true }
      );
  };

  render() {
    if (this.state.loading) {
      return <div className="actionBody" />;
    }
    var resultData = this.state.resultData;
    var actionData = this.state.actionData;

    var updates = [];
    if (resultData.location != undefined) {
      updates.push(
        <div>
          Your location is now <b>{this.state.location.name}</b>.
        </div>
      );
    }

    if (actionData.check != undefined) {
      updates.push(
        <span>
          You {this.props.player.result == 0 ? "failed" : "succeeded"} in a{" "}
          <b>{this.state.skills[actionData.check.skill].name}</b> challenge!
        </span>
      );
    }

    if (resultData.skills != undefined) {
      for (var skillUpdate in resultData.skills) {
        var skillData = this.state.skills[skillUpdate];
        var skillName = skillData.name;
        updates.push(
          <span>
            Your base <b>{skillName}</b> {skillData.label} increased by{" "}
            {resultData.skills[skillUpdate]}. It is now{" "}
            {this.props.player.baseSkills[skillUpdate]}!
          </span>
        );
      }
    }

    if (resultData.items != undefined) {
      for (var itemUpdate in resultData.items) {
        var itemName = this.state.items[itemUpdate].name;
        var delta = this.props.player.inventoryDelta[itemUpdate];
        if (delta === undefined || delta === 0) {
          continue;
        }
        updates.push(
          <span>
            You {delta < 0 ? "lost " + -delta : "got " + delta}{" "}
            <b>{itemName}</b>. You now have have{" "}
            {this.props.player.inventory[itemUpdate] || "no"} <b>{itemName}</b>.
          </span>
        );
      }
    }

    if (actionData.costs != undefined) {
      for (var itemUpdate in actionData.costs) {
        var itemName = this.state.items[itemUpdate].name;
        var delta = this.props.player.inventoryDelta[itemUpdate];
        if (delta === undefined || delta === 0) {
          continue;
        }
        updates.push(
          <span>
            You {delta < 0 ? "lost " + -delta : "got " + delta}{" "}
            <b>{itemName}</b>. You now have have{" "}
            {this.props.player.inventory[itemUpdate]} <b>{itemName}</b>.
          </span>
        );
      }
    }

    return (
      <div className="action">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div className="actionBody">
            <div>{resultData.text}</div>
            {updates.length == 0 ? null : <div className="divider" />}
            {updates.map((data, id) => (
              <div key={id} className="update">
                {data}
              </div>
            ))}
          </div>
          <button
            className="actionButton"
            disabled={this.props.player.action == ""}
            onClick={this.takeAction}
          >
            Proceed
          </button>
        </div>
      </div>
    );
  }
}
