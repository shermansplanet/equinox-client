import React from "react";
import { GetDocuments } from "../Utils/GameDataCache";
import {
  condenseItems,
  GetTraits,
  canTakeAction
} from "../Utils/ServerCloneUtils";
import { TitleCase, GetName } from "../Utils/StyleUtils";
import "firebase/firestore";

export default class Alchemy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      itemDocs: null,
      actionDocs: null
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
    this.setState({ itemDocs });
  };

  updateActions = async () => {
    var actionDocs = await GetDocuments(
      "actions",
      this.props.player.availableActions
    );
    this.setState({ actionDocs });
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

  renderItems = () => {
    let itemsToRender = [];
    let condensedInventory = condenseItems(this.props.player.inventory);
    for (let i of this.props.location.items || []) {
      condensedInventory[i] = (condensedInventory[i] || 0) + 1;
    }
    let selfOptions = {};
    for (let id1 in condensedInventory) {
      let traits1 = GetTraits(id1);
      selfOptions[id1] = [];
      for (let actionId in this.state.actionDocs) {
        let action = this.state.actionDocs[actionId];
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
        for (let actionId in this.state.actionDocs) {
          if (
            selfOptions[id1].includes(actionId) ||
            selfOptions[id2].includes(actionId)
          ) {
            continue;
          }
          let action = this.state.actionDocs[actionId];
          let inventoryTotals = {}; //this.props.player.inventoryTotals;
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
    let renderedItems = [];
    itemsToRender.sort();
    for (let itemId of itemsToRender) {
      let traits = GetTraits(itemId);
      let item = this.state.itemDocs[traits.id];
      let label = GetName(item, false);
      let variety = traits.variety;
      if (variety !== undefined) {
        label = this.state.itemDocs[variety].name + " " + label;
      }
      renderedItems.push(
        <div key={traits.id} className="itemPreview">
          <div>
            <b>{TitleCase(label)}</b>
          </div>
        </div>
      );
    }
    return <div className="itemContainer">{renderedItems}</div>;
  };

  render() {
    if (this.state.actionDocs == null || this.state.itemDocs == null) {
      return null;
    }
    return <div>{this.renderItems()}</div>;
  }
}
