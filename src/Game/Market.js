import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { GetDocuments } from "../Utils/GameDataCache";
import { condenseItems, GetTraits } from "../Utils/ServerCloneUtils";
import { currencySymbol, TitleCase } from "../Utils/StyleUtils";

export default class Market extends React.Component {
  constructor(props) {
    super(props);
    this.auth = app.auth();
    this.state = {
      sellableItems: null,
      itemCounts: {}
    };
  }

  updateDocs = async () => {
    let sellableItems = [];
    let itemCounts = {};
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
    let itemDocs = await GetDocuments("items", itemList);
    for (let i in condensedInventory) {
      let traits = GetTraits(i);
      let id = traits.id;
      let item = itemDocs[id];
      if (!item.derivedValue || item.derivedValue == 0) continue;
      itemCounts[i] = 1;
      sellableItems.push({
        item: item,
        id: i,
        count: condensedInventory[i]
      });
    }
    sellableItems.sort(
      (a, b) =>
        a.item.derivedValue -
        b.item.derivedValue +
        a.item.name.localeCompare(b.item.name) * 0.1
    );
    this.setState({ sellableItems, itemCounts });
  };

  componentDidMount() {
    this.updateDocs();
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(Object.keys(this.props.player.inventory)) !==
      JSON.stringify(Object.keys(prevProps.player.inventory))
    ) {
      this.updateDocs();
    }
  }

  toChimes = number => {
    let n = (number || 0) / 100;
    return (
      <span>
        {currencySymbol}
        {n.toFixed(2)}
      </span>
    );
  };

  renderMarket = () => {
    let renderedItems = [];
    for (let i of this.state.sellableItems) {
      const item = i.item;
      const id = i.id;
      const count = i.count;
      let soldAmount = this.state.itemCounts[id];
      renderedItems.push(
        <tr>
          <td>
            {TitleCase(item.name)} ({i.count})
          </td>
          <td>{this.toChimes(item.derivedValue / 2)}</td>
          <td>
            <input
              type="number"
              style={{ width: "25px", marginRight: "4px" }}
              value={soldAmount}
              onChange={e => {
                const n = parseInt(e.target.value);
                if (n < 0 || n > count) {
                  return;
                }
                this.setState(oldState => {
                  oldState.itemCounts[id] = n;
                  return oldState;
                });
              }}
            />
            ({this.toChimes((soldAmount * item.derivedValue) / 2)})
            <button
              onClick={() => {
                var uid = app.auth().currentUser.uid;
                app
                  .firestore()
                  .collection("gameplay")
                  .doc(uid)
                  .set({
                    action: "sell",
                    args: {
                      id,
                      soldAmount
                    }
                  });
              }}
            >
              Sell
            </button>
          </td>
        </tr>
      );
    }
    return (
      <div>
        <div className="actionTitle">Sell Your Stuff</div>
        <div>
          Chimes to your name:{" "}
          <b>{this.toChimes(this.props.player.inventory["chimes"])}</b>
        </div>
        <table>{renderedItems}</table>
      </div>
    );
  };

  render() {
    return (
      <div className="action">
        {this.state.sellableItems == null ? null : this.renderMarket()}
      </div>
    );
  }
}
