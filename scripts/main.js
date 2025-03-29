import PartyMembersAppV2 from "./party-listv2.js";
import CurrencySpenderApp from "./currency-calcv2.js";

let currentCurrencyApp = null;
function toggleCurrencySpender() {
    if (currentCurrencyApp?.rendered) {
        currentCurrencyApp.close();
    } else {
        currentCurrencyApp = new CurrencySpenderApp();
        currentCurrencyApp.render(true);
    }
}

let currentPartyApp = null;
function togglePartyList() {
    if (currentPartyApp?.rendered) {
        currentPartyApp.close();
    } else {
        currentPartyApp = new PartyMembersAppV2();
        currentPartyApp.render(true);
    }
}

const showButtons = () => {
    const CoinSpenderButton = document.createElement("li");
    CoinSpenderButton.id = "currency-spender-button";
    CoinSpenderButton.attributes["data-tool"] = "CurrencySpender";
    CoinSpenderButton.attributes["data-tooltip"] = "Currency Spender";
    CoinSpenderButton.attributes["aria-label"] = "Show Currency Spender";
    CoinSpenderButton.innerHTML = `<i class="fas fa-coins"></i>`;
    CoinSpenderButton.onclick = () => toggleCurrencySpender();

    const PartyListButton = document.createElement("li");
    PartyListButton.id = "party-list-button";
    PartyListButton.attributes["data-tool"] = "PartyList";
    PartyListButton.attributes["data-tooltip"] = "Party List";
    PartyListButton.attributes["aria-label"] = "Show Party List";
    PartyListButton.innerHTML = `<i class="fas fa-users"></i>`;
    PartyListButton.onclick = () => togglePartyList();

    const controls = document.getElementById("tools-panel-token");
    controls.appendChild(CoinSpenderButton);
    controls.appendChild(PartyListButton);

}

Hooks.on("init", () => {
    console.log("Initializing BowenArrow's Utils");
});
Hooks.on("ready", () => {
    console.log("BowenArrow's Utils Ready!");
    showButtons();
});
Hooks.on("renderSceneControls", () => showButtons());