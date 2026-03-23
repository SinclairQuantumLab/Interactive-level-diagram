# Development History

This file is the narrative memory: how the current app got here, what was tried, what was abandoned, and which decisions were intentional.

## 1. Panel and Coordinate-System Stabilization

Early work spent a lot of time fixing floating information panels so they would track the diagram correctly during pan and zoom.

The key lesson:

- mixed coordinate systems were the root cause
- partial fixes that only matched D3 zoom transforms were not enough
- the correct solution was to use the SVG scene's full screen transform

Related follow-up decisions:

- panel positions should track the diagram
- panel sizes should stay in normal screen pixels
- HTML controls such as sliders should not live inside a scaled transform container because native drag behavior breaks there

## 2. Hyperfine Slider Stability

The hyperfine slider once detached from the pointer because panel rerenders recreated the range input mid-drag.

The fix:

- during slider `input`, update the diagram only
- delay full panel rebuild until the drag completes

This principle still matters:

- do not rebuild the owning DOM control during continuous pointer interaction if it can be avoided

## 3. Home Panel and Product Framing Cleanup

The top-left home panel began much noisier, with tutorial-like copy and controls mixed together.

It was gradually simplified into:

- app title
- version
- species notation
- concise species notes
- grouped controls
- separate `?` help panel

Important direction that emerged:

- the home panel should not try to be a manual
- global explanatory copy belongs in the help panel

## 4. Config-File Simplification

The project originally kept more rendering and layout concerns in the diagram config.

That was intentionally removed.

Current principle:

- the diagram file should describe the atom and transitions
- the app code should own universal drawing and interaction behavior

This also led to removal of many old per-state layout hints from the config.

## 5. TOML to YAML Migration

This was a major turning point.

Why it happened:

- measured scientific values now needed to carry uncertainties and inline citations
- requiring users to think about TOML number-vs-string distinctions was becoming awkward

The result:

- diagram files moved from TOML to YAML
- the app became responsible for interpreting plain scalars that contain numbers, units, uncertainties, and `\cite{...}`

Important lasting principle:

- the schema should be friendly to human editing
- the app should do the parsing work

## 6. TeX Rendering Journey

There were several attempts before the current approach stabilized:

1. plain-font approximation
2. custom fallback renderer
3. CDN-based KaTeX
4. local vendored KaTeX
5. moving fine-state labels onto a rendering path that actually respected the TeX output

Important lessons:

- CDN dependencies were the wrong fit for a local-first project
- fine-state labels and normal dashboard HTML did not always behave the same way
- real local KaTeX support was the right long-term answer

Current principle:

- TeX-like text should work broadly and locally, without internet dependence

## 7. Browser-Only Direction

The project temporarily leaned into Electron to escape browser folder-access limitations.

That solved some things for a while, but the strategic direction later changed again:

- the browser is more accessible and familiar for end users
- the app should stay browser-native rather than carrying a second standalone runtime

The lasting conclusion:

- fight for a better browser UX first
- remove the standalone path instead of keeping it as a parallel maintenance burden

## 8. Diagram Discovery and Folder Picking

Several approaches were explored:

- fake manifest-based local file discovery
- browser-local cached config text
- a short-lived Electron direct-folder-reading path
- File System Access API folder handles in browser mode

The reality that shaped the current design:

- a normal browser page cannot freely enumerate sibling files or folders without user-granted access

So the current approach is:

- browser mode guides the user toward choosing the `diagrams/` folder
- browser remembers the granted handle
- the browser folder-picker path is the only supported runtime path

## 9. Monolithic Script Split

The original single large `script.js` was split into:

- `app-core.js`
- `diagram-model.js`
- `diagram-ui.js`
- `diagram-render.js`

This was a major maintainability improvement and should be preserved.

Important caution:

- several later bugs happened when similar logic got duplicated across modules or across synthetic vs real layout paths

## 10. References and Bibliography Feature

References were first scaffolded, then wired to real `.bib` files.

Key design decisions:

