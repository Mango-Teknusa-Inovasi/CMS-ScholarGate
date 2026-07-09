# Webpage Design Specification

Mode: Structure Mode
Target tool: Generic AI Builder
Target stack: Generic
Emphasize layout geometry, section flow, spacing, alignment, hierarchy, and responsive structure.
Use this as an implementation brief, not a literal page clone or content scrape.

## Page Theme / Context
cms 

## Screenshot References
- Screenshot 1: Full page. Best-effort full-page screenshot. Sticky or fixed elements may repeat in the stitched full-page screenshot. Filename: screenshot-01-full-page.png.
- Screenshot 2: Full page. Best-effort full-page screenshot. Sticky or fixed elements may repeat in the stitched full-page screenshot. Filename: screenshot-02-full-page.png.
- Screenshot 3: Full page. Best-effort full-page screenshot. Sticky or fixed elements may repeat in the stitched full-page screenshot. Filename: screenshot-03-full-page.png.
- Screenshot 4: Full page. Best-effort full-page screenshot. Sticky or fixed elements may repeat in the stitched full-page screenshot. Filename: screenshot-04-full-page.png.
- Screenshots are reference context only. Do not reuse original images, logos, illustrations, videos, or proprietary media.

## Viewport / Page Context
- Analyzed viewport: 1469x865px at 1 device pixel ratio.
- Source URL is reference-only for context: https://ppsmk.dindik.jatimprov.go.id/artikel/mendikdasmen-dan-gubernur-jatim-lepas-3000-lulusan-smk-ke-luar-negeri-sekaligus-meluncurkan-pro.
- Treat all visible copy, branding, and source-specific names as non-transferable. Recreate only the design structure and styling system.
- Extraction note: Large page detected. Extraction was summarized to avoid noisy output.

## Layout System
- Container pattern: centered medium-width containers with occasional full-width bands.
- Alignment: mixed full-width and constrained alignment.
- Section spacing: moderate vertical rhythm, around 61px between major sections.
- Max visible section width observed: ~1461px.
- Display systems: 1 flex-like section, observed column counts: 1, 2.

## Object Inventory
- Text blocks: 31 detected. 31 visible text blocks forming heading, body, and supporting copy hierarchy
- Images/media: 17 detected. 17 visible media/icon/mockup elements used as visual support, not reusable assets
- Buttons/CTAs: 43 detected. multiple repeated CTA/link controls arranged for scanning
- Links: 11 detected. 11 text links used for navigation or secondary actions
- Cards/containers: 44 detected. 23 card-like blocks with repeated content grouping and bounded surfaces; 21 structural container/wrapper elements defining layout bounds
- Lists/grids: 24 detected. 24 semantic or visual list/groupings with repeated item rhythm
- Tables: not strongly detected. Not strongly detected in current viewport.
- Forms/controls: 9 detected. 4 form areas with inputs, labels, and submission controls; 5 input/control elements with grouped interaction affordances
- Galleries/slideshows: not strongly detected. Not strongly detected in current viewport.
- Video/audio/embeds/widgets: not strongly detected. Not strongly detected in current viewport.
- Icons: 5 detected. 5 compact icon/symbol elements used for visual cues
- Dividers: not strongly detected. Not strongly detected in current viewport.
- Representative additional objects:
  - Text link/navigation item: x~1163px, y~710px, w~202px, h~66px; right side, lower viewport, ~1163px from left and ~710px from top.
  - Form region: x~567px, y~5293px, w~119px, h~40px; center area, lower viewport, ~567px from left and ~5293px from top.
  - Card or bounded content surface: x~56px, y~144px, w~1350px, h~143px; left side, upper viewport, ~56px from left and ~144px from top.
  - Structural container/wrapper: x~0px, y~80px, w~1461px, h~6493px; left side, upper viewport, ~0px from left and ~80px from top.
  - Icon or small symbolic graphic: x~1087px, y~687px, w~64px, h~64px; right side, lower viewport, ~1087px from left and ~687px from top.

