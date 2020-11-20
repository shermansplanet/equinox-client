import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import Header from "./Header";
import Actions from "./Actions";
import Result from "./Result";
import NewUser from "../Account/NewUser";
import YouPanel from "./YouPanel";
import Alchemy from "./Alchemy";
import { GetPlace } from "../Utils/GameDataCache";
import QuickActions from "./QuickActions";
import Clock from "./Clock";
import RightSidebar from "./RightSidebar";
import Loader from "../Loader";
import {
  GetTimeUntilNextSemester,
  monthNames,
  GetCurrentMonth
} from "../Utils/TimeUtils";

export default class Game extends React.Component {
  constructor(props) {
    super(props);

    this.db = app.firestore();
    this.auth = app.auth();

    this.state = {
      location: null,
      backLocationName: "",
      userData: null,
      action: null,
      newUser: false,
      currentTab: "actions",
      clearedMessages: [],
      showSidebars: false
    };

    this.unsubscribe = this.db
      .collection("users")
      .doc(this.auth.currentUser.uid)
      .onSnapshot(async doc => {
        if (doc.exists) {
          var userData = doc.data();
          const locactionid = doc.data().actionSet;
          var location = await GetPlace(userData, locactionid);
          var backLoc = await GetPlace(userData, doc.data().location);
          this.setState({
            userData,
            newUser: false,
            location,
            backLocationName: backLoc.name,
            clearedMessages: [],
            showSidebars: this.state.showSidebars && !this.backToActions,
            loading: false
          });
          this.backToActions = false;
        } else {
          this.setState({ newUser: true });
        }
      });

    this.unsubscribe2 = this.db
      .collection("gameplay")
      .doc(this.auth.currentUser.uid)
      .onSnapshot(doc => {
        var newState = { action: doc.data()?.action };
        newState.currentTab =
          doc.data().args && doc.data().args.loadAlchemy
            ? "alchemy"
            : "actions";
        this.switchingToTab = newState.currentTab;
        console.log(doc.data().action);
        newState.loading = newState.currentTab != this.state.currentTab;
        this.setState(newState);
      });

    this.backToActions = false;
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.unsubscribe2();
  }

  showSidebars = show => {
    this.setState({ showSidebars: show });
  };

  setTab = tab => {
    this.switchingToTab = tab;
    if (tab == "actions") {
      var uid = app.auth().currentUser.uid;
      app
        .firestore()
        .collection("gameplay")
        .doc(uid)
        .set({
          action: "softRefresh"
        });
    }
    if (tab == "you") {
      this.setState({ currentTab: tab, showSidebars: false });
    } else {
      this.setState({ showSidebars: false });
    }
  };

  render() {
    console.log(this.switchingToTab, this.state.currentTab, this.state.loading);
    var player = this.state.userData;
    if (this.state.newUser) {
      return <NewUser />;
    }
    if (
      player == null ||
      this.state.action == null ||
      this.state.action == "refresh"
    ) {
      return (
        <div className="centered">
          <Loader />
        </div>
      );
    }
    var content = null;
    let showResult = player.result >= 0 && this.state.action != "";
    if (showResult) {
      content = <Result player={player} action={this.state.action} />;
    } else {
      content = (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <div className="lightDivider" />
          <div className="locationHeading">
            <div className="actionTitle">{this.state.location.name}</div>
            {this.state.location.image == undefined ? null : (
              <img className="locationImage" src={this.state.location.image} />
            )}
            {this.state.location.text}
            {this.state.location.name === "Course Registration" ? (
              <div>
                <div className="lightDivider" style={{ margin: "8px" }} />
                <i>
                  Semesters are two months long. The next semester starts on the
                  first day of The{" "}
                  {monthNames[Math.ceil(((GetCurrentMonth() + 1) / 2) * 2) % 8]}{" "}
                  ({GetTimeUntilNextSemester()} from now in real time).
                </i>
              </div>
            ) : null}
          </div>
          <div className="lightDivider" />
          {player.actionSet == player.location ? null : (
            <div
              className="action"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div className="actionTitle">
                Return to {this.state.backLocationName}
              </div>
              <button
                disabled={this.state.action !== ""}
                className="actionButton"
                onClick={() => {
                  var uid = app.auth().currentUser.uid;
                  app
                    .firestore()
                    .collection("gameplay")
                    .doc(uid)
                    .set(
                      {
                        action: "softRefresh"
                      },
                      { merge: true }
                    );
                }}
              >
                Back
              </button>
            </div>
          )}

          <Actions
            noExtras={this.state.currentTab == "alchemy"}
            player={player}
            action={this.state.action}
          />
        </div>
      );
    }
    let showSidebars = this.state.showSidebars;
    return (
      <div className="gameContainer">
        <Header player={player} />
        <QuickActions
          action={this.state.action}
          setTab={this.setTab}
          showSidebars={this.showSidebars}
        />
        <div className="gameColumns">
          <div className={showSidebars ? "" : "mobileHide"}>
            <Clock player={player} />
          </div>
          <div
            className={showSidebars ? "mainColumn mobileHide" : "mainColumn"}
          >
            <div style={{ height: "0px", opacity: 0 }}>
              ----------------------------------------------------------------------------------------------------
            </div>
            {this.state.loading ||
            this.state.currentTab != this.switchingToTab ? (
              <div className="centered">
                <Loader />
              </div>
            ) : this.state.currentTab == "alchemy" ? (
              <Alchemy
                tab={this.switchingToTab}
                player={player}
                location={this.state.location}
                action={this.state.action}
              />
            ) : this.state.currentTab == "you" ? (
              <YouPanel player={player} />
            ) : (
              <div>
                {player.messages.map((message, i) => {
                  const ci = i;
                  return this.state.clearedMessages.includes(ci) ? null : (
                    <div className="action message" key={i}>
                      <div className="actionTitle">{message.name}</div>
                      {message.text}
                      <button
                        className="closeButton"
                        onClick={() =>
                          this.setState(oldState => {
                            oldState.clearedMessages.push(ci);
                            return oldState;
                          })
                        }
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
                {content}
              </div>
            )}
          </div>
          <div className={showSidebars ? "" : "mobileHide"}>
            <RightSidebar
              action={this.state.action}
              location={this.state.location}
              player={player}
              onSidebarAction={() => (this.backToActions = true)}
            />
          </div>
        </div>
      </div>
    );
  }
}
