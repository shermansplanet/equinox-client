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
      secondary: null
    };
    this.actions = [];
    this.dom = {};
    document.onmousemove = e => {
      this.setState({ dragCenterX: e.clientX, dragCenterY: e.clientY });
    };
    document.ontouchmove = e => {
      console.log(e);
      let touch = e.changedTouches[0];
      let x = touch.pageX;
      let y = touch.pageY;
      this.setState({ dragCenterX: x, dragCenterY: y });
    };
  }

  updateItems = async () => {
    let condensedInventory = condenseItems(this.props.player.inventory);
    for (let i of this.props.location.items || []) {
      condensedInventory[i] = (condensedInventory[i] || 0) + 1;
    }
    let inventory = Object.keys(condensedInventory);
    var itemList = [...inventory];
    for (let i of inventory) {
      let variety = GetTraits(i).variety;
      if (variety !== undefined) {
        itemList.push(variety);
      }
    }
    var itemDocs = await GetDocuments("items", itemList);
    this.actions = [];
    this.setState({ itemDocs });
  };

  updateActions = async () => {
    var actionDocs = await GetDocuments(
      "actions",
      this.props.player.availableActions
    );
    this.actions = [];
    this.setState({ actionDocs, mapping: this.getMapping(actionDocs) });
  };

  componentDidMount() {
    this.updateItems();
    this.updateActions();
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(Object.keys(this.props.player.inventory)) !==
      JSON.stringify(Object.keys(prevProps.player.inventory))
    ) {
      this.updateItems();
    }
    if (
      JSON.stringify(Object.keys(this.props.player.availableActions)) !==
      JSON.stringify(Object.keys(prevProps.player.availableActions))
    ) {
      this.updateActions();
    }
  }

  getMapping = actionDocs => {
    let itemsToRender = [];
    let condensedInventory = condenseItems(this.props.player.inventory);
    for (let i of this.props.location.items || []) {
      condensedInventory[i] = (condensedInventory[i] || 0) + 1;
    }
    let selfOptions = {};
    for (let id1 in condensedInventory) {
      let traits1 = GetTraits(id1);
      selfOptions[id1] = [];
      for (let actionId in actionDocs) {
        let action = actionDocs[actionId];
        let inventoryTotals = {};
        inventoryTotals[traits1.id] = 1;
        if (canTakeAction({ inventoryTotals }, action)) {
          selfOptions[id1].push(actionId);
          if (!itemsToRender.includes(id1)) {
            itemsToRender.push(id1);
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
          let inventoryTotals = {};
          inventoryTotals[traits1.id] = 1;
          inventoryTotals[traits2.id] = 1;
          if (canTakeAction({ inventoryTotals }, action)) {
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
    let dragCenterX = this.state.dragCenterX || 0;
    let dragCenterY = this.state.dragCenterY || 0;
    let noMatch = true;
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
      let selected = this.state.currentlyDragging == i;
      let validOption = true;
      let inBounds = false;
      if (this.state.currentlyDragging) {
        validOption = selected;
        let options =
          this.state.mapping.otherOptions[this.state.currentlyDragging] || {};
        if (options[itemId] !== undefined) {
          validOption = true;

          let dragRect = this.dom[i].getBoundingClientRect();
          inBounds =
            dragCenterX > dragRect.left &&
            dragCenterX < dragRect.right &&
            dragCenterY > dragRect.top &&
            dragCenterY < dragRect.bottom;
        }
      }
      if (inBounds) {
        noMatch = false;
        this.actions = this.state.mapping.otherOptions[
          this.state.currentlyDragging
        ][i];
      }
      renderedItems.push(
        <Draggable
          key={i}
          position={selected ? null : { x: 0, y: 0 }}
          onStart={() => this.setState({ currentlyDragging: i })}
          onStop={() => this.setState({ currentlyDragging: null })}
        >
          <span>
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
    if (noMatch && this.state.currentlyDragging) {
      this.actions = this.state.mapping.selfOptions[
        this.state.currentlyDragging
      ];
    }
    return <div className="itemContainer">{renderedItems}</div>;
  };

  render() {
    if (this.state.actionDocs == null || this.state.itemDocs == null) {
      return null;
    }
    let renderedItems = [];
    try {
      renderedItems = this.renderItems();
    } catch (e) {}
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
          {(this.actions || []).map((actionId, i) => {
            let action = this.state.actionDocs[actionId];
            if (this.state.currentlyDragging) {
              return (
                <div key={i} className="alchemyAction">
                  {action.name}
                </div>
              );
            } else {
              return (
                <Action
                  key={i}
                  highlighted={this.props.action == actionId}
                  delay={0}
                  player={this.props.player}
                  action={actionId}
                  hideExtras={true}
                  enabled={this.props.action == ""}
                />
              );
            }
          })}
        </div>
      </div>
    );
  }
}
