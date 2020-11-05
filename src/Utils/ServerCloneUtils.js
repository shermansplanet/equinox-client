export function canTakeAction(player, action) {
  if (action.costs !== undefined) {
    for (var costItem in action.costs) {
      var req = action.costs[costItem];
      var count = player.inventory[costItem] || 0;
      if (count < req) {
        return false;
      }
    }
  }

  if (action.requirements !== undefined) {
    for (costItem in action.requirements) {
      req = action.requirements[costItem];
      count = player.inventory[costItem] || 0;
      if (count < req.min || (req.max !== undefined && count > req.max)) {
        return false;
      }
    }
  }
  return true;
}
