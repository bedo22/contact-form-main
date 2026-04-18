# Frontend Mentor - Contact form solution

This is a solution to the [Contact form challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/contact-form--G-hYlqKJj). The goal of this build was not just to match the design, but to create an accessible, keyboard-friendly, screen-reader-aware contact form using semantic HTML, SCSS, and vanilla JavaScript.

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
  - [Useful resources](#useful-resources)
  - [AI Collaboration](#ai-collaboration)
- [Author](#author)
- [Acknowledgments](#acknowledgments)

## Overview

### The challenge

Users should be able to:

- Complete the form and see a success toast message upon successful submission
- Receive form validation messages if:
  - A required field has been missed
  - The email address is not formatted correctly
- Complete the form only using their keyboard
- Have inputs, error messages, and the success message announced on their screen reader
- View the optimal layout for the interface depending on their device's screen size
- See hover and focus states for all interactive elements on the page

This solution puts a strong emphasis on accessibility and WCAG-aligned form patterns, including semantic grouping, linked error messages, focus management, and live region announcements.

### Screenshot

![Screenshot of the completed contact form](./screenshot.jpg)

> Add your project screenshot here before publishing.

### Links

- Solution URL: [Add your Frontend Mentor solution URL here](https://your-solution-url.com)
- Live Site URL: [Add your live site URL here](https://your-live-site-url.com)

## My process

### Built with

- Semantic HTML5 markup
- SCSS with a single-file architecture
- Vanilla JavaScript
- CSS Grid
- Flexbox
- Mobile-first workflow
- BEM naming conventions
- SCSS variables and mixins
- Local **Karla** variable font

### What I learned

The biggest takeaway from this project was that accessible forms are not just about adding validation messages. Good accessibility comes from combining semantic HTML, meaningful ARIA usage, clear focus behavior, and predictable feedback.

#### 1. Native HTML should do as much work as possible

One of the most useful lessons was that accessibility is much easier when the structure is correct from the start. For example, radio buttons should be grouped with `fieldset` and `legend`, not just a heading or paragraph above them.

```html
<fieldset class="field field--group">
  <legend class="field__label">
    Query Type
    <span aria-hidden="true"> *</span>
  </legend>

  <div class="choice">
    <input
      id="query-general"
      class="choice__input"
      type="radio"
      name="queryType"
      value="general"
      required
      aria-required="true"
    />
    <label for="query-general" class="choice__label">
      <span class="choice__indicator" aria-hidden="true"></span>
      General Enquiry
    </label>
  </div>
</fieldset>
```

That structure gives screen readers proper context for the whole group instead of treating each option like an unrelated control.

#### 2. ARIA works best when it supports real HTML

I learned to use ARIA to reinforce meaning, not replace it. In this project, `aria-required`, `aria-invalid`, and `aria-describedby` helped make custom validation understandable for assistive technology.

```js
function showError(input, errorEl, message) {
  errorEl.textContent = message;
  errorEl.removeAttribute("hidden");
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", errorEl.id);
}
```

This pattern made the error state work in three ways at once:

- visually, because the error appears on screen
- semantically, because the field is marked invalid
- contextually, because the field is linked to the exact message explaining the problem

#### 3. Custom controls should still use native inputs

A really important accessibility detail was keeping the real radio and checkbox inputs in the DOM and focusable. I visually hid them with a proper utility mixin instead of using `display: none`, which would remove them from the accessibility tree and keyboard flow.

```scss
@mixin visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
```

That let me style the labels freely while preserving native keyboard behavior and screen reader support.

#### 4. Focus management is part of validation

Another key lesson was that accessible validation is not complete unless focus is handled intentionally. On failed submit, I moved focus to the first invalid field so keyboard and screen reader users immediately know where to start.

```js
const firstInvalid = results.find((r) => !r.valid);

if (firstInvalid) {
  firstInvalid.input.focus();
  announce(`There are ${errorCount} errors in the form. Please correct them and try again.`);
  return;
}
```

That small step makes the experience much more usable than showing errors and expecting the user to hunt for them.

#### 5. Live regions help communicate changes that are not tied to focus

I also learned when live regions are useful. If a success toast appears or a form-level error summary is generated, those updates may not be announced unless they are placed in a live region or exposed with a status role.

```html
<div id="sr-announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>

<div id="success-toast" class="toast" role="status" aria-live="polite" aria-atomic="true" hidden>
  ...
</div>
```

Using `aria-live="polite"` and `role="status"` helped make both failure and success feedback more inclusive.

#### 6. `:focus-visible` creates a better keyboard experience

I had used focus styles before, but this project helped me understand why `:focus-visible` is such a good fit. It shows a clear indicator for keyboard users without forcing the same ring to appear after every mouse click.

```scss
.choice__input:focus-visible + .choice__label,
.button:focus-visible {
  @include focus-ring;
}
```

That gave the interface a cleaner feel while still respecting keyboard accessibility.

### Continued development

In future projects, I want to keep improving in these areas:

- Testing forms with a more deliberate accessibility checklist instead of treating accessibility as a final pass
- Getting more confident with screen reader testing workflows
- Building stronger progressive enhancement habits, especially for form handling
- Refining my custom validation patterns so they stay simple, reusable, and accessible
- Continuing to pair semantic HTML with minimal, purposeful ARIA instead of overengineering interactions

### Useful resources

- [MDN: `aria-live`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions) - Helped me better understand how to announce dynamic updates without moving focus.
- [MDN: `<fieldset>` and `<legend>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset) - A solid reference for grouping related form controls correctly.
- [MDN: `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) - Useful for building better keyboard-only focus styles.
- [WebAIM - Invisible Content Just for Screen Reader Users](https://webaim.org/techniques/css/invisiblecontent/) - Reinforced the correct visually-hidden pattern for keeping native controls accessible.
- [W3C WCAG Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) - Helpful for checking the intent behind the accessibility decisions in this form.

### AI Collaboration

I used AI as a thinking and implementation partner throughout this project.

- I used **Amp** as an AI coding agent to help generate and refine parts of the solution.
- I used the **oracle** tool for planning, structure, and architecture decisions before committing to implementation details.
- One thing that worked especially well was asking for code with detailed **WHAT / WHY** comments. That made the generated code easier to review, understand, and learn from instead of just copying it blindly.
- I also used a layered reading approach while working with AI: **map → slice → rebuild**.
  - **Map:** understand the overall structure first
  - **Slice:** zoom in on one part at a time
  - **Rebuild:** restate or rework the logic in my own understanding

What I found most valuable was treating AI as a collaborator rather than an autopilot. It was most useful when I gave clear constraints, checked the output carefully, and used it to deepen my understanding of accessibility decisions instead of just speeding through the challenge.

## Author

- Website - [Your Name Here](https://www.your-site.com)
- Frontend Mentor - [@yourusername](https://www.frontendmentor.io/profile/yourusername)
- Twitter - [@yourusername](https://www.twitter.com/yourusername)

## Acknowledgments

Thanks to Frontend Mentor for the challenge brief and to the accessibility documentation from MDN, WebAIM, and W3C that helped guide the implementation. This project was also a useful exercise in learning how to collaborate with AI thoughtfully while still reviewing, understanding, and owning the final result.
