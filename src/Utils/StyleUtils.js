import React from "react";

export const monthColors = [
  "#ac8a74",
  "#92aa5d",
  "#e93682",
  "#2ea041",
  "#ceac45",
  "#d97500",
  "#16dbe1",
  "#9fadb6"
];

export function TitleCase(s) {
  return s[0].toUpperCase() + s.substring(1);
}

export const defaultActionButton = "➤";

const currencySymbol = (
  <div
    style={{
      display: "inline-block",
      marginRight: "1px",
      position: "relative",
      top: "-2px"
    }}
  >
    🝑
  </div>
);

export function toChimes(number) {
  let n = (number || 0) / 100;
  return (
    <span>
      {currencySymbol}
      {n.toFixed(2)}
    </span>
  );
}

export function GetName(item, plural) {
  return plural ? item.plural || item.name : item.name;
}

export function ElementalFormat(text) {
  return text.split("$").map((t, i) => {
    if (t.charAt(0) == "e") {
      return (
        <span key={i} className="earthColor">
          {t.substring(1)}
        </span>
      );
    }
    if (t.charAt(0) == "f") {
      return (
        <span key={i} className="fireColor">
          {t.substring(1)}
        </span>
      );
    }
    if (t.charAt(0) == "w") {
      return (
        <span key={i} className="waterColor">
          {t.substring(1)}
        </span>
      );
    }
    return <span key={i}>{t}</span>;
  });
}

export function AddLineBreaks(text) {
  if (text == "") return "";
  return (
    <div>
      {text.split("\n").map((line, i) => (
        <div key={i}>
          {ElementalFormat(line)}
          <br />
        </div>
      ))}
    </div>
  );
}
