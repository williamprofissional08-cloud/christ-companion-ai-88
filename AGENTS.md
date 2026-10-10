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

- Preserve the existing course hierarchy and extend it additively through `book_chapters` and lesson chapter links, because published URLs and student progress must remain valid.
- Persist study reading checkpoints through authenticated server functions and adapt legacy cached content into reader sections, because older studies and per-user resume positions must remain usable without regeneration.
- Keep Lovable's VITE environment replacement enabled and explicitly define the two public backend values with project-bound public fallbacks in Vite config, because remote browser builds must not depend on server-only environment variables; never embed private credentials.
