# DIRECTION SHEET ÔÇö One motif
seed 1290151057 ┬À drawn 2026-10-27 ┬À sector saas ┬À tone technical
Brief: AgroShield: monitoreo predictivo de suelos y cultivos para empresas agricolas y entidades publicas; convierte lecturas de sensores en alertas con cuenta regresiva

| | |
| --- | --- |
| Direction | One motif |
| Hero | Fragment on a shaped stage |
| Type | Switzer |
| Colour | Sheet and biro |
| Sections | how-it-works (Drag through the stages) ÔåÆ features (Specimens on colour tiles) ÔåÆ showcase (One control, blown up) ÔåÆ about (Inset panel, shaped portrait) ÔåÆ faq (Accordion of filled tiles) ÔåÆ contact (Clip-out coupon form) |
| Motion | Shutter image |
| Photographs | the "Architecture" set, as atmosphere |

This is the direction for this build. Adopt it. Do not blend it with the layout you would have made anyway,
and do not redraw because it is unfamiliar: unfamiliar is the point. Redraw a slot only when it conflicts
with a stated brand constraint or needs an asset that does not exist, and say why in your report.

The parts of this sheet were written separately and will disagree in small ways. Settle every disagreement in this order:
**house rules** (including type no smaller than 13px and body text of 16px or more) ÔåÆ **the direction** (the idea, the composition habits, where the
one accent goes) ÔåÆ **the type system and the palette** (which face does which job, the five size steps, which colour is the ground and where the
accent goes) ÔåÆ **the hero blueprint** ÔåÆ **the section blueprints**. Under each blueprint below, "Adjusted for this page" lists where it disagrees.
In practice: take geometry from blueprints (columns, proportions, what sits where) and take everything else from above them. Map every size a
blueprint names onto one of your five type steps instead of adding a sixth. Use one button shape, one corner radius and one pair of page margins on
the whole page, whatever individual blueprints say. If a blueprint names a kind of typeface (a light serif, a heavy grotesk), use the dealt face.

## 1. The idea
Take one shape from the subject and let it run the whole system. A drilling tool's octagonal cross-section becomes the buttons, the image masks and the loader. A two-account money app becomes two circles that recur as icon, inline dot and section colour. A caf├®'s striped awning becomes every band on the page. Look at the product, the logo, the object or the word in the headline and find the simplest geometry in it (a circle, an arc, a chamfer, a stripe, a notch, a ring). Then use only that shape, at three or four very different scales, everywhere a designer would normally reach for a generic rounded rectangle.

Before anything else, write one sentence in your notes: "On this page, <the subject's own material> becomes <the device>."
Fill the first blank from your inventory of what only this client has (its name and what it means, its street, its numbers, its
constraint), then put the nearest competitor in the sentence: if it still works, the idea is the category's, not the client's.
Then name the one live thing the visitor can do on the page (SKILL.md step 4).

## 2. Composition
Hero: the motif appears once at enormous scale as a flat filled shape, cropped by the viewport (a circle 120vh across entering from the right, a chamfered block filling the lower half), with a short headline at 6ÔÇô8vw and one supporting sentence set on the remaining ground, left-aligned on a shared margin. Through the page the motif returns as: the mask for every photograph (via `clip-path` or `border-radius` made from the same geometry), the shape of the primary button, the bullet beside list items at text size, and one full-width band that separates the two halves of the page. Sections use simple two-column or single-column layouts so the shape is the only thing with character.

## 3. Type ÔÇö Switzer
One neo-grotesk doing everything: semibold headings pulled tight, small regular text, no capitals and no second voice. Suits software, hardware and studio pages that want to look exact and unshowy.
```html
<link rel="preconnect" href="https://api.fontshare.com">
<link rel="preconnect" href="https://cdn.fontshare.com" crossorigin>
<link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600&display=swap" rel="stylesheet">
```
- Display: **Switzer** ÔÇö weight 600 ┬À tracking -0.04em ┬À leading 0.95 ┬À sentence case; charcoal rather than pure black
- Text: **Switzer** ÔÇö 400 for body, 500 for emphasis ┬À leading 1.5 ┬À tracking -0.005em
```css
:root {
  --step-small: clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem);
  --step-body: clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem);
  --step-lead: clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem);
  --step-head: clamp(2rem, 1.3rem + 3.2vw, 4rem);
}
```
A clean geometric or grotesk face that echoes the shape (round bowls for circles, squared terminals for chamfers). Medium weight; headings 6ÔÇô8vw in the hero and 3ÔÇô4vw after.
The direction decides sizes and how many of them; the type system decides how this face is set. Where the two give different tracking or leading, use the values of the type system: they are tuned to this face.
The display size itself comes from the hero blueprint below.

