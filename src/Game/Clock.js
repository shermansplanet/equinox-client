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
  GetHourPercent,
  GetYearPercent,
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

  renderSeasonDots = () => {
    return monthColors.map((color, i) => (
      <svg
        key={i}
        style={{
          position: "absolute",
          transform: "translate(-29.5px, -29.5px) rotate(-90deg)"
        }}
        width="60"
        height="60"
      >
        <circle
          strokeDasharray="15 125"
          strokeDashoffset={-((i + 1) % 8) * 17.3}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          r="22"
          cx="30"
          cy="30"
        />
      </svg>
    ));
  };

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
          {sleeplessRot < 0 ? null : (
            <circle
              strokeDasharray="390 390"
              strokeDashoffset={390 - (sleeplessRot * 390) / 1440}
              className="progress-ring__circle clockTransition"
              stroke="var(--highlight)"
              opacity="0.6"
              strokeWidth="4"
              fill="transparent"
              r="62"
              cx="70"
              cy="70"
            />
          )}
        </svg>
        {clock_svg}
        <div className="clockCenter">
          <div className="pendulumHolder">
            <div className="pendulum">{pendulum_svg}</div>
          </div>
          <div
            className="clockTransition"
            style={{
              transform: "rotate(" + GetHourPercent() * 360 + "deg)"
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
          {this.renderSeasonDots()}
          <div
            className="clockTransition"
            style={{
              transform:
                "rotate(" + ((GetYearPercent() * 360 + 45) % 360) + "deg)"
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
          {this.state.minutes <= 0 ? (
            "Wait a bit..."
          ) : (
            <div>
              You have{" "}
              <b>{TimeString(this.state.minutes).replace(",", " and")}</b> to
              spend.
            </div>
          )}
        </div>
      </div>
    );
  }
}
