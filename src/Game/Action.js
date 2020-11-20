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
import {
  canTakeAction,
  condenseItems,
  GetTraits
} from "../Utils/ServerCloneUtils";
import {
  toChimes,
  TitleCase,
  defaultActionButton,
  GetName,
  AddLineBreaks
} from "../Utils/StyleUtils";
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
    let costKeys = Object.keys(data.costs || {});
    let itemList = [...costKeys, ...Object.keys(data.requirements || {})];
    for (let i of costKeys) {
      for (let itemToMatch of data.matchingIds[i]) {
        for (let item in player.inventory) {
          if (item.startsWith(itemToMatch)) {
            itemList.push(item);
            let variety = GetTraits(item).variety;
            if (variety !== undefined) {
              itemList.push(variety);
            }
          }
        }
      }
    }
    var items = await GetDocuments("items", itemList);

    let condensedInventory = condenseItems(player.inventory);
    let varieties = {};
    for (let itemId in data.costs) {
      let ids = [];
      for (let itemToMatch of data.matchingIds[itemId]) {
        for (let i in condensedInventory) {
          if (i.startsWith(itemToMatch)) {
            ids.push(i);
          }
        }
      }
      let total = 0;
      let i = 0;
      let chosenVarieties = [];
      while (total < data.costs[itemId]) {
        let amount = condensedInventory[ids[i]];
        total += amount;
        if (total > data.costs[itemId]) {
          amount -= total - data.costs[itemId];
        }
        chosenVarieties.push([ids[i], amount]);
        i++;
      }
      varieties[itemId] = chosenVarieties;
    }

    this.setState({ loading: false, data, skillData, items, varieties });
  };

  componentWillUnmount() {
    Unsubscribe(this.props.action);
  }

  takeAction = action_id => {
    var uid = this.auth.currentUser.uid;
    let args = this.state.args;
    if (this.props.itemMap !== undefined) {
      let itemMap = {};
      let itemVars = {};
      for (let i in this.props.itemMap) {
        let itemId = this.props.itemMap[i].id;
        itemMap[i] = itemId;
        itemVars[itemId.split("&")[0]] = [[itemId, 1]];
      }
      args.itemVarieties = JSON.stringify(itemVars);
      args.itemMap = itemMap;
      args.loadAlchemy =
        this.state.data.flags != undefined &&
        this.state.data.flags.noResultScreen;
    } else {
      args.itemVarieties = JSON.stringify(this.state.varieties);
    }
    this.db
      .collection("gameplay")
      .doc(uid)
      .set({ action: action_id, args });
  };

  render() {
    if (this.state.loading) {
      return null;
    }
    var action = this.state.data;

    var updates = [];
    var skillData = this.state.skillData;
    let player = this.props.player;
    let condensedInventory = condenseItems(player.inventory);
    if (!this.props.hideExtras) {
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
                Math.round(((playerSkill + 2) / action.check.difficulty) * 100)
              )}
              %
            </b>{" "}
            chance of success.
          </span>
        );
      }

      if (action.costs != null) {
        for (var item in action.costs) {
          let count = 0;
          for (let i of action.matchingIds[item]) {
            count += player.inventoryTotals[i] || 0;
          }
          var hasEnough = count >= action.costs[item];
          updates.push(
            <span>
              {hasEnough ? "This will cost you " : "Unlock this with "}
              <b>
                {item == "chimes"
                  ? toChimes(action.costs[item])
                  : action.costs[item]}{" "}
                {GetName(this.state.items[item], action.costs[item] != 1)}
              </b>{" "}
              (you have <b>{item == "chimes" ? toChimes(count) : count}</b>).
            </span>
          );
          if (!hasEnough) {
            continue;
          }
          let ids = [];
          for (let itemToMatch of action.matchingIds[item]) {
            for (let i in condensedInventory) {
              if (i.startsWith(itemToMatch)) {
                ids.push(i);
              }
            }
          }
          if (ids.length <= 1) {
            continue;
          }
          const itemId = item;
          let chosenVarieties = this.state.varieties[item];
          let options = ids.map((id, i) => {
            let traits = GetTraits(id);
            let variety = traits.variety;
            let label =
              (variety ? GetName(this.state.items[variety], false) + " " : "") +
              GetName(this.state.items[traits.id], true) +
              (traits.decay == undefined
                ? " (" + condensedInventory[ids[i]] + ")"
                : " (" + ShortTimeString(traits.decay) + ")");
            return (
              <option key={i} value={id}>
                {label}
              </option>
            );
          });
          updates.push(
            <div>
              {chosenVarieties.map((chosenVariety, index) => {
                const i = index;
                return (
                  <div key={index}>
                    {i == 0 ? "Use " : "and "}
                    {i == 0 ? (
                      chosenVariety[1] || 0
                    ) : (
                      <input
                        type="number"
                        style={{ width: "30px" }}
                        value={chosenVariety[1] || 0}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          if (
                            val < 0 ||
                            val > condensedInventory[chosenVarieties[i][0]]
                          ) {
                            return;
                          }
                          let total = val;
                          for (let ii in chosenVarieties) {
                            if (ii == 0 || ii == i) continue;
                            total += chosenVarieties[ii][1];
                          }
                          let first = action.costs[itemId] - total;
                          if (
                            first < 0 ||
                            first > condensedInventory[chosenVarieties[0][0]]
                          )
                            return;
                          this.setState(oldState => {
                            if (!oldState.varieties[itemId]) {
                              oldState.varieties[itemId] = chosenVarieties;
                            }
                            oldState.varieties[itemId][i][1] = val;
                            oldState.varieties[itemId][0][1] = first;
                            return oldState;
                          });
                        }}
                      />
                    )}{" "}
                    of your{" "}
                    <select
                      value={chosenVariety[0]}
                      onChange={e => {
                        const val = e.target.value;
                        this.setState(oldState => {
                          if (!oldState.varieties[itemId]) {
                            oldState.varieties[itemId] = chosenVarieties;
                          }
                          if (
                            condensedInventory[val] <
                            oldState.varieties[itemId][i][1]
                          ) {
                            return;
                          }
                          oldState.varieties[itemId][i][0] = val;
                          return oldState;
                        });
                      }}
                    >
                      {options}
                    </select>
                    {i < chosenVarieties.length - 1 ? null : (
                      <button
                        onClick={() =>
                          this.setState(oldState => {
                            let el = [[ids[0], 0]];
                            if (!oldState.varieties[itemId]) {
                              oldState.varieties[itemId] = chosenVarieties;
                            }
                            oldState.varieties[itemId].push(el);
                            return oldState;
                          })
                        }
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }
      }

      if (action.requirements != null) {
        for (var item in action.requirements) {
          if (item.startsWith("checkpoint") || item == "month") {
            continue;
          }
          let count = 0;
          for (let i of action.matchingIds[item]) {
            count += player.inventoryTotals[i] || 0;
          }
          var req = action.requirements[item];
          var hasEnough =
            count >= req.min && (req.max == undefined || count <= req.max);
          updates.push(
            <span>
              {hasEnough ? "You unlocked this with " : "Unlock this with "}
              {req.max == undefined
                ? `at least ${req.min} `
                : req.min == req.max
                ? `exactly ${req.min} `
                : req.min == 0
                ? `at most ${req.max} `
                : `between ${req.min} and ${req.max} `}
              <b>
                {GetName(this.state.items[item], (req.max || req.min) != 1)}
              </b>
              {req.min == req.max && hasEnough ? null : (
                <span>
                  {" "}
                  (you have <b>{count}</b>)
                </span>
              )}
              .
            </span>
          );
        }
      }
    }

    if (action.ooc !== undefined) {
      updates.push(
        <i>
          <b>{action.ooc}</b>
        </i>
      );
    }

    var d = new Date();
    var timeElapsed = (d.getTime() - this.spawnTime) / 1000.0;

    var goText = defaultActionButton;
    if (action.minutes != undefined) {
      goText = ShortTimeString(action.minutes);
    }

    let title = action.name;
    for (let i in this.props.itemMap || {}) {
      title = title.replace("$" + i, this.props.itemMap[i].name);
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
            alignItems: "center",
            flexDirection: action.text.length > 500 ? "column" : "row"
          }}
        >
          <div className="actionBody">
            <div className="actionTitle">{title}</div>
            {AddLineBreaks(action.text)}
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
          {action.results.length > 0 ? (
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
          ) : null}
        </div>
      </div>
    );
  }
}
