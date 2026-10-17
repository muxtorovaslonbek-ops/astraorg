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
- Play intro media from a Lovable Assets pointer after a user gesture, using the video's native audio and ended event so sound obeys autoplay rules and the sign-in handoff follows the actual duration.
- Open external educational platforms in an iframe viewer with a new-tab fallback so the supplied sites remain accessible when embedding is restricted.
- Resolve access state for the current identity before rendering gated content, and refresh while the tab is visible so approval changes do not require signing in again.
- Keep password recovery on a standalone public auth/reset route and sanitize stored sign-in destinations to same-origin paths so recovery sessions are not redirected away and login cannot become an open redirect.
