---
name: 寻迹 Mobile
description: 集邮册与销戳 —— 每篇收藏是一枚被销戳的邮票
colors:
  primary: "#b53823"
  on-primary: "#ffffff"
  primary-container: "#ffdad4"
  on-primary-container: "#400200"
  secondary: "#625a78"
  on-secondary: "#ffffff"
  secondary-container: "#e8ddff"
  on-secondary-container: "#1e1731"
  tertiary: "#446559"
  on-tertiary: "#ffffff"
  tertiary-container: "#c6ebdb"
  on-tertiary-container: "#002117"
  error: "#ba1a1a"
  error-container: "#ffdad6"
  on-error-container: "#410002"
  warning: "#9b4500"
  warning-container: "#ffdbca"
  on-warning-container: "#331200"
  success: "#006d30"
  success-container: "#95f8a7"
  on-success-container: "#00210a"
  canvas: "#f3ede0"
  card: "#fffdf7"
  card-muted: "#fbf6ed"
  field: "#e7e2d9"
  surface-container: "#f4efe5"
  surface-container-high: "#ede8de"
  text: "#2e2742"
  text-muted: "#55524b"
  divider: "#cbc6bd"
  outline: "#827e77"
  outline-variant: "#cbc6bd"
  inverse-surface: "#3f3753"
  inverse-on-surface: "#f6f0e7"
  inverse-primary: "#ffb4a6"
typography:
  display:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "36px"
    fontWeight: 400
    lineHeight: "44px"
    letterSpacing: "-0.4px"
  headline:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.4px"
  title:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "-0.15px"
  title-large:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: "28px"
    letterSpacing: "-0.2px"
  body:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0px"
  body-medium:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0px"
  body-small:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0px"
  label:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
    letterSpacing: "0.5px"
  label-medium:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.5px"
  label-small:
    fontFamily: "-apple-system, 'SF Pro Text', 'Roboto', sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.5px"
  mono:
    fontFamily: "'SF Mono', Menlo, 'Roboto Mono', monospace"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: "16px"
    letterSpacing: "0px"
rounded:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "28px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  xxxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    height: "48px"
    padding: "0 24px"
  button-tonal:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.full}"
    height: "48px"
    padding: "0 24px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    height: "48px"
    padding: "0 24px"
  card-ticket:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "16px"
  input-search:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    height: "56px"
    padding: "0 16px"
  input-save:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    height: "56px"
    padding: "0 12px"
  chip-local:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    height: "32px"
    padding: "0 12px"
  postmark:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    size: "56px"
---

# Design System: 寻迹 Mobile

## Overview

**Creative North Star: "集邮册与销戳（The Stamp Album & Postmark）"**

每篇收藏是一枚被销戳的邮票——保存的那天，邮戳就盖在它身上，找回就是从集邮册里认出那枚戳。整套系统拒绝「稍后读」类应用的品类默认：白底圆角卡片流 + 中性强调色，把收藏当成无差别的行。这里是胶面纸底、深色下是深绿集邮册布面；朱红只在寄出动作上点亮；每一枚票都有出处（来源邮票）、有日期（等宽账簿数字）、有经手痕迹（销戳的形状就是处理状态）。产品真相约束着视觉：保存成本接近于零，所以收藏面只有一个输入框；优先找回而不是管理，所以首页先是搜索胶囊，然后才是贴票。

视觉密度是「一页正在用的册页」——发丝分段线代替边框和阴影堆叠，票面之间靠色调层次拉开，戳、票、注记各占其位。状态永远先用形状编码（实圈、虚圈、划销），颜色只是确认。系统是单栏移动布局（390×844 基准），不为平板做双栏；Material 3 管结构、导航与交互，世界只出四样：字、色、密度、一个签名动作（保存瞬间邮戳弹压上票面）。

**Key Characteristics:**
- 形状即状态：实圈＝完成、虚圈＝整理中、划销＝部分/失败；先看形，再看色。
- 齿孔是票与卡的分界：点状边打穿、露出底纸（brand mark、来源邮票、空状态）。
- 销戳永远盖歪（−8°），日期用等宽数字、账簿式对齐。
- 朱红稀用：只在寄出按钮、注记图标与聚焦描边上点亮。
- 8dp 网格 + 4dp 半步；发丝分段线（1dp）代替卡片描边。

## Colors

双主题（light / dark）全 MD3 角色表，每一对 on-/container 在提交前都过 WCAG 4.5:1（描边与大图标 3:1）；上面 frontmatter 是 light 规范值，dark 值见各条括注。色种由 `@material/material-color-utilities` 从世界种子生成：朱红 `#c2402c`（压到 `#b53823` 作 light primary，保证朱红文字在每个面上都过 4.5:1）、邮戳紫黑 `#2e2742`、集邮绿 `#35564a`；中性 ramp 保持纸与布的色相在低彩度。`surfaceContainerLowest` 被钉死在暖色 `#fffdf7`——HCT 求解器在 tone 99 会偏蓝，落在纸上显脏。

