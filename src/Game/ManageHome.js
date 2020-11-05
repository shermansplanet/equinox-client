import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

export default class ManageHome extends React.Component {
  constructor(props) {
    super(props);
    this.auth = app.auth();
    this.state = {
      homeData: null
    };
  }

  componentDidMount() {
    let homeRef = app
      .firestore()
      .collection("houses")
      .doc(this.props.player.address);
    this.unsubscribe = homeRef.onSnapshot(doc => {
      this.populateData(doc.data());
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  populateData = async homeData => {
    let playerNames = {};
    let requests = homeData.requests || [];
    let playerIds = [...homeData.admin, ...requests];
    for (let id of playerIds) {
      let info = await app
        .firestore()
        .collection("users")
        .doc(id)
        .get();
      playerNames[id] = info.data().name;
    }
    this.setState({ homeData, playerNames });
  };

  respondToRequest = (accept, id) => {
    let ref = app
      .firestore()
      .collection("gameplay")
      .doc(app.auth().currentUser.uid);
    ref.set({
      action: "house_respond",
      args: { id, accept }
    });
  };

  render() {
    let homeData = this.state.homeData;
    if (homeData == null) {
      return null;
    }
    return (
      <div className="action">
        <div className="sectionHeading">Members:</div>
        <div className="textSection">
          {homeData.admin.map((user, i) => {
            return <div key={i}>{this.state.playerNames[user]}</div>;
          })}
        </div>
        {(homeData.requests || []).length == 0 ? null : (
          <div>
            <div className="sectionHeading">Requests:</div>
            <div className="textSection">
              {homeData.requests.map((user, i) => {
                const userConst = user;
                return (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <div style={{ marginRight: "10px" }}>
                      {this.state.playerNames[user]}
                    </div>
                    <button
                      onClick={() => this.respondToRequest(true, userConst)}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => this.respondToRequest(false, userConst)}
                    >
                      Deny
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <button className="actionButton" onClick={this.props.closeHome}>
          Back
        </button>
      </div>
    );
  }
}
