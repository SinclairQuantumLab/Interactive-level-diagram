# Interactive Atomic Level Diagram

Browser-based frontend for exploring atomic structure, transitions, and measurements in interactive level diagrams.

Currently hosted at: https://sinclair-imaq.gitlab.io/interactive-level-diagram/

## Example diagram: $^{87}\mathrm{Rb}$ (`rb87-neutral.yaml`)

Expand the following collapsible section and try importing the layout inside:
<details>
<summary>A layout for 87Rb diagram</summary>

```yaml
version: 3
appVersion: 20260415.codex-resizable-dashboard-panels.50b4a31
expandedFine:
  - 5S1/2
  - 6P3/2
  - 4D3/2v
  - 5P3/2
  - 5P1/2
expandedHyperfine:
  - 4D3/2[F=3]
  - 4D3/2[F=2]
  - 5P3/2[F=3]v
  - 5P1/2[F=2]
pinnedPanels:
  - panelId: 1
    type: transition
    between: [5P3/2, 5S1/2]
    sceneX: 391.15661316406505
    sceneY: 124.3126499962393
    widthScreen: 397
    heightScreen: 555
    showTransitionLabelSelectors: false
theme: dark
referencesVisible: false
measureToolEnabled: false
hideToolEnabled: false
measureSelection: []
measurements:
  - between: [5D3/2, 5D5/2]
    show: [fine:frequency]
    precision: {fine:frequency: 1}
    notes: []
  - between: ['5D5/2[F=3]', '5D5/2[F=4]']
    show: [hyperfine:frequency]
    precision: {}
    notes: []
  - between: ['5D5/2[F=2]', '5D5/2[F=3]']
    show: [hyperfine:frequency]
    precision: {}
    notes: []
  - between: [6P1/2, 6P3/2]
    show: [fine:frequency]
    precision: {fine:frequency: 1}
    notes: []
  - between: ['5D5/2[F=2,mF=-1]', '5P3/2[F=3,mF=3]']
    show: [fine:wavelength, hyperfine:frequency, zeeman:frequency, note:0]
    precision: {}
    notes: [reer]
  - between: [4D3/2, 4D5/2]
    show: [fine:frequency, note:0]
    precision: {fine:frequency: null}
    notes: []
hiddenStates:
  - hyperfine:5D5/2[F=3]
  - hyperfine:5D5/2[F=1]
  - zeeman:5D5/2[F=4,mF=-2]
  - zeeman:5D5/2[F=4,mF=-1]
  - zeeman:5D5/2[F=4,mF=0]
  - zeeman:5D5/2[F=4,mF=1]
  - zeeman:5D5/2[F=4,mF=2]
hiddenTransitions:
  - between: ['5P3/2[F=3]', '5S1/2[F=2]']
  - between: ['5P1/2[F=1]', '5S1/2[F=2]']
  - between: ['5P3/2[F=2]', '5S1/2[F=1]']
  - between: ['5P1/2[F=2]', '5S1/2[F=2]']
  - between: [5S1/2, 6P1/2]
  - between: [4D3/2, 5P1/2]
  - between: [4D5/2, 5P3/2]
  - between: ['5P1/2[F=1]', '5S1/2[F=1]']
  - between: ['5P1/2[F=2]', '5S1/2[F=1]']
  - between: ['5P3/2[F=0]', '5S1/2[F=1]']
  - between: ['5P3/2[F=1]', '5S1/2[F=2]']v
  - between: ['5P3/2[F=2]', '5S1/2[F=2]']
controls:
  hyperfineScaleByFineState:
    5S1/2: 0.1076465213629835
    5P1/2: 1
    5P3/2: 4.487453899331323
  transitionLabels:
    - {between: ['5S1/2[F=1]', '5S1/2[F=2]'], show: [frequency], precision: {wavelength: null, frequency: null}}
    - {between: [5P1/2, 5S1/2], show: [wavelength, strength], precision: {wavelength: 1, frequency: null}}
    - {between: [5P3/2, 5S1/2], show: [wavelength, strength], precision: {wavelength: 1, frequency: null}}
    - {between: ['5P1/2[F=1]', '5S1/2[F=1]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P1/2[F=2]', '5S1/2[F=1]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P1/2[F=1]', '5S1/2[F=2]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P1/2[F=2]', '5S1/2[F=2]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P3/2[F=0]', '5S1/2[F=1]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P3/2[F=1]', '5S1/2[F=1]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P3/2[F=2]', '5S1/2[F=1]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P3/2[F=1]', '5S1/2[F=2]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P3/2[F=2]', '5S1/2[F=2]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P3/2[F=3]', '5S1/2[F=2]'], show: [strength], precision: {wavelength: null, frequency: null}}
    - {between: ['5P3/2[F=3,mF=3]', '5S1/2[F=2,mF=2]'], show: [strength], precision: {wavelength: null, frequency: null}}
  bFieldEnabled: true
  bFieldVisualScale: 0.5997910762555094
  bFieldGauss: 2.38
  bFieldGaussMin: 0
  bFieldGaussMax: 10
zoom:
  x: 54.12979516131418
  'y': 10.261415109382824
  k: 1.1000000000000012
```
</details>

## License

The publicly distributed frontend source files in this repository are licensed under the Mozilla Public License 2.0 (`MPL-2.0`).

These covered frontend source files were originally developed by Joonseok Hur in the Josiah Sinclair Group, UW-Madison.

This does not by itself place backend code, services, or infrastructure under `MPL-2.0` unless they are explicitly stated to be covered.

Downstream modifiers of covered files should preserve existing copyright, license, and provenance notices.