- references should be simple and APS-style
- hover panels should stay compact
- the bibliography panel should not be padded with extra descriptive prose
- citations should be clickable
- pinned reference panels should be possible independently of the global bibliography toggle

Another key schema decision:

- inline `\cite{...}` in values and notes won over separate per-field reference sections for normal authored content

## 11. Transition Feature

Transitions became a major subsystem.

Important evolution:

- directional `from` / `to` was dropped
- undirected `between: [...]` became the identity
- endpoint notation was generalized so transitions can target fine, hyperfine, Zeeman, or mixed-depth bars

There was also transition-routing experimentation:

- straight lines
- curved lines
- collision-aware label placement

Current decision:

- straight lines are preferred
- labels try to avoid overlap
- transitions are colored from rough spectral frequency estimates

## 12. Transition Panel and Label Customization

Originally transition labels were more rigid.

Now:

- users can choose which panel items appear on the on-diagram label
- those choices are made from the actual items in the pinned transition panel
- if nothing is selected, no label should be shown

Important supporting details:

- citations are dropped from on-diagram transition labels
- decimal limiters exist for wavelength and frequency label display
- decimal limiting intentionally drops uncertainty notation from those rendered label strings

## 13. Measurement Tool

The measurement tool became another major subsystem.

Important design turns:

- measurements are visible objects on the diagram, not just panel data
- multiple measurement lines are allowed
- removal should happen on the diagram itself, not in a detached list panel
- right-clicking a measure line pins a measurement panel
- measurement labels are configurable similarly to transition labels

Physics and display decisions that matter:

- same-type states may show just a representative difference in simple cases
- but if states come from different parents, the full fine/HF/Zeeman decomposition should be shown
- explicit zero Zeeman contribution should still be shown when needed for clarity

Schema decision:

- exported measurement entries should use `between: [...]`
- old internal string ids should not leak into exported layout

## 14. Hide Tool and Ellipsis Feature

This area produced one of the biggest regressions and lessons.

What happened:

- hidden-state compaction was added for hyperfine and Zeeman structures
- a duplicated synthetic sizing path diverged from the real render path
- that duplication caused expansion and layout regressions

The fix:

- use one shared expanded-state layout builder for both sizing and rendering

Important lessons:

- do not maintain parallel geometry pipelines for the same structure
- hidden-run compaction must not arbitrarily recenter or rescale physics structure

Current intended behavior:

- hyperfine: preserve real relative spacing, only reclaim edge space from hidden runs
- Zeeman: collapse hidden runs to one placeholder slot, align around `m_F = 0` when possible

Ellipsis markers also went through iterations:

- Unicode glyphs
- custom SVG dots
- detached overlays
- integrated render groups

The current principle:

- hidden-run markers must behave like real members of the animated structure, not like detached overlay decorations

## 15. Layout Export Evolution

The app's copied layout format evolved from JSON toward YAML.

Intentional current state:

- copied layout is YAML
- layout includes app version
- hidden transitions use `between: [...]`
- measurements use `between: [...]`
- old internal ids and older compatibility loaders were deliberately cleaned out once the project was still early enough to simplify

This matters a lot:

- do not casually reintroduce old schema compatibility unless explicitly requested

## 16. Versioning and Git Workflow

Later in development, the repo was initialized and GitHub Flow was chosen.

New direction:

- branch from `main`
- develop on short-lived branches
- merge back into `main`

Versioning also changed:

- main uses `YYYYMMDD.d`
- feature and development branches use `YYYYMMDD.<branchname>.<commit hash>`

Important caveat:

- Git local config such as `core.hooksPath` is not part of the repo history
- a future machine must set that locally after clone

## 17. Why the Memory Files Exist

The chat history behind this project is long and full of fine-grained decisions that are easy to lose.

These memory files exist so a future Codex can recover:

- current architecture
- product direction
- schema decisions
- interaction philosophy
- abandoned approaches worth avoiding

When major decisions shift, update these files rather than relying on conversational memory alone.
