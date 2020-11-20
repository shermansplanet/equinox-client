import React from "react";
import { GetDocuments } from "../Utils/GameDataCache";
import { TitleCase } from "../Utils/StyleUtils";
import { ShortTimeString } from "../Utils/TimeUtils";
import { GetTraits } from "../Utils/ServerCloneUtils";

export default class StatusPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      skillDocs: null,
      itemDocs: null
    };
  }

  updateDocs = async () => {
    var itemList = Object.keys(this.props.player.inventory);
    for (let i of itemList) {
      let variety = GetTraits(i).variety;
      if (variety !== undefined) {
        itemList.push(variety);
      }
    }
    var itemDocs = await GetDocuments("items", itemList);
    let skillList = [];
    for (let id in itemDocs) {
      skillList.push(...Object.keys(itemDocs[id].skill_coeffs || {}));
    }
    var skillDocs = await GetDocuments("skills", skillList);
    this.setState({ itemDocs, skillDocs });
  };

  componentDidMount() {
    this.updateDocs();
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(this.props.player.skills) !==
        JSON.stringify(prevProps.player.skills) ||
      JSON.stringify(Object.keys(this.props.player.inventory)) !==
        JSON.stringify(Object.keys(prevProps.player.inventory))
    ) {
      this.updateDocs();
    }
  }

  render() {
    if (this.state.itemDocs == null || this.state.skillDocs == null) {
      return null;
    }
    let player = this.props.player;
    let rendered = [];
    for (let id in player.inventory) {
      let traits = GetTraits(id);
      let item = this.state.itemDocs[traits.id];
      if (item == undefined || item.hidden) {
        continue;
      }
      if (
        item.skill_coeffs == undefined ||
        Object.keys(item.skill_coeffs).length == 0
      ) {
        continue;
      }
      let coeffs = [];
      for (let skillId in item.skill_coeffs) {
        let skill = this.state.skillDocs[skillId];
        if (skill == undefined) {
          continue;
        }
        coeffs.push(
          <div
            key={skillId}
            style={{
              fontSize: "10pt",
              color: "#d53"
            }}
          >
            {TitleCase(skill.name)} x{item.skill_coeffs[skillId]}
          </div>
        );
      }
      rendered.push({
        div: (
          <div key={id} style={{ marginTop: "10px" }}>
            {item.name}
            {traits.decay !== undefined ? (
              <div className="itemInfo">
                {ShortTimeString(traits.decay)} left
              </div>
            ) : null}
            {coeffs}
          </div>
        ),
        rank: traits.decay || 0
      });
    }
    if (rendered.length == 0) {
      return null;
    }
    rendered.sort((a, b) => a.rank - b.rank);
    return (
      <div>
        <div className="actionTitle" style={{ color: "var(--light)" }}>
          Current Status
        </div>
        <div className="itemInfo">
          Trait modifiers will be applied to all dependent traits as well. Click
          on a trait in the{" "}
          <i>
            <b>you</b>
          </i>{" "}
          tab for more details.
        </div>
        {rendered.map(r => r.div)}
      </div>
    );
  }
}
