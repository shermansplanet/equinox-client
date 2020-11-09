import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import { Subscribe, Unsubscribe, ShortTimeString } from "../Utils/TimeUtils";
import { GetDocuments, GetDocument } from "../Utils/GameDataCache";
import { defaultActionButton } from "../Utils/StyleUtils";
import Loader from "../Loader";

export default class RightSidebar extends React.Component {
  constructor(props) {
    super(props);
    this.HAND_SIZE = 3;
    this.state = {
      updateTime: 0,
      wanderTime: "",
      availableCards: []
    };
  }

  updateTime = minutes => {
    this.setState({ updateTime: new Date().getTime() });
  };

  componentDidMount() {
    this.updateCards();
    Subscribe(this.updateTime, "cards");
  }

  componentWillUnmount() {
    Unsubscribe("cards");
  }

  componentDidUpdate(prevProps) {
    if (
      JSON.stringify(this.props.player.cards) !==
        JSON.stringify(prevProps.player.cards) ||
      this.props.location.cardset !== prevProps.location.cardset
    ) {
      this.updateCards();
    }
  }

  updateCards = async () => {
    let cardIds = this.props.player.cards[this.props.location.cardset];
    let wanderAction = await GetDocument("actions", "newcard");
    let wanderTime = ShortTimeString(wanderAction.minutes);
    let wanderMinutes = wanderAction.minutes;
    if (cardIds == undefined || cardIds.length == 0) {
      this.setState({ availableCards: [], wanderTime, wanderMinutes });
      return;
    }
    let cardData = await GetDocuments("actions", cardIds);
    let availableCards = cardIds.map(id => {
      return { id, ...cardData[id] };
    });
    this.setState({
      availableCards,
      wanderTime,
      wanderMinutes
    });
  };

  takeAction = (action_id, args) => {
    var uid = app.auth().currentUser.uid;
    if (action_id != "discard") {
      this.props.onSidebarAction();
    }
    app
      .firestore()
      .collection("gameplay")
      .doc(uid)
      .set(
        {
          action: action_id,
          args: args || {}
        },
        { merge: true }
      );
  };

  render() {
    let cards = [];
    let player = this.props.player;
    let cardset = this.props.location.cardset;

    if (this.state.availableCards.length > 0) {
      for (let i in this.state.availableCards) {
        let card = this.state.availableCards[i];
        const actionId = card.id;
        const ci = i;
        cards.push(
          <div
            className="action"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
            key={i}
          >
            <div className="actionTitle" style={{ fontSize: "13pt" }}>
              {card.name}
            </div>
            <button
              className="actionButton"
              disabled={this.props.action != ""}
              onClick={() => this.takeAction(actionId)}
            >
              {this.props.action == actionId ? (
                <div style={{ position: "relative" }}>
                  <span style={{ opacity: 0 }}>X</span>
                  <Loader unstyled={true} />
                </div>
              ) : (
                defaultActionButton
              )}
            </button>
            <button
              className="closeButton discardButton"
              disabled={this.props.action != ""}
              onClick={() => this.takeAction("discard", { cardIndex: ci })}
            >
              ✕
            </button>
          </div>
        );
      }
    }

    for (let i = this.state.availableCards.length; i < this.HAND_SIZE; i++) {
      cards.push(<div key={i} className="eventSlot" />);
    }

    return (
      <div className="sidebar">
        <div className="action">
          {cardset == undefined ? (
            "Not much happening here..."
          ) : (
            <div>
              <button
                className="actionButton"
                style={{
                  width: "100%"
                }}
                disabled={
                  this.props.action != "" ||
                  (player.cards[cardset] || []).length >= this.HAND_SIZE ||
                  player.minutes < this.state.wanderMinutes
                }
                onClick={() => {
                  var uid = app.auth().currentUser.uid;
                  app
                    .firestore()
                    .collection("gameplay")
                    .doc(uid)
                    .set(
                      {
                        action: "newcard"
                      },
                      { merge: true }
                    );
                }}
              >
                {this.props.action == "newcard" ? (
                  <div style={{ position: "relative" }}>
                    <span style={{ opacity: 0 }}>X</span>
                    <Loader unstyled={true} />
                  </div>
                ) : (
                  <span>Wander! {this.state.wanderTime}</span>
                )}
              </button>
            </div>
          )}
        </div>
        {cards}
      </div>
    );
  }
}
