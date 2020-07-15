# css

![CircleCI](https://img.shields.io/circleci/build/github/gactjs/css?style=for-the-badge)
![Coveralls github](https://img.shields.io/coveralls/github/gactjs/css?style=for-the-badge)
![GitHub](https://img.shields.io/github/license/gactjs/css?style=for-the-badge)
![npm](https://img.shields.io/npm/v/@gact/css?style=for-the-badge)
![npm bundle size](https://img.shields.io/bundlephobia/min/@gact/css?style=for-the-badge)

`@gact/css` is a very fast, complete CSS-in-JS solution

`@gact/css` provides direct support for:
  - infinite nesting
  - pseduo-classes and pseduo-elements
  - `@keyframes`
  - `@media`
  - `@supports`

## API

### `css`

Tagged template literal that lets you declare and inject a scoped stylesheet.

#### Returns

(`string`): The scoped `className`, which should be added to the root element of the UI to which the styles apply.

#### Example

```ts
import React from "react";
import { css } from "@gact/css";

const className = css`
  display: flex;
  background: purple;
  justify-content: center;
  align-items: center;
  font-size: 1.2em;
  width: 50vw;
  height: 50vh;

  p {
    font-size: 1em;
    width: 100px;
    animation: spin infinite 1s linear;

    strong {
      color: teal;
    }
  }

  :hover {
    background: orange;
  }

  @supports (display: grid) {
    @media (max-width: 600px) {
      p {
        background: pink;
      }
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0);
    }

    to {
      transform: rotate(360deg);
    }
  }
`;

export function CSSExample() {
  return (
    <div className={className}>
      CSS Example
      <p>
        You can <strong>infinitely</strong> nest
      </p>
    </div>
  );
}
```
