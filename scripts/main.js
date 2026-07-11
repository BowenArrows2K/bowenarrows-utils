import PartyMembersApp from "./party-list.js";
import CurrencySpenderApp from "./currency-calc.js";

let spenderInstance = null;
let partyListInstance = null;

/**
 * Registers settings for the BowenArrows-Utils module.
 * @function
 */
const registerSettings = () => {
    game.settings.register("bowenarrows-utils", "playerCurrencyApp", {
        name: "Player Currency Spender",
        hint: "Allow players to use the Currency Spender app",
        scope: "world",
        requiresReload: true,
        config: true,
        type: Boolean,
        default: true
    })
    game.settings.register("bowenarrows-utils", "playerPartyApp", {
        name: "Player Party List",
        hint: "Allow players to use the Party List app",
        scope: "world",
        requiresReload: true,
        config: true,
        type: Boolean,
        default: true
    })
    game.settings.register("bowenarrows-utils", "displayHPValue", {
        name: "Display HP Value",
        hint: "Display HP value in the Party Members List for players",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    })
}

const appAPI = {
    Open(app, appType){
        if (!app) {
            app = new appType()
        }
        app.render(true)
        return app
    }
}

Hooks.on("init", () => {
    console.log("Initializing BowenArrow's Utils");

    registerSettings();
});
Hooks.on("ready", () => {
    console.log("BowenArrow's Utils Ready!");
});
Hooks.on("getSceneControlButtons", (controls) => {
    const tokenControl = controls.tokens
    if (tokenControl) {
        tokenControl.tools.spender = {
            name: "spender",
            title: "Currency Spender",
            icon: "fa-solid fa-coin",
            button: true,
            onChange: () => appAPI.Open(spenderInstance, CurrencySpenderApp)
        };
        tokenControl.tools.partylist = {
            name: "partylist",
            title: "Party List",
            icon: "fa-solid fa-users",
            button: true,
            onChange: () => appAPI.Open(partyListInstance, PartyMembersApp)
        }
    }
});