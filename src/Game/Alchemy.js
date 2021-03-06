import React from "react";
import { GetDocuments } from "../Utils/GameDataCache";
import {
  condenseItems,
  GetTraits,
  canTakeAction
} from "../Utils/ServerCloneUtils";
import { ShortTimeString } from "../Utils/TimeUtils";
import { TitleCase, GetName } from "../Utils/StyleUtils";
import "firebase/firestore";
import Draggable from "react-draggable";
import Action from "./Action";
import Loader from "../Loader";

export default class Alchemy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      itemDocs: null,
      actionDocs: null,
      currentlyDragging: null,
      secondary: null,
      actions: [],
      mapping: { itemsToRender: [], selfOptions: [], otherOptions: [] },
      showLights: false,
      showContainers: false
    };
    this.actions = [];
    this.dom = {};
    let mouseResponse = e => {
      this.onMove(e.clientX, e.clientY);
    };
    document.onmousemove = mouseResponse;
    document.onmousedown = mouseResponse;
    document.onmouseup = mouseResponse;
    document.ontouchmove = e => {
      let touch = e.changedTouches[0];
      let x = touch.pageX;
      let y = touch.pageY;
      this.onMove(x, y);
    };
  }

  onMove = (x, y) => {
    let actions = [];
    let secondary = null;
    for (let itemId of this.state.mapping.itemsToRender) {
      const i = itemId;
      if (this.dom[i] == null) continue;
      let options =
        this.state.mapping.otherOptions[this.state.currentlyDragging] || {};
      if (options[itemId] !== undefined) {
        let dragRect = this.dom[i].getBoundingClientRect();
        let inBounds =
          x > dragRect.left &&
          x < dragRect.right &&
          y > dragRect.top &&
          y < dragRect.bottom;
        if (inBounds) {
          secondary = itemId;
          actions = this.state.mapping.otherOptions[
            this.state.currentlyDragging
          ][i];
          break;
        }
      }
    }
    if (actions.length == 0) {
      actions =
        this.state.mapping.selfOptions[this.state.currentlyDragging] || [];
    }
    if (
      JSON.stringify(actions) == JSON.stringify(this.state.actions) &&
      secondary == this.state.secondary
    ) {
      return;
    }
    let itemMaps = this.state.itemMaps || {};
    if (this.state.currentlyDragging == null) {
      actions = this.state.actions;
    } else {
      let primaryBaseId = this.state.currentlyDragging.split("&")[0];
      let secondaryBaseId = secondary ? secondary.split("&")[0] : "";
      for (let actionId of actions) {
        let action = this.state.actionDocs[actionId];
        let itemMapChoices = {};
        let itemNames = [];
        for (let itemId in action.matchingIds) {
          let matchingIds = action.matchingIds[itemId];
          let itemName = this.state.itemDocs[itemId].name;
          for (let i of matchingIds) {
            if (i == primaryBaseId) {
              if (itemMapChoices[itemName] == undefined) {
                itemNames.push(itemName);
                itemMapChoices[itemName] = [];
              }
              itemMapChoices[itemName].push({
                id: this.state.currentlyDragging,
                name: TitleCase(this.state.itemDocs[primaryBaseId].name),
                baseType: itemId
              });
            } else if (secondary && i == secondaryBaseId) {
              if (itemMapChoices[itemName] == undefined) {
                itemNames.push(itemName);
                itemMapChoices[itemName] = [];
              }
              itemMapChoices[itemName].push({
                id: secondary,
                name: TitleCase(this.state.itemDocs[secondaryBaseId].name),
                baseType: itemId
              });
            }
          }
        }
        let itemMap = {};
        for (let i in itemNames) {
          let itemName = itemNames[i];
          let choices = itemMapChoices[itemName];
          let map = choices[0];
          if (itemNames.length > 1 && choices.length > 1) {
            let duplicateId = itemMapChoices[itemNames[i == 0 ? 1 : 0]][0].id;
            if (duplicateId == map.id) {
              map = choices[1];
            }
          }
          itemMap[itemName] = map;
        }
        itemMaps[actionId] = itemMap;
      }
    }
    this.setState({ actions, secondary, itemMaps });
  };

  updateDocs = async () => {
    let player = this.props.player;
    let condensedInventory = condenseItems(player.inventory);
    let inventory = Object.keys(condensedInventory);
    var itemList = [];
    for (let i of inventory) {
      let traits = GetTraits(i);
      if (
        traits.location !== undefined &&
        traits.location !== player.location
      ) {
        continue;
      }
      itemList.push(i);
      if (traits.variety !== undefined) {
        itemList.push(traits.variety);
      }
      if (traits.inside !== undefined) {
        itemList.push(player.uniqueItemIds[traits.inside]);
      }
      if (traits.uniqueId !== undefined) {
        let contains = player.containers[traits.uniqueId] || {};
        itemList.push(...Object.keys(contains));
      }
    }
    let availableActions = this.props.player.availableActions.filter(
      action =>
        (this.state.showLights || action !== "0HKutIBlqrZNKBQwkGu6") &&
        (this.state.showContainers || action !== "I8W7ckEAadDwnFijHYuN")
    );
    var actionDocs = await GetDocuments("actions", availableActions);
    for (let i of availableActions) {
      for (let itemId in actionDocs[i].matchingIds) {
        itemList.push(itemId);
      }
    }
    var itemDocs = await GetDocuments("items", itemList);
    this.setState({
      itemDocs,
      actionDocs,
      actions: [],
      mapping: this.getMapping(actionDocs)
    });
  };

  componentDidMount() {
    this.updateDocs();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.currentlyDragging != prevState.currentlyDragging) {
      this.onMove(0, 0);
    }
    if (
      JSON.stringify(Object.keys(this.props.player.inventory)) !==
        JSON.stringify(Object.keys(prevProps.player.inventory)) ||
      JSON.stringify(Object.keys(this.props.player.availableActions)) !==
        JSON.stringify(Object.keys(prevProps.player.availableActions)) ||
      this.state.showLights !== prevState.showLights ||
      this.state.showContainers !== prevState.showContainers
    ) {
      this.updateDocs();
    }
  }

  getMapping = actionDocs => {
    let itemsToRender = [];
    let condensedInventory = condenseItems(this.props.player.inventory);
    let selfOptions = {};
    for (let id1 in condensedInventory) {
      let traits1 = GetTraits(id1);
      selfOptions[id1] = [];
      for (let actionId in actionDocs) {
        let action = actionDocs[actionId];
        if (action.flags && action.flags.multiItem) {
          continue;
        }
        let inventory = {};
        inventory[id1] = 1;
        let inventoryTotals = {};
        inventoryTotals[traits1.id] = 1;
        let location = this.props.player.location;
        if (canTakeAction({ inventoryTotals, inventory, location }, action)) {
          if (!itemsToRender.includes(id1)) {
            itemsToRender.push(id1);
          }
          selfOptions[id1].push(actionId);
        }
      }
    }
    let otherOptions = {};
    for (let id1 in condensedInventory) {
      let traits1 = GetTraits(id1);
      for (let id2 in condensedInventory) {
        if (id1 == id2) continue;
        let traits2 = GetTraits(id2);
        for (let actionId in actionDocs) {
          if (
            selfOptions[id1].includes(actionId) ||
            selfOptions[id2].includes(actionId)
          ) {
            continue;
          }
          let action = actionDocs[actionId];
          let inventory = {};
          inventory[id1] = 1;
          inventory[id2] = 1;
          let inventoryTotals = {};
          inventoryTotals[traits1.id] = 1;
          inventoryTotals[traits2.id] = 1;
          let location = this.props.player.location;
          let fakePlayer = { inventoryTotals, inventory, location };
          if (!canTakeAction(fakePlayer, action)) {
            continue;
          }
          if (action.flags && action.flags.multiItem) {
            let subActions = Object.keys(action.requirements).map(req => {
              let action1 = Object.assign({}, action);
              action1.requirements = { [req]: action.requirements[req] };
              return action1;
            });
            let subPlayers = [
              { id: id1, traits: traits1 },
              { id: id2, traits: traits2 }
            ].map(itemInfo => {
              let subInventory = { [itemInfo.id]: 1 };
              let subInventoryTotals = { [itemInfo.traits.id]: 1 };
              return {
                inventoryTotals: subInventoryTotals,
                inventory: subInventory,
                location
              };
            });
            let allItemsNeeded = true;
            for (let subPlayer of subPlayers) {
              let needsThisItem = false;
              for (let subAction of subActions) {
                if (canTakeAction(subPlayer, subAction)) {
                  needsThisItem = !needsThisItem;
                }
              }
              if (!needsThisItem) {
                allItemsNeeded = false;
                break;
              }
            }
            if (!allItemsNeeded) {
              continue;
            }
          }
          if (otherOptions[id1] == undefined) {
            otherOptions[id1] = {};
          }
          if (otherOptions[id1][id2] == undefined) {
            otherOptions[id1][id2] = [];
          }
          otherOptions[id1][id2].push(actionId);
          if (!itemsToRender.includes(id1)) {
            itemsToRender.push(id1);
          }
          if (!itemsToRender.includes(id2)) {
            itemsToRender.push(id2);
          }
        }
      }
    }
    let parentMapping = {};
    for (let i of [...itemsToRender]) {
      let traits = GetTraits(i);
      if (traits.uniqueId !== undefined) {
        let contains = condenseItems(
          this.props.player.containers[traits.uniqueId] || {}
        );
        for (let contained in contains) {
          if (!itemsToRender.includes(contained)) {
            parentMapping[contained] = i;
            itemsToRender.push(contained);
          }
        }
      }
    }
    let fitnessFunc = a => {
      if (parentMapping[a] !== undefined) {
        return fitnessFunc(parentMapping[a]) - 0.01;
      }
      let combos = selfOptions[a].length;
      if (otherOptions[a] == undefined) {
        return combos;
      }
      for (let b in otherOptions[a]) {
        combos += otherOptions[a][b].length;
      }
      return combos;
    };
    itemsToRender.sort(
      (a, b) => fitnessFunc(b) - fitnessFunc(a) + a.localeCompare(b) * 0.1
    );
    return {
      itemsToRender,
      selfOptions,
      otherOptions
    };
  };

  renderItems = () => {
    let renderedItems = [];
    let options =
      this.state.mapping.otherOptions[this.state.currentlyDragging] || {};

    for (let itemId of this.state.mapping.itemsToRender) {
      const i = itemId;
      let traits = GetTraits(itemId);
      let item = this.state.itemDocs[traits.id];
      if (item == undefined) {
        continue;
      }
      let label = GetName(item, false);
      let variety = traits.variety;
      let subLabels = [];
      if (variety !== undefined) {
        label = this.state.itemDocs[variety].name + " " + label;
      }
      if (traits.uniqueId != undefined) {
        let containedItems = this.props.player.containers[traits.uniqueId];
        if (containedItems) {
          for (let contained in containedItems) {
            let containedTraits = GetTraits(contained);
            subLabels.push(
              "- " +
                TitleCase(this.state.itemDocs[containedTraits.id].name) +
                " x" +
                containedItems[contained]
            );
          }
        }
      }
      if (traits.inside !== undefined) {
        subLabels.push(
          "- in " +
            this.state.itemDocs[
              this.props.player.uniqueItemIds[traits.inside].split("&")[0]
            ].name
        );
      }
      if (traits.decay !== undefined) {
        subLabels.push(`- ${ShortTimeString(traits.decay)} left`);
      }
      if (traits.heatedBy != undefined) {
        let heater = this.props.player.uniqueItemIds[traits.heatedBy];
        let heaterTraits = GetTraits(heater);
        subLabels.push("🜂" + this.state.itemDocs[heaterTraits.id].name);
      }
      if (traits.fireId != undefined) {
        subLabels.push("On fire");
      }
      if (traits.fireId != undefined || traits.burnt > 0) {
        subLabels.push(
          `${((traits.burnt || 0) * 100) / item.traits.burnTime}% burnt`
        );
      }
      if (traits.temperature != undefined) {
        let temp = traits.temperature;
        let desc =
          (temp == temp) == 0
            ? ""
            : temp < 1
            ? "lukewarm"
            : temp < 6
            ? "warm"
            : temp < 10 || item.traits.element != "water"
            ? "hot"
            : "boiling";
        subLabels.push("- " + desc);
      }
      let selected = this.state.currentlyDragging == i;
      let validOption =
        selected ||
        this.state.currentlyDragging == null ||
        options[i] !== undefined;
      let inBounds = this.state.secondary == i;
      renderedItems.push(
        <Draggable
          key={i}
          position={selected ? null : { x: 0, y: 0 }}
          onStart={() => this.setState({ currentlyDragging: i })}
          onStop={() => this.setState({ currentlyDragging: null })}
        >
          <span style={selected ? { zIndex: 1, position: "relative" } : {}}>
            <div
              ref={ref => (this.dom[i] = ref)}
              key={traits.id}
              className={
                "itemPreview draggableItem" +
                (validOption ? " " : " invalidItem ") +
                (inBounds ? " highlightedItem " : " ") +
                "element_" +
                ((item.traits || {}).element || "")
              }
              style={
                this.state.currentlyDragging && !selected
                  ? { pointerEvents: "none" }
                  : {}
              }
            >
              <b>{TitleCase(label)}</b>
              {traits.q == undefined ? null : (
                <div className="qlabel">Q{Math.floor(traits.q)}</div>
              )}
              {subLabels.map((line, i) => (
                <div className="subItem" key={i}>
                  {line}
                </div>
              ))}
            </div>
          </span>
        </Draggable>
      );
    }
    return <div className="itemContainer">{renderedItems}</div>;
  };

  render() {
    if (this.state.actionDocs == null || this.state.itemDocs == null) {
      return (
        <div className="centered">
          <Loader />
        </div>
      );
    }
    let renderedItems = this.renderItems();
    let isVernal = this.props.player.inventory["1xDtdWx60VkVJXc1NzuR"] == 1;
    let elements = isVernal
      ? ["element_fire", "element_water", "element_earth"]
      : ["element_fire", "element_earth", "element_water"];
    let eNames = isVernal ? ["F", "W", "E"] : ["F", "E", "W"];
    return (
      <div style={{ color: "var(--light" }}>
        <div className="lightDivider" />
        <div style={{ margin: "8px", textAlign: "center" }}>
          Drag items to each other to unlock actions. Different items may be
          available in different locations.
        </div>
        <div className="lightDivider" />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <button
            key={"showLights " + this.state.showLights}
            className={
              "checkboxButton" + (this.state.showLights ? " checked" : "")
            }
            onClick={() => {
              this.setState(oldState => {
                return { showLights: !oldState.showLights };
              });
            }}
          />
          Show Lights
          <button
            key={"showContainers " + this.state.showContainers}
            className={
              "checkboxButton" + (this.state.showContainers ? " checked" : "")
            }
            style={{ marginLeft: "20px" }}
            onClick={() => {
              this.setState(oldState => {
                return { showContainers: !oldState.showContainers };
              });
            }}
          />
          Show Containers
        </div>
        <div className="lightDivider" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            margin: "8px"
          }}
        >
          <span>
            Current alchemy cycle: <b>{isVernal ? "Vernal" : "Autumnal"}</b>
          </span>
          <div style={{ display: "flex", alignItems: "center" }}>
            {elements.map((cname, i) => (
              <div
                key={i}
                style={{
                  margin: "0px 10px",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <div className={"alchemyDot " + cname}>{eNames[i]}</div> +{" "}
                <div className={"alchemyDot " + elements[(i + 1) % 3]}>
                  {eNames[(i + 1) % 3]}
                </div>{" "}
                → <div className={"alchemyDot " + cname}>{eNames[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="lightDivider" style={{ marginBottom: "8px" }} />
        <div
          style={{
            color: "#f68",
            margin: "8px",
            textAlign: "center",
            fontStyle: "italic",
            fontWeight: "bold",
            fontSize: "11pt"
          }}
        >
          The alchemy system is in its very early stages, and is not
          feature-complete. You are encouraged to see what can be done with
          various items that appear here, but unless you are explicitly told so,
          you will not need to use the alchemy system to unlock any options.
        </div>
        <div className="lightDivider" style={{ marginBottom: "8px" }} />
        {renderedItems}
        <div className="alchemyActionList">
          <img src="https://i.imgur.com/xBrWxCm.png" className="croissant" />
          {(this.state.actions || []).map((actionId, i) => (
            <Action
              key={
                i +
                "_" +
                actionId +
                "_" +
                JSON.stringify(this.state.itemMaps[actionId])
              }
              highlighted={this.props.action == actionId}
              delay={0}
              player={this.props.player}
              action={actionId}
              hideExtras={true}
              itemMap={this.state.itemMaps[actionId]}
              enabled={this.props.action == "" && !this.props.currentlyDragging}
            />
          ))}
        </div>
      </div>
    );
  }
}
