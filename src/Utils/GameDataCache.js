import app from "firebase/app";
import "firebase/firestore";
import { CurrentTime, MS_PER_GAME_DAY } from "./TimeUtils";
export const SILVERWORK_PREFIX = "silverworkTrait_";

var gameDataCache = {};

export async function GetPlace(player, document) {
  if (document.startsWith("silverwork_")) {
    return await GetSilverworkLocation(player, document);
  }
  if (document !== "home") {
    return GetDocument("locations", document);
  }
  let baseHome = await GetDocument("locations", "home");
  // COPY vvvv
  baseHome = JSON.parse(JSON.stringify(baseHome));
  let couchSurfing = player.inventory.xFXVQG1y22Ek35fY1UUV;
  if (couchSurfing === 1) {
    baseHome.name = "Mari's Apartment";
    baseHome.text =
      "Your friend Mari has agreed to let you crash with them while you look for a place of your own in Scribblewick.";
    baseHome.actions.push("hUth0r1pi3MPkF2ylOIE"); //Register for classes
  } else if (player.address !== undefined) {
    // Living in house
    baseHome.name = player.address;
  } else {
    // Living on your own
    baseHome.name = player.houseName;
    baseHome.text = player.houseText;
    baseHome.actions.push("D1wNlMJUYDBTF8jE0VE8"); //Start a house
  }
  return baseHome;
}

export async function GetDocument(collection, document) {
  if (document === undefined) {
    return null;
  }
  document = document.split("&")[0].replace(SILVERWORK_PREFIX, "");
  if (gameDataCache[collection] == undefined) {
    gameDataCache[collection] = {};
  }
  if (gameDataCache[collection][document] == undefined) {
    var result = await app
      .firestore()
      .collection(collection)
      .doc(document)
      .get();
    gameDataCache[collection][document] = { ...result.data(), id: result.id };
  }
  return gameDataCache[collection][document];
}

export async function GetDocuments(collection, documentList) {
  if (documentList.length == 0) return {};
  return new Promise(resolve => {
    var collected = 0;
    var target = documentList.length;
    var documentResults = {};

    for (var document of documentList) {
      GetDocument(collection, document).then(doc => {
        documentResults[doc.id] = doc;
        collected++;
        if (collected == target) {
          resolve(documentResults);
        }
      });
    }
  });
}

const silverworkTypeMapping = {
  SsIoPeBfmKqGuCX5TMF3: "Warehouse"
};

async function GetSilverworkLocation(player, actionSet) {
  console.log("TEST");
  let baseWork = await GetDocument("locations", "base_silverwork");
  let work = player.silverworks[parseInt(actionSet.split("_")[1])];
  baseWork.name = work.name;
  let typeName = "";
  for (let n of work.choices) {
    let id = n.split("&")[0];
    if (silverworkTypeMapping[id] !== undefined) {
      typeName = silverworkTypeMapping[id];
    }
  }
  baseWork.text = `Type: ${typeName}, Quality: ${
    work.quality
  }, Capacity: ${GetSilverworkCapacity(work, player)}`;
  return baseWork;
}

export function GetSilverworkCapacity(work, player) {
  let daysSinceCreation =
    (CurrentTime(player.minutes) - work.creationTime) / MS_PER_GAME_DAY;
  return Math.round(50 + Math.pow(daysSinceCreation, 1.5));
}
