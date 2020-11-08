import React from "react";
import "firebase/firestore";

export default class Alchemy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      itemDocs: null
    };
  }

  updateItems = async () => {
    var itemList = Object.keys(this.props.player.inventory);
    for (let i of itemList) {
      let variety = GetTraits(i).variety;
      if (variety !== undefined) {
        itemList.push(variety);
      }
    }
    var itemDocs = await GetDocuments("items", itemList);
    this.setState({ itemDocs });
  };

  componentDidMount() {
    this.updateItems();
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(Object.keys(this.props.player.inventory)) !==
      JSON.stringify(Object.keys(prevProps.player.inventory))
    ) {
      this.updateItems();
    }
  }

  render() {
    return null;
  }
}
