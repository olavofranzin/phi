# paid-ads — skill de Planejamento (uso PHI)

> **[WRAPPER PHI — contrato de runtime · 2026-07-31]**
> Este arquivo é a skill **`paid-ads`** mantida **ORIGINAL** (só o markdown foi des-escapado
> mecanicamente; nenhuma palavra do corpo foi reescrita) + um **contrato de runtime** para
> uso pelos agentes PHI. O corpo após o separador é **"as regras" que o agente executa — não
> reescrever**.
>
> **Contrato de runtime (quando esta skill roda dentro de um agente PHI, headless no n8n):**
> - **Entrada:** o payload da campanha/cliente + o Client Knowledge Pack. **Não pergunte ao
>   humano**; o que faltar vira `dados_faltantes` (ADR-31) e a conclusão dependente fica **[HIPÓTESE]**.
> - **Ignore** as instruções de assistente interativo do corpo (ex.: "User runs /comando",
>   "ask the user", `CONNECTORS.md`, `argument-hint`) — não se aplicam ao runtime headless.
> - **Saída:** estruturada, entregue ao **Maestro** (não ao cliente). O humano dá o "play".
> - **Guardrails:** honre métrica-mãe / "So What?", os guardrails de dado (ADR-29) e a
>   **doutrina destilada** (`regras-otimizacao-metodo-subido.md` + `regras-planejamento-midia-paga.md`)
>   — a doutrina decide *o que é bom*; esta skill é o *procedimento*.
> - **Benchmarks numéricos** do corpo são **[HIPÓTESE] datada** (ADR-31 camada 5): revalidar
>   antes de usar como fato.

═══════════════ SKILL ORIGINAL (não reescrever abaixo) ═══════════════

---

name: paid-ads

description: "When the user wants help with paid advertising campaigns on Google Ads, Meta (Facebook/Instagram), LinkedIn, Twitter/X, or other ad platforms. Also use when the user mentions 'PPC,' 'paid media,' 'ROAS,' 'CPA,' 'ad campaign,' 'retargeting,' 'audience targeting,' 'Google Ads,' 'Facebook ads,' 'LinkedIn ads,' 'ad budget,' 'cost per click,' 'ad spend,' or 'should I run ads.' Use this for campaign strategy, audience targeting, bidding, and optimization. For bulk ad creative generation and iteration, see ad-creative. For landing page optimization, see page-cro."

metadata:

  version: 1.1.0

---

 

# Paid Ads

 

You are an expert performance marketer with direct access to ad platform accounts. Your goal is to help create, optimize, and scale paid advertising campaigns that drive efficient customer acquisition.

 

## Before Starting

 

**Check for product marketing context first:**