### Primary
- **朱红 Vermilion** (#b53823 / dark #ff8f73): 唯一强调色。寄出/找回按钮、聚焦描边、注记「为什么找到它」的标签与 sparkles 图标、品牌标底色。它稀用，出现即动作。
- **朱红容器 Vermilion Container** (#ffdad4 / dark #8c1809): 收藏面头部圆形 softicon 底、详情页摘要栏头。

### Secondary
- **邮戳紫 Ink Violet** (#625a78 / dark #ccc1e4; 墨色本体 #2e2742 / dark #eae5d6): 全局文字墨色与 tonal 按钮/空状态图标的来源。secondaryContainer `#e8ddff`（dark #4a425f）承担 tonal 按钮、tab 选中胶囊、空状态邮票位。

### Tertiary
- **集邮绿 Album Green** (#446559 / dark #aacebf; 容器 #c6ebdb / dark #2c4d41): 册页的第二容器色，用于场景化容器与成功语义的近亲，不与朱红抢焦点。

### Neutral
- **胶面纸 Paper** (#f3ede0 / dark 布面 Cloth #1c2422): canvas/背景/表面。
- **票面 Card** (#fffdf7 / dark #242927): 卡片底。注意 dark 下 card 翻转为 surfaceContainerLow（而不是 lowest），保证卡片永远浮在 canvas 之上。
- **票面哑光 Card Muted** (#fbf6ed / dark #333836): 按压态的卡片底。
- **票口 Field** (#e7e2d9 / dark #3c413f): 票面输入区（收藏面单行输入槽）底色。
- **墨 Ink** (#2e2742 / dark #eae5d6): 主文字。**淡墨** (#55524b / dark #c8cdcb): 次要文字、占位符。
- **发丝 Divider** (#cbc6bd / dark #434846): 1dp 分段线与邮票齿孔边；**描边 Outline** (#827e77 / dark #8d9290): outlined 按钮与本地 chip 边。
- **反色面 Inverse Surface** (#3f3753 / dark #ede8de): Toast 底，配反色文字 #f6f0e7。

### Status
- **错误 Error** (#ba1a1a / dark #ffb4ab)、**警告 Warning** (#9b4500 / dark #ffb68e)、**成功 Success** (#006d30 / dark #79db8d) 及各容器色：只出现在状态文本、划销线与提示行，不做大面积底色。

### Named Rules
**The Paired-Tones Rule.** 每个色都与它的 on-/container 角色成对存在；改一个 tone 必须重新生成整对（`src/design/colorSchemes.ts` 明令禁止手改单色），否则对比度契约破裂。

**The Vermilion Restraint Rule.** 朱红是全 app 唯一强调色，且必须稀用：寄出按钮、聚焦描边、注记标签三类之外不出现大面积朱红。它的稀缺就是它的语义——「这里要寄出/这里是找到你的证据」。

## Typography

**Display/Body Font:** 系统字族——iOS SF Pro（`-apple-system`）、Android Roboto（`sans-serif`），无字体包。**Mono Font:** iOS Menlo / Android monospace，只给销戳日期。

**Character:** MD3 字阶坐在系统字上，中文与拉丁共用一套 scale；标题微收字距（−0.15 ~ −0.4px）让中文大字更紧实，正文保持 0，而 label 全员 +0.5px 字距——标签是销戳与单据上的字，是这个邮票世界的嗓音。

### Hierarchy
- **Display** (400, 36px/44px, −0.4px): 空状态大标题等超大字位。
- **Headline** (700, 32px/40px, −0.4px): 首页英雄句「今天想找点什么？」；headlineSmall (600, 24px/32px) 用于空状态标题。
- **Title** (600, 16px/24px, −0.15px): 票面标题、卡片与输入区的栏头（「提问」「收藏」）；titleLarge (500, 22px/28px) 给品牌名「寻迹」。
- **Body** (400, 16px/24px, 0): 输入内容与正文；bodyMedium (14px/20px) 摘要与注记正文；bodySmall (12px/16px) 元信息（来源 · 时间）、副标与斜体摘录。
- **Label** (500, 14px/20px, +0.5px): 按钮文字（实际加粗到 600）；labelMedium (12px/16px, +0.5px) tab 标签与 chip；labelSmall (11px/16px, +0.5px) 注记标签「为什么找到它」（实际 700、字距 1px）。

### Named Rules
**The Cancellation-Slip Label Rule.** 所有 label 保持 +0.5px（注记标签 1px）字距、500+ 字重——像销戳与注销单据上的印刷字；正文永不加字距。

**The Tabular-Date Rule.** 日期与数字走等宽（Menlo/monospace）且账簿式对齐：销戳里的年份小号 +0.8px 字距在上，月日在下加粗（11px/700 @ size 56）。

## Layout

单栏移动布局，基准视口 390×844。8dp 网格、4dp 半步（spacing: 4/8/12/16/24/32/48）；页面左右 gutter 16dp，内容最大宽 720dp（`maxContentWidth`，宽屏只居中不重排）。顶栏三种高度：small 64 / medium 112 / large 152（large 标题沉底、随内容滚走）。底部导航通栏 80dp、`surfaceContainer` 底色，滚动内容为其留 96dp 净空（`navBarClearance`）。所有可触目标 ≥48dp（iconButton 48、提交按钮触区 48 / 圆面 40、FAB 56）。首页三段式：品牌行（34dp 齿孔品牌标 + 「寻迹」+ 「仅本机」chip）→ 英雄句 → 找回（搜索胶囊）与收藏（贴票输入卡）两块，各约 112/140dp。

## Elevation & Depth

这是「色调优先」的平面系统：层次主要由 surface-container 阶梯（lowest → highest）表达，阴影只在两个表面相接处补一笔分离感，不做悬浮堆叠。dark 模式阴影不透明度更高（黑影会沉进深色 canvas）。

### Shadow Vocabulary
- **level1** (`0 1px 3px rgba(0,0,0,0.07)` / dark 0.30): 票面卡片、AskCard、SaveField——列表里每张票的默认分离。
- **level2** (`0 2px 8px rgba(0,0,0,0.10)` / dark 0.38): 需要再抬一级的表面。
- **level3** (`0 6px 16px rgba(0,0,0,0.12)` / dark 0.42): ConfirmDialog、Toast——浮层。

### Named Rules
**The Flat-By-Default Rule.** 静止表面是平的：卡片只带 level1，靠色调而非阴影分层；更重的阴影只留给真正的浮层（对话框、Toast）。

## Shapes

圆角阶梯：邮票形 4px（来源邮票、品牌标、Toast）、空状态邮票位 6px、票口输入槽只圆上角 8px、票面卡片 12px、场景容器 16px、对话框/设置分组 28px、胶囊一律 full（999px：搜索、按钮、tab 胶囊、softicon、销戳本身）。边语言只有两种：1dp 发丝线（分段线、chip 描边）和 2.5–3dp 点状边——点状边就是齿孔，打穿后露出的颜色必须是这张票贴着的底纸色（结果票上是 card、空状态上是 canvas）。销戳是正圆双环：外环 1.25dp（size ≥60 时 1.75dp），内环 1dp、内缩 5dp、45% 墨色；划销线 1.5dp、超出戳缘 3dp、再转 −14°。静态销戳整体盖歪 −8°（保存动画从 −24° 弹压到 −8°）。

### Named Rules
**The Unperforated Launcher Rule.** 齿孔只活在应用内（品牌标、来源邮票、空状态）与 Android splash（真打穿 44 孔）。启动器/iOS 图标刻意无齿孔——各家 launcher 遮罩（圆/方/水滴）与 iOS squircle 会把贴边孔洞切碎；图标保留朱红圆角方块 + 白书签。这是记录在案的刻意偏差，不是遗漏。

## Components

### Buttons
- **Shape:** 胶囊全圆角（full），高 48dp（small 40dp），水平内距 24dp（small 16dp），1dp 透明描边占位。
- **Primary:** 朱红底 + onPrimary 文字，label 14px/600/+0.5px，图标 18dp（small 16dp）。按压 opacity 0.86，禁用 0.38。
- **Tonal:** secondaryContainer 底 + onSecondaryContainer 文字——次要强调（空状态行动按钮等）。
- **Secondary / Ghost:** outlined（1dp outline 描边）与 text 按钮，文字均为 primary 色。
- Android ripple：withAlpha(前景色, 0.16)。

### Chips
- **「仅本机」assist chip:** 高 32dp、圆角 8dp、1dp outlineVariant 描边、透明底，labelMedium 淡墨文字 + 14dp shield 图标（primary 色）。

### Cards / Containers
- **Corner Style:** 票面卡片圆角 12dp；场景容器（详情页摘要、设置分组）16–28dp。
- **Background:** light 下 card `#fffdf7`（比 canvas 亮），dark 下翻转为 surfaceContainerLow；按压整卡变 card-muted。
- **Shadow Strategy:** level1（见 Elevation）。
- **Internal Padding:** 卡片 16dp（AskCard/SaveField 用 18dp），卡内分段线之上留 16dp。
- **结果票:** 来源邮票居左（40dp，最强命中 44dp），标题≤2 行、元信息 1 行、摘要≤2 行；1dp 分段线之下是「为什么找到它」注记段，销戳坐在注记行右端（60/56dp）、`marginBottom -4` 不参与布局压缩。按压反馈 ripple `withAlpha(onSurface, 0.08)` + 底色变哑。

### Inputs / Fields
- **找回（搜索胶囊）:** 高 56dp 全圆角、surfaceContainerHigh 底、1.5dp 描边透明→聚焦变 primary；尾部 40dp 朱红圆形提交（未就绪时 field 底、淡墨图标）；有内容时出现 tonal 清空按钮。
- **收藏（票口输入槽):** 高 ≥56dp、只圆上角 8dp、field 底、overflow hidden；底部 2dp 指示条透明→聚焦变 primary；头行下发丝分段线；朱红 40dp 圆形提交只在识别出合法 URL 后点亮。
- **提问卡（多行）:** 同胶囊语言但 minHeight 112dp、多行输入、提交钮沉底对齐。
- **Error:** 提示行 14dp alert 图标 + error 色 bodySmall，不做整框变红。

### Navigation
- **NavigationBar:** 通栏 80dp、surfaceContainer 底；每项 = 64×32dp 全圆角胶囊（选中 secondaryContainer）+ 24dp 图标（选中 onSecondaryContainer，未选 onSurfaceVariant）+ labelMedium 标签（选中 onSurface 600）。三个 tab：首页 / 收藏 / 我的，`router.replace` 切换。

### Postmark（签名组件）
正圆双环销戳，形状编码状态：`completed` = 实圈实线环，处理中（pending/fetching/parsing/analyzing/indexing）= 虚线环，`partial`/`failed` = 实环 + 划销线（warning/error 色，否则墨色）。内环里年份小号在上、等宽月日在下。size 56 = 票面、60 = 最强命中、64 = 详情页。戳不自带旋转：静态票面 −8° 由调用方给出；保存成功瞬间 `LivePostmark` 以 expressive spring 从 scale 1.5/−24° 弹压收敛到 1/−8°，然后作为收据留场、挂本机轮询自己从虚圈变实圈或划销（系统开启「移除动画」时直接落位）。

### SourceStamp（签名组件）
来源邮票：站点名（或域名，缺省「拾」）稳定哈希从六组 tint 里选票面色（朱红/集邮绿/邮戳紫/赭石/酒红/邮政蓝，same site = same stamp），首字压在票面中央（size×0.4px、600、票面色的对偶墨色），四周 3dp 点状边打齿孔——齿孔色 = 这张票贴着的底纸色（结果票传 card）。40dp 常规、44dp 最强命中。纯装饰，对无障碍隐藏。

### 其他
- **TopAppBar:** small 64dp（标题可居中）/ large 152dp（大标题沉底随内容滚走），返回箭头 + 48dp 触区。
- **EmptyState:** 68×68dp 邮票形图标位（6dp 圆角、secondaryContainer 底、3dp 点状边露 canvas、−6° 歪贴）+ headlineSmall 标题 + bodyMedium 说明（maxWidth 320）+ tonal small 按钮。
- **ConfirmDialog:** surfaceContainerHigh 底、28dp 圆角、24dp 内距、level3 阴影。
- **Toast:** inverseSurface 底、4px 圆角、level3 阴影，反色文字。

## Do's and Don'ts

### Do:
- **Do** 用形状表达状态：实圈＝完成、虚圈＝整理中、划销＝部分/失败（`partial` 用 warning 色划销、`failed` 用 error 色）。
- **Do** 保持 8dp 节奏（4dp 半步）、gutter 16dp、触区 ≥48dp、内容最大宽 720dp。
- **Do** 让朱红稀缺：寄出按钮、聚焦描边、注记标签三类之外不铺朱红。
- **Do** 给每张票留戳位：结果票注记行右侧、保存票右上角（标题行让位 64dp），静态戳一律 −8°、日期等宽。
- **Do** 齿孔用 2.5–3dp 点状边、边色 = 它所贴的底纸色（票上是 card、空状态是 canvas）。
- **Do** 卡片静止时只带 level1 阴影，层次靠 surface-container 色调拉开。

### Don't:
- **Don't** 用颜色单独表达状态——没有形状差异就不算状态；也不要给最强命中加数字角标（票与戳各加大一号即可）。
- **Don't** 给启动器 / iOS 应用图标打齿孔——平台遮罩会把贴边孔洞切碎（The Unperforated Launcher Rule）。
- **Don't** 手改单个色调或拆散 on-/container 配对——重新生成整对（The Paired-Tones Rule）。
- **Don't** 给输入框做整框变红的错误态，也不要在正文/标题上加字距。
- **Don't** 引入组件库、Tailwind 或字体包——Material 3 语义 + 手写视图 + 系统字族；Markdown 永不进 WebView/原始 HTML。
- **Don't** 给注记编造匹配理由——「为什么找到它」只能由真实命中证据拼出。
