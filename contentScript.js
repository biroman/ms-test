function createShadowRoot() {
  const host = document.createElement("div");
  host.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;";
  document.body.appendChild(host);
  return host.attachShadow({ mode: "closed" });
}

function showModal() {
  const shadowRoot = createShadowRoot();

  const modal = document.createElement("div");
  const modalContent = document.createElement("div");
  const text = document.createElement("p");
  const yesButton = document.createElement("button");
  const noButton = document.createElement("button");

  modal.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center;";

  modalContent.style.cssText = "background-color: #1a222c; padding: 20px; border-radius: 12px; backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;";

  text.innerText = "Aktivere discord meldinger?";
  text.style.cssText = "font-size: 16px; font-weight: bold; margin-bottom: 10px; color: white;";

  yesButton.innerText = "Ja";
  yesButton.style.cssText = "background-color: #4b4b4b; color: white; padding: 8px 16px; font-size: 14px; border-radius: 6px; margin: 5px; cursor: pointer; border: none; transition: background-color 0.3s, transform 0.1s;";
  yesButton.addEventListener("mouseover", () => (yesButton.style.backgroundColor = "#6b6b6b"));
  yesButton.addEventListener("mouseout", () => (yesButton.style.backgroundColor = "#4b4b4b"));
  yesButton.addEventListener("mousedown", () => (yesButton.style.transform = "scale(0.95)"));
  yesButton.addEventListener("mouseup", () => (yesButton.style.transform = "scale(1)"));

  noButton.innerText = "Nei";
  noButton.style.cssText = "background-color: #4b4b4b; color: white; padding: 8px 16px; font-size: 14px; border-radius: 6px; margin: 5px; cursor: pointer; border: none; transition: background-color 0.3s, transform 0.1s;";
  noButton.addEventListener("mouseover", () => (noButton.style.backgroundColor = "#6b6b6b"));
  noButton.addEventListener("mouseout", () => (noButton.style.backgroundColor = "#4b4b4b"));
  noButton.addEventListener("mousedown", () => (noButton.style.transform = "scale(0.95)"));
  noButton.addEventListener("mouseup", () => (noButton.style.transform = "scale(1)"));

  yesButton.addEventListener("click", () => {
    runExtension();
    document.body.removeChild(shadowRoot.host);
  });

  noButton.addEventListener("click", () => {
    console.log("Discord meldinger blir ikke sendt");
    document.body.removeChild(shadowRoot.host);
  });

  modalContent.appendChild(text);
  modalContent.appendChild(yesButton);
  modalContent.appendChild(noButton);
  modal.appendChild(modalContent);
  shadowRoot.appendChild(modal);
}

