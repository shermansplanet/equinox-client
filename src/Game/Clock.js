import {
  clock_svg,
  bighand_svg,
  smallhand_svg,
  pendulum_svg
} from "../img/clock_svg";
import React from "react";
import app from "firebase/app";
import "firebase/firestore";
import "firebase/auth";
import {
  Subscribe,
  Unsubscribe,
  Sync,
  TimeString,
  GetCurrentDate,
  GetCurrentMonth,
  GetDayPercent,
  GetMonthPercent,
  MS_PER_GAME_MONTH
} from "../Utils/TimeUtils";
import { monthColors } from "../Utils/StyleUtils";

export default class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.auth = app.auth();
    this.state = {
      minutes: this.props.player.minutes
    };
  }

  updateTime = minutes => {
    this.setState({ minutes });
  };

  componentDidUpdate(prevProps) {
    if (this.props.player.minutes !== prevProps.player.minutes) {
      Sync(this.props.player);
    }
  }

  componentDidMount() {
    Sync(this.props.player);
    Subscribe(this.updateTime, "clock");
  }

  componentWillUnmount() {
    Unsubscribe("clock");
  }

  render() {
    var currentTime = new Date().getTime();
    var m = (currentTime / MS_PER_GAME_MONTH + 1) % 8;
    let daylightMod = Math.abs(m - 4) - 2;
    let dayLength = 0.5 + daylightMod / 12;
    let sleeplessRot =
      this.state.minutes - 1440 + (this.props.player.timeSinceLastSleep % 1440);
    return (
      <div style={{ width: "180px", margin: "8px" }}>
        <svg className="progress-ring" width="140" height="140">
          <circle
            className="progress-ring__circle clockTransition"
            stroke="#234"
            strokeWidth="19"
            fill="transparent"
            r="45"
            cx="70"
            cy="70"
          />
        </svg>
        <svg
          className="progress-ring"
          style={{
            transform: `translate(27px, 172px) rotate(${(dayLength - 0.5) *
              180}deg)`
          }}
          width="140"
          height="140"
        >
          <circle
            strokeDasharray="283 283"
            strokeDashoffset={dayLength * 283}
            className="day-ring__circle clockTransition"
            stroke="#705838"
            strokeWidth="19"
            fill="transparent"
            r="45"
            cx="70"
            cy="70"
          />
        </svg>
        <svg className="progress-ring" width="140" height="140">
          <circle
            strokeDasharray="390 390"
            strokeDashoffset={390 - (this.state.minutes * 390) / 1440}
            className="progress-ring__circle clockTransition"
            stroke="var(--light)"
            strokeWidth="4"
            fill="transparent"
            r="62"
            cx="70"
            cy="70"
          />
        </svg>
        <div
          className="monthBackground"
          style={{
            backgroundColor: monthColors[GetCurrentMonth()]
          }}
        />
        {clock_svg}
        <div className="clockCenter">
          <div className="pendulumHolder">
            <div className="pendulum">{pendulum_svg}</div>
          </div>
          {sleeplessRot < 0 ? null : (
            <div
              className="clockTransition"
              style={{
                transform: "rotate(" + (sleeplessRot * 360) / 1440 + "deg)"
              }}
            >
              <div className="sleeplessTick">🝰</div>
            </div>
          )}
          <div
            className="clockTransition"
            style={{
              transform: "rotate(" + (this.state.minutes * 360) / 1440 + "deg)"
            }}
          >
            <div className="bigHand">{bighand_svg}</div>
          </div>
          <div
            className="clockTransition"
            style={{
              transform: "rotate(" + GetDayPercent() * 360 + "deg)"
            }}
          >
            <div className="smallHand">{smallhand_svg}</div>
          </div>
        </div>
        <div className="clockTopCenter">
          <div
            className="clockTransition"
            style={{
              transform: "rotate(" + GetMonthPercent() * 360 + "deg)"
            }}
          >
            <div className="smallerHand">{smallhand_svg}</div>
          </div>
        </div>
        <div className="clockDisplay">
          <b style={{ color: monthColors[GetCurrentMonth()] }}>
            {GetCurrentDate()}
          </b>
          <div className="lightDivider" style={{ margin: "14px 0px" }} />
          You have <b>
            {TimeString(this.state.minutes).replace(",", " and")}
          </b>{" "}
          to spend.
        </div>
      </div>
    );
  }
}