## Sections
### Section 1: Sticky Header / Navigation
- Geometry: x~0px, y~0px, w~1461px, h~80px.
- Placement: central area, upper viewport, ~0px from left and ~0px from top.
- Layout: block layout with 1 visible column and 1461px visible width; Internal gap not strongly detected.
- Contains:
  - logo/identity area: leading navigation identity zone; x~56px, y~21px, w~170px, h~38px; left side, upper viewport, ~56px from left and ~21px from top
  - navigation/action controls: 9 link/control items grouped in the header; x~56px, y~20px, w~1242px, h~40px; left side, upper viewport, ~56px from left and ~20px from top
  - CTA/action row: 9 CTA/action controls grouped by local hierarchy; x~56px, y~20px, w~853px, h~40px; left side, upper viewport, ~56px from left and ~20px from top
  - image/media region: 1 visual media element; x~56px, y~21px, w~170px, h~38px; left side, upper viewport, ~56px from left and ~21px from top
  - list/link group: 14 list/grouping areas; x~56px, y~0px, w~1350px, h~80px; left side, upper viewport, ~56px from left and ~0px from top
- Spatial relationships:
  - Child systems are grouped inside this parent section rather than treated as separate page regions.
- Hierarchy: controls provide local action/navigation; navigation anchors the top-level page flow.
### Section 2: Hero Section
- Geometry: x~0px, y~80px, w~1461px, h~271px.
- Placement: central area, upper viewport, ~0px from left and ~80px from top.
- Layout: block layout with 1 visible column and 1461px visible width; Internal gap not strongly detected.
- Contains:
  - heading text block: 1 heading level forming the local hierarchy; x~72px, y~180px, w~1318px, h~43px; left side, upper viewport, ~72px from left and ~180px from top
  - supporting text block: 1 supporting text block; x~72px, y~239px, w~768px, h~48px; left side, upper viewport, ~72px from left and ~239px from top
  - CTA/action row: 2 CTA/action controls grouped by local hierarchy; x~72px, y~144px, w~126px, h~20px; left side, upper viewport, ~72px from left and ~144px from top
  - list/link group: 1 list/grouping area; x~72px, y~144px, w~1318px, h~20px; left side, upper viewport, ~72px from left and ~144px from top
- Spatial relationships:
  - Supporting text sits ~16px below the local heading block.
  - Heading and supporting text share a consistent left edge.
- Hierarchy: heading anchors the local section hierarchy; controls provide local action/navigation.
### Section 3: Sidebar Widget Region
- Geometry: x~1070px, y~415px, w~320px, h~4953px.
- Placement: right side, middle viewport, ~1070px from left and ~415px from top.
- Layout: block layout with 1 visible column and 320px visible width; Internal gap not strongly detected.
- Contains:
  - heading text block: 5 heading levels forming the local hierarchy; x~1163px, y~707px, w~210px, h~419px; right side, lower viewport, ~1163px from left and ~707px from top
  - supporting text block: 1 supporting text block; x~1095px, y~1579px, w~270px, h~91px; right side, lower viewport, ~1095px from left and ~1579px from top
  - repeated feed/list rows: dense repeated rows with aligned detail blocks and repeated actions; x~1070px, y~415px, w~320px, h~1372px; right side, middle viewport, ~1070px from left and ~415px from top
  - CTA/action row: 5 CTA/action controls grouped by local hierarchy; x~1087px, y~687px, w~64px, h~734px; right side, lower viewport, ~1087px from left and ~687px from top
  - image/media region: 5 visual media elements; x~1087px, y~687px, w~64px, h~560px; right side, lower viewport, ~1087px from left and ~687px from top
  - sidebar widget/ad region: 1 high-confidence embed/widget modules aligned inside this section; x~1070px, y~415px, w~320px, h~4953px; right side, middle viewport, ~1070px from left and ~415px from top
  - repeated card group: 10 card-like items grouped as one card system; x~1087px, y~687px, w~286px, h~654px; right side, lower viewport, ~1087px from left and ~687px from top
  - list/link group: 6 list/grouping areas; x~1095px, y~476px, w~270px, h~1286px; right side, middle viewport, ~1095px from left and ~476px from top
- Spatial relationships:
  - Repeated cards use ~32px vertical rhythm inside this section.
  - Repeated rows are grouped as one feed/list region rather than separate sections.
