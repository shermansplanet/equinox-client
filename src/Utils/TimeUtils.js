var currentTimingFunction = null;
var timingPlayerData = null;
var currentMinutes = 0;

const MAX_MINUTES = 1440;
const SPEED_COEFF = 12;
export const MS_PER_GAME_MINUTE = (1000 * 60) / SPEED_COEFF;
const MS_PER_GAME_HOUR = MS_PER_GAME_MINUTE * 60;
const MS_PER_GAME_DAY = MS_PER_GAME_HOUR * 24;
export const MS_PER_GAME_MONTH = MS_PER_GAME_DAY * 45;

export const monthNames = [
  "Scrawled Enigma",
  "Lichen Tide",
  "Lurid Swarm",
  "Briar Heart",
  "Tallow Skull",
  "Amber Lantern",
  "Lightning Grin",
  "Silver Engine"
];

var callbacks = {};

export function GetCurrentMonth() {
  var currentTime = new Date().getTime();
  return Math.floor(currentTime / MS_PER_GAME_MONTH) % 8;
}

export function GetCurrentMonthName() {
  return monthNames[GetCurrentMonth()];
}

export function GetCurrentDate() {
  return (
    (IsDay() ? "☀" : "☾") +
    GetCurrentTime() +
    " on day " +
    GetCurrentDay() +
    " of The " +
    GetCurrentMonthName()
  );
}

export function GetTimeUntilNextSemester() {
  var currentTime = new Date().getTime();
  var semesterStart =
    Math.ceil(currentTime / (MS_PER_GAME_MONTH * 2)) * (MS_PER_GAME_MONTH * 2);
  var dt = (semesterStart - currentTime) / SPEED_COEFF;
  var days = Math.floor(dt / MS_PER_GAME_DAY);
  dt -= days * MS_PER_GAME_DAY;
  var hours = Math.floor(dt / MS_PER_GAME_HOUR);
  dt -= hours * MS_PER_GAME_HOUR;
  var minutes = Math.floor(dt / MS_PER_GAME_MINUTE);
  var s = [];
  if (days > 0) s.push(days > 1 ? days + " days" : "1 day");
  if (hours > 0) s.push(hours > 1 ? hours + " hours" : "1 hour");
  if (minutes > 0) s.push(minutes > 1 ? minutes + " minutes" : "1 day");
  return s.join(", ");
}

export function GetCurrentDay() {
  var currentTime = new Date().getTime();
  var monthStart =
    Math.floor(currentTime / MS_PER_GAME_MONTH) * MS_PER_GAME_MONTH;
  return Math.ceil((currentTime - monthStart) / MS_PER_GAME_DAY);
}

export function GetMonthPercent() {
  var currentTime = new Date().getTime();
  var monthStart =
    Math.floor(currentTime / MS_PER_GAME_MONTH) * MS_PER_GAME_MONTH;
  return (currentTime - monthStart) / MS_PER_GAME_MONTH;
}

export function GetCurrentHour() {
  var currentTime = new Date().getTime();

  var dayStart = Math.floor(currentTime / MS_PER_GAME_DAY) * MS_PER_GAME_DAY;
  return Math.floor((currentTime - dayStart) / MS_PER_GAME_HOUR);
}

export function IsDay() {
  var currentTime = new Date().getTime();
  var dayStart = Math.floor(currentTime / MS_PER_GAME_DAY) * MS_PER_GAME_DAY;
  var h = (currentTime - dayStart) / MS_PER_GAME_HOUR;
  var m = (currentTime / MS_PER_GAME_MONTH + 1) % 8;
  var daylightMod = Math.abs(m - 4) - 2;
  return h >= 6 + daylightMod && h < 18 - daylightMod;
}

export function GetDayPercent() {
  var currentTime = new Date().getTime();

  var dayStart = Math.floor(currentTime / MS_PER_GAME_DAY) * MS_PER_GAME_DAY;
  return (currentTime - dayStart) / MS_PER_GAME_DAY;
}

export function GetCurrentTime() {
  var currentTime = new Date().getTime();

  var hour = GetCurrentHour();
  var pm = hour >= 12;
  if (pm) {
    hour -= 12;
  }
  if (hour == 0) {
    hour = 12;
  }

  var hourStart = Math.floor(currentTime / MS_PER_GAME_HOUR) * MS_PER_GAME_HOUR;
  var minute = Math.floor((currentTime - hourStart) / MS_PER_GAME_MINUTE);

  return hour + ":" + minute.toString().padStart(2, "0") + (pm ? "pm" : "am");
}

export function Subscribe(cb, label) {
  callbacks[label] = cb;
  cb(currentMinutes);
}

export function Unsubscribe(label) {
  delete callbacks[label];
}

export function TimeString(minutes) {
  var h = Math.floor(minutes / 60);
  var m = minutes % 60;
  var s = [];
  if (h > 0) {
    s.push(h == 1 ? "1 hour" : h + " hours");
  }
  if (m > 0) {
    s.push(m == 1 ? "1 minute" : m + " minutes");
  }
  return s.join(", ");
}

export function ShortTimeString(minutes) {
  if (minutes == 0) {
    return "Mere moments";
  }
  var h = Math.floor(minutes / 60);
  var m = minutes % 60;
  var s = [];
  if (h > 0) {
    s.push(h + "h");
  }
  if (m > 0) {
    s.push(m + "m");
  }
  return s.join(" ");
}

export function RealTimeString(minutes) {
  var seconds = minutes * 5;
  var h = Math.floor(seconds / (60 * 60));
  seconds -= h * (60 * 60);
  var m = Math.floor(seconds / 60);
  seconds -= m * 60;
  var s = seconds;
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function updateTime() {
  var currentTime = new Date().getTime();
  var realTimePassed = currentTime - timingPlayerData.lastTime;
  var newGameMinutes = Math.floor(realTimePassed / MS_PER_GAME_MINUTE);
  var minutes = timingPlayerData.minutes + newGameMinutes;
  minutes = Math.min(minutes, MAX_MINUTES);
  currentMinutes = minutes;
  for (var i in callbacks) {
    callbacks[i](minutes);
  }
}

export function Sync(player) {
  if (currentTimingFunction != null) {
    clearInterval(currentTimingFunction);
  }
  timingPlayerData = player;
  currentTimingFunction = setInterval(updateTime, 5000);
  updateTime();
}
