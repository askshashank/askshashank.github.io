# LearnHub — Course Dashboard

This is a simple dashboard-style static website intended for GitHub Pages. Visitors can browse courses and download course files.

How to use
1. Place these files in the repository root of `askshashank/askshashnk.github.io`.
2. Add your downloadable files under a `files/` directory (create it) and update the `courses.json` or the `script.js` data accordingly.
   - Example: `files/python_basics.pdf`
3. GitHub Pages will serve the site automatically for the `*-github.io` repo on the `main` branch.

Extending
- To add more courses: update `courses.json` or add objects in `script.js`.
- To provide a single ZIP "Download All" per course: pre-generate a zip and add a file like `files/c1_all.zip` and change the `downloadAll` handler to point at it.
- For large scale usage: move courses and files to a backend or cloud storage and serve file links dynamically.

If you want, I can:
- push these files into a branch in your repository,
- create a basic CI to validate file availability,
- or add a small admin UI to upload and manage course files.