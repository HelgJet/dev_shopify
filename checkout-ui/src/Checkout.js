// import {
//   extension,
//   Banner,
//   BlockStack,
//   Checkbox,
//   Link,
//   Text,
// } from "@shopify/ui-extensions/checkout";

// // 1. Choose an extension target
// export default extension("purchase.checkout.block.render", (root, api,  { lines, applyCartLinesChange, query, i18n }) => {
//   // 2. Check instructions for feature availability, see https://shopify.dev/docs/api/checkout-ui-extensions/apis/cart-instructions for details
//   api.instructions.subscribe((instructions) => {
//     if (!instructions.attributes.canUpdateAttributes) {
//       // For checkouts such as draft order invoices, cart attributes may not be allowed
//       // Consider rendering a fallback UI or nothing at all, if the feature is unavailable
//       root.replaceChildren(
//         root.createComponent(
//           Banner,
//           { title: "checkout-ui", status: "warning" },
//           api.i18n.translate("attributeChangesAreNotSupported"),
//         ),
//       );
//     } else {
//       // 3. Render a UI

//       root.replaceChildren(
//         root.createComponent(
//           BlockStack,
//           { border: "dotted", padding: "tight" },
//           [
//             root.createComponent(
//               Banner,
//               { title: "checkout-ui" },
//               api.i18n.translate("welcome", {
//                 target: root.createComponent(
//                   Text,
//                   { emphasis: "italic" },
//                   api.extension.target,
//                 ),
//               }),
//             ),
//             root.createComponent(
//               Checkbox,
//               {
//                 onChange: onCheckboxChange,
//               },
//               api.i18n.translate("iWouldLikeAFreeGiftWithMyOrder"),
//             ),
//             root.createComponent(
//               Checkbox,
//               {
//                 id: "checkbox1",
//                 name: "checkboxchoices",
//               },
//               [
//                 " I agree to the ",
//                 root.createComponent(
//                   Link,
//                   { to: "https://www.shopify.com" },
//                   "terms and conditions",
//                 ),
//                 " and ",
//                 root.createComponent(
//                   Link,
//                   { to: "https://www.shopify.com" },
//                   "privacy policy",
//                 ),
//                 " of the store related to pricing, payment, shipping, returns, and liability set forth by Ride Sports.",
//               ],
//             ),
//           ],
//         ),
//       );
//     }

//     async function onCheckboxChange(isChecked) {
//       // 4. Call the API to modify checkout
//       const result = await api.applyAttributeChange({
//         key: "requestedFreeGift",
//         type: "updateAttribute",
//         value: isChecked ? "yes" : "no",
//       });
//       console.log("applyAttributeChange result", result);
//     }
//   });
// });
import {
  extension,
  Text,
  InlineLayout,
  BlockStack,
  Divider,
  Image,
  Banner,
  Heading,
  Button,
  SkeletonImage,
  SkeletonText,
} from "@shopify/ui-extensions/checkout";

// Set up the entry point for the extension
export default extension(
  "purchase.checkout.block.render",
  (root, { lines, applyCartLinesChange, query, i18n }) => {
    let products = [];
    let loading = true;
    let appRendered = false;

    // Fetch products from the server
    fetchProducts(query).then((fetchedProducts) => {
      products = fetchedProducts;
      loading = false;
      renderApp();
    });

    // Subscribe to changes in the cart lines
    lines.subscribe(() => renderApp());

    // Initial loading state
    const loadingState = createLoadingState(root);
    if (loading) {
      root.append(loadingState);
    }

    const { imageComponent, titleMarkup, priceMarkup, merchandise } =
      createProductComponents(root);
    const addButtonComponent = createAddButtonComponent(
      root,
      applyCartLinesChange,
      merchandise,
    );

    const app = createApp(
      root,
      imageComponent,
      titleMarkup,
      priceMarkup,
      addButtonComponent,
    );

    function renderApp() {
      if (loading) {
        return;
      }

      if (!loading && products.length === 0) {
        root.removeChild(loadingState);
        return;
      }

      const productsOnOffer = filterProductsOnOffer(lines, products);

      if (!loading && productsOnOffer.length === 0) {
        if (loadingState.parentElement) root.removeChild(loadingState);
        if (root.firstChild) root.removeChild(root.firstChild);
        return;
      }

      updateProductComponents(
        productsOnOffer[0],
        imageComponent,
        titleMarkup,
        priceMarkup,
        addButtonComponent,
        merchandise,
        i18n,
      );

      if (!appRendered) {
        root.removeChild(loadingState);
        root.append(app);
        appRendered = true;
      }
    }
  },
);

