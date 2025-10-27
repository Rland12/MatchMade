// GA4 wrapper that won't throw if gtag isn't ready yet
const send = (name, params = {}) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
};

// Recommended GA4 event shapes
export const analytics = {
  // user clicked a card in the grid (before modal)
  selectItem({ folder, slug, title }) {
    send("select_item", {
      item_list_name: folder || "home",
      items: [{ item_id: slug, item_name: title, item_category: folder || "home" }]
    });
  },

  // modal actually opens (detail view of a pair)
  viewItem({ folder, slug, title }) {
    send("view_item", {
      currency: "USD", // GA4 wants a currency; harmless here
      value: 0,        // not a purchase
      items: [{ item_id: slug, item_name: title, item_category: folder || "home" }]
    });
  },

  // download click (left/right)
  downloadPfp({ folder, slug, title, side, format = "jpg", url }) {
    send("download_pfp", {
      item_id: slug,
      item_name: title,
      item_category: folder || "home",
      side,               // "left" | "right"
      format,             // "jpg","png",...
      link_url: url       // helps in reports/debugging
    });
  }
};