- Hierarchy: heading anchors the local section hierarchy; controls provide local action/navigation.
### Section 4: Hero Section
- Geometry: x~73px, y~416px, w~964px, h~1038px.
- Placement: central area, middle viewport, ~73px from left and ~416px from top.
- Layout: block layout with 2 visible columns and 964px visible width; Internal gap not strongly detected.
- Contains:
  - heading text block: 1 heading level forming the local hierarchy; x~105px, y~490px, w~900px, h~120px; left side, middle viewport, ~105px from left and ~490px from top
  - supporting text block: 1 supporting text block; x~105px, y~626px, w~768px, h~56px; left side, lower viewport, ~105px from left and ~626px from top
  - repeated feed/list rows: dense repeated rows with aligned detail blocks and repeated actions; x~105px, y~448px, w~900px, h~1006px; left side, middle viewport, ~105px from left and ~448px from top
  - CTA/action row: 5 CTA/action controls grouped by local hierarchy; x~105px, y~448px, w~593px, h~26px; left side, middle viewport, ~105px from left and ~448px from top
  - image/media region: 1 visual media element; x~105px, y~746px, w~900px, h~708px; left side, lower viewport, ~105px from left and ~746px from top
  - list/link group: 8 list/grouping areas; x~105px, y~448px, w~593px, h~274px; left side, middle viewport, ~105px from left and ~448px from top
- Spatial relationships:
  - Supporting text sits ~16px below the local heading block.
  - Heading and supporting text share a consistent left edge.
  - Repeated rows are grouped as one feed/list region rather than separate sections.
- Hierarchy: heading anchors the local section hierarchy; controls provide local action/navigation.
### Section 5: Feed/List Section
- Geometry: x~73px, y~1454px, w~964px, h~3913px.
- Placement: central area, lower viewport, ~73px from left and ~1454px from top.
- Layout: flex layout with 2 visible columns and 964px visible width; Internal gap not strongly detected.
- Contains:
  - supporting text block: 2 supporting text blocks; x~105px, y~1486px, w~900px, h~3849px; left side, lower viewport, ~105px from left and ~1486px from top
  - repeated feed/list rows: dense repeated rows with aligned detail blocks and repeated actions; x~105px, y~1486px, w~900px, h~3849px; left side, lower viewport, ~105px from left and ~1486px from top
  - form/input group: form surface with grouped controls; x~567px, y~5293px, w~438px, h~40px; center area, lower viewport, ~567px from left and ~5293px from top
  - CTA/action row: 5 CTA/action controls grouped by local hierarchy; x~438px, y~5293px, w~567px, h~40px; center area, lower viewport, ~438px from left and ~5293px from top
  - image/media region: 3 visual media elements; x~105px, y~1779px, w~900px, h~3423px; left side, lower viewport, ~105px from left and ~1779px from top
  - list/link group: 7 list/grouping areas; x~105px, y~5291px, w~900px, h~44px; left side, lower viewport, ~105px from left and ~5291px from top
- Spatial relationships:
  - Repeated rows are grouped as one feed/list region rather than separate sections.
- Hierarchy: heading anchors the local section hierarchy; controls provide local action/navigation; dense repeated rows prioritize scanning and repeated actions.
### Section 6: Card Grid Section
- Geometry: x~72px, y~5408px, w~966px, h~1086px.
- Placement: central area, lower viewport, ~72px from left and ~5408px from top.
- Layout: block layout with 1 visible column and 966px visible width; Internal gap not strongly detected.
- Contains:
  - heading text block: 7 heading levels forming the local hierarchy; x~72px, y~5408px, w~615px, h~464px; left side, lower viewport, ~72px from left and ~5408px from top
  - supporting text block: 7 supporting text blocks; x~72px, y~5436px, w~945px, h~490px; left side, lower viewport, ~72px from left and ~5436px from top
  - image/media region: 6 visual media elements; x~73px, y~5473px, w~964px, h~739px; left side, lower viewport, ~73px from left and ~5473px from top
  - repeated card group: 12 card-like items grouped as one card system; x~72px, y~5472px, w~966px, h~1021px; left side, lower viewport, ~72px from left and ~5472px from top
  - list/link group: 20 list/grouping areas; x~72px, y~5408px, w~966px, h~566px; left side, lower viewport, ~72px from left and ~5408px from top
- Spatial relationships:
  - Heading and supporting text share a consistent left edge.
  - Repeated cards use ~24px vertical rhythm inside this section.
