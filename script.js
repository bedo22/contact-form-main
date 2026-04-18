/**
 * =============================================================
 * CONTACT FORM — Accessible Validation & Toast
 * =============================================================
 *
 * WHAT: Client-side form validation with accessible error handling
 * WHY:  We use custom validation (novalidate on the form) instead of
 *       browser-native validation because:
 *       1. Native popups can't be styled to match the design
 *       2. Native popups disappear quickly — bad for screen readers
 *       3. We need persistent, linked error messages (aria-describedby)
 *       4. We want consistent behavior across all browsers
 *
 * ACCESSIBILITY STRATEGY:
 * - Each error message is linked to its input via aria-describedby
 * - aria-invalid="true" is set on invalid inputs
 * - A hidden live region announces error summaries on failed submit
 * - The success toast uses role="status" for automatic announcement
 * - Focus moves to the first invalid field on failed submit
 */

// =============================================================
// 1. DOM ELEMENT REFERENCES
// =============================================================
// WHAT: Cache all DOM elements we'll interact with
// WHY:  Avoids repeated DOM queries (performance) and keeps
//       all selectors in one place (maintainability).

const form = document.getElementById("contact-form");
const announcer = document.getElementById("sr-announcer");
const toast = document.getElementById("success-toast");

// WHAT: Individual form control references
// WHY:  We need direct references for validation logic and
//       setting aria attributes on each specific input.
const fields = {
  firstName: {
    input: document.getElementById("first-name"),
    error: document.getElementById("first-name-error"),
    message: "This field is required",
  },
  lastName: {
    input: document.getElementById("last-name"),
    error: document.getElementById("last-name-error"),
    message: "This field is required",
  },
  email: {
    input: document.getElementById("email"),
    error: document.getElementById("email-error"),
    // WHY: Email has two possible messages — empty vs. wrong format
    messageRequired: "This field is required",
    messageInvalid: "Please enter a valid email address",
  },
  message: {
    input: document.getElementById("message"),
    error: document.getElementById("message-error"),
    message: "This field is required",
  },
  consent: {
    input: document.getElementById("consent"),
    error: document.getElementById("consent-error"),
    message: "To submit this form, please consent to being contacted",
  },
};

// WHAT: Radio button group — requires special handling
// WHY:  Radio groups validate as a unit (one must be selected),
//       not as individual inputs. Both inputs need aria-describedby
//       when the group is invalid.
const queryType = {
  inputs: [
    document.getElementById("query-general"),
    document.getElementById("query-support"),
  ],
  error: document.getElementById("query-type-error"),
  message: "Please select a query type",
};

// =============================================================
// 2. ERROR DISPLAY HELPERS
// =============================================================

/**
 * WHAT: Shows an error message for a single input
 * WHY:  This function handles THREE things in sync:
 *       1. Visual: reveals the error text and makes it visible
 *       2. Semantic: sets aria-invalid="true" so screen readers
 *          know the field is invalid
 *       3. Linkage: adds aria-describedby pointing to the error
 *          element so screen readers read the error message
 *          when the input is focused
 *
 * @param {HTMLElement} input - The form control (input/textarea)
 * @param {HTMLElement} errorEl - The <p> element for the error text
 * @param {string} message - The error message to display
 */
function showError(input, errorEl, message) {
  // WHAT: Set the error text content
  errorEl.textContent = message;

  // WHAT: Remove the hidden attribute to make it visible
  // WHY:  "hidden" is both a visual (display:none) and semantic attribute —
  //       removing it makes the error visible AND part of the accessibility tree
  errorEl.removeAttribute("hidden");

  // WHAT: Mark the input as invalid for assistive technology
  // WHY:  Screen readers announce "invalid" when this attribute is present.
  //       Our CSS also uses this attribute to show the red border:
  //       .field__input[aria-invalid="true"] { border-color: red }
  input.setAttribute("aria-invalid", "true");

  // WHAT: Link the input to its error message
  // WHY:  When a screen reader user focuses this input, the reader will
  //       announce the input label + "invalid" + the error message text.
  //       Without aria-describedby, the user wouldn't know WHY it's invalid.
  input.setAttribute("aria-describedby", errorEl.id);
}