function runExtension() {
  //autentikasjon med github

  const WEBHOOK_URL = "https://discord.com/api/webhooks/1084465696966189096/cUQaEvsTLu2rkxCUr2Td9BvtQlM7RdD-hh6YBs9Bap6grwJN2bIgj6r2NK-nVmiQge0C";
  const WHITELIST_URL = "https://raw.githubusercontent.com/biroman/discord/main/dsc.txt";

  const playerName = document.querySelector("#game-container > header > div > div.header-info-column.header-info-column1 > p.header-item.header-item-username > a > span").innerText;

  const cities = ["Detroit", "Las Vegas", "New York", "Rio de Janeiro", "London", "Oslo", "Kabul", "Kuala Lumpur", "Mogadishu"];

  function sendDiscordMessage(message) {
    fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: message,
        avatar_url: "https://i.imgur.com/mtakKYX.png",
      }),
    });
  }

  const targetNode = document.querySelector("#varsler_boks > div.boks_body");
  let pageJustLoaded = false;
  const maxMessageAge = 24 * 60 * 60 * 1000;
  const observer = new MutationObserver(function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0 && mutation.target.matches("#notifications_table")) {
        if (pageJustLoaded) {
          pageJustLoaded = false;
          return;
        }

        mutation.addedNodes.forEach((notificationElement) => {
          const nameElement = notificationElement.querySelector("p > a");
          const textElement = notificationElement.querySelector("p");
          const timestampElement = notificationElement.querySelector("p > i");
          if (nameElement && textElement && timestampElement) {
            const name = nameElement.innerText;
            const text = textElement.innerText.replace("...", "").trim();
            const city = cities.find((city) => text.includes(city));
            const timestampText = timestampElement.innerText;
            const timestamp = Date.parse(timestampText);

            // Assign a unique timestamp with milliseconds to the notification
            const uniqueTimestamp = Date.now();

            if (city && text.includes("drepe")) {
              let message;
              const currentCityElem = document.querySelector("#city_menu_header > a > span");
              if (currentCityElem && currentCityElem.innerText === city) {
                message = `**${name}** skyter på ${playerName} i **${city}** *${timestampText}*`;
              } else {
                message = `**${name}** skyter på ${playerName} i **${city}** *${timestampText} - FEIL BY*`;
              }

              let sentMessagesJSON = localStorage.getItem("sentMessages");
              let sentMessages;

              if (!sentMessagesJSON) {
                sentMessages = [];
                localStorage.setItem("sentMessages", JSON.stringify(sentMessages));
              } else {
                sentMessages = JSON.parse(sentMessagesJSON);
              }

              const currentTime = Date.now();
              sentMessages = sentMessages.filter((sentMessage) => currentTime - sentMessage.timestamp < maxMessageAge);

              // Check if a message with the same content and uniqueTimestamp is already sent
              if (!sentMessages.some((sentMessage) => sentMessage.message === message && sentMessage.uniqueTimestamp === uniqueTimestamp)) {
                sendDiscordMessage(message);
                sentMessages.push({ message: message, timestamp: timestamp, uniqueTimestamp: uniqueTimestamp });
                localStorage.setItem("sentMessages", JSON.stringify(sentMessages));

                // Log the notification with the timestamp
                console.log(`Notification: ${message} | Timestamp: ${timestamp} | Unique Timestamp: ${uniqueTimestamp}`);
              }
            }
          }
        });
      }
    }
  });

  const checkInterval = 500; // Check for new notifications every 10 seconds
  let lastNotificationTimestamp = Date.now();

  setInterval(() => {
    const currentTime = Date.now();
    const notificationElements = document.querySelectorAll("#notifications_table > *");
    notificationElements.forEach((notificationElement) => {
      const timestampElement = notificationElement.querySelector("p > i");
      if (timestampElement) {
        const timestampText = timestampElement.innerText;
        const timestamp = Date.parse(timestampText);
        if (timestamp > lastNotificationTimestamp && currentTime - timestamp < maxMessageAge) {
          const nameElement = notificationElement.querySelector("p > a");
          const textElement = notificationElement.querySelector("p");
          if (nameElement && textElement) {
            const name = nameElement.innerText;
            const text = textElement.innerText.replace("...", "").trim();
            const city = cities.find((city) => text.includes(city));
            if (city && text.includes("drepe")) {
              let message;
              const currentCityElem = document.querySelector("#city_menu_header > a > span");
              if (currentCityElem && currentCityElem.innerText === city) {
                message = `**${name}** skyter på ${playerName} i **${city}** *${timestampText}*`;
              } else {
                message = `**${name}** skyter på ${playerName} i **${city}** *${timestampText} - FEIL BY*`;
              }

              let sentMessagesJSON = localStorage.getItem("sentMessages");
              let sentMessages;

              if (!sentMessagesJSON) {
                sentMessages = [];
                localStorage.setItem("sentMessages", JSON.stringify(sentMessages));
              } else {
                sentMessages = JSON.parse(sentMessagesJSON);
              }

              sentMessages = sentMessages.filter((sentMessage) => currentTime - sentMessage.timestamp < maxMessageAge);

              if (!sentMessages.some((sentMessage) => sentMessage.message === message)) {
                sendDiscordMessage(message);
                sentMessages.push({ message: message, timestamp: currentTime });
                localStorage.setItem("sentMessages", JSON.stringify(sentMessages));
              }
            }
          }
        }
      }
    });
    lastNotificationTimestamp = currentTime;
  }, checkInterval);

  fetch(WHITELIST_URL + "?_=" + Date.now())
    .then((response) => response.text())
    .then((text) => {
      const authorizedUsers = text.split(/\r?\n/);

      if (authorizedUsers.includes(playerName)) {
        observer.observe(targetNode, { childList: true, subtree: true });
        console.log("Du vil nå dele drapforsøk med Discord!");
      } else {
        alert("Du er ikke godkjent til å bruke denne ;)");
      }
    });
}

showModal();
