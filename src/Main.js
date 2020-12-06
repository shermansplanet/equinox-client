import React from "react";
import app from "firebase/app";
import app from "firebase/firestore";
import "firebase/auth";
import Game from "./Game/Game";
import Login from "./Account/Login";
import Loader from "./Loader";

export default class Main extends React.Component {
  constructor(props) {
    super(props);
    var firebaseConfig = {
      apiKey: "AIzaSyDa_29u_EWqM0zXurRUnD_5QSMpYPbE5jU",
      authDomain: "equinox-engine.firebaseapp.com",
      databaseURL: "https://equinox-engine.firebaseio.com",
      projectId: "equinox-engine",
      storageBucket: "equinox-engine.appspot.com",
      messagingSenderId: "479848169963",
      appId: "1:479848169963:web:cb68f3f2a764d72b31d9ae",
      measurementId: "G-JSTKKZ228S"
    };
    if (!app.apps.length) {
      app.initializeApp(firebaseConfig);
    }
    this.auth = app.auth();
    this.state = {
      authUser: null,
      loading: true
    };
    this.auth.onAuthStateChanged(async authUser => {
      if (authUser) {
        var actionDoc = app
          .firestore()
          .collection("gameplay")
          .doc(authUser.uid);
        var actionData = (await actionDoc.get()).data();
        var currentAction = actionData ? actionData.action : "";
        if (currentAction == "refresh" || currentAction == "") {
          await actionDoc.set({
            action: currentAction != "" ? "" : "refresh",
            args: { loadAlchemy: true }
          });
        }
        this.setState({ authUser, loading: false });
      } else {
        this.setState({ authUser: null, loading: false });
      }
    });
  }

  render() {
    if (this.state.loading) {
      return (
        <div className="centered">
          <Loader />
        </div>
      );
    }
    if (this.state.authUser == null) {
      return (
        <div>
          <Login />
        </div>
      );
    }
    return <Game />;
  }
}