If `.agents/product-marketing-context.md` exists (or `.claude/product-marketing-context.md` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

 

Gather this context (ask if not provided):

 

### 1. Campaign Goals

- What's the primary objective? (Awareness, traffic, leads, sales, app installs)

- What's the target CPA or ROAS?

- What's the monthly/weekly budget?

- Any constraints? (Brand guidelines, compliance, geographic)

 

### 2. Product & Offer

- What are you promoting? (Product, free trial, lead magnet, demo)

- What's the landing page URL?

- What makes this offer compelling?

 

### 3. Audience

- Who is the ideal customer?

- What problem does your product solve for them?

- What are they searching for or interested in?

- Do you have existing customer data for lookalikes?

 

### 4. Current State

- Have you run ads before? What worked/didn't?

- Do you have existing pixel/conversion data?

- What's your current funnel conversion rate?

 

---

 

## Platform Selection Guide

 

| Platform | Best For | Use When |

|----------|----------|----------|

| **Google Ads** | High-intent search traffic | People actively search for your solution |

| **Meta** | Demand generation, visual products | Creating demand, strong creative assets |

| **LinkedIn** | B2B, decision-makers | Job title/company targeting matters, higher price points |

| **Twitter/X** | Tech audiences, thought leadership | Audience is active on X, timely content |

| **TikTok** | Younger demographics, viral creative | Audience skews 18-34, video capacity |

 

---

 

## Campaign Structure Best Practices

 

### Account Organization

 

```

Account

├── Campaign 1: [Objective] - [Audience/Product]

│   ├── Ad Set 1: [Targeting variation]

│   │   ├── Ad 1: [Creative variation A]

│   │   ├── Ad 2: [Creative variation B]

│   │   └── Ad 3: [Creative variation C]

│   └── Ad Set 2: [Targeting variation]

└── Campaign 2...

```

 

### Naming Conventions

 

```

[Platform]_[Objective]_[Audience]_[Offer]_[Date]

 

Examples:

META_Conv_Lookalike-Customers_FreeTrial_2024Q1

GOOG_Search_Brand_Demo_Ongoing

LI_LeadGen_CMOs-SaaS_Whitepaper_Mar24

```

 

### Budget Allocation

 

**Testing phase (first 2-4 weeks):**

- 70% to proven/safe campaigns

- 30% to testing new audiences/creative

 

**Scaling phase:**

- Consolidate budget into winning combinations

- Increase budgets 20-30% at a time

- Wait 3-5 days between increases for algorithm learning

 

---

 

## Ad Copy Frameworks

 

### Key Formulas

 

**Problem-Agitate-Solve (PAS):**

> [Problem] → [Agitate the pain] → [Introduce solution] → [CTA]

 

**Before-After-Bridge (BAB):**

> [Current painful state] → [Desired future state] → [Your product as bridge]

 

**Social Proof Lead:**

> [Impressive stat or testimonial] → [What you do] → [CTA]

 

**For detailed templates and headline formulas**: See [references/ad-copy-templates.md](references/ad-copy-templates.md)

 

---

 

## Audience Targeting Overview

 

### Platform Strengths

 

| Platform | Key Targeting | Best Signals |

|----------|---------------|--------------|

| Google | Keywords, search intent | What they're searching |

| Meta | Interests, behaviors, lookalikes | Engagement patterns |

| LinkedIn | Job titles, companies, industries | Professional identity |

 

### Key Concepts

 

- **Lookalikes**: Base on best customers (by LTV), not all customers

- **Retargeting**: Segment by funnel stage (visitors vs. cart abandoners)

- **Exclusions**: Exclude existing customers and recent converters — showing ads to people who already bought wastes spend

 

**For detailed targeting strategies by platform**: See [references/audience-targeting.md](references/audience-targeting.md)

 

---

 

## Creative Best Practices

 

### Image Ads

- Clear product screenshots showing UI

- Before/after comparisons

- Stats and numbers as focal point

- Human faces (real, not stock)

- Bold, readable text overlay (keep under 20%)

 

### Video Ads Structure (15-30 sec)

1. Hook (0-3 sec): Pattern interrupt, question, or bold statement

2. Problem (3-8 sec): Relatable pain point

3. Solution (8-20 sec): Show product/benefit

4. CTA (20-30 sec): Clear next step

 

**Production tips:**

- Captions always (85% watch without sound)

- Vertical for Stories/Reels, square for feed

- Native feel outperforms polished

- First 3 seconds determine if they watch

 

### Creative Testing Hierarchy

1. Concept/angle (biggest impact)

2. Hook/headline

3. Visual style

4. Body copy

5. CTA

 

---

 

## Campaign Optimization

 

### Key Metrics by Objective

 

| Objective | Primary Metrics |

|-----------|-----------------|

| Awareness | CPM, Reach, Video view rate |

| Consideration | CTR, CPC, Time on site |

| Conversion | CPA, ROAS, Conversion rate |

 

### Optimization Levers

 

**If CPA is too high:**

1. Check landing page (is the problem post-click?)

2. Tighten audience targeting

3. Test new creative angles

4. Improve ad relevance/quality score

5. Adjust bid strategy

 

**If CTR is low:**

- Creative isn't resonating → test new hooks/angles

- Audience mismatch → refine targeting

- Ad fatigue → refresh creative

 

**If CPM is high:**

- Audience too narrow → expand targeting

- High competition → try different placements

- Low relevance score → improve creative fit

 

### Bid Strategy Progression

1. Start with manual or cost caps

2. Gather conversion data (50+ conversions)

3. Switch to automated with targets based on historical data

4. Monitor and adjust targets based on results

 

---

 

## Retargeting Strategies

 

### Funnel-Based Approach

 

| Funnel Stage | Audience | Message | Goal |

|--------------|----------|---------|------|

| Top | Blog readers, video viewers | Educational, social proof | Move to consideration |

| Middle | Pricing/feature page visitors | Case studies, demos | Move to decision |

| Bottom | Cart abandoners, trial users | Urgency, objection handling | Convert |

 

### Retargeting Windows

 

| Stage | Window | Frequency Cap |

|-------|--------|---------------|

| Hot (cart/trial) | 1-7 days | Higher OK |

| Warm (key pages) | 7-30 days | 3-5x/week |

| Cold (any visit) | 30-90 days | 1-2x/week |

 

### Exclusions to Set Up

- Existing customers (unless upsell)

- Recent converters (7-14 day window)

- Bounced visitors (<10 sec)

- Irrelevant pages (careers, support)

 

---

 

## Reporting & Analysis

 

### Weekly Review

- Spend vs. budget pacing

- CPA/ROAS vs. targets

- Top and bottom performing ads

- Audience performance breakdown

- Frequency check (fatigue risk)

- Landing page conversion rate

 

### Attribution Considerations

- Platform attribution is inflated

- Use UTM parameters consistently

- Compare platform data to GA4

- Look at blended CAC, not just platform CPA

 

---

 

## Platform Setup

 

Before launching campaigns, ensure proper tracking and account setup.

 

**For complete setup checklists by platform**: See [references/platform-setup-checklists.md](references/platform-setup-checklists.md)

 

### Universal Pre-Launch Checklist

- [ ] Conversion tracking tested with real conversion

- [ ] Landing page loads fast (<3 sec)

- [ ] Landing page mobile-friendly

- [ ] UTM parameters working

- [ ] Budget set correctly

- [ ] Targeting matches intended audience

 

---

 

## Common Mistakes to Avoid

 

### Strategy

- Launching without conversion tracking

- Too many campaigns (fragmenting budget)

- Not giving algorithms enough learning time

- Optimizing for wrong metric

 

### Targeting

- Audiences too narrow or too broad

- Not excluding existing customers

- Overlapping audiences competing

 

### Creative

- Only one ad per ad set

- Not refreshing creative (fatigue)

- Mismatch between ad and landing page

 

### Budget

- Spreading too thin across campaigns

- Making big budget changes (disrupts learning)

- Stopping campaigns during learning phase

 

---

 

## Task-Specific Questions

 

1. What platform(s) are you currently running or want to start with?

2. What's your monthly ad budget?

3. What does a successful conversion look like (and what's it worth)?

4. Do you have existing creative assets or need to create them?

5. What landing page will ads point to?

6. Do you have pixel/conversion tracking set up?

 

---

 

## Tool Integrations

 

For implementation, see the [tools registry](../../tools/REGISTRY.md). Key advertising platforms:

 

| Platform | Best For | MCP | Guide |

|----------|----------|:---:|-------|

| **Google Ads** | Search intent, high-intent traffic | ✓ | [google-ads.md](../../tools/integrations/google-ads.md) |

| **Meta Ads** | Demand gen, visual products, B2C | - | [meta-ads.md](../../tools/integrations/meta-ads.md) |

| **LinkedIn Ads** | B2B, job title targeting | - | [linkedin-ads.md](../../tools/integrations/linkedin-ads.md) |

| **TikTok Ads** | Younger demographics, video | - | [tiktok-ads.md](../../tools/integrations/tiktok-ads.md) |

 

For tracking, see also: [ga4.md](../../tools/integrations/ga4.md), [segment.md](../../tools/integrations/segment.md)

 

---

 

## Related Skills

 

- **ad-creative**: For generating and iterating ad headlines, descriptions, and creative at scale

- **copywriting**: For landing page copy that converts ad traffic

- **analytics-tracking**: For proper conversion tracking setup

- **ab-test-setup**: For landing page testing to improve ROAS

- **page-cro**: For optimizing post-click conversion rates

 

{

  "skill_name": "paid-ads",

  "evals": [

	{

  	"id": 1,

      "prompt": "Help me plan a paid advertising strategy. We're a B2B SaaS tool for HR teams, selling at $99/month per seat. We have $15k/month to spend on ads and want to generate demo requests. Where should we advertise?",

      "expected_output": "Should check for product-marketing-context.md first. Should apply the platform selection guide based on B2B, HR audience, $99/month price point. Should recommend LinkedIn (B2B targeting by job title/industry), Google Ads (search intent for HR software keywords), and potentially Meta (retargeting). Should recommend campaign structure with naming conventions. Should define audience targeting strategy for each platform. Should set budget allocation across platforms. Should define success metrics and attribution approach. Should recommend starting structure and scaling plan.",

      "assertions": [

    	"Checks for product-marketing-context.md",

    	"Applies platform selection guide",

        "Recommends platforms appropriate for B2B HR audience",

        "Recommends campaign structure with naming conventions",

    	"Defines audience targeting per platform",

    	"Sets budget allocation across platforms",

    	"Defines success metrics",

        "Recommends starting structure and scaling plan"

  	],

      "files": []

	},

	{

  	"id": 2,

      "prompt": "Our Google Ads CPC is $12 and our cost per lead is $180. Is that good? We're getting about 80 leads/month from a $15k budget.",

      "expected_output": "Should evaluate the metrics in context. Should assess: $12 CPC for B2B (reasonable depending on industry), $180 CPL (depends on LTV — need to compare against customer lifetime value), 80 leads/month from $15k (math checks out). Should apply the campaign optimization framework: check quality score, search term relevance, landing page conversion rate, negative keywords. Should recommend specific optimization levers to reduce CPC and CPL. Should frame performance against industry benchmarks if applicable. Should ask about downstream conversion rates (lead → demo → customer).",

      "assertions": [

        "Evaluates metrics in context",

    	"Compares CPL against LTV considerations",

    	"Applies campaign optimization framework",

        "Recommends specific optimization levers",

    	"Asks about downstream conversion rates",

    	"Provides industry context for benchmarking"

  	],

      "files": []

	},

	{

  	"id": 3,

      "prompt": "we want to run retargeting ads for people who visited our site but didn't convert. how should we set this up?",

      "expected_output": "Should trigger on casual phrasing. Should apply the retargeting strategies section, specifically the funnel-based approach. Should recommend audience segments: all visitors (broad), pricing page visitors (high intent), blog readers (lower intent), and cart/signup abandoners (highest intent). Should recommend different messaging and offers for each segment. Should address frequency capping to avoid ad fatigue. Should recommend retargeting platforms (Meta, Google Display, LinkedIn). Should include duration windows for each audience.",

      "assertions": [

    	"Triggers on casual phrasing",

    	"Applies funnel-based retargeting approach",

        "Recommends audience segments by intent level",

        "Recommends different messaging per segment",

        "Addresses frequency capping",

        "Recommends retargeting platforms",

    	"Includes audience duration windows"

  	],

      "files": []

	},

	{

  	"id": 4,

      "prompt": "Should we advertise on TikTok? We sell accounting software to small businesses. Our current ads are on Google and Meta.",

      "expected_output": "Should apply the platform selection guide for TikTok specifically. Should evaluate TikTok fit for accounting software + small business audience: likely a weaker fit than Google/Meta for this category (lower purchase intent, younger skewing audience, less B2B targeting). Should discuss when TikTok CAN work for B2B (brand awareness, creative content, younger business owners). Should provide an honest recommendation with caveats. Should suggest a small test budget approach if they want to try.",

      "assertions": [

    	"Applies platform selection guide for TikTok",

        "Evaluates fit for accounting + small business audience",

    	"Provides honest assessment of likely weaker fit",

        "Discusses when TikTok can work for B2B",

    	"Suggests small test budget if proceeding",

    	"Compares to their existing Google/Meta performance"

  	],

      "files": []

	},

	{

  	"id": 5,

      "prompt": "How do we structure our Google Ads campaigns? We have 50+ keywords we want to target for our CRM product.",

  	"expected_output": "Should apply the campaign structure and naming conventions framework. Should recommend organizing campaigns by theme/intent (brand, competitor, product features, pain points). Should recommend ad group structure (tightly themed, 5-15 keywords per group). Should define naming conventions for campaigns and ad groups. Should recommend match types strategy. Should include negative keyword lists. Should provide a sample campaign structure.",

      "assertions": [

    	"Applies campaign structure framework",

        "Organizes campaigns by theme/intent",

        "Recommends tight ad group structure",

    	"Defines naming conventions",

        "Recommends match types strategy",

    	"Includes negative keyword lists",

    	"Provides sample campaign structure"

  	],

      "files": []

	},

	{

  	"id": 6,

      "prompt": "Can you write some ad copy for our Facebook ads? We need headlines and descriptions for 5 different angles.",

      "expected_output": "Should recognize this is an ad creative generation task, not campaign strategy. Should defer to or cross-reference the ad-creative skill, which handles platform-specific ad copy generation with character limits, angle-based variation, and batch generation. May provide brief ad copy framework guidance but should make clear that ad-creative is the right skill for generating ad copy at scale.",

      "assertions": [

        "Recognizes this as ad creative generation",

        "References or defers to ad-creative skill",

    	"Does not attempt bulk ad copy generation using campaign strategy patterns"

  	],

      "files": []

	}

  ]

}

# Ad Copy Templates Reference

 

Detailed formulas and templates for writing high-converting ad copy.

 

## Contents

- Primary Text Formulas (Problem-Agitate-Solve, Before-After-Bridge, Social Proof Lead, Feature-Benefit Bridge, Direct Response)

- Headline Formulas (For Search Ads, For Social Ads)

- CTA Variations (Soft CTAs, Hard CTAs, Urgency CTAs, Action-Oriented CTAs)

- Platform-Specific Copy Guidelines (Google Search Ads, Meta Ads, LinkedIn Ads)

- Copy Testing Priority

 

## Primary Text Formulas

 

### Problem-Agitate-Solve (PAS)

 

```

[Problem statement]

[Agitate the pain]

[Introduce solution]

[CTA]

```

 

**Example:**

> Spending hours on manual reporting every week?

> While you're buried in spreadsheets, your competitors are making decisions.

> [Product] automates your reports in minutes.

> Start your free trial →

 

---

 

### Before-After-Bridge (BAB)

 

```

[Current painful state]

[Desired future state]

[Your product as the bridge]

```

 

**Example:**

> Before: Chasing down approvals across email, Slack, and spreadsheets.

> After: Every approval tracked, automated, and on time.

> [Product] connects your tools and keeps projects moving.

 

---

 

### Social Proof Lead

 

```

[Impressive stat or testimonial]

[What you do]

[CTA]

```

 

**Example:**

> "We cut our reporting time by 75%." — Sarah K., Marketing Director

> [Product] automates the reports you hate building.

> See how it works →

 

---

 

### Feature-Benefit Bridge

 

```

[Feature]

[So that...]

[Which means...]

```

 

**Example:**

> Real-time collaboration on documents

> So your team always works from the latest version

> Which means no more version confusion or lost work

 

---

 

### Direct Response

 

```

[Bold claim/outcome]

[Proof point]

[CTA with urgency if genuine]

```

 

**Example:**

> Cut your reporting time by 80%

> Join 5,000+ marketing teams already using [Product]

> Start free → First month 50% off

 

---

 

## Headline Formulas

 

### For Search Ads

 

| Formula | Example |

|---------|---------|

| [Keyword] + [Benefit] | "Project Management That Teams Actually Use" |

| [Action] + [Outcome] | "Automate Reports \| Save 10 Hours Weekly" |

| [Question] | "Tired of Manual Data Entry?" |

| [Number] + [Benefit] | "500+ Teams Trust [Product] for [Outcome]" |

| [Keyword] + [Differentiator] | "CRM Built for Small Teams" |

| [Price/Offer] + [Keyword] | "Free Project Management \| No Credit Card" |

 

### For Social Ads

 

| Type | Example |

|------|---------|

| Outcome hook | "How we 3x'd our conversion rate" |

| Curiosity hook | "The reporting hack no one talks about" |

| Contrarian hook | "Why we stopped using [common tool]" |

| Specificity hook | "The exact template we use for..." |

| Question hook | "What if you could cut your admin time in half?" |

| Number hook | "7 ways to improve your workflow today" |

| Story hook | "We almost gave up. Then we found..." |

 

---

 

## CTA Variations

 

### Soft CTAs (awareness/consideration)

 

Best for: Top of funnel, cold audiences, complex products

 

- Learn More

- See How It Works

- Watch Demo

- Get the Guide

- Explore Features

- See Examples

- Read the Case Study

 

### Hard CTAs (conversion)

 

Best for: Bottom of funnel, warm audiences, clear offers

 

- Start Free Trial

- Get Started Free

- Book a Demo

- Claim Your Discount

- Buy Now

- Sign Up Free

- Get Instant Access

 

### Urgency CTAs (use when genuine)

 

Best for: Limited-time offers, scarcity situations

 

- Limited Time: 30% Off

- Offer Ends [Date]

- Only X Spots Left

- Last Chance

- Early Bird Pricing Ends Soon

 

### Action-Oriented CTAs

 

Best for: Active voice, clear next step

 

- Start Saving Time Today

- Get Your Free Report

- See Your Score

- Calculate Your ROI

- Build Your First Project

 

---

 

## Platform-Specific Copy Guidelines

 

### Google Search Ads

 

- **Headline limits:** 30 characters each (up to 15 headlines)

- **Description limits:** 90 characters each (up to 4 descriptions)

- Include keywords naturally

- Use all available headline slots

- Include numbers and stats when possible

- Test dynamic keyword insertion

 

### Meta Ads (Facebook/Instagram)

 

- **Primary text:** 125 characters visible (can be longer, gets truncated)

- **Headline:** 40 characters recommended

- Front-load the hook (first line matters most)

- Emojis can work but test

- Questions perform well

- Keep image text under 20%

 

### LinkedIn Ads

 

- **Intro text:** 600 characters max (150 recommended)

- **Headline:** 200 characters max (70 recommended)

- Professional tone (but not boring)

- Specific job outcomes resonate

- Stats and social proof important

- Avoid consumer-style hype

 

---

 

## Copy Testing Priority

 

When testing ad copy, focus on these elements in order of impact:

 

1. **Hook/angle** (biggest impact on performance)

2. **Headline**

3. **Primary benefit**

4. **CTA**

5. **Supporting proof points**

 

Test one element at a time for clean data.

# Audience Targeting Reference

 

Detailed targeting strategies for each major ad platform.

 

## Contents

- Google Ads Audiences (Search Campaign Targeting, Display/YouTube Targeting)

- Meta Audiences (Core Audiences, Custom Audiences, Lookalike Audiences)

- LinkedIn Audiences (Job-Based Targeting, Company-Based Targeting, High-Performing Combinations)

- Twitter/X Audiences

- TikTok Audiences

- Audience Size Guidelines

- Exclusion Strategy

 

## Google Ads Audiences

 

### Search Campaign Targeting

 

**Keywords:**

- Exact match: [keyword] — most precise, lower volume

- Phrase match: "keyword" — moderate precision and volume

- Broad match: keyword — highest volume, use with smart bidding

 

**Audience layering:**

- Add audiences in "observation" mode first

- Analyze performance by audience

- Switch to "targeting" mode for high performers

 

**RLSA (Remarketing Lists for Search Ads):**

- Bid higher on past visitors searching your terms

- Show different ads to returning searchers

- Exclude converters from prospecting campaigns

 

### Display/YouTube Targeting

 

**Custom intent audiences:**

- Based on recent search behavior

- Create from your converting keywords

- High intent, good for prospecting

 

**In-market audiences:**

- People actively researching solutions

- Pre-built by Google

- Layer with demographics for precision

 

**Affinity audiences:**

- Based on interests and habits

- Better for awareness

- Broad but can exclude irrelevant

 

**Customer match:**

- Upload email lists

- Retarget existing customers

- Create lookalikes from best customers

 

**Similar/lookalike audiences:**

- Based on your customer match lists

- Expand reach while maintaining relevance

- Best when source list is high-quality customers

 

---

 

## Meta Audiences

 

### Core Audiences (Interest/Demographic)

 

**Interest targeting tips:**

- Layer interests with AND logic for precision

- Use Audience Insights to research interests

- Start broad, let algorithm optimize

- Exclude existing customers always

 

**Demographic targeting:**

- Age and gender (if product-specific)

- Location (down to zip/postal code)

- Language

- Education and work (limited data now)

 

**Behavior targeting:**

- Purchase behavior

- Device usage

- Travel patterns

- Life events

 

### Custom Audiences

 

**Website visitors:**

- All visitors (last 180 days max)

- Specific page visitors

- Time on site thresholds

- Frequency (visited X times)

 

**Customer list:**

- Upload emails/phone numbers

- Match rate typically 30-70%

- Refresh regularly for accuracy

 

**Engagement audiences:**

- Video viewers (25%, 50%, 75%, 95%)

- Page/profile engagers

- Form openers

- Instagram engagers

 

**App activity:**

- App installers

- In-app events

- Purchase events

 

### Lookalike Audiences

 

**Source audience quality matters:**

- Use high-LTV customers, not all customers

- Purchasers > leads > all visitors

- Minimum 100 source users, ideally 1,000+

 

**Size recommendations:**

- 1% — most similar, smallest reach

- 1-3% — good balance for most

- 3-5% — broader, good for scale

- 5-10% — very broad, awareness only

 

**Layering strategies:**

- Lookalike + interest = more precision early

- Test lookalike-only as you scale

- Exclude the source audience

 

---

 

## LinkedIn Audiences

 

### Job-Based Targeting

 

**Job titles:**

- Be specific (CMO vs. "Marketing")

- LinkedIn normalizes titles, but verify

- Stack related titles

- Exclude irrelevant titles

 

**Job functions:**

- Broader than titles

- Combine with seniority level

- Good for awareness campaigns

 

**Seniority levels:**

- Entry, Senior, Manager, Director, VP, CXO, Partner

- Layer with function for precision

 

**Skills:**

- Self-reported, less reliable

- Good for technical roles

- Use as expansion layer

 

### Company-Based Targeting

 

**Company size:**

- 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+

- Key filter for B2B

 

**Industry:**

- Based on company classification

- Can be broad, layer with other criteria

 

**Company names (ABM):**

- Upload target account list

- Minimum 300 companies recommended

- Match rate varies

 

**Company growth rate:**

- Hiring rapidly = budget available

- Good signal for timing

 

### High-Performing Combinations

 

| Use Case | Targeting Combination |

|----------|----------------------|

| Enterprise sales | Company size 1000+ + VP/CXO + Industry |

| SMB sales | Company size 11-200 + Manager/Director + Function |

| Developer tools | Skills + Job function + Company type |

| ABM campaigns | Company list + Decision-maker titles |

| Broad awareness | Industry + Seniority + Geography |

 

---

 

## Twitter/X Audiences

 

### Targeting options:

- Follower lookalikes (accounts similar to followers of X)

- Interest categories

- Keywords (in tweets)

- Conversation topics

- Events

- Tailored audiences (your lists)

 

### Best practices:

- Follower lookalikes of relevant accounts work well

- Keyword targeting catches active conversations

- Lower CPMs than LinkedIn/Meta

- Less precise, better for awareness

 

---

 

## TikTok Audiences

 

### Targeting options:

- Demographics (age, gender, location)

- Interests (TikTok's categories)

- Behaviors (video interactions)

- Device (iOS/Android, connection type)

- Custom audiences (pixel, customer file)

- Lookalike audiences

 

### Best practices:

- Younger skew (18-34 primarily)

- Interest targeting is broad

- Creative matters more than targeting

- Let algorithm optimize with broad targeting

 

---

 

## Audience Size Guidelines

 

| Platform | Minimum Recommended | Ideal Range |

|----------|-------------------|-------------|

| Google Search | 1,000+ searches/mo | 5,000-50,000 |

| Google Display | 100,000+ | 500K-5M |

| Meta | 100,000+ | 500K-10M |

| LinkedIn | 50,000+ | 100K-500K |

| Twitter/X | 50,000+ | 100K-1M |

| TikTok | 100,000+ | 1M+ |

 

Too narrow = expensive, slow learning

Too broad = wasted spend, poor relevance

 

---

 

## Exclusion Strategy

 

Always exclude:

- Existing customers (unless upsell)

- Recent converters (7-14 days)

- Bounced visitors (<10 sec)

- Employees (by company or email list)

- Irrelevant page visitors (careers, support)

- Competitors (if identifiable)

# Platform Setup Checklists

 

Complete setup checklists for major ad platforms.

 

## Contents

- Google Ads Setup (Account Foundation, Conversion Tracking, Analytics Integration, Audience Setup, Campaign Readiness, Ad Extensions, Brand Protection)

- Meta Ads Setup (Business Manager Foundation, Pixel & Tracking, Domain & Aggregated Events, Audience Setup, Catalog, Creative Assets, Compliance)

- LinkedIn Ads Setup (Campaign Manager Foundation, Insight Tag & Tracking, Audience Setup, Lead Gen Forms, Document Ads, Creative Assets, Budget Considerations)

- Twitter/X Ads Setup (Account Foundation, Tracking, Audience Setup, Creative)

- TikTok Ads Setup (Account Foundation, Pixel & Tracking, Audience Setup, Creative)

- Universal Pre-Launch Checklist

 

## Google Ads Setup

 

### Account Foundation

 

- [ ] Google Ads account created and verified

- [ ] Billing information added

- [ ] Time zone and currency set correctly

- [ ] Account access granted to team members

 

### Conversion Tracking

 

- [ ] Google tag installed on all pages

- [ ] Conversion actions created (purchase, lead, signup)

- [ ] Conversion values assigned (if applicable)

- [ ] Enhanced conversions enabled

- [ ] Test conversions firing correctly

- [ ] Import conversions from GA4 (optional)

 

### Analytics Integration

 

- [ ] Google Analytics 4 linked

- [ ] Auto-tagging enabled

- [ ] GA4 audiences available in Google Ads

- [ ] Cross-domain tracking set up (if multiple domains)

 

### Audience Setup

 

- [ ] Remarketing tag verified

- [ ] Website visitor audiences created:

  - All visitors (180 days)

  - Key page visitors (pricing, demo, features)

  - Converters (for exclusion)

- [ ] Customer match lists uploaded

- [ ] Similar audiences enabled

 

### Campaign Readiness

 

- [ ] Negative keyword lists created:

  - Universal negatives (free, jobs, careers, reviews, complaints)

  - Competitor negatives (if needed)

  - Irrelevant industry terms

- [ ] Location targeting set (include/exclude)

- [ ] Language targeting set

- [ ] Ad schedule configured (if B2B, business hours)

- [ ] Device bid adjustments considered

 

### Ad Extensions

 

- [ ] Sitelinks (4-6 relevant pages)

- [ ] Callouts (key benefits, offers)

- [ ] Structured snippets (features, types, services)

- [ ] Call extension (if phone leads valuable)

- [ ] Lead form extension (if using)

- [ ] Price extensions (if applicable)

- [ ] Image extensions (where available)

 

### Brand Protection

 

- [ ] Brand campaign running (protect branded terms)

- [ ] Competitor campaigns considered

- [ ] Brand terms in negative lists for non-brand campaigns

 

---

 

## Meta Ads Setup

 

### Business Manager Foundation

 

- [ ] Business Manager created

- [ ] Business verified (if running certain ad types)

- [ ] Ad account created within Business Manager

- [ ] Payment method added

- [ ] Team access configured with proper roles

 

### Pixel & Tracking

 

- [ ] Meta Pixel installed on all pages

- [ ] Standard events configured:

  - PageView (automatic)

  - ViewContent (product/feature pages)

  - Lead (form submissions)

  - Purchase (conversions)

  - AddToCart (if e-commerce)

  - InitiateCheckout (if e-commerce)

- [ ] Conversions API (CAPI) set up for server-side tracking

- [ ] Event Match Quality score > 6

- [ ] Test events in Events Manager

 

### Domain & Aggregated Events

 

- [ ] Domain verified in Business Manager

- [ ] Aggregated Event Measurement configured

- [ ] Top 8 events prioritized in order of importance

- [ ] Web events prioritized for iOS 14+ tracking

 

### Audience Setup

 

- [ ] Custom audiences created:

  - Website visitors (all, 30/60/90/180 days)

  - Key page visitors

  - Video viewers (25%, 50%, 75%, 95%)

  - Page/Instagram engagers

  - Customer list uploaded

- [ ] Lookalike audiences created (1%, 1-3%)

- [ ] Saved audiences for common targeting

 

### Catalog (E-commerce)

 

- [ ] Product catalog connected

- [ ] Product feed updating correctly

- [ ] Catalog sales campaigns enabled

- [ ] Dynamic product ads configured

 

### Creative Assets

 

- [ ] Images in correct sizes:

  - Feed: 1080x1080 (1:1)

  - Stories/Reels: 1080x1920 (9:16)

  - Landscape: 1200x628 (1.91:1)

- [ ] Videos in correct formats

- [ ] Ad copy variations ready

- [ ] UTM parameters in all destination URLs

 

### Compliance

 

- [ ] Special Ad Categories declared (if housing, credit, employment, politics)

- [ ] Landing page complies with Meta policies

- [ ] No prohibited content in ads

 

---

 

## LinkedIn Ads Setup

 

### Campaign Manager Foundation

 

- [ ] Campaign Manager account created

- [ ] Company Page connected

- [ ] Billing information added

- [ ] Team access configured

 

### Insight Tag & Tracking

 

- [ ] LinkedIn Insight Tag installed on all pages

- [ ] Tag verified and firing

- [ ] Conversion tracking configured:

  - URL-based conversions

  - Event-specific conversions

- [ ] Conversion values set (if applicable)

 

### Audience Setup

 

- [ ] Matched Audiences created:

  - Website retargeting audiences

  - Company list uploaded (for ABM)

  - Contact list uploaded

- [ ] Lookalike audiences created

- [ ] Saved audiences for common targeting

 

### Lead Gen Forms (if using)

 

- [ ] Lead gen form templates created

- [ ] Form fields selected (minimize for conversion)

- [ ] Privacy policy URL added

- [ ] Thank you message configured

- [ ] CRM integration set up (or CSV export process)

 

### Document Ads (if using)

 

- [ ] Documents uploaded (PDF, PowerPoint)

- [ ] Gating configured (full gate or preview)

- [ ] Lead gen form connected

 

### Creative Assets

 

- [ ] Single image ads: 1200x627 (1.91:1) or 1080x1080 (1:1)

- [ ] Carousel images ready

- [ ] Video specs met (if using)

- [ ] Ad copy within character limits:

  - Intro text: 600 max, 150 recommended

  - Headline: 200 max, 70 recommended

 

### Budget Considerations

 

- [ ] Budget realistic for LinkedIn CPCs ($8-15+ typical)

- [ ] Audience size validated (50K+ recommended)

- [ ] Daily vs. lifetime budget decided

- [ ] Bid strategy selected

 

---

 

## Twitter/X Ads Setup

 

### Account Foundation

 

- [ ] Ads account created

- [ ] Payment method added

- [ ] Account verified (if required)

 

### Tracking

 

- [ ] Twitter Pixel installed

- [ ] Conversion events created

- [ ] Website tag verified

 

### Audience Setup

 

- [ ] Tailored audiences created:

  - Website visitors

  - Customer lists

- [ ] Follower lookalikes identified

- [ ] Interest and keyword targets researched

 

### Creative

 

- [ ] Tweet copy within 280 characters

- [ ] Images: 1200x675 (1.91:1) or 1200x1200 (1:1)

- [ ] Video specs met (if using)

- [ ] Cards configured (website, app, etc.)

 

---

 

## TikTok Ads Setup

 

### Account Foundation

 

- [ ] TikTok Ads Manager account created

- [ ] Business verification completed

- [ ] Payment method added

 

### Pixel & Tracking

 

- [ ] TikTok Pixel installed

- [ ] Events configured (ViewContent, Purchase, etc.)

- [ ] Events API set up (recommended)

 

### Audience Setup

 

- [ ] Custom audiences created

- [ ] Lookalike audiences created

- [ ] Interest categories identified

 

### Creative

 

- [ ] Vertical video (9:16) ready

- [ ] Native-feeling content (not too polished)

- [ ] First 3 seconds are compelling hooks

- [ ] Captions added (most watch without sound)

- [ ] Music/sounds selected (licensed if needed)

 

---

 

## Universal Pre-Launch Checklist

 

Before launching any campaign:

 

- [ ] Conversion tracking tested with real conversion

- [ ] Landing page loads fast (<3 sec)

- [ ] Landing page mobile-friendly

- [ ] UTM parameters working

- [ ] Budget set correctly (daily vs. lifetime)

- [ ] Start/end dates correct

- [ ] Targeting matches intended audience

- [ ] Ad creative approved

- [ ] Team notified of launch

- [ ] Reporting dashboard ready

