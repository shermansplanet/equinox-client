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

export const currencySymbol = (
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

export function GetName(item, plural) {
  return plural ? item.plural || item.name : item.name;
}

export function AddLineBreaks(text) {
  console.log(text.split("\n"));
  return (
    <div>
      {text.split("\n").map((line, i) => (
        <div key={i}>
          {line}
          <br />
        </div>
      ))}
    </div>
  );
}
