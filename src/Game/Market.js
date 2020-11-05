import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

export default class Market extends React.Component {
  constructor(props) {
    super(props);
    this.auth = app.auth();
    this.state = {
      homeData: null
    };
  }
  render() {
    return <div className="action">MARKET</div>;
  }
}