/**
 * WHAT: Clears the error state for a single input
 * WHY:  Removes all three accessibility markers (visual, semantic, linkage)
 *       so the field returns to its normal valid state.
 *       Called when a field becomes valid (on input/change events).
 *
 * @param {HTMLElement} input - The form control
 * @param {HTMLElement} errorEl - The <p> element for the error text
 */
function clearError(input, errorEl) {
  errorEl.textContent = "";
  errorEl.setAttribute("hidden", "");
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
}

/**
 * WHAT: Shows an error for the radio button group
 * WHY:  Radio groups are special — both inputs share one error message.
 *       We need to set aria-invalid and aria-describedby on ALL radios
 *       in the group so the error is announced regardless of which
 *       radio button the user focuses.
 *
 * @param {HTMLElement[]} inputs - Array of radio input elements
 * @param {HTMLElement} errorEl - The shared error <p> element
 * @param {string} message - The error message
 */
function showGroupError(inputs, errorEl, message) {
  errorEl.textContent = message;
  errorEl.removeAttribute("hidden");
  inputs.forEach((input) => {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", errorEl.id);
  });
}

/**
 * WHAT: Clears error for the radio button group
 * WHY:  Removes error state from ALL radios in the group simultaneously.
 *
 * @param {HTMLElement[]} inputs - Array of radio input elements
 * @param {HTMLElement} errorEl - The shared error <p> element
 */
function clearGroupError(inputs, errorEl) {
  errorEl.textContent = "";
  errorEl.setAttribute("hidden", "");
  inputs.forEach((input) => {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  });
}

// =============================================================
// 3. FIELD VALIDATORS
// =============================================================
// WHAT: Individual validation functions for each field type
// WHY:  Each returns true/false so we can collect results and
//       determine if the form is valid overall.
//       They also handle showing/clearing their own errors.

/**
 * WHAT: Validates a required text field (first name, last name, message)
 * WHY:  Checks if the trimmed value is empty. trim() prevents
 *       spaces-only from passing validation.
 *
 * @param {object} fieldConfig - Object with input, error, message properties
 * @returns {boolean} Whether the field is valid
 */
function validateTextField(fieldConfig) {
  if (fieldConfig.input.value.trim() === "") {
    showError(fieldConfig.input, fieldConfig.error, fieldConfig.message);
    return false;
  }
  clearError(fieldConfig.input, fieldConfig.error);
  return true;
}

/**
 * WHAT: Validates the email field with two checks
 * WHY:  Email has two distinct error states:
 *       1. Empty — "This field is required"
 *       2. Wrong format — "Please enter a valid email address"
 *       We use the browser's built-in validity.typeMismatch (from type="email")
 *       to check format. This uses the same regex the browser uses,
 *       which handles edge cases better than a custom regex.
 *
 * @returns {boolean} Whether the email is valid
 */
function validateEmail() {
  const { input, error, messageRequired, messageInvalid } = fields.email;

  if (input.value.trim() === "") {
    showError(input, error, messageRequired);
    return false;
  }

  // WHAT: Use the browser's built-in email validation
  // WHY:  type="email" makes the browser check format via input.validity.typeMismatch.
  //       This is more reliable than a custom regex and handles internationalized emails.
  if (input.validity.typeMismatch) {
    showError(input, error, messageInvalid);
    return false;
  }

  clearError(input, error);
  return true;
}

/**
 * WHAT: Validates that one radio button in the group is selected
 * WHY:  Radio groups are validated as a unit — at least one must be :checked.
 *       Array.some() checks if ANY radio in the group is checked.
 *
 * @returns {boolean} Whether a query type is selected
 */
