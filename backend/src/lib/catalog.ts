export const getProductCategory = (sku?: string | null) => {
  if (!sku) return "General";

  const prefix = sku.split("-")[0]?.toUpperCase();
  switch (prefix) {
    case "BEER":
      return "Beer";
    case "MALT":
      return "Malt";
    case "SOFT":
      return "Soft Drink";
    case "COCKTAIL":
      return "Cocktail";
    default:
      return "General";
  }
};
