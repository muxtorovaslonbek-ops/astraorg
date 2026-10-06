<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep shared navigation and the animated star background in AstraShell around the root Outlet so every content page shares the same experience.
- Define subject content and destinations in a browser-safe central subject catalog so cards and subject pages stay consistent.
- Implement the intro sound with a browser Web Audio synth started by a user gesture so audio respects browser autoplay rules without an external service.
- Open external educational platforms in an iframe viewer with a new-tab fallback so the supplied sites remain accessible when embedding is restricted.