function validateQueryType() {
  const isSelected = queryType.inputs.some((input) => input.checked);

  if (!isSelected) {
    showGroupError(queryType.inputs, queryType.error, queryType.message);
    return false;
  }

  clearGroupError(queryType.inputs, queryType.error);
  return true;
}

/**
 * WHAT: Validates the consent checkbox is checked
 * WHY:  This is a required checkbox — user must opt in before submitting.
 *       .checked is a boolean property on checkbox inputs.
 *
 * @returns {boolean} Whether consent is given
 */
function validateConsent() {
  const { input, error, message } = fields.consent;

  if (!input.checked) {
    showError(input, error, message);
    return false;
  }

  clearError(input, error);
  return true;
}

// =============================================================
// 4. SCREEN READER ANNOUNCEMENTS
// =============================================================

/**
 * WHAT: Announces a message to screen readers via the live region
 * WHY:  The #sr-announcer element has aria-live="polite", meaning
 *       screen readers will read its content when it changes.
 *
 *       The trick: we clear the text first, then set it after a tiny delay.
 *       WHY the delay? If we just set new text directly, and it happens
 *       to be the same text as before (e.g., submitting twice with the
 *       same errors), the screen reader won't detect a "change" and
 *       won't re-announce. Clearing first forces a change detection.
 *
 * @param {string} text - The message to announce
 */
function announce(text) {
  announcer.textContent = "";
  setTimeout(() => {
    announcer.textContent = text;
  }, 50);
}

// =============================================================
// 5. SUCCESS TOAST
// =============================================================

/**
 * WHAT: Shows the success toast and auto-hides after 5 seconds
 * WHY:  Removing the "hidden" attribute makes the toast visible AND
 *       triggers the screen reader to announce its content (because
 *       it has role="status" and aria-live="polite" in HTML).
 *
 *       The 5-second timeout gives users enough time to read the message.
 *       We also announce via the live region as a backup for screen readers
 *       that might not pick up the toast's role="status".
 */
function showToast() {
  toast.removeAttribute("hidden");

  // WHAT: Backup announcement via the dedicated live region
  // WHY:  Some screen readers handle role="status" inconsistently.
  //       This ensures the success message is always announced.
  announce("Message sent successfully. Thanks for completing the form.");

  // WHAT: Auto-hide after 5 seconds
  // WHY:  The toast shouldn't stay forever — it's a transient notification.
  //       5 seconds is enough time for users to read it (WCAG recommends
  //       at least 2 seconds, and some recommend timing based on word count).
  setTimeout(() => {
    toast.setAttribute("hidden", "");
  }, 5000);
}

// =============================================================
// 6. FORM SUBMISSION HANDLER
// =============================================================

/**
 * WHAT: Main form submit handler — validates all fields and shows toast or errors
 * WHY:  preventDefault() stops the browser from submitting the form to a server
 *       (there is no server — this is a front-end-only challenge).
 *       We validate all fields, collect which ones failed, then either:
 *       - Show errors + focus the first invalid field + announce errors
 *       - Show success toast + reset the form
 */