## 4. Colour ÔÇö Sheet and biro
```css
:root {
  --bg: #ffffff;
  --surface: #f4f4f4;
  --ink: #111111;
  --muted: #6b6b6b;
  --accent: #1a4be0;
  --accent-ink: #ffffff;
  --field-1: #111111;  --field-1-ink: #ffffff;
}
```
White holds the whole page with black type, one grey for secondary lines and a pale grey step for tiles and inputs; the footer may invert to black. Blue is the colour of text links and the one button, and nothing else is tinted.
The motif carries the accent colour at large scale, flat. Everything else is ground and ink. A second motif colour is allowed only if the subject has a real pair (two accounts, two modes).

## 5. Imagery
**This subject is software and there are no screenshots, so its pictures are its own interface.** Wherever this sheet says photograph, image or object, build a believable fragment of the product in HTML at real size (real labels, numbers that add up, one item hovered or selected) by the app-screen rules (references/app-screens.md: deal its style once with `node <skill>/scripts/draw.mjs --app --kind <kind> --keep palette,type --out .taste-skill/app`, and build it with assets/app.css and assets/charts.js), put the attribute `data-ui` on its root, and crop or scale it the way the blueprint treats a photograph: a full-bleed close crop, a tile, the fixed half of a split. Where a fragment makes no sense, use a flat colour field with type on it. Never a fake dashboard of grey bars, never a device frame. If the product works on something physical (ships, plants, buildings, a city), one real picture of that world can carry a section: find it with `node C:/Users/vcris/OneDrive/Escritorio/AgroShield/.agents/skills/design-taste-frontend/scripts/assets.mjs "<that world>"`, download it with `--get`, credit it on the page, and never let it pass for the product or its customers.

Photographs appear inside the motif's shape. If there is product interface to show, it sits on a flat colour stage shaped by the motif. Draw the shape with CSS or a simple inline SVG path; do not draw illustrations.

**Floor (the inspector checks it):** at least four real pictures on the page, usually six to twelve; SVG drawings do not count. One moving picture where an honest clip exists: `node <skill>/scripts/assets.mjs --video "<query>"`, used as a muted loop with a poster frame. Whatever this direction says about pictures, it is carried out with real ones.

Optional atmosphere, two at most, from the "Architecture" set (structure, lines, bridges, facades and building interiors). The page does not need them.
Order of preference for imagery: (1) the project's own photographs and product shots; (2) images you generate, if an image tool is
available; (3) real pictures of the subject's world found in the open collections (assets.mjs, downloaded and credited on the page);
(4) drawings of the subject in code; (5) these. They are real photographs (Unsplash licence, served by picsum.photos) of places, light and
texture. They are atmosphere, never a stand-in for a specific product, dish, person or interface. List the ones you use in your report so
they can be replaced.
- `https://picsum.photos/id/693/1600/1000` ÔÇö Red suspension bridge tower rising from fog above rugged cliffs ┬À mid tone ┬À rust red, grey, dark teal ┬À calm area: left ┬À native landscape ┬À photo: Rob Bye
- `https://picsum.photos/id/1081/1600/1000` ÔÇö Stepped white modern building corner rising into a pale blue sky ┬À light tone ┬À white, pale blue, soft grey ┬À calm area: top ┬À native landscape ┬À photo: Julien Moreau
- `https://picsum.photos/id/887/1600/1000` ÔÇö White apartment block facade with repeating balconies and windows ┬À light tone ┬À white, pale grey, soft red ┬À native landscape ┬À photo: Roman Kraft
- `https://picsum.photos/id/508/1600/1000` ÔÇö Tall pointed vaults and pale columns of a church interior ┬À light tone ┬À cream, warm grey, soft orange ┬À native portrait ┬À photo: Jeff Sheldon
The last two path numbers are width and height: request the exact crop you render (`/1200/1500` for a 4:5 portrait, `/2400/1350` for a hero) and
add `?grayscale` to desaturate. Use at most two. Always set `width`, `height`, `alt` and `loading="lazy"` (not on the hero image).
Other sets that fit this brief: fog-and-quiet, sky-and-space ÔÇö `node draw.mjs --photos <set>` prints one in full; `--photos list` shows all sets. Taking photographs from another set is your call and is not a redraw; keep them to one light and one treatment.

