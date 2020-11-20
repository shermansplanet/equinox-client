import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { GetDocument, GetDocuments, GetPlace } from "../Utils/GameDataCache";
import { GetName, AddLineBreaks } from "../Utils/StyleUtils";
import { condenseItems, GetTraits } from "../Utils/ServerCloneUtils";

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

    var itemList = Object.keys(this.props.player.inventoryDelta);
    for (let i of itemList) {
      let variety = GetTraits(i).variety;
      if (variety !== undefined) {
        itemList.push(variety);
      }
    }
    var items = await GetDocuments("items", itemList);

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
      let fail = this.props.player.result == 0;
      updates.push(
        <span>
          You {fail ? "failed" : "succeeded"} in a{" "}
          <b>{this.state.skills[actionData.check.skill].name}</b> challenge
          {fail
            ? " and learned from your experience! (You learn more the lower your odds of success.)"
            : "!"}
        </span>
      );
    }

    if (resultData.skills != undefined) {
      for (var skillUpdate in resultData.skills) {
        var skillData = this.state.skills[skillUpdate];
        var skillName = skillData.name;
        updates.push(
          <span>
            Your base <b>{skillName}</b> {skillData.label} has changed! It is
            now{" "}
            {Math.round(this.props.player.baseSkills[skillUpdate] * 10) / 10}.
          </span>
        );
      }
    }

    let condensedInventory = condenseItems(this.props.player.inventory);

    let itemDeltas = this.props.player.inventoryDelta;

    let possibleIds = [];
    if (resultData.items != undefined) {
      possibleIds.push(
        ...Object.keys(resultData.items).map(k => k.split("$")[0])
      );
    }
    if (resultData.specificItems != undefined) {
      possibleIds.push(
        ...resultData.specificItems.map(k => k.item.split("$")[0])
      );
    }
    if (actionData.costs != undefined) {
      possibleIds.push(
        ...Object.keys(actionData.costs).map(k => k.split("$")[0])
      );
    }

    for (var itemUpdate in itemDeltas) {
      let baseId = itemUpdate.split("&")[0];
      let item = this.state.items[baseId];
      let itemAmount = condensedInventory[itemUpdate] || 0;
      var delta = itemDeltas[itemUpdate];
      if (delta === undefined || delta === 0) {
        continue;
      }
      let variety = GetTraits(itemUpdate).variety;
      let deltaLabel = GetName(item, Math.abs(delta) != 1);
      let resultLabel = GetName(item, itemAmount != 1);
      if (variety !== undefined) {
        deltaLabel = this.state.items[variety].name + " " + deltaLabel;
        resultLabel = this.state.items[variety].name + " " + resultLabel;
      }
      updates.push(
        <span>
          You {delta < 0 ? "lost " + -delta : "got " + delta}{" "}
          <b>{deltaLabel}</b> (new total {itemAmount}).
        </span>
      );
    }

    if (this.props.action == "init") {
      updates = [];
    }

    return (
      <div className="action">
        <div className="actionBody">
          {AddLineBreaks(resultData.text)}
          {updates.length == 0 ? null : <div className="divider" />}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start"
          }}
        >
          <div>
            {updates.map((data, id) => (
              <div key={id} className="update">
                {data}
              </div>
            ))}
          </div>
          <button
            className="actionButton"
            style={{
              marginLeft: "10px",
              marginTop: updates.length > 0 ? "0px" : "10px"
            }}
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
