let isLoading = false;
const currentUrl = window.location.href;
const dataInfinite = document
  .querySelector("#devok-load-more")
  .getAttribute("data-infinite");

const devokLoadMore = async (button) => {
  if (isLoading) return;
  isLoading = true;
  const loadMoreWrapper = document.querySelector("#devok-load-more");
  if (!loadMoreWrapper) return;
  button = loadMoreWrapper.querySelector("#devok-load-button") || button;

  const loadMoreSpinner = loadMoreWrapper.querySelector(".load-more__spinner");
  const paginationList = document.querySelector(".pagination");
  const gridContainer = document.querySelector(".product-grid");

  if (!button) return;

  try {
    if (dataInfinite == "false") {
      button.classList.add("hidden");
    }
    const nextDataUrl = button.getAttribute("data-next-url");
    const nextUrl = new URL(nextDataUrl, currentUrl).href;

    gridContainer.classList.add("loading");
    loadMoreSpinner.classList.remove("hidden");

    const response = await fetch(nextUrl);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.text();
    const parser = new DOMParser();
    const parseFromString = parser.parseFromString.bind(parser); // Bind the context to the parseFromString method
    const newPage = parseFromString(data, "text/html");

    if (newPage) {
      if (dataInfinite == "false") {
        button.classList.remove("hidden");
      }

      const grid = document.querySelector("[data-grid-js]");
      grid.innerHTML += newPage.querySelector("[data-grid-js]").innerHTML;

      activeCompare();
      activeWishlist();

      const loadMore = document.querySelector("#devok-load-more");
      loadMore.replaceWith(newPage.querySelector("#devok-load-more"));

      if (paginationList) {
        paginationList.replaceWith(newPage.querySelector(".pagination"));
      }
    }

    if (dataInfinite === "false") {
      const event = new CustomEvent("devok.paginate.next");
      document.querySelector("#devok-load-more").dispatchEvent(event);
      if (paginationList) {
        document.querySelector(".pagination").dispatchEvent(event);
      }
    }
  } catch (error) {
    console.error("Failed to load more products:", error);
  } finally {
    isLoading = false;
    gridContainer.classList.remove("loading");
    loadMoreSpinner.classList.add("hidden");
    if (dataInfinite == "false") {
      button.classList.remove("hidden");
    }
  }
};

const handleInfiniteScroll = () => {
  const loadTarget = document.querySelector("#devok-load-more");
  if (!loadTarget) return;
  const dataInf = loadTarget.getAttribute("data-infinite");
  if (dataInf !== "true") return;
  const buttonTarget = loadTarget.querySelector("#devok-load-button");
  if (!loadTarget || !buttonTarget) return;
  const scrollOffset = 100;
  const targetScroll = loadTarget.offsetTop;
  const scrollPosition = window.innerHeight + window.pageYOffset;

  if (scrollPosition >= targetScroll - scrollOffset) {
    devokLoadMore(buttonTarget);
  }
};

if (dataInfinite != "false") {
  window.addEventListener("scroll", handleInfiniteScroll);
}

// let intersectionObservers = []; // Declare the array globally

// const devokLoadMore = async (button) => {
//
//   try {
//

//
//     if (newPage) {
//       const grid = document.querySelector("[data-grid-js]");
//       const newItems = newPage.querySelectorAll("product-card");

//       // Lazy load new items
//       observeNewItems(newItems);

//       newItems.forEach((newItem) => {
//         if (!grid.contains(newItem)) {
//           grid.appendChild(newItem);
//         }
//       });

//     }

//   } catch (error) {
//     console.error("Failed to load more products:", error);
//   } finally {
//     isLoading = false;
//     document.documentElement.dispatchEvent(
//       new CustomEvent("theme:loading:end", { bubbles: true })
//     );
//   }
// };

// // Add this function to observe new items lazily
// const observeNewItems = (newItems) => {
//   newItems.forEach((newItem) => {
//     newItem.classList.add("pr-hidden");
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             newItem.classList.remove("pr-hidden"); // Remove the "hidden" class when visible
//             newItem.classList.add("visible");
//           }
//         });
//       },
//       { threshold: 0.5 }
//     );

//     observer.observe(newItem);
//     intersectionObservers.push({ target: newItem, observer });
//   });
// };
