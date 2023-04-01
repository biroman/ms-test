async function checkPlayerOnlineStatus(playerName, playerNameElement, trElement) {
  const profileUrl = `https://mafiaspillet.no/game.php?p=profil&bruker=${playerName}`;
  const response = await fetch(profileUrl);
  const htmlText = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  const onlineStatusElement1 = doc.querySelector("#page-id > div:nth-child(2) > div:nth-child(12) > div > div > font");
  const onlineStatusElement2 = doc.querySelector("#page-id > div:nth-child(2) > div:nth-child(11) > div > div > font");

  let onlineStatus = "Avlogget";
  if ((onlineStatusElement1 && onlineStatusElement1.textContent.includes("Pålogget")) || (onlineStatusElement2 && onlineStatusElement2.textContent.includes("Pålogget"))) {
    onlineStatus = "Pålogget";
    playerNameElement.style.color = "#00840f";
  } else if ((onlineStatusElement1 && onlineStatusElement1.textContent.includes("Borte")) || (onlineStatusElement2 && onlineStatusElement2.textContent.includes("Borte"))) {
    onlineStatus = "Borte";
    playerNameElement.style.color = "#507250";
  } else {
    playerNameElement.style.color = "#a0a0a070";
  }
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

async function checkPlayerOnlineStatusWithDelay(playerName, playerNameElement, trElement, delay) {
  setTimeout(async () => {
    await checkPlayerOnlineStatus(playerName, playerNameElement, trElement);
  }, delay);
}

function checkTableForChanges() {
  const trElements = Array.from(document.querySelectorAll("tr")).filter((tr) => tr.textContent.includes("eid av"));
  let cumulativeDelay = 0;

  for (const trElement of trElements) {
    const playerNameElement = trElement.querySelector("b:nth-child(1)");
    const cityElement = trElement.querySelector("b:nth-child(2)");
    if (playerNameElement && cityElement) {
      const playerName = playerNameElement.textContent;
      const targetCity = cityElement.textContent;

      // Check if the player's city has changed from the one in local storage
      const storedCity = localStorage.getItem(playerName);
      if (storedCity !== targetCity) {
        console.log("Sending message:", { type: "showNotification", playerName, targetCity });
        chrome.runtime.sendMessage({
          type: "showNotification",
          playerName: playerName,
          targetCity: targetCity,
        });

        // Update the city in the local storage
        localStorage.setItem(playerName, targetCity);
      }

      // Automatically check the player's online status (only if not checked before)
      if (!trElement.dataset.statusChecked) {
        cumulativeDelay += randomDelay(300, 1200); // Random delay between 1 and 5 seconds, accumulated for each player
        checkPlayerOnlineStatusWithDelay(playerName, playerNameElement, trElement, cumulativeDelay);
        trElement.dataset.statusChecked = "true";
      }
    }
  }
}

function observeTableText() {
  // Store the player's name and city in the local storage
  checkTableForChanges();

  // Check the table for changes every 5 seconds
  setInterval(checkTableForChanges, 5000);
}

observeTableText();