- Hierarchy: heading anchors the local section hierarchy; controls provide local action/navigation.
### Section 7: Footer / Utility Section
- Geometry: x~0px, y~6573px, w~1461px, h~400px.
- Placement: central area, lower viewport, ~0px from left and ~6573px from top.
- Layout: block layout with 2 visible columns and 1461px visible width; Internal gap not strongly detected.
- Contains:
  - supporting text block: 1 supporting text block; x~104px, y~6725px, w~384px, h~68px; left side, lower viewport, ~104px from left and ~6725px from top
  - CTA/action row: 17 CTA/action controls grouped by local hierarchy; x~104px, y~6654px, w~513px, h~195px; left side, lower viewport, ~104px from left and ~6654px from top
  - image/media region: 1 visual media element; x~104px, y~6654px, w~179px, h~40px; left side, lower viewport, ~104px from left and ~6654px from top
  - footer utility link columns: 9 list/grouping areas; x~104px, y~6698px, w~615px, h~151px; left side, lower viewport, ~104px from left and ~6698px from top
- Spatial relationships:
  - Footer utility links are grouped as one parent region with compact column/list rhythm.
- Hierarchy: controls provide local action/navigation; footer groups low-emphasis utility links.

## Spatial Relationships
- Hero Section starts ~0px below adjacent Sticky Header / Navigation.
- Hero Section shares a left-edge alignment with Sticky Header / Navigation.
- Hero Section shares a right-edge alignment with Sticky Header / Navigation.
- Sidebar Widget Region starts ~64px below adjacent Hero Section.
- Hero Section starts ~0px below adjacent Sidebar Widget Region.
- Feed/List Section starts ~0px below adjacent Hero Section.
- Feed/List Section shares a left-edge alignment with Hero Section.
- Feed/List Section shares a right-edge alignment with Hero Section.
- Card Grid Section starts ~41px below adjacent Feed/List Section.
- Card Grid Section shares a left-edge alignment with Feed/List Section.
- Card Grid Section shares a right-edge alignment with Feed/List Section.
- Footer / Utility Section starts ~79px below adjacent Card Grid Section.

## Text System
- Summary: 31 visible text blocks forming heading, body, and supporting copy hierarchy
- Primary heading text block: x~72px, y~180px, w~1318px, h~43px; left side, upper viewport, ~72px from left and ~180px from top; aspect 30.7:1.
  - Notes: block display; text #374151; padding 0/0/0/0; Onest; 36px; weight 700; line-height 40px; start aligned; ~14 chars, ~1 lines; highest text emphasis in its local area
- Body/supporting text block: x~72px, y~239px, w~768px, h~48px; left side, upper viewport, ~72px from left and ~239px from top; aspect 16:1.
  - Notes: block display; text #6b7280; padding 0/0/0/0; Onest; 16px; weight 400; line-height 24px; start aligned; ~119 chars, ~2 lines; supports local layout hierarchy
- Primary heading text block: x~105px, y~490px, w~900px, h~120px; left side, middle viewport, ~105px from left and ~490px from top; aspect 7.5:1.
  - Notes: block display; text #111827; padding 0/0/0/0; Onest; 36px; weight 700; line-height 40px; start aligned; ~119 chars, ~3 lines; highest text emphasis in its local area
- Body/supporting text block: x~105px, y~626px, w~768px, h~56px; left side, lower viewport, ~105px from left and ~626px from top; aspect 13.7:1.
  - Notes: block display; text #6b7280; padding 0/0/0/0; Onest; 16px; weight 400; line-height 28px; start aligned; ~119 chars, ~2 lines; supports local layout hierarchy
- Describe new copy by role and hierarchy only; do not reuse source headings, article text, reviews, names, or proprietary phrases.

## Image System
- Summary: 17 visible media/icon/mockup elements used as visual support, not reusable assets
- Supporting image placeholder: x~56px, y~21px, w~170px, h~38px; left side, upper viewport, ~56px from left and ~21px from top; aspect 4.5:1.
  - Notes: block display; text #1f2937; padding 0/0/0/0; ~2 lines; supporting visual object
- Hero/product mockup placeholder: x~105px, y~746px, w~900px, h~708px; left side, lower viewport, ~105px from left and ~746px from top; aspect 1.3:1.
  - Notes: block display; text #1f2937; padding 0/0/0/0; ~30 lines; large visual focal object
