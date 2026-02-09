type StockMovementSnapshot = {
  inventoryItemId: string;
  type: string;
  quantity: number;
};

type StockBatchSnapshot = {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
};

export const sumStockMovements = (movements: StockMovementSnapshot[]) => {
  const totals = new Map<string, number>();

  for (const movement of movements) {
    const current = totals.get(movement.inventoryItemId) || 0;
    let next = current;

    if (movement.type === "IN" || movement.type === "ADJUSTMENT") {
      next = current + movement.quantity;
    }
    if (movement.type === "OUT") {
      next = current - movement.quantity;
    }

    totals.set(movement.inventoryItemId, next);
  }

  return totals;
};

export const averageUnitCost = (batches: StockBatchSnapshot[]) => {
  const totals = new Map<string, { quantity: number; cost: number }>();

  for (const batch of batches) {
    const current = totals.get(batch.inventoryItemId) || { quantity: 0, cost: 0 };

    totals.set(batch.inventoryItemId, {
      quantity: current.quantity + batch.quantity,
      cost: current.cost + batch.unitCost * batch.quantity,
    });
  }

  const averages = new Map<string, number>();
  for (const [itemId, aggregate] of totals) {
    averages.set(
      itemId,
      aggregate.quantity === 0 ? 0 : aggregate.cost / aggregate.quantity
    );
  }

  return averages;
};
