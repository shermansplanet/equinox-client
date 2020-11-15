import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { GetDocuments, GetDocument } from "../Utils/GameDataCache";
import { condenseItems, GetTraits, getValue } from "../Utils/ServerCloneUtils";
import { toChimes, TitleCase } from "../Utils/StyleUtils";

export default class Market extends React.Component {
  constructor(props) {
    super(props);
    this.auth = app.auth();
    this.state = {
      sellableItems: null,
      itemCounts: {},
      currentMarket: 0,
      markets: []
    };
  }

  updateDocs = async () => {
    let location = await GetDocument("locations", this.props.player.location);
    let markets = this.state.markets;
    if (markets.length == 0) {
      markets = [{ name: "Sell", text: "", items: [] }];
      for (let i in location.markets || []) {
        markets.push(await GetDocument("markets", location.markets[i]));
      }
      this.setState({ markets });
    }
    let marketIndex = this.state.currentMarket;
    let currentMarket = markets[marketIndex];
    let selling = marketIndex == 0;

    let sellableItems = [];
    let itemCounts = {};
    let condensedInventory = condenseItems(this.props.player.inventory);
    let inventory = selling
      ? Object.keys(condensedInventory)
      : currentMarket.items;
    var itemList = [...inventory];
    if (selling) {
      for (let i of inventory) {
        let traits = GetTraits(i);
        if (traits.variety !== undefined) {
          itemList.push(traits.variety);
        }
      }
    }
    let itemDocs = await GetDocuments("items", itemList);
    for (let i of inventory) {
      let traits = GetTraits(i);
      let id = traits.id;
      let item = itemDocs[id];
      if (item.derivedValue == undefined || item.derivedValue == 0) continue;
      let valueId =
        traits.variety == undefined ? id : id + "$" + traits.variety;
      itemCounts[i] = 1;
      let title =
        traits.variety == undefined
          ? item.name
          : itemDocs[traits.variety].name + " " + item.name;
      sellableItems.push({
        value: getValue(valueId, itemDocs),
        title,
        id: i,
        count: condensedInventory[i]
      });
    }
    sellableItems.sort(
      (a, b) => a.value - b.value + a.title.localeCompare(b.title) * 0.1
    );
    this.setState({ sellableItems, itemCounts });
  };

  componentDidMount() {
    this.updateDocs();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      JSON.stringify(Object.keys(this.props.player.inventory)) !==
        JSON.stringify(Object.keys(prevProps.player.inventory)) ||
      prevState.currentMarket != this.state.currentMarket
    ) {
      this.updateDocs();
    }
  }

  renderMarket = () => {
    let renderedItems = [];
    let currentMarket = this.state.markets[this.state.currentMarket];
    let selling = this.state.currentMarket == 0;
    let currentChimes = this.props.player.inventory["chimes"];
    for (let i of this.state.sellableItems) {
      const title = i.title;
      const id = i.id;
      const count = i.count;
      const baseValue = i.value;
      let soldAmount = this.state.itemCounts[id];
      let value = soldAmount * baseValue * (selling ? 0.5 : 1);
      renderedItems.push(
        <tr key={id}>
          <td>
            {TitleCase(title)} {selling ? `(${i.count})` : ""}
          </td>
          <td>{toChimes(baseValue * (selling ? 0.5 : 1))}</td>
          <td>
            <input
              type="number"
              style={{ width: "40px", marginRight: "4px" }}
              value={soldAmount || 0}
              onChange={e => {
                const n = parseInt(e.target.value);
                if (n < 1 || n > count) {
                  return;
                }
                this.setState(oldState => {
                  oldState.itemCounts[id] = n;
                  return oldState;
                });
              }}
            />
            ({toChimes(value)})
            <button
              disabled={
                this.props.action != "" || (!selling && value > currentChimes)
              }
              onClick={() => {
                var uid = app.auth().currentUser.uid;
                app
                  .firestore()
                  .collection("gameplay")
                  .doc(uid)
                  .set({
                    action: selling ? "sell" : "buy",
                    args: {
                      id,
                      soldAmount
                    }
                  });
              }}
            >
              {selling ? "Sell" : "Buy"}
            </button>
          </td>
        </tr>
      );
    }
    return (
      <div>
        <div className="actionTitle">{currentMarket.name}</div>
        <div>{currentMarket.text}</div>
        <div>
          Chimes to your name: <b>{toChimes(currentChimes)}</b>
        </div>
        <table>
          <tbody>{renderedItems}</tbody>
        </table>
      </div>
    );
  };

  render() {
    return [
      this.state.markets.length == 0 ? null : (
        <div key="marketTabs">
          {this.state.markets.map((market, i) => {
            const ci = i;
            return (
              <button
                key={i}
                onClick={() => this.setState({ currentMarket: ci })}
              >
                {market.name}
              </button>
            );
          })}
        </div>
      ),
      <div className="action" key={"marketAction" + this.state.currentMarket}>
        {this.state.sellableItems == null ? null : this.renderMarket()}
      </div>
    ];
  }
}
