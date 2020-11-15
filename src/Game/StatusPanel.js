import React from "react";
import { GetDocuments } from "../Utils/GameDataCache";
import { TitleCase, GetName } from "../Utils/StyleUtils";
import { ShortTimeString } from "../Utils/TimeUtils";
import { condenseItems, GetTraits } from "../Utils/ServerCloneUtils";

export default class StatusPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      skillDocs: null,
      itemDocs: null
    };
  }

  updateSkills = async () => {
    var skillList = Object.keys(this.props.player.skills);
    var skillDocs = await GetDocuments("skills", skillList);
    this.setState({ skillDocs });
  };

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
    this.updateSkills();
    this.updateItems();
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(this.props.player.skills) !==
      JSON.stringify(prevProps.player.skills)
    ) {
      this.updateSkills();
    }
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
