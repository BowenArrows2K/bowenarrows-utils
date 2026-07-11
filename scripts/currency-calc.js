export default class CurrencySpenderApp extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: "currency-spender-app",
    classes: ["sheet", "dnd5e2"],
    tag: "section",
    actions: {},
    position: { width: 400, height: "auto" },
    window: {
      icon: "fas fa-coin",
      title: "Currency Spender",
      popOut: true,
      resizable: true,
      minimizable: true
    },
    form: {
      submitOnChange: false,
      submitOnClose: false,
      closeOnSubmit: false
    }
  };

  constructor() {
    const defaults = CurrencySpenderApp.DEFAULT_OPTIONS;
    
    const dynamicTitle = {
      window: {
        title: `${game.user.isGM ? "GM's Currency" : `${game.user.character?.name ? game.user.character.name+`'s` : game.user.name+`'s`}`} Spender`
      }
    }

    const merged = foundry.utils.mergeObject(defaults, dynamicTitle, { inplace: false });
    super(merged);
  }

  async #getData(actor = game.user.character) {
    if (!actor) return {};
    const conversions = this.getConversions();
    const currencyDefinitions = this.currencyDefinitions();
    const wallet = actor.system?.currency ?? {};
    if (wallet == {}) {
      Object.keys(currencyDefinitions.coinValues).forEach(currency => {
        wallet[currency] = 0;
      })
    }
    const totalGPValue = this.getTotalBaseCoin(wallet, conversions);
    return { wallet, totalGPValue };
  }

  getTotalBaseCoin(wallet, conversions) {
      let totalBaseCoins = 0;

      for (const coin in wallet) {
        if (conversions[coin] !== undefined) {
          totalBaseCoins += wallet[coin] / conversions[coin]
        }
      }

      return totalBaseCoins.toFixed(2);
    }

  getConversions() {
    const conversions = {}
    const systemCurrencies = game.system.config.currencies
    Object.keys(systemCurrencies).forEach(currency => {
      conversions[currency] = systemCurrencies[currency].conversion
    });
    return conversions;
  }

  currencyDefinitions() {
    const conversions = this.getConversions();
    const currencyDefinitions = {};
    const maxVal = Math.max(...Object.values(conversions));
    currencyDefinitions.commonTypes = {};
    currencyDefinitions.coinValues = Object.keys(conversions).reduce((result, key) => {
      result[key] = 1 / (conversions[key] / maxVal);
      switch (conversions[key]) {
        case 1:
          currencyDefinitions.commonTypes.base = key
        case maxVal:
          currencyDefinitions.commonTypes.min = key
      }
      return result;
    }, {});
    currencyDefinitions.commonTypes.max = Object.keys(currencyDefinitions.coinValues).reduce((a, b) => currencyDefinitions.coinValues[a] > currencyDefinitions.coinValues[b] ? a : b);
    currencyDefinitions.coinTypes = Object.keys(currencyDefinitions.coinValues)
    currencyDefinitions.sortedCoins = Object.entries(currencyDefinitions.coinValues).sort((a, b) => a[1] - b[1]);
    currencyDefinitions.conversionList = currencyDefinitions.sortedCoins.reduce((result, [coin], index, array) => {
      if (index < array.length -1) {
        result[coin] = array[index + 1][0];
      }
      return result;
    }, {});
    return currencyDefinitions;
  }

  #calculatePayment(html, amount, currency, source) {
    const currencyDefinitions = this.currencyDefinitions();
    const commonTypes = currencyDefinitions.commonTypes;
    const coinValues = currencyDefinitions.coinValues;
    const coinTypes = currencyDefinitions.coinTypes;
    const conversionList = currencyDefinitions.conversionList;
    const wallet = foundry.utils.deepClone(currency);
    const coinType = html.querySelector("#currency-spender-denom-select option:checked").textContent;
    const coinToGold = html.querySelector("#currency-spender-denom-select").value*amount;
    const totalMinType = Math.round(coinToGold * coinValues[commonTypes.base]);
    const paid = {};
    const change = {};
    const ideal = {};
    const purchaseValue = {};
    const PVformatted = {}
    Object.keys(coinValues).forEach(currency => {
      if (currency !== commonTypes.max) {
        change[currency] = 0;
        PVformatted[currency] = 0;
      }
      paid[currency] = 0;
      purchaseValue[currency] = 0;
    });
    let paidMinType = 0;
    let remaining = totalMinType;
    let pvremaining = totalMinType;

    // purchaseValue distribution
    for (const [type, value] of Object.entries(coinValues).sort((a, b) => b[1] - a[1])) {
      purchaseValue[type] = type === commonTypes.min ? pvremaining : Math.floor(pvremaining / value);
      pvremaining -= purchaseValue[type] * value;
    }

    // Ideal distribution
    for (const [type, value] of Object.entries(coinValues).sort((a, b) => b[1] - a[1])) {
      ideal[type] = Math.min(Math.floor(remaining / value), wallet[type]);
      remaining -= ideal[type] * value;
    }

    const hasExact = remaining === 0;

    if (hasExact) {
      for (let type of coinTypes) {
        paid[type] = ideal[type];
        paidMinType += coinValues[type] * ideal[type];
        wallet[type] -= ideal[type];
      }
    } else {
      const convList = conversionList
      const roundedCost = structuredClone(purchaseValue);
      for (const [type, conv] of Object.entries(convList)) {
        var valueTypes = coinTypes.toReversed();
        if (roundedCost[type] === 0) continue;
        if (roundedCost[type] > wallet[type]) {
          if (type === commonTypes.max) {
            for (let type of valueTypes) {
              paid[type] = wallet[type];
              paidMinType += coinValues[type] * wallet[type];
              wallet[type] -= wallet[type];
            }
            break;
          } else {
            roundedCost[conv] += 1;
            for (let i = 0; i <= valueTypes.indexOf(type); i++) {
              wallet[valueTypes[i]] += paid[valueTypes[i]];
              paid[valueTypes[i]] = 0;
              roundedCost[valueTypes[i]] = 0;
            };
            continue;
          }
        }
        paid[type] = roundedCost[type];
        paidMinType += coinValues[type] * roundedCost[type];
        wallet[type] -= roundedCost[type];
      };

      if (paidMinType < totalMinType) {
        let short = remaining;
        const shortParts = [];
        for (const [type, value] of Object.entries(coinValues).sort((a, b) => b[1] - a[1])) {
          const missing = Math.floor(short / value);
          short -= missing * value;
          if (missing > 0) shortParts.push(`<strong style="color: darkred;">${missing}</strong> ${type}`);
        }

        return {
          success: false,
          short,
          messageHTML: `
            <hr>
            <div style="font-size: 0.95em; line-height: 1.4;">
              <strong style="color: red;">❌ Insufficient funds.</strong><br />
              <strong>Amount Short:</strong> ${shortParts.join(", ")}
            </div>
          `
        };
      }

      // Change
      let extra = paidMinType - totalMinType;
      for (let type of Object.keys(change)) {
        const value = coinValues[type];
        change[type] = Math.floor(extra / value);
        wallet[type] += change[type];
        extra %= value;
      }
    }

    const spentMsg = Object.entries(paid)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");

    const changeMsg = Object.values(change).some(v => v > 0)
      ? Object.entries(change).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k}`).join(", ")
      : "No change returned.";

    for (let type of coinTypes) {
      if (type === commonTypes.max) {
        PVformatted[commonTypes.base] += (purchaseValue[type] * coinValues[type])/coinValues[commonTypes.base] ?? 0;
      } else {
        PVformatted[type] += purchaseValue[type] ?? 0;
      };
    };
    
    const purchaseVal = Object.entries(PVformatted)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");

    const balanceMsg = Object.entries(wallet)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v} ${k}`)
      .join(", ");    
    
    const baseMessage = `
      <hr>
      <div style="font-size: 0.95em; line-height: 1.4;">
        ${(source === "preview")
          ? `${hasExact
            ? `<div><strong style="color: green;">✔ Exact denominations available</strong></div>`
            : `<div><strong style="color: darkorange;">⚠ Using alternate denominations</strong></div>`
          }
          <div><strong>Total:</strong> <span style="color: gold;">${amount.toFixed(2)} ${coinType}</span></div>
          <div><strong>Deducting:</strong> <span style="color: red;">${spentMsg}</span></div>
          <div><strong>Change:</strong> <span style="color: aqua;">${changeMsg}</span></div>
          <div><strong>Purchase Value:</strong> <span style="color: limegreen;">${purchaseVal}</span></div>
          <div><strong>Remaining:</strong> ${balanceMsg}</div>
          <div style="margin-top: 0.5em;"><strong style="color: green;">✔ Sufficient Funds</strong></div>`
          : `<div><strong>Total:</strong> <span style="color: rgb(244 199 56);">${amount.toFixed(2)} ${coinType}</span></div>
          <div><strong>Deducting:</strong> <span style="color: red;">${spentMsg}</span></div>
          ${(changeMsg !== "No change returned.") ?`<div><strong>Change:</strong> <span style="color: blue;">${changeMsg}</span></div>` : ""}
          <div><strong>Purchase Value:</strong> <span style="color: forestgreen;">${purchaseVal}</span></div>
          <div><strong>Remaining:</strong> ${balanceMsg}</div>`
        }
      </div>
    `;

    return {
      success: true,
      paid,
      change,
      wallet,
      paidCopper: paidMinType,
      hasExact,
      messageHTML: baseMessage
    };
  }

  async #handleSpendGold(html) {
    const actor = game.user.character ? game.user.character : game.actors.get(html.querySelector("#currency-spender-character-select")?.value);
    if (!actor) return ui.notifications.warn("You must have a linked character.");

    const amount = parseFloat(html.querySelector("#gold-amount")?.value);
    if (isNaN(amount) || amount <= 0) return ui.notifications.warn("Enter a valid amount.");

    const result = this.#calculatePayment(html, amount, actor.system?.currency ?? { cp: 0, sp: 0, gp: 0, pp: 0 }, "chat");

    if (!result.success) {
      return ui.notifications.error("Insufficient funds.");
    }

    await actor.update({ "system.currency": result.wallet });

    const fullMessage = `
      <div style="font-size: 1em; font-weight: bold;">💰 ${actor.name} spent ${(result.paidCopper / 100).toFixed(2)} gp</div>
      ${result.messageHTML}
    `;

    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: fullMessage
    });

    this.close();
  }

  async #updateCurrencySpender(html, actor) {
    const conversions = this.getConversions();
    const status = html.querySelector("#currency-status");
    const { wallet, totalGPValue } = await this.#getData(actor);
    const tooltip = new Array();
    Object.keys(conversions).forEach((currency) => {
      tooltip.push(wallet[currency] + " " + currency)
    });

    status.innerHTML = `
        <strong>Current Funds:</strong><br />
        ${tooltip.join(", ")}<br />
        <strong>Total GP Value:</strong> ${totalGPValue} gp
    `;
  }

  async #updatePreview(html) {
    const amount = parseFloat(html.querySelector("#gold-amount")?.value);
    const previewDiv = html.querySelector("#deduction-preview");
    if (isNaN(amount) || amount <= 0) return previewDiv.style.display = "none";

    const actor = html.querySelector("#currency-spender-character-select")?.value ? game.actors.get(html.querySelector("#currency-spender-character-select")?.value) : game.user.character;
    const currency = actor?.system.currency ?? { cp: 0, sp: 0, gp: 0, pp: 0 };
    const result = this.#calculatePayment(html, amount, currency, "preview");

    previewDiv.innerHTML = result.messageHTML;
    previewDiv.style.display = "block";
  }

  async _renderHTML() {
    const members = game.actors.filter(actor =>
      game.user.isGM ? actor.hasPlayerOwner : game.user._id in actor.ownership &&
      actor.type === "character" &&
      !actor.name.toLowerCase().includes("spectator") &&
      !actor.name.toLowerCase().includes("map")
    );
    
    const actor = game.user.isGM === true ? members[0] : game.user.character ? game.user.character : members[0];
    const { currency, totalGPValue } = await this.#getData(actor);
    if (!actor) return document.createElement("div");
    
    const charSelect = document.createElement("select");
    const charOptions = members.map(member => `<option value="${member.id}">${member.name}</option>`).join("");
    charSelect.id = "currency-spender-character-select";
    charSelect.style.width = "auto";
    charSelect.innerHTML = charOptions;

    const denomSelect = document.createElement("select");
    // const denomValue = { pp: 10, gp: 1, sp: 0.1, cp: 0.01 };
    const conversions = this.getConversions();
    const denomValue = Object.keys(conversions).reduce((result, key) => {
      result[key] = 1 / conversions[key];
      return result;
    }, {});
    const denomOptions = Object.entries(denomValue).map(([k, v]) => {
      if (v === 1) {
        return `<option value=${v} selected>${k}</option>`;
      } else {
        return `<option value=${v}>${k}</option>`;
      }
    }).join("");    
    denomSelect.id = "currency-spender-denom-select";
    denomSelect.style.width = "75px";
    denomSelect.innerHTML = denomOptions;
    

    const container = document.createElement("div");
    container.id = "currency-spender-container";

    const body = document.createElement("div");
    body.id = "currency-spender-body";
    body.innerHTML = `
      ${(game.user.isGM | !game.user.character?.name) ? charSelect.outerHTML : ""}
      <div class="amount-input">
        <label style="white-space: nowrap;">Amount to Spend:</label>
        <input type="number" id="gold-amount" min="0" step="0.01" />
        ${denomSelect.outerHTML}
      </div>
      <div class="currency-preview" id="currency-status"></div>
      <div class="currency-preview" id="deduction-preview" style="display:none;"></div>
      <button data-action="spendGold">Spend</button>
    `;
    container.appendChild(body);
    
    this.#updateCurrencySpender(container, actor);

    let debounce;
    container.querySelector("#gold-amount").addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this.#updatePreview(container), 150);
    });

    container.querySelector("#currency-spender-denom-select").addEventListener("change", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this.#updatePreview(container), 150);
    });

    if (game.user.isGM | !game.user.character) {
      container.querySelector("#currency-spender-character-select").addEventListener("change", (event) => {
        const selectedValue = event.target.value;
        const actor = game.actors.get(selectedValue);
        this.#updateCurrencySpender(container, actor);
      });
    };

    container.querySelector("button[data-action='spendGold']").addEventListener("click", () => this.#handleSpendGold(container));
    return container;
  }

  async _replaceHTML(inner, outer) {
    outer.innerHTML = "";
    outer.appendChild(inner);
  }
}