- Hero/product mockup placeholder: x~105px, y~1779px, w~900px, h~1125px; left side, lower viewport, ~105px from left and ~1779px from top; aspect 0.8:1.
  - Notes: block display; text #374151; 16px radius; padding 0/0/0/0; ~42 lines; large visual focal object
- Hero/product mockup placeholder: x~105px, y~2928px, w~900px, h~1125px; left side, lower viewport, ~105px from left and ~2928px from top; aspect 0.8:1.
  - Notes: block display; text #374151; 16px radius; padding 0/0/0/0; ~42 lines; large visual focal object
- Use original, licensed, royalty-free, or placeholder assets. Do not reuse source logos, brand assets, images, illustrations, videos, or proprietary media.

## Button System
- Summary: multiple repeated CTA/link controls arranged for scanning
- Primary wide CTA control: x~56px, y~21px, w~170px, h~38px; left side, upper viewport, ~56px from left and ~21px from top; aspect 4.5:1.
  - Notes: block display; text #1f2937; padding 0/0/0/0; ~2 lines; high-emphasis action; click/tap action control
- Compact CTA/control: x~401px, y~20px, w~95px, h~40px; center area, upper viewport, ~401px from left and ~20px from top; aspect 2.4:1.
  - Notes: flex display; text #374151; 12px radius; padding 8/16/8/16; ~7 chars, ~2 lines; compact action or navigation control; click/tap action control
- Compact CTA/control: x~504px, y~20px, w~95px, h~40px; center area, upper viewport, ~504px from left and ~20px from top; aspect 2.4:1.
  - Notes: flex display; text #374151; 12px radius; padding 8/16/8/16; ~6 chars, ~2 lines; compact action or navigation control; click/tap action control
- Compact CTA/control: x~607px, y~20px, w~80px, h~40px; center area, upper viewport, ~607px from left and ~20px from top; aspect 2:1.
  - Notes: flex display; bg #ecfeff; text #0891b2; 12px radius; padding 8/16/8/16; ~7 chars, ~2 lines; compact action or navigation control; click/tap action control
- Preserve CTA placement, size hierarchy, and action grouping while writing original labels.

## List System
- Summary: 24 semantic or visual list/groupings with repeated item rhythm
- Repeated list/grouped item system: x~56px, y~0px, w~1350px, h~80px; left side, upper viewport, ~56px from left and ~0px from top; aspect 16.9:1.
  - Notes: flex display; text #1f2937; padding 0/0/0/0; ~61 chars, ~3 lines; 3 items; horizontal; item spacing ~175px; icon + text row pattern detected; mixed or wrapped alignment; no obvious separators; airy list rhythm; supports local layout hierarchy
- Repeated list/grouped item system: x~401px, y~0px, w~625px, h~80px; center area, upper viewport, ~401px from left and ~0px from top; aspect 7.8:1.
  - Notes: flex display; text #374151; padding 0/0/0/0; ~49 chars, ~3 lines; 6 items; horizontal; item spacing ~8px; native bullet/ordered marker pattern detected; mixed or wrapped alignment; no obvious separators; compact list rhythm; supports local layout hierarchy
- Repeated list/grouped item system: x~504px, y~0px, w~95px, h~80px; center area, upper viewport, ~504px from left and ~0px from top; aspect 1.2:1.
  - Notes: flex display; relative positioning; text #374151; padding 0/0/0/0; ~6 chars, ~3 lines; unknown; item spacing not strongly detected; native bullet/ordered marker pattern detected; alignment not strongly detected; no obvious separators; moderate/unknown list rhythm; supports local 
- Repeated list/grouped item system: x~796px, y~0px, w~113px, h~80px; center area, upper viewport, ~796px from left and ~0px from top; aspect 1.4:1.
  - Notes: flex display; relative positioning; text #374151; padding 0/0/0/0; ~8 chars, ~3 lines; unknown; item spacing not strongly detected; native bullet/ordered marker pattern detected; alignment not strongly detected; no obvious separators; moderate/unknown list rhythm; supports local 
- Group repeated rows/cards by structural rhythm instead of copying source item names or descriptions.

## Table System
- No strong table/data system detected.
- If tables are needed, recreate column structure, density, borders, and alignment, not source data.