## 6. Hero ÔÇö Fragment on a shaped stage
A neutral ground. The headline occupies the upper-left third: two lines at clamp(52px, 5.2vw, 80px), medium weight, flush left on columns 1ÔÇô6 at a 40px margin, starting 150px down. One supporting sentence at 18px, max 40ch, follows, then the single action as a small rectangular button. The rest of the screen belongs to one flat stage in a saturated colour: it spans columns 5ÔÇô12, begins 42% down, and bleeds off the right and bottom edges. Its top-left corner is cut with the product's own shape using `clip-path` (a notch, a chamfer or a tab two columns wide), the only decoration on the page. On the stage, 56px in from its left and top edges, sits the main fragment of the interface at true size with labels at 13ÔÇô15px, built in HTML and working: one panel or control about 620px wide, cropped by the bottom edge, never a whole window and never inside a browser or laptop frame. Mark its root with data-ui. Navigation is a plain row at 28px from the top: wordmark left and four text links right at 15px. Nothing overlaps the headline.

On a phone: The headline sits under the wordmark at 10vw on two lines, followed by the sentence at 16px and the button. The stage comes next at full width, bleeding off both sides and the bottom, its corner cut kept at 72px wide. The fragment sits 16px inside it at true size; if it is wider than the screen the right edge crops it rather than scaling it down.
Headline: A plain statement of what the product does in three to six words, two lines of up to about 16 characters each at 5.2vw.

## 7. Sections, in order
Each is a composition to rebuild with this project's content. Keep the geometry; change the subject. Re-order or drop a
section when the argument of the page needs it (see references/copy.md), never to fall back to a card grid.

### 1. how-it-works ÔÇö Drag through the stages (split)
A 50/50 split, 88svh tall: two flat fields meeting on a clean vertical edge, and one slider that drives both. Left field: the current stage as a clause of three to six words at clamp(40px, 4.6vw, 76px) on two lines, top-left from column 1, starting with its order word; it serves as the heading. Right field: one fragment of the product at true size, about 440px wide, centred, root marked data-ui, in the state that matches the clause. Along the bottom, crossing both fields inside 28px margins, a real range `<input>` with four stops: a solid track 8px tall, the part already passed in full ink, and a square thumb 32px across in the accent. Under the track, four stage names at 16px, the current one in full ink. Dragging, or the arrow keys, swaps the clause and the fragment's state with a 200ms crossfade; nothing depends on scroll.
On a phone: The fragment's field comes first, 46svh, the fragment at true size and cropped to its active region. The slider follows directly beneath on the seam, thumb 40px. Then the clause field: the clause at 9vw on two lines, with the four stage names under it in a two-by-two block at 15px.

### 2. features ÔÇö Specimens on colour tiles (grid)
Each capability is represented by one object photographed alone and shown on a flat colour tile. Columns 1ÔÇô3 hold the heading (two to four words at 40ÔÇô52px), top-aligned, with a 30ch sentence beneath and nothing else down the rest of that column. Columns 4ÔÇô12 hold a grid of five or six tiles in two rows with 10px gaps: tiles are 4:5 except one, which is double width at 8:5 and placed second in the first row. Tile colours rotate through three palette fields. Each photograph is centred at about 70% of its tile's height; on light tiles use mix-blend-mode: multiply so a white studio background disappears. Under each tile, outside it and aligned to its left edge: the capability name at 20px medium and one fact at 16px in the soft ink. No text on the tiles and no hover lift.
On a phone: The heading and its sentence sit on top at full width. Tiles become a two-column grid with 8px gaps; the double tile spans both columns at 8:5 and comes first. Names shrink to 17px and facts to 15px, still under each tile.

