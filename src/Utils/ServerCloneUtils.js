function GetTotalItemCount(player, action, id, traitMatch, cap = 0) {
  let total = 0;
  for (let i of action.matchingIds[id]) {
    if ((player.inventoryTotals[i] || 0) === 0) {
      continue;
    }
    if (traitMatch.length === 0) {
      total += player.inventoryTotals[i];
    } else {
      for (let itemId of player.itemsByType[i] || []) {
        let traits = GetTraits(itemId);
        if (
          traits.location !== undefined &&
          traits.location !== player.location
        ) {
          continue;
        }
        let matchesTraits = true;
        for (let traitReq of traitMatch) {
          if (traitReq.comparer === "=") {
            if (traitReq.value === "none") {
              matchesTraits =
                matchesTraits && traits[traitReq.trait] === undefined;
            } else if (traitReq.value === "any") {
              matchesTraits =
                matchesTraits && traits[traitReq.trait] !== undefined;
            } else {
              matchesTraits =
                matchesTraits &&
                parseFloat(traits[traitReq.trait]) ===
                  parseFloat(traitReq.value);
            }
          } else if (traitReq.comparer === "<") {
            matchesTraits =
              matchesTraits &&
              parseFloat(traits[traitReq.trait]) < parseFloat(traitReq.value);
          } else if (traitReq.comparer === ">") {
            matchesTraits =
              matchesTraits &&
              parseFloat(traits[traitReq.trait]) > parseFloat(traitReq.value);
          }
          if (!matchesTraits) {
            break;
          }
        }
        if (matchesTraits) {
          total += player.inventory[itemId] || 0;
          if (cap > 0 && total >= cap) {
            return total;
          }
        }
      }
    }
  }
  return total;
}

export function getItemsByType(items) {
  let condensedInventory = {};
  for (let id in items) {
    let newId = id.split("&")[0];
    condensedInventory[newId] = condensedInventory[newId] || [];
    condensedInventory[newId].push(id);
  }
  return condensedInventory;
}

export function canTakeAction(player, action) {
  player.itemsByType = getItemsByType(player.inventory);

  if (action.costs !== undefined) {
    for (let costItem in action.costs) {
      let req = action.costs[costItem];
      let count = GetTotalItemCount(player, action, costItem, []);
      if (count < req) {
        return false;
      }
    }
  }

  if (action.requirements !== undefined) {
    for (let costItem in action.requirements) {
      let req = action.requirements[costItem];
      let count = GetTotalItemCount(
        player,
        action,
        costItem,
        req.traitMatch || []
      );
      let fail = count < req.min || (req.max !== undefined && count > req.max);
      if (req.invert) {
        fail = !fail;
      }
      if (fail) {
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
    let val = JSON.parse(keyval[1]);
    if (!isNaN(val)) {
      val = parseFloat(val);
    }
    item[keyval[0]] = val;
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
      bits.push(t + "=" + JSON.stringify(traits[t]));
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

export function getValue(id, items, first = true) {
  let coeff = 1;
  if (id.includes("$")) {
    let bits = id.split("$");
    id = bits[1];
    coeff = getValue(bits[0], items, false);
  }
  var item = items[id];
  if (item === undefined) {
    return 0;
  }
  let val = coeff * (item.derivedValue || item.value || 0);
  if (first) {
    val = Math.floor(val);
  }
  return val;
}
