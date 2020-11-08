import app from "firebase/app";
import "firebase/firestore";

var gameDataCache = {};

export async function GetPlace(player, document) {
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
  document = document.split("&")[0];
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