### 3. showcase ÔÇö One control, blown up (full-bleed)
A flat saturated field, full-bleed and 92svh tall, holds one working control from the product: the toggle, slider, segmented switch or record button the whole product turns on. Build it at true proportions with every dimension in em, mark its root data-ui, then raise that root's font-size until the control stands about 46vh tall. Anchor it right of centre so the section's right and bottom edges crop about a fifth of it (overflow: hidden on the section). It keeps its real label and value, now at poster size, and it works: operating it swaps the field between two palette colours and changes one word of the heading. The heading, two to four words at clamp(28px, 2.6vw, 40px), sits top-left on the page margin with one sentence at 17px beneath it. The lower-left third of the field stays empty.
On a phone: The field is 86svh. Heading and sentence sit top-left at 26px and 16px. The control is enlarged to about 130vw wide and anchored bottom-left, so the right edge crops its far end while its thumb or active segment stays within reach. It still works and still swaps the field colour.

### 4. about ÔÇö Inset panel, shaped portrait (split)
A deep-toned panel inset 20px from the page edges with a 12px radius, about 110svh tall, `overflow: hidden`. Left half: a two-line statement of four to seven words at clamp(40px, 4.4vw, 64px) in a pale ink, top-left with 56px padding; it is the heading and has nothing above it. Below it a photograph of the person or the workshop, masked with `clip-path` or an SVG `mask` to one bold shape taken from the subject (a four-lobed flower, a circle, an arch, a chamfered block), 38vw across, positioned so the panel's bottom edge crops its lowest fifth. Right side, starting at 63% of the width and 56px from the top: two text blocks 300px wide and 64px apart, each a subhead at 22px over a four-line paragraph at 15px; then one solid button in the accent colour. Between the statement and the text blocks the panel is empty. One photograph only.
On a phone: The panel is inset 10px and stacks: the statement at 8.5vw, then the two text blocks at full width, the button, and last the shaped photograph at 86vw across, centred and cropped by the panel's bottom edge by a quarter of its height.

Adjusted for this page:
- It names its own corners: use the one radius of this page (square unless the direction says otherwise) and one button shape.
- It sets a sentence large over several lines: jurors read that as a long headline. Either cut it to a two-line headline at display size, or keep it a statement at 36px or less on three lines (24px, four lines on a phone).

### 5. faq ÔÇö Accordion of filled tiles (stack)
A two-part row. Columns 1ÔÇô4 hold the heading, two to four words at about 4vw, `position: sticky; top: 96px` so it stays while the list scrolls past. Columns 5ÔÇô12 hold the accordion: each question is a filled tile one step from the page ground, with 8px between tiles, no border and the page's one radius (or its motif's corner). A closed tile is 72px tall with the question at 20px medium on the left, 24px padding, and on the right a plus sign drawn from two 3px bars 16px long. The open tile switches to the accent colour with its assigned ink, the plus becomes a minus by rotating one bar, and the answer appears at 17px, no wider than 52ch. Build each tile as `<details>` with a shared `name` so one opens at a time. Six to nine tiles.
On a phone: The heading sits above at 9vw, not sticky. Tiles run full width with 6px gaps, questions at 18px wrapping to two lines, closed height at least 64px. The open tile keeps the accent colour, and answers are set at 16px with 20px padding.

### 6. contact ÔÇö Clip-out coupon form (split)
The form is a coupon to cut out. One filled card in a strong flat colour, about 2.2:1, spans columns 2ÔÇô11 with a 14px radius, with 120px of ground above and below. Semicircular notches 28px across are cut into its top and bottom edges at the 46% mark with `clip-path` or an SVG `mask`, and a vertical row of round dots (a dotted `border-left` 5px thick in the ground colour) joins the two notches as the perforation. Left of the perforation, with 48px padding: a two-line heading of three to five words at clamp(28px, 3vw, 44px) in heavy capitals at the top, and one sentence at 16px at the bottom. Right of it: four inputs stacked with 10px gaps, each a filled block 52px tall in a lighter tone of the card with its placeholder at 16px, then a full-width solid submit bar 56px tall in the darkest ink. Inputs keep visually hidden `label` elements.
On a phone: The card turns upright and spans the width with 12px margins. The perforation becomes horizontal: notches on the left and right edges, dots across. Heading and sentence sit above it; the four inputs and the submit bar sit below, each 54px tall.

Adjusted for this page:
- It names its own corners: use the one radius of this page (square unless the direction says otherwise) and one button shape.
- It names a kind of typeface: use the dealt faces (display Switzer, text Switzer) and their settings; capitals only where the type system sets them.
- It draws lines or borders: keep them only inside a table, a form or a `data-ui` fragment; elsewhere separate with space or a change of ground.

