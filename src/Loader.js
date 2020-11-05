import React from "react";

export default class Loader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      character: "?"
    };
    this.alchemySymbols = [
      "🜀",
      "🜁",
      "🜂",
      "🜃",
      "🜄",
      "🜅",
      "🜆",
      "🜈",
      "🜉",
      "🜊",
      "🜋",
      "🜌",
      "🜍",
      "🜎",
      "🜏",
      "🜐",
      "🜑",
      "🜒",
      "🜓",
      "🜔",
      "🜕",
      "🜖",
      "🜗",
      "🜘",
      "🜙",
      "🜚",
      "🜛",
      "🜜",
      "🜝",
      "🜞",
      "🜟",
      "🜠",
      "🜡",
      "🜢",
      "🜣",
      "🜤",
      "🜥",
      "🜦",
      "🜧",
      "🜨",
      "🜩",
      "🜪",
      "🜫",
      "🜬",
      "🜭",
      "🜮",
      "🜯",
      "🜰",
      "🜱",
      "🜲",
      "🜳",
      "🜴",
      "🜵",
      "🜶",
      "🜷",
      "🜸",
      "🜹",
      "🜺",
      "🜻",
      "🜼",
      "🜽",
      "🜾",
      "🜿",
      "🝀",
      "🝁",
      "🝂",
      "🝃",
      "🝄",
      "🝅",
      "🝆",
      "🝈",
      "🝉",
      "🝊",
      "🝋",
      "🝌",
      "🝍",
      "🝎",
      "🝐",
      "🝑",
      "🝒",
      "🝓",
      "🝔",
      "🝕",
      "🝖",
      "🝗",
      "🝘",
      "🝞",
      "🝟",
      "🝠",
      "🝡",
      "🝢",
      "🝣",
      "🝤",
      "🝥",
      "🝦",
      "🝧",
      "🝨",
      "🝩",
      "🝪",
      "🝮",
      "🝯",
      "🝰",
      "🝱",
      "🝲",
      "🝳"
    ];
  }

  componentDidMount() {
    this.loop = setInterval(this.update, 300);
    this.update();
  }

  componentWillUnmount() {
    clearInterval(this.loop);
  }

  update = () => {
    let c = this.alchemySymbols[
      Math.floor(Math.random() * this.alchemySymbols.length)
    ];
    this.setState({
      character: c,
      key: Math.random()
    });
  };

  render() {
    return (
      <div
        key={this.state.key}
        className={
          this.props.unstyled
            ? "alchemyUnstyled alchemyAnimation"
            : "alchemySymbols alchemyAnimation"
        }
      >
        {this.state.character}
      </div>
    );
  }
}