// Fetch products from the server
function fetchProducts(query) {
  return query(
    `query ($first: Int!) {
        products(first: $first) {
          nodes {
            id
            title
            images(first: 1) {
              nodes {
                url
              }
            }
            variants(first: 1) {
              nodes {
                id
                price {
                  amount
                }
              }
            }
          }
        }
      }`,
    {
      variables: { first: 5 },
    },
  )
    .then(({ data }) => data.products.nodes)
    .catch((err) => {
      console.error(err);
      return [];
    });
}

// Create loading state UI
function createLoadingState(root) {
  return root.createComponent(BlockStack, { spacing: "loose" }, [
    root.createComponent(Divider),
    root.createComponent(Heading, { level: 2 }, ["You might also like"]),
    root.createComponent(BlockStack, { spacing: "loose" }, [
      root.createComponent(
        InlineLayout,
        {
          spacing: "base",
          columns: [64, "fill", "auto"],
          blockAlignment: "center",
        },
        [
          root.createComponent(SkeletonImage, { aspectRatio: 1 }),
          root.createComponent(BlockStack, { spacing: "none" }, [
            root.createComponent(SkeletonText, { inlineSize: "large" }),
            root.createComponent(SkeletonText, { inlineSize: "small" }),
          ]),
          root.createComponent(Button, { kind: "secondary", disabled: true }, [
            root.createText("Add"),
          ]),
        ],
      ),
    ]),
  ]);
}

// Create product components
function createProductComponents(root) {
  const imageComponent = root.createComponent(Image, {
    border: "base",
    borderWidth: "base",
    borderRadius: "loose",
    aspectRatio: 1,
    source: "",
  });
  const titleMarkup = root.createText("");
  const priceMarkup = root.createText("");
  const merchandise = { id: "" };

  return { imageComponent, titleMarkup, priceMarkup, merchandise };
}

// Create add button component
function createAddButtonComponent(root, applyCartLinesChange, merchandise) {
  return root.createComponent(
    Button,
    {
      kind: "secondary",
      loading: false,
      onPress: async () => {
        await handleAddButtonPress(root, applyCartLinesChange, merchandise);
      },
    },
    ["Add"],
  );
}

// Handle add button press
async function handleAddButtonPress(root, applyCartLinesChange, merchandise) {
  const result = await applyCartLinesChange({
    type: "addCartLine",
    merchandiseId: merchandise.id,
    quantity: 1,
  });

  if (result.type === "error") {
    displayErrorBanner(
      root,
      "There was an issue adding this product. Please try again.",
    );
  }
}

// Display error banner
function displayErrorBanner(root, message) {
  const errorComponent = root.createComponent(Banner, { status: "critical" }, [
    message,
  ]);
  const topLevelComponent = root.firstChild;
  topLevelComponent.append(errorComponent);
  setTimeout(() => topLevelComponent.removeChild(errorComponent), 3000);
}

// Create app UI
function createApp(
  root,
  imageComponent,
  titleMarkup,
  priceMarkup,
  addButtonComponent,
) {
  return root.createComponent(BlockStack, { spacing: "loose" }, [
    root.createComponent(Divider),
    root.createComponent(Heading, { level: 2 }, "You might also like"),
    root.createComponent(BlockStack, { spacing: "loose" }, [
      root.createComponent(
        InlineLayout,
        {
          spacing: "base",
          columns: [64, "fill", "auto"],
          blockAlignment: "center",
        },
        [
          imageComponent,
          root.createComponent(BlockStack, { spacing: "none" }, [
            root.createComponent(Text, { size: "medium", emphasis: "strong" }, [
              titleMarkup,
            ]),
            root.createComponent(Text, { appearance: "subdued" }, [
              priceMarkup,
            ]),
          ]),
          addButtonComponent,
        ],
      ),
    ]),
  ]);
}

// Filter products to offer based on cart lines
function filterProductsOnOffer(lines, products) {
  const cartLineProductVariantIds = lines.current.map(
    (item) => item.merchandise.id,
  );
  return products.filter((product) => {
    const isProductVariantInCart = product.variants.nodes.some(({ id }) =>
      cartLineProductVariantIds.includes(id),
    );
    return !isProductVariantInCart;
  });
}

// Update product components with product data
function updateProductComponents(
  product,
  imageComponent,
  titleMarkup,
  priceMarkup,
  addButtonComponent,
  merchandise,
  i18n,
) {
  const { images, title, variants } = product;

  const renderPrice = i18n.formatCurrency(variants.nodes[0].price.amount);

  const imageUrl =
    images.nodes[0]?.url ??
    "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png?format=webp&v=1530129081";

  imageComponent.updateProps({ source: imageUrl });
  titleMarkup.updateText(title);
  addButtonComponent.updateProps({
    accessibilityLabel: `Add ${title} to cart,`,
  });
  priceMarkup.updateText(renderPrice);
  merchandise.id = variants.nodes[0].id;
}
