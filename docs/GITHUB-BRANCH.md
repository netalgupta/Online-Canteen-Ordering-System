# Put this package on a new GitHub branch

From a clone of your QueueLess repository, create a feature branch first:

```bash
git switch -c feat/supabase-backend
```

Copy the contents of this package into the repository (do not overwrite unrelated project files without reviewing the diff), then:

```bash
git status
git diff --stat
git add .
git commit -m "Add Supabase backend foundation"
git push -u origin feat/supabase-backend
```

Do not push service-role keys, SMTP passwords, or database passwords. `js/backend-config.js` contains only the Supabase project URL and public publishable key; RLS and server-side RPC validation are still required.
