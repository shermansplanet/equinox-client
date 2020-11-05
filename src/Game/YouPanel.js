import React from "react";
import { GetDocuments, GetTraits } from "../Utils/GameDataCache";
import { TitleCase } from "../Utils/StyleUtils";
import { ShortTimeString } from "../Utils/TimeUtils";

export default class YouPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      skillDocs: null,
      itemDocs: null,
      selectedSkill: null
    };
  }

  updateSkills = async () => {
    var skillList = Object.keys(this.props.player.skills);
    var skillDocs = await GetDocuments("skills", skillList);
    this.setState({ skillDocs });
  };

  updateItems = async () => {
    var itemList = Object.keys(this.props.player.inventory);
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

  renderSkills = () => {
    var skills = this.props.player.skills;
    var docs = this.state.skillDocs;
    var skillList = [];
    for (var id in skills) {
      if (docs[id] != undefined && skills[id] > 0) {
        skillList.push(id);
      }
    }
    skillList.sort(
      (a, b) =>
        skills[b] - skills[a] + docs[a].name.localeCompare(docs[b].name) * 0.5
    );
    var renderedSkills = skillList.map((id, i) => {
      var skill = docs[id];
      const ci = i;
      const selected = this.state.selectedSkill == i;
      let base = this.props.player.baseSkills[id] || 0;
      let diffused = this.props.player.diffusedSkills[id] || 0;
      let skillValue = this.props.player.skills[id];
      let bleed = diffused - base;
      let status = skillValue - diffused;
      return (
        <button
          className="itemPreviewButton"
          style={selected ? { borderRadius: "8px 8px 0px 0px" } : {}}
          key={i}
          onClick={() => {
            this.setState({ selectedSkill: ci });
          }}
        >
          <div className="itemNumber">{skillValue}</div>
          <div>
            <div className="itemInfoTop">{skill.label}:</div>
            <b>{skill.name}</b>
          </div>
          {selected ? (
            <div className="itemPreviewExtension">
              Base: {base}
              <div
                className={
                  bleed == 0 ? "" : bleed > 0 ? "skillBonus" : "skillPenalty"
                }
              >
                Bleed: {(bleed >= 0 ? "+" : "") + bleed}
              </div>
              <div
                className={
                  status == 0 ? "" : status > 0 ? "skillBonus" : "skillPenalty"
                }
              >
                Status: {(status >= 0 ? "+" : "") + status}
              </div>
            </div>
          ) : null}
        </button>
      );
    });
    return (
      <div>
        {this.makeCategoryTitle("Traits")}
        <div className="itemContainer">{renderedSkills}</div>
      </div>
    );
  };

  renderItems = () => {
    var itemsByCategory = {};
    let categoryNames = ["status"];
    for (var id in this.props.player.inventory) {
      var baseid = id.split("&")[0];
      var item = this.state.itemDocs[baseid];
      var count = this.props.player.inventory[id];
      if (!item || !item.name || count <= 0 || item.hidden) {
        continue;
      }
      var c = item.category;
      if (c == undefined) {
        c = "items";
      }
      if (itemsByCategory[c] == undefined) {
        itemsByCategory[c] = [];
      }
      if (!categoryNames.includes(c)) {
        categoryNames.push(c);
      }
      itemsByCategory[c].push({ id, item, count });
    }
    var categories = [];
    for (var category of categoryNames) {
      if (!itemsByCategory[category]) continue;
      var items = [];
      itemsByCategory[category].sort(
        (a, b) =>
          a.item.name.localeCompare(b.item.name) +
          0.1 * a.id.localeCompare(b.id)
      );
      for (var item of itemsByCategory[category]) {
        var traits = GetTraits(item.id);
        items.push(
          <div key={item.id} className="itemPreview">
            <div className="itemNumber">{item.count}</div>
            <div>
              <b>{item.item.name}</b>
              {traits.decay == undefined ? null : (
                <div className="itemInfo">
                  {ShortTimeString(traits.decay)} left
                </div>
              )}
            </div>
          </div>
        );
      }
      categories.push(this.makeCategoryTitle(category));
      categories.push(
        <div key={category} className="itemContainer">
          {items}
        </div>
      );
    }
    return categories;
  };

  makeCategoryTitle = category => (
    <div key={category + "_header"} className="categoryHeader">
      <div className="lightDivider" />
      {category}
      <div className="lightDivider" />
    </div>
  );

  render() {
    return (
      <div
        style={{ height: "100%", marginTop: "-14px" }}
        onMouseDown={() => this.setState({ selectedSkill: null })}
      >
        {this.state.skillDocs == null ? null : this.renderSkills()}
        {this.state.itemDocs == null ? null : this.renderItems()}
      </div>
    );
  }
}
