# File Viewer

This is a custom element ([web component](https://developer.mozilla.org/en-US/docs/Web/Web_Components) - can be used every where regardless the framework) built with [Svelte](https://svelte.dev/) to view files.

## Usage

`url` - File link.

`filename` - the file name - should include the file extension.

```html
<file-viewer
    filename="some-excel-file.xlsx"
    url="https://link.com"
></file-viewer>
```

```html
<file-viewer
    filename="some-not-supported-file.not-supported"
    url="https://link.com"
>
    <div slot="not-supported">
        :(
    </div>
</file-viewer>
```

### Available slot:

-   `not-supported` - Given file extension is not supported.

### Supported File Extensions

`.png`, `.jpg`, `.jpeg`, `.gif`, `.pdf`, `xlsx`

### Examples:

-   [React](https://codesandbox.io/s/tender-platform-rlxs1)
-   [Vue](https://codesandbox.io/s/tender-platform-rlxs1)
-   [Angular](https://codesandbox.io/s/dreamy-goldstine-e9pso)
-   [Vanilla](https://codesandbox.io/s/vigorous-moon-ghy8w)
