---
name: cardservice-switch-offstate
description: CardService Switch widget does not submit a value when OFF — using || "true" fallback in onChange/save handlers makes the switch impossible to turn off
metadata:
  type: feedback
---

In CardService, a `Switch` widget only submits its `.setValue()` value (e.g., `"true"`) when it is ON. When the switch is OFF, the field is absent from `commonEventObject.formInputs`, so `formVal_(e, fieldName)` returns `""`.

Using `formVal_(e, "POST_DATE_PERMALINK") || "true"` in an onChange handler or Save handler means: when the switch is OFF, `"" || "true"` evaluates to `"true"`, so the card always rebuilds / saves with the switch ON. The user can never turn the switch off.

**Why:** This is a silent footgun — the switch renders, the user clicks it, and nothing changes. No error is thrown.

**How to apply:** In any CardService handler that receives a switch field value and rebuilds a card or saves state, use:
```js
formVal_(e, "SWITCH_FIELD") === "true" ? "true" : "false"
```
NOT `formVal_(e, "SWITCH_FIELD") || "true"`.

The `|| "true"` fallback is only appropriate in a context where the switch widget has NOT yet been rendered (e.g., `onContentTypeChange` switching TO a type that contains the switch for the first time), where "on by default" is the intended starting state.