## Gallery / Slideshow System
- No strong gallery or slideshow system detected.
- Use placeholder/original media with similar aspect ratios and visual weight.

## Video / Audio / Embed / Widget System
- No strong video, audio, embed, or widget system detected.
- Represent third-party embeds as safe placeholder modules unless the new project provides its own integrations.

## Forms / Controls
- Summary: 4 form areas with inputs, labels, and submission controls; 5 input/control elements with grouped interaction affordances
- Form region: x~567px, y~5293px, w~119px, h~40px; center area, lower viewport, ~567px from left and ~5293px from top; aspect 3:1.
  - Notes: block display; text #1f2937; padding 0/0/0/0; ~8 chars, ~2 lines; 0 standard inputs; single-column/stacked control grouping; field spacing not strongly detected; field edge alignment varies or is not strongly detected; textarea scale not applicable or not detected; submit button 
- Form region: x~694px, y~5293px, w~124px, h~40px; center area, lower viewport, ~694px from left and ~5293px from top; aspect 3.1:1.
  - Notes: block display; text #1f2937; padding 0/0/0/0; ~8 chars, ~2 lines; 0 standard inputs; single-column/stacked control grouping; field spacing not strongly detected; field edge alignment varies or is not strongly detected; textarea scale not applicable or not detected; submit button 
- Form region: x~826px, y~5293px, w~63px, h~40px; right side, lower viewport, ~826px from left and ~5293px from top; aspect 1.6:1.
  - Notes: block display; text #1f2937; padding 0/0/0/0; ~1 chars, ~2 lines; 0 standard inputs; single-column/stacked control grouping; field spacing not strongly detected; field edge alignment varies or is not strongly detected; textarea scale not applicable or not detected; submit button 
- Form region: x~897px, y~5293px, w~108px, h~40px; right side, lower viewport, ~897px from left and ~5293px from top; aspect 2.7:1.
  - Notes: block display; text #1f2937; padding 0/0/0/0; ~7 chars, ~2 lines; 0 standard inputs; single-column/stacked control grouping; field spacing not strongly detected; field edge alignment varies or is not strongly detected; textarea scale not applicable or not detected; submit button 
- For forms and controls, preserve control sizing, spacing, grouping, and alignment while using original labels.

## Color System
- Theme: light theme.
- Palette mood: mostly white/gray backgrounds with black/dark text and blue primary CTA accents.
- Dominant colors: #1f2937 (accent/supporting), #111827 (black/dark text), #ffffff (white/background surface), #6b7280 (accent/supporting), #374151 (supporting), #047857 (supporting), #f9fafb (white/background surface), #f4e8d9 (supporting).
- Gradients: linear-gradient(to right bottom, rgb(236, 253, 245), rgb(250, 250, 249)).
- Typography: families Onest; headings range around 36px, 20px, 18px, 14px; weights include 400, 700, 600; body text around 16px, 14px; text alignments include start, center.
- Radius/border/shadow: radius values commonly include 16px, 12px, 10 sampled elements use subtle borders, often around cards/buttons/inputs, shadow/elevation appears on key surfaces: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0.
- Density/action styling: dense, information-rich layout with many scannable elements, consistent action controls with 12px radius.
- Readability: body text around 16px, 14px; dominant text/background colors should be checked for contrast.

## Responsive Notes
- Analyzed at 1469x865px viewport.
- current viewport shows up to 2 columns.
- Current viewport shows up to 2 columns.
- Do not overfit to this single viewport; preserve the observed proportions, stacking logic, and spacing rhythm responsively.

## Build Guidance
- Use the source page as layout, hierarchy, spacing, and UX-flow inspiration only. Do not directly copy branding, content, assets, or proprietary details.
- Use original, licensed, royalty-free, or placeholder assets. Do not reuse source logos, brand assets, images, illustrations, videos, or proprietary media.
- Build an original page using the measured structure, spacing, colors, typography, and component systems above.
- Use placeholder, original, licensed, or royalty-free assets only.
- Avoid raw HTML recreation, source-page copy, exact brand identity, source logos, exact media, and proprietary names.
- Structure Mode priority: layout hierarchy, geometry, spatial relationships, and responsive structure can transfer; exact styling and content should remain original.