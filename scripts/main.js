import PartyMembersAppV2 from "./party-listv2.js";
import CurrencySpenderApp from "./currency-calcv2.js";

let currentCurrencyApp = null;
let currentPartyApp = null;

function toggleApp(app, appType) {
    if (app?.rendered) {
        app.close();
    } else {
        app = new appType();
        app.render(true);
    }
}

const showButtons = () => {
    const buttons = [
    {
        id: 'currency-spender-button',
        dataTooltip: 'Currency Spender',
        icon: 'fa-coins',
        onclick: () => toggleApp(currentCurrencyApp, CurrencySpenderApp)
    },
    {
        id: 'party-list-button',
        dataTooltip: 'Party List',
        icon: 'fa-users',
        onclick: () => toggleApp(currentPartyApp, PartyMembersAppV2)
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