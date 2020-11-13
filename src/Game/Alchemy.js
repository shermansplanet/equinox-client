import React from "react";
import { GetDocuments } from "../Utils/GameDataCache";
import {
  condenseItems,
  GetTraits,
  canTakeAction
} from "../Utils/ServerCloneUtils";
import { TitleCase, GetName } from "../Utils/StyleUtils";
import "firebase/firestore";
import Draggable from "react-draggable";
import Action from "./Action";

export default class Alchemy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      itemDocs: null,
      actionDocs: null,
      currentlyDragging: null,
      secondary: null,
      actions: [],
      mapping: { itemsToRender: [], selfOptions: [], otherOptions: [] }
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
        let itemMap = {};
        for (let itemId in action.matchingIds) {
          let matchingIds = action.matchingIds[itemId];
          let itemName = this.state.itemDocs[itemId].name;
          for (let i of matchingIds) {
            if (i == primaryBaseId) {
              itemMap[itemName] = {
                id: this.state.currentlyDragging,
                name: TitleCase(this.state.itemDocs[primaryBaseId].name)
              };
            }
            if (secondary && i == secondaryBaseId) {
              itemMap[itemName] = {
                id: secondary,
                name: TitleCase(this.state.itemDocs[secondaryBaseId].name)
              };
            }
          }
        }
        itemMaps[actionId] = itemMap;
      }
    }
    this.setState({ actions, secondary, itemMaps });
  };

  updateDocs = async () => {
    let condensedInventory = condenseItems(this.props.player.inventory);
    let inventory = Object.keys(condensedInventory);
    var itemList = [...inventory];
    for (let i of inventory) {
      let traits = GetTraits(i);
      if (traits.variety !== undefined) {
        itemList.push(traits.variety);
      }
      if (traits.contains && traits.contains != "[]") {
        itemList.push(traits.contains.split(",")[0]);
      }
    }
    var actionDocs = await GetDocuments(
      "actions",
      this.props.player.availableActions
    );
    for (let i of this.props.player.availableActions) {
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

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(Object.keys(this.props.player.inventory)) !==
        JSON.stringify(Object.keys(prevProps.player.inventory)) ||
      JSON.stringify(Object.keys(this.props.player.availableActions)) !==
        JSON.stringify(Object.keys(prevProps.player.availableActions))
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
        let inventory = {};
        inventory[id1] = 1;
        let inventoryTotals = {};
        inventoryTotals[traits1.id] = 1;
        if (canTakeAction({ inventoryTotals, inventory }, action)) {
          if (!itemsToRender.includes(id1)) {
            itemsToRender.push(id1);
            selfOptions[id1].push(actionId);
          }
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
          if (canTakeAction({ inventoryTotals, inventory }, action)) {
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
    }
    itemsToRender.sort();
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
      if (variety !== undefined) {
        label = this.state.itemDocs[variety].name + " " + label;
      }
      if (traits.contains && traits.contains != "[]") {
        let contains = traits.contains.split(",");
        label += " Full of ";
        label += TitleCase(this.state.itemDocs[contains[0]].name);
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
            </div>
          </span>
        </Draggable>
      );
    }
    return <div className="itemContainer">{renderedItems}</div>;
  };

  render() {
    if (this.state.actionDocs == null || this.state.itemDocs == null) {
      return null;
    }
    let renderedItems = [];
    renderedItems = this.renderItems();
    return (
      <div>
        <div className="lightDivider" />
        <div
          style={{ color: "var(--light", margin: "8px", textAlign: "center" }}
        >
          Drag items to each other to unlock actions. Different items may be
          available in different locations.
        </div>
        <div className="lightDivider" style={{ marginBottom: "8px" }} />
        {renderedItems}
        <div className="alchemyActionList">
          {(this.state.actions || []).map((actionId, i) => (
            <Action
              key={i}
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
