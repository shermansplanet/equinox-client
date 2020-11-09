function GetTotalItemCount(player, action, id) {
  let total = 0;
  for (let i of action.matchingIds[id]) {
    total += player.inventoryTotals[i] || 0;
  }
  return total;
}

export function canTakeAction(player, action) {
  if (action.costs !== undefined) {
    for (let costItem in action.costs) {
      let req = action.costs[costItem];
      let count = GetTotalItemCount(player, action, costItem);
      if (count < req) {
        return false;
      }
    }
  }

  if (action.requirements !== undefined) {
    for (let costItem in action.requirements) {
      let req = action.requirements[costItem];
      let count = GetTotalItemCount(player, action, costItem);
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
