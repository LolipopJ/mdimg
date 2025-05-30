# Mdimg - Covert Markdown or HTML to image

## Marked

<img alt="marked-logo" src="./marked-logo-black.svg" style="width: 120px; float: right;">

> Source: https://github.com/markedjs/marked/blob/master/docs/demo/initial.md

[Marked] lets you convert [Markdown] into HTML. Markdown is a simple text format whose goal is to be very easy to read and write, even when not converted to HTML. This demo page will let you type anything you like and see how it gets converted. Live. No more waiting around.

## Why Markdown?

It's easy. It's not overly bloated, unlike HTML. Also, as the creator of [markdown] says,

> The overriding design goal for Markdown's
> formatting syntax is to make it as readable
> as possible. The idea is that a
> Markdown-formatted document should be
> publishable as-is, as plain text, without
> looking like it's been marked up with tags
> or formatting instructions.

Ready to start writing? Either start changing stuff on the left or
[clear everything](/demo/?text=) with a simple click.

[marked]: https://github.com/markedjs/marked/
[markdown]: http://daringfireball.net/projects/markdown/

## Code Block

> Source: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Headings_and_paragraphs

```html
<h1>This is a top level heading</h1>

<span style="font-size: 32px; margin: 21px 0; display: block;">
  Is this a top level heading?
</span>
```

> Source: https://www.typescriptlang.org/

```ts
interface User {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

function updateUser(id: number, update: Partial<User>) {
  const user = getUser(id);
  const newUser = { ...user, ...update };
  saveUser(id, newUser);
}
```

## LaTex

> Source: https://ashki23.github.io/markdown-latex.html#latex

This is a inline LaTex example: $\dfrac{0}{1} \neq \infty$. And below is a block LaTeX example:

<div>$$
A_{m,n} =
\begin{pmatrix}
a_{1,1} & a_{1,2} & \cdots & a_{1,n} \\
a_{2,1} & a_{2,2} & \cdots & a_{2,n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m,1} & a_{m,2} & \cdots & a_{m,n}
\end{pmatrix}
$$</div>

## Mermaid

> Source: https://mermaid.js.org/

```mermaid
sequenceDiagram
  A->>B: I #9829; you!
  B->>A: I #9829; you #infin; times more!
```
