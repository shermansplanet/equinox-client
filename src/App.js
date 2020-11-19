import React from "react";
import Main from "./Main";
import "./style.css";
import "./sidebar.css";
import "./loaderstyle.css";
import "./alchemystyle.css";
import express from "express";

export default function App() {
  var app = express();
  app.use(express.static("/public"));
  return <Main />;
}