## 8. Motion ÔÇö Shutter image
The one hero or showcase image opens from an edge with a clip-path over about 1.1 seconds while the picture inside settles from 1.12 scale to rest. Use it once, on the image that matters most; later images simply are there. Recipe: 'Image shutter' in references/motion.md.
This is the signature move, the one loud moment. Around it the page still needs the rest of the motion layer (SKILL.md step 9): an entrance for the parts of every section, feedback on every control, and one moving picture. The inspector fails a page that barely moves. Recipes: references/motion.md.

## 10. Where the richness comes from
One shape at many sizes. The giant cropped shape gives the hero mass and colour without a single image.

## 11. How this direction goes wrong
One motif means one. A circle here, a hexagon there and a blob behind is the generated look this replaces. The motif must come from the subject and you must be able to say from where in one clause.

## 12. Real references
Studied sites that work this way. Take the principle, never the specifics: no names, copy, images or signature assets of theirs.
- **Superlocal 2026** (One Page Love, studied score 7.4) `opl-superlocal-2026`
  Idea: Everything is a circle: a dot-matrix logotype whose dots become floating photo circles and glowing orbs across a grey-to-orange field.
  Hero: Mid-grey field with a faint dot grid (one dot every 33px) that fades through the lower half into saturated orange at the bottom edge. The captured first paint contains one element: a 270├ù80px logotype dead centre, built from black ellipses of varying size, its letters progressively compressed to the right. No nav or text yet. After loading, a cluster of four small pills (one black, three white) appears top-centre; the logo turns white inside a 330px ring of about fifty tiny circles ÔÇö round photo crops, glowing orbs, coins; and the bottom edge carries the event name left and dates right in an outlined dot-matrix face 40px tall.
  Worth taking: Build the logotype from a dot matrix of ellipses of varying size, then reuse the same matrix at screen-filling scale as the footer background.
- **Midnight** (One Page Love, studied score 7.1) `opl-midnight-2`
  Idea: The headline's circles are literally pictured: one blurred dark ring, sliced into horizontal bands, becomes the hero, the demo panel, the session cards and the footer.
  Hero: No navigation at all. A canvas fills the full width and the top 90% of the viewport: a huge out-of-focus dark navy ring on drifting taupe, sage and terracotta, cut into horizontal bands about 78px tall that are slightly offset like blinds. On the vertical centre line, starting 58px from the left, sit a small rounded-square line icon and a one-line headline at 48px in cream. On the same baseline, starting 59% across, a two-line 17px statement whose first sentence is white and bold while the rest drops to half opacity. The cream page background shows as a 90px strip at the bottom. No button.
  Worth taking: Slice a soft blurred gradient into horizontal bands with small offsets so a familiar glow becomes a recognisable, ownable texture.
- **Rows** (One Page Love, studied score 7.5) `opl-rows`
  Idea: Radical understatement: a product about simple lists is sold with a 27px headline, 12px copy and a column of small live demos, each proving one interaction.
  Hero: Warm off-white page, almost empty. Everything hangs on one vertical line 27% in from the left. A small striped-letter logo mark sits there near the top; 220px lower comes a two-line headline at only 27px (under 2vw), then three lines of 13px body about 370px wide, then a near-black rectangular button with 4px corners beside a text link with an arrow. A single grey sign-in link sits in the top-right corner; there is no navigation bar. More than 80% of the viewport is blank. At the bottom edge the first feature module peeks in: grey demo panel left, short text column right.
  Worth taking: Set the headline at near-body size (under 2vw) and let empty space, not scale, give it importance.
Full notes on any of them: `node draw.mjs --site <id>`.

## Always
Headlines two lines or fewer at every width. No eyebrow labels, no monospace, no 01/02/03, no thin rules, no gradients, no shadows at rest,
no cream-and-terracotta, no violet. The frame: one h1 on the first screen that says what this is, equal outer margins, no
section huddled on one side with the other half empty, no blank stretch over half a screen, a heading on every section.
`inspect.mjs` measures all of it.

Saved to C:/Users/vcris/OneDrive/Escritorio/AgroShield/.taste-skill/direction.json ┬À reprint with `node draw.mjs --show`
