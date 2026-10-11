# Instagram account section

The owner's account is `https://www.instagram.com/the_booty_rebublic.jo/`.
`src/lib/social.ts` owns the destination used by the homepage and footer follow links.
The spelling matches the supplied account. The homepage collage uses current store
images; it does not claim to be a live feed or invent follower counts/posts.

Verification: 58 existing tests passed, TypeScript and the Next.js production build
passed, and DESIGN.md lint returned zero errors (one existing orphan-token warning).
Five real Chromium checks covered image loading, identical link destinations,
keyboard/new-tab navigation with no opener, pointer navigation in the footer,
320px/375px widths without horizontal overflow, and an empty catalog. Screenshots
of the desktop and phone layout were inspected. External navigation was intercepted
locally for testing; account content and Instagram availability were not fetched.

The strict premium audit retains the same four pre-existing findings in unrelated
login/user/password forms, with none in this addition.