form.addEventListener("submit", (e) => {
  // WHAT: Prevent actual form submission
  // WHY:  This is a front-end demo — no server to submit to.
  e.preventDefault();

  // WHAT: Validate every field and track which are invalid
  // WHY:  We validate ALL fields at once (not stopping at the first error)
  //       so the user can see and fix everything in one pass.
  //       Each validator returns true/false and handles its own error display.
  const results = [
    { valid: validateTextField(fields.firstName), input: fields.firstName.input },
    { valid: validateTextField(fields.lastName), input: fields.lastName.input },
    { valid: validateEmail(), input: fields.email.input },
    { valid: validateQueryType(), input: queryType.inputs[0] },
    { valid: validateTextField(fields.message), input: fields.message.input },
    { valid: validateConsent(), input: fields.consent.input },
  ];

  // WHAT: Find the first invalid field's input element
  // WHY:  WCAG best practice — on failed validation, move focus to the
  //       first invalid field so keyboard/screen reader users know exactly
  //       where to start correcting. Without this, they'd have to Tab
  //       through the entire form to find the errors.
  const firstInvalid = results.find((r) => !r.valid);

  if (firstInvalid) {
    // WHAT: Focus the first invalid input
    // WHY:  The screen reader will announce the field label + "invalid" +
    //       the error message (from aria-describedby). This gives the user
    //       immediate, actionable feedback.
    firstInvalid.input.focus();

    // WHAT: Announce error count to screen readers
    // WHY:  Gives an overview of how many errors exist, so the user
    //       knows the scope of corrections needed.
    const errorCount = results.filter((r) => !r.valid).length;
    announce(
      `There ${errorCount === 1 ? "is" : "are"} ${errorCount} error${errorCount === 1 ? "" : "s"} in the form. Please correct ${errorCount === 1 ? "it" : "them"} and try again.`
    );

    return; // Stop here — don't show toast or reset
  }

  // WHAT: All fields valid — show success and reset
  // WHY:  form.reset() clears all inputs back to their initial state.
  //       We show the toast AFTER resetting so the form is clean
  //       and the user sees a fresh form + success message.
  showToast();
  form.reset();
});

// =============================================================
// 7. REAL-TIME FIELD VALIDATION (on blur and input)
// =============================================================
// WHAT: Validate fields as the user interacts with them
// WHY:  Showing errors only on submit is frustrating — users have to
//       submit, scroll to find errors, fix them, submit again.
//       Real-time validation gives immediate feedback.
//
//       STRATEGY:
//       - "blur" (leaving a field): validate and show error if empty/invalid
//       - "input" (typing): ONLY clear existing errors as the user fixes them
//         (don't show new errors while they're still typing — that's annoying)
//       - "change" (radio/checkbox): validate immediately when selection changes

// -- Text Fields (First Name, Last Name, Message) --
// WHAT: Loop through text-type fields and attach blur + input listeners
// WHY:  They all share the same validation logic (required text check),
//       so we can handle them in a loop to avoid code duplication.
["firstName", "lastName", "message"].forEach((key) => {
  const field = fields[key];

  // WHAT: Validate on blur (leaving the field)
  // WHY:  If the user tabs through without filling in a required field,
  //       they see the error immediately — not just on submit.
  field.input.addEventListener("blur", () => {
    validateTextField(field);
  });

  // WHAT: Clear error on input (while typing)
  // WHY:  As soon as the user starts typing in a previously-invalid field,
  //       the error disappears. This gives positive reinforcement.
  //       We only clear (not re-validate) to avoid showing errors mid-typing.
  field.input.addEventListener("input", () => {
    if (field.input.getAttribute("aria-invalid") === "true") {
      validateTextField(field);
    }
  });
});

// -- Email Field --
// WHAT: Special handling because email has TWO error messages
// WHY:  We need to validate format (not just emptiness), so we call
//       validateEmail() which handles both cases.
fields.email.input.addEventListener("blur", () => {
  validateEmail();
});

fields.email.input.addEventListener("input", () => {
  // WHAT: Only re-validate if the field was already marked invalid
  // WHY:  Prevents showing "invalid email" errors while the user
  //       is still in the middle of typing their email address.
  if (fields.email.input.getAttribute("aria-invalid") === "true") {
    validateEmail();
  }
});

// -- Radio Buttons (Query Type) --
// WHAT: Validate on change for each radio button
// WHY:  "change" fires when a radio button is selected.
//       Once the user picks an option, immediately clear the error.
//       This is better than waiting for blur because radio buttons
//       don't have a traditional "blur" interaction.
queryType.inputs.forEach((input) => {
  input.addEventListener("change", () => {
    validateQueryType();
  });
});

// -- Consent Checkbox --
// WHAT: Validate on change when checkbox is toggled
// WHY:  Same as radio — "change" is the natural event for checkboxes.
//       Immediately clears the error when the user checks the box.
fields.consent.input.addEventListener("change", () => {
  validateConsent();
});
