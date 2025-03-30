import PartyMembersApp from "./party-list.js";
import CurrencySpenderApp from "./currency-calc.js";

let currentCurrencyApp = null;
let currentPartyApp = null;

function toggleApp(app, appType) {
    if (app?.rendered) {
        app.close();
        return null;
    } else {
        app = new appType();
        app.render(true);
        return app;
    }
}

const registerSettings = () => {
    game.settings.register("bowenarrows-utils", "playerCurrencyApp", {
        "name": "Player Currency Spender",
        "hint": "Allow players to use the Currency Spender app",
        "scope": "world",
        "requiresReload": true,
        "config": true,
        "type": Boolean,
        "default": true
    })
    game.settings.register("bowenarrows-utils", "playerPartyApp", {
        "name": "Player Party List",
        "hint": "Allow players to use the Party List app",
        "scope": "world",
        "requiresReload": true,
        "config": true,
        "type": Boolean,
        "default": true
    })
    game.settings.register("bowenarrows-utils", "displayHPValue", {
        "name": "Display HP Value",
        "hint": "Display HP value in the Party Members List for players",
        "scope": "world",
        "config": true,
        "type": Boolean,
        "default": true
    })
}

const showButtons = () => {
    const buttons = [
    {
        id: 'currency-spender-button',
        enabled: game.settings.get("bowenarrows-utils", "playerCurrencyApp"),
        dataTooltip: 'Currency Spender',
        icon: 'fa-coins',
        onclick: () => currentCurrencyApp = toggleApp(currentCurrencyApp, CurrencySpenderApp)
    },
    {
        id: 'party-list-button',
        enabled: game.settings.get("bowenarrows-utils", "playerPartyApp"),
        dataTooltip: 'Party List',
        icon: 'fa-users',
        onclick: () => currentPartyApp =toggleApp(currentPartyApp, PartyMembersApp)
    }
    ];
    for (const button of buttons) {
    if (document.getElementById(button.id)) continue;
    if (!button.enabled && !game.user.isGM) continue;
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

    registerSettings();
});
Hooks.on("ready", () => {
    console.log("BowenArrow's Utils Ready!");
    showButtons();
});
Hooks.on("renderSceneControls", () => showButtons());