export function canTakeAction(player, action) {
  if (action.costs !== undefined) {
    for (let costItem in action.costs) {
      let req = action.costs[costItem];
      let count = player.inventoryTotals[costItem] || 0;
      if (count < req) {
        return false;
      }
    }
  }

  if (action.requirements !== undefined) {
    for (costItem in action.requirements) {
      req = action.requirements[costItem];
      count = player.inventoryTotals[costItem] || 0;
      if (count < req.min || (req.max !== undefined && count > req.max)) {
        return false;
      }
    }
  }
  return true;
}

export function GetTraits(raw) {
  let item = {};
  let parts = raw.split("&");
  item.id = parts[0];
  for (let i = 1; i < parts.length; i++) {
    let keyval = parts[i].split("=");
    if (keyval[1] === "undefined") {
      continue;
    }
    item[keyval[0]] = keyval[1];
  }
  return item;
}

export function FromTraits(traits) {
  let bits = [];
  for (let t in traits) {
    if (t !== "id") {
      if (traits[t] === undefined) {
        continue;
      }
      bits.push(t + "=" + traits[t]);
    }
  }
  bits.sort();
  return [traits.id, ...bits].join("&");
}

export function condenseItems(items) {
  let condensedInventory = {};
  for (let id in items) {
    let traits = GetTraits(id);
    if (traits.infusion === "none") {
      delete traits.infusion;
    }
    delete traits.destinySpecific;
    let count = items[id];
    let newId = FromTraits(traits);
    condensedInventory[newId] = (condensedInventory[newId] || 0) + count;
  }
  return condensedInventory;
}
