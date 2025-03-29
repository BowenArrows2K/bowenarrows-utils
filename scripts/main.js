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
    const buttons = [
    {
        id: 'currency-spender-button',
        dataTooltip: 'Currency Spender',
        icon: 'fa-coins',
        onclick: () => toggleCurrencySpender()
    },
    {
        id: 'party-list-button',
        dataTooltip: 'Party List',
        icon: 'fa-users',
        onclick: () => togglePartyList()
    }
    ];
    for (const button of buttons) {
    const li = document.createElement('li');
    li.id = button.id;
    li.setAttribute('data-tooltip', button.dataTooltip);
    li.setAttribute('aria-label', `Show ${button.dataTooltip}`);
    li.setAttribute('data-tool', button.dataTooltip.replace(' ', ''));
    li.innerHTML = `<i class="fas ${button.icon}"></i>`;
    li.onclick = button.onclick;
    const controls = document.getElementById("tools-panel-token");
    controls.appendChild(li);
    }
}

Hooks.on("init", () => {
    console.log("Initializing BowenArrow's Utils");
});
Hooks.on("ready", () => {
    console.log("BowenArrow's Utils Ready!");
    showButtons();
});
Hooks.on("renderSceneControls", () => showButtons());