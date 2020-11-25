import React from "react";
import { GetDocuments } from "../Utils/GameDataCache";
import { TitleCase, GetName, toChimes } from "../Utils/StyleUtils";
import { ShortTimeString } from "../Utils/TimeUtils";
import { condenseItems, GetTraits } from "../Utils/ServerCloneUtils";

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

  renderSkills = () => {
    var skills = this.props.player.skills;
    var docs = this.state.skillDocs;
    var skillList = [];
    for (var id in skills) {
      if (
        docs[id] != undefined &&
        (skills[id] > 0 || this.props.player.baseSkills[id] !== undefined)
      ) {
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
      base = Math.round(base * 100) / 100;
      let bleedMap = this.props.player.bleedMap[id] || {};
      let preciseValue = this.props.player.skills[id];
      let skillValue = Math.round(preciseValue);
      let hasBonus = false;
      let hasPenalty = false;
      let bleedLabels = [];
      for (let bleedName in bleedMap) {
        let bonus = Math.round(bleedMap[bleedName] * 100) / 100;
        hasBonus = hasBonus || bonus > 0;
        hasPenalty = hasPenalty || bonus < 0;
        bleedLabels.push(
          <div className={bonus > 0 ? "skillBonus" : "skillPenalty"}>
            <b>{bonus > 0 ? "+" + bonus : bonus}</b> from <b>{bleedName}</b>
          </div>
        );
      }
      if (bleedLabels.length > 0) {
        bleedLabels.push(
          <div>Total: {Math.round(preciseValue * 1000) / 1000}</div>
        );
      }
      return (
        <button
          className="itemPreviewButton"
          style={selected ? { borderRadius: "8px 8px 0px 0px" } : {}}
          key={i}
          onClick={() => {
            this.setState({ selectedSkill: ci });
          }}
        >
          <div
            className="itemNumber"
            style={{
              backgroundColor: hasBonus
                ? hasPenalty
                  ? "#606"
                  : "#048"
                : hasPenalty
                ? "#800"
                : "var(--dark)"
            }}
          >
            {skillValue}
          </div>
          <div>
            <div className="itemInfoTop">{skill.label}:</div>
            <b>{skill.name}</b>
          </div>
          {selected ? (
            <div className="itemPreviewExtension">
              Base: {base}
              {bleedLabels}
            </div>
          ) : null}
        </button>
      );
    });
    return (
      <div>
        {this.makeCategoryTitle("Traits")}
        <div
          className="itemInfo"
          style={{
            color: "var(--light)",
            textAlign: "center",
            margin: "4px"
          }}
        >
          Your base traits will bleed over into related traits.
        </div>
        <div className="itemContainer">{renderedSkills}</div>
      </div>
    );
  };

  renderItems = () => {
    var itemsByCategory = {};
    let categoryNames = ["status"];
    let condensedInventory = condenseItems(this.props.player.inventory);

    for (var id in condensedInventory) {
      var baseid = id.split("&")[0];
      var item = this.state.itemDocs[baseid];
      var count = condensedInventory[id];
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
      let variety = GetTraits(id).variety;
      let label = GetName(item, count != 1);
      if (variety !== undefined) {
        label = this.state.itemDocs[variety].name + " " + label;
      }
      itemsByCategory[c].push({ id, item, label: TitleCase(label), count });
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
        let traits = GetTraits(item.id);
        let renderedTraits = [];
        for (let t in traits) {
          let val = traits[t];
          if (t == "decay") {
            renderedTraits.push(
              <div className="itemInfo">{ShortTimeString(val)} left</div>
            );
          }
          if (t == "location") {
            if (val !== this.props.player.location) {
              renderedTraits.push(
                <div className="itemInfo">Somewhere else</div>
              );
            }
          }
        }
        items.push(
          <div key={item.id} className="itemPreview">
            <div className="itemNumber">
              {item.id == "chimes" ? toChimes(item.count) : item.count}
            </div>
            <div>
              <b>{TitleCase(item.label)}</b>
              {renderedTraits}
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
