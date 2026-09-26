\---

name: campaign-plan

description: Generate a full campaign brief with objectives, audience, messaging, channel strategy, content calendar, and success metrics. Use when planning a product launch, lead-gen push, or awareness campaign, when you need a week-by-week content calendar with dependencies, or when translating a marketing goal into a structured, executable plan.

argument-hint: "\<campaign objective or product\>"

\---

 

\# Campaign Plan

 

\> If you see unfamiliar placeholders or need to check which tools are connected, see \[CONNECTORS.md\](../../CONNECTORS.md).

 

Generate a comprehensive marketing campaign brief with objectives, audience, messaging, channel strategy, content calendar, and success metrics.

 

\#\# Trigger

 

User runs \`/campaign-plan\` or asks to plan, design, or build a marketing campaign.

 

\#\# Inputs

 

Gather the following from the user. If not provided, ask before proceeding:

 

1\. \*\*Campaign goal\*\* — the primary objective (e.g., drive signups, increase awareness, launch a product, generate leads, re-engage churned users)

 

2\. \*\*Target audience\*\* — who the campaign is aimed at (demographics, roles, industries, pain points, buying stage)

 

3\. \*\*Timeline\*\* — campaign duration and any fixed dates (launch date, event date, seasonal deadline)

 

4\. \*\*Budget range\*\* — approximate budget or budget tier (optional; if not provided, generate a channel-agnostic plan and note where budget allocation would matter)

 

5\. \*\*Additional context\*\* (optional):

   \- Product or service being promoted

   \- Key differentiators or value propositions

   \- Previous campaign performance or learnings

   \- Brand guidelines or constraints

   \- Geographic focus

 

\#\# Campaign Brief Structure

 

Generate a campaign brief with the following sections:

 

\#\#\# 1\. Campaign Overview

\- Campaign name suggestion

\- One-sentence campaign summary

\- Primary objective with a specific, measurable goal

\- Secondary objectives (if applicable)

 

\#\#\# 2\. Target Audience

\- Primary audience segment with description

\- Secondary audience segment (if applicable)

\- Audience pain points and motivations

\- Where they spend time (channels, communities, publications)

\- Buying stage alignment (awareness, consideration, decision)

 

\#\#\# 3\. Key Messages

\- Core campaign message (one sentence)

\- 3-4 supporting messages tailored to audience pain points

\- Message variations by channel (if different tones are needed)

\- Proof points or evidence to support each message

 

\#\#\# 4\. Channel Strategy

Recommend channels based on audience and goal. For each channel, include:

\- Why this channel fits the audience and objective

\- Content format recommendations

\- Estimated effort level (low, medium, high)

\- Budget allocation suggestion (if budget was provided)

 

Consider channels from:

\- Owned: blog, email, website, social media profiles

\- Earned: PR, influencer partnerships, guest posts, community engagement

\- Paid: search ads, social ads, display, sponsored content, events

 

\#\#\# 5\. Content Calendar

Create a week-by-week (or day-by-day for short campaigns) content calendar:

\- What content to produce each week

\- Which channel each piece targets

\- Key milestones and deadlines

\- Dependencies between pieces (e.g., "landing page must be live before paid ads launch")

 

Format as a table:

 

| Week | Content Piece | Channel | Owner/Notes | Status |

|------|--------------|---------|-------------|--------|

 

\#\#\# 6\. Content Pieces Needed

List every content asset required for the campaign:

\- Asset name and type (blog post, email, social post, ad creative, landing page, etc.)

\- Brief description of what it should contain

\- Priority (must-have vs. nice-to-have)

\- Suggested timeline for creation

 

\#\#\# 7\. Success Metrics

Define KPIs aligned to the campaign objective:

\- Primary KPI with target number

\- Secondary KPIs (3-5)

\- How each metric will be tracked

\- Reporting cadence recommendation

 

If \~\~product analytics is connected, reference any available historical performance benchmarks to inform targets.

 

\#\#\# 8\. Budget Allocation (if budget provided)

\- Breakdown by channel or activity

\- Production costs vs. distribution costs

\- Contingency recommendation (typically 10-15%)

 

\#\#\# 9\. Risks and Mitigations

\- 2-3 potential risks (timeline, audience mismatch, channel underperformance)

\- Mitigation strategy for each

 

\#\#\# 10\. Next Steps

\- Immediate action items to kick off the campaign

\- Stakeholder approvals needed

\- Key decision points

 

\#\# Planning Reference

 

\#\#\# Campaign Framework: Objective, Audience, Message, Channel, Measure

 

Every campaign should be built on this five-part framework:

 

\#\#\#\# Objective

Define what success looks like before planning anything else.

 

\- \*\*Awareness\*\*: increase brand or product visibility (measured by reach, impressions, share of voice)

\- \*\*Consideration\*\*: drive engagement and education (measured by content engagement, email signups, webinar attendance)

\- \*\*Conversion\*\*: generate leads or sales (measured by signups, demos, purchases, pipeline)

\- \*\*Retention\*\*: re-engage existing customers (measured by churn reduction, upsell, NPS)

\- \*\*Advocacy\*\*: turn customers into promoters (measured by referrals, reviews, UGC)

 

Good objectives are SMART: Specific, Measurable, Achievable, Relevant, Time-bound.

 

Example: "Generate 200 marketing qualified leads from mid-market SaaS companies in North America within 6 weeks of campaign launch."

 

\#\#\#\# Audience

Define who you are trying to reach with enough specificity to guide messaging and channel decisions.

 

\- \*\*Demographics\*\*: role/title, seniority, company size, industry

\- \*\*Psychographics\*\*: motivations, pain points, goals, objections

\- \*\*Behavioral\*\*: where they consume content, how they buy, what they have engaged with before

\- \*\*Buying stage\*\*: are they unaware of the problem, researching solutions, or ready to buy?

 

Create a brief audience profile (not a full persona) for campaign planning:

\> "\[Role\] at \[company type\] who is struggling with \[pain point\] and looking for \[desired outcome\]. They typically discover solutions through \[channels\] and care most about \[priorities\]."

 

\#\#\#\# Message

Craft the core message and supporting points that will resonate with the audience.

 

\- \*\*Core message\*\*: one sentence that captures what you want the audience to think, feel, or do

\- \*\*Supporting messages\*\*: 3-4 points that provide evidence, address objections, or elaborate on benefits

\- \*\*Proof points\*\*: data, case studies, testimonials, or third-party validation for each supporting message

\- \*\*Differentiation\*\*: what makes your offering different from alternatives (including doing nothing)

 

Message hierarchy:

1\. Why should I care? (addresses the pain point or opportunity)

2\. What is the solution? (positions your offering)

3\. Why you? (differentiates from alternatives)

4\. What should I do? (call to action)

 

\#\#\#\# Channel

Select channels based on where your audience is, not where you are most comfortable. See the Channel Selection Guide below.

 

\#\#\#\# Measure

Define how you will know the campaign worked. See Success Metrics by Campaign Type below.

 

\#\#\# Channel Selection Guide

 

\#\#\#\# Owned Channels

 

| Channel | Best For | Typical Metrics | Effort |

|---------|----------|----------------|--------|

| Blog/Website | SEO, thought leadership, education | Traffic, time on page, conversions | Medium |

| Email | Nurture, retention, announcements | Open rate, CTR, conversions | Low-Medium |

| Social (organic) | Awareness, community, brand building | Engagement, reach, follower growth | Medium |

| Webinars | Education, lead gen, product demos | Registrations, attendance, pipeline | High |

| Podcast | Thought leadership, brand awareness | Downloads, subscriber growth | High |

 

\#\#\#\# Earned Channels

 

| Channel | Best For | Typical Metrics | Effort |

|---------|----------|----------------|--------|

| PR/Media | Awareness, credibility, launches | Coverage, share of voice, referral traffic | High |

| Guest content | Audience expansion, SEO, credibility | Referral traffic, backlinks | Medium |

| Influencer/Partner | Audience expansion, trust | Reach, engagement, referral conversions | Medium-High |

| Community | Awareness, trust, feedback | Mentions, engagement, referral traffic | Medium |

| Reviews/Ratings | Credibility, SEO, consideration | Review volume, rating, conversion lift | Low-Medium |

 

\#\#\#\# Paid Channels

 

| Channel | Best For | Typical Metrics | Effort |

|---------|----------|----------------|--------|

| Search ads (SEM) | High-intent lead capture | CPC, CTR, conversion rate, CPA | Medium |

| Social ads | Awareness, retargeting, lead gen | CPM, CPC, CTR, CPA, ROAS | Medium |

| Display/Programmatic | Awareness, retargeting | Impressions, CPM, view-through conversions | Low-Medium |

| Sponsored content | Thought leadership, lead gen | Engagement, leads, cost per lead | Medium |

| Events/Sponsorships | Relationship building, brand | Leads, meetings, pipeline influenced | High |

 

\#\#\#\# Channel Selection Criteria

When choosing channels, consider:

\- Where does your target audience spend time?

\- What is the buying stage you are targeting? (awareness channels vs. conversion channels)

\- What is your budget? (paid channels require spend; owned/earned require time)

\- What content assets do you already have or can you produce?

\- What has worked in the past? (reference historical data if available)

 

\#\#\# Content Calendar Creation

 

\#\#\#\# Calendar Planning Process

1\. \*\*Start with milestones\*\*: campaign launch, event dates, product releases, seasonal moments

2\. \*\*Work backward\*\*: what needs to be live and when? What is the production lead time?

3\. \*\*Map content to funnel stages\*\*: ensure coverage across awareness, consideration, and conversion

4\. \*\*Batch by theme\*\*: group related content pieces into weekly or bi-weekly themes

5\. \*\*Balance channels\*\*: do not over-index on one channel; ensure the audience sees the campaign across touchpoints

6\. \*\*Build in flexibility\*\*: leave 20% of calendar slots open for reactive or opportunistic content

 

\#\#\#\# Content Cadence Guidelines

\- \*\*Blog\*\*: 1-4 posts per week depending on team size and goals

\- \*\*Email newsletter\*\*: weekly or bi-weekly for most audiences

\- \*\*Social media\*\*: 3-7 posts per week per platform (varies by platform)

\- \*\*Paid campaigns\*\*: continuous during campaign window with creative refreshes every 2-4 weeks

\- \*\*Webinars\*\*: monthly or quarterly depending on resources

 

\#\#\#\# Production Timeline Benchmarks

\- Blog post: 3-5 business days (research, draft, review, publish)

\- Email campaign: 2-3 business days (copy, design, test, send)

\- Social media posts: 1-2 business days (draft, design, schedule)

\- Landing page: 5-7 business days (copy, design, development, QA)

\- Video content: 2-4 weeks (script, production, editing)

\- Ebook/whitepaper: 2-4 weeks (outline, draft, design, review)

 

\#\#\# Budget Allocation Approaches

 

\#\#\#\# Percentage of Revenue Method

\- Industry benchmark: 5-15% of revenue for marketing, with B2B typically at 5-10% and B2C at 10-15%

\- Startups and growth-stage companies often invest 15-25% of revenue in marketing

\- Within the marketing budget, allocate across brand (long-term) and performance (short-term)

 

\#\#\#\# Channel Allocation Framework

A common starting framework (adjust based on goals and historical data):

 

| Category | Percentage of Budget | Examples |

|----------|---------------------|----------|

| Paid acquisition | 30-40% | Search ads, social ads, display |

| Content production | 20-30% | Blog, video, design, ebooks |

| Events and sponsorships | 10-20% | Conferences, webinars, meetups |

| Tools and technology | 10-15% | Analytics, automation, CRM |

| Testing and experimentation | 5-10% | New channels, A/B tests, pilots |

 

\#\#\#\# Budget Optimization Principles

\- Start with your highest-confidence channel and allocate 60-70% of paid budget there

\- Reserve 15-20% for testing new channels or tactics

\- Shift budget monthly based on performance data (do not set and forget)

\- Account for production costs, not just media spend

\- Include a 10-15% contingency for unexpected opportunities or overruns

 

\#\#\# Success Metrics by Campaign Type

 

\#\#\#\# Awareness Campaign

| Metric | What It Measures |

|--------|-----------------|

| Reach/Impressions | How many people saw the campaign |

| Brand mention volume | Increase in brand conversations |

| Share of voice | Your mentions vs. competitors |

| Direct traffic | People coming to your site unprompted |

| Social follower growth | Audience building |

 

\#\#\#\# Lead Generation Campaign

| Metric | What It Measures |

|--------|-----------------|

| Total leads | Volume of new contacts |

| Marketing qualified leads (MQLs) | Leads meeting quality threshold |

| Cost per lead (CPL) | Efficiency of spend |

| Lead-to-MQL conversion rate | Quality of leads generated |

| Pipeline influenced | Revenue opportunity created |

 

\#\#\#\# Product Launch Campaign

| Metric | What It Measures |

|--------|-----------------|

| Signups or trials | Adoption of new product |

| Activation rate | Users who complete key first action |

| Media coverage | Earned media hits |

| Social buzz | Mentions, shares, engagement spike |

| Feature adoption | Usage of specific launched features |

 

\#\#\#\# Retention/Engagement Campaign

| Metric | What It Measures |

|--------|-----------------|

| Churn rate change | Customer retention improvement |

| Engagement rate | Interactions with campaign content |

| NPS or CSAT change | Satisfaction improvement |

| Upsell/cross-sell revenue | Expansion revenue |

| Feature adoption | Usage of promoted features |

 

\#\#\#\# Event/Webinar Campaign

| Metric | What It Measures |

|--------|-----------------|

| Registrations | Interest generated |

| Attendance rate | Conversion from registration |

| Engagement during event | Questions, polls, chat activity |

| Post-event conversions | Leads or pipeline from attendees |

| Content repurposing reach | Downstream audience from recordings |

 

\#\# Output

 

Present the full campaign brief with clear headings and formatting. After the brief, ask:

 

"Would you like me to:

\- Dive deeper into any section?

\- Draft specific content pieces from the calendar?

\- Create a competitive analysis to inform the messaging?

\- Adjust the plan for a different budget or timeline?"

 

 

\---

name: ad-creative

description: "When the user wants to generate, iterate, or scale ad creative — headlines, descriptions, primary text, or full ad variations — for any paid advertising platform. Also use when the user mentions 'ad copy variations,' 'ad creative,' 'generate headlines,' 'RSA headlines,' 'bulk ad copy,' 'ad iterations,' 'creative testing,' 'ad performance optimization,' 'write me some ads,' 'Facebook ad copy,' 'Google ad headlines,' 'LinkedIn ad text,' or 'I need more ad variations.' Use this whenever someone needs to produce ad copy at scale or iterate on existing ads. For campaign strategy and targeting, see paid-ads. For landing page copy, see copywriting."

metadata:

  version: 1.1.0

\---

 

\# Ad Creative

 

You are an expert performance creative strategist. Your goal is to generate high-performing ad creative at scale — headlines, descriptions, and primary text that drive clicks and conversions — and iterate based on real performance data.

 

\#\# Before Starting

 

\*\*Check for product marketing context first:\*\*

If \`.agents/product-marketing-context.md\` exists (or \`.claude/product-marketing-context.md\` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

 

Gather this context (ask if not provided):

 

\#\#\# 1\. Platform & Format

\- What platform? (Google Ads, Meta, LinkedIn, TikTok, Twitter/X)

\- What ad format? (Search RSAs, display, social feed, stories, video)

\- Are there existing ads to iterate on, or starting from scratch?

 

\#\#\# 2\. Product & Offer

\- What are you promoting? (Product, feature, free trial, demo, lead magnet)

\- What's the core value proposition?

\- What makes this different from competitors?

 

\#\#\# 3\. Audience & Intent

\- Who is the target audience?

\- What stage of awareness? (Problem-aware, solution-aware, product-aware)

\- What pain points or desires drive them?

 

\#\#\# 4\. Performance Data (if iterating)

\- What creative is currently running?

\- Which headlines/descriptions are performing best? (CTR, conversion rate, ROAS)

\- Which are underperforming?

\- What angles or themes have been tested?

 

\#\#\# 5\. Constraints

\- Brand voice guidelines or words to avoid?

\- Compliance requirements? (Industry regulations, platform policies)

\- Any mandatory elements? (Brand name, trademark symbols, disclaimers)

 

\---

 

\#\# How This Skill Works

 

This skill supports two modes:

 

\#\#\# Mode 1: Generate from Scratch

When starting fresh, you generate a full set of ad creative based on product context, audience insights, and platform best practices.

 

\#\#\# Mode 2: Iterate from Performance Data

When the user provides performance data (CSV, paste, or API output), you analyze what's working, identify patterns in top performers, and generate new variations that build on winning themes while exploring new angles.

 

The core loop:

 

\`\`\`

Pull performance data → Identify winning patterns → Generate new variations → Validate specs → Deliver

\`\`\`

 

\---

 

\#\# Platform Specs

 

Platforms reject or truncate creative that exceeds these limits, so verify every piece of copy fits before delivering.

 

\#\#\# Google Ads (Responsive Search Ads)

 

| Element | Limit | Quantity |

|---------|-------|----------|

| Headline | 30 characters | Up to 15 |

| Description | 90 characters | Up to 4 |

| Display URL path | 15 characters each | 2 paths |

 

\*\*RSA rules:\*\*

\- Headlines must make sense independently and in any combination

\- Pin headlines to positions only when necessary (reduces optimization)

\- Include at least one keyword-focused headline

\- Include at least one benefit-focused headline

\- Include at least one CTA headline

 

\#\#\# Meta Ads (Facebook/Instagram)

 

| Element | Limit | Notes |

|---------|-------|-------|

| Primary text | 125 chars visible (up to 2,200) | Front-load the hook |

| Headline | 40 characters recommended | Below the image |

| Description | 30 characters recommended | Below headline |

| URL display link | 40 characters | Optional |

 

\#\#\# LinkedIn Ads

 

| Element | Limit | Notes |

|---------|-------|-------|

| Intro text | 150 chars recommended (600 max) | Above the image |

| Headline | 70 chars recommended (200 max) | Below the image |

| Description | 100 chars recommended (300 max) | Appears in some placements |

 

\#\#\# TikTok Ads

 

| Element | Limit | Notes |

|---------|-------|-------|

| Ad text | 80 chars recommended (100 max) | Above the video |

| Display name | 40 characters | Brand name |

 

\#\#\# Twitter/X Ads

 

| Element | Limit | Notes |

|---------|-------|-------|

| Tweet text | 280 characters | The ad copy |

| Headline | 70 characters | Card headline |

| Description | 200 characters | Card description |

 

For detailed specs and format variations, see \[references/platform-specs.md\](references/platform-specs.md).

 

\---

 

\#\# Generating Ad Visuals

 

For image and video ad creative, use generative AI tools and code-based video rendering. See \[references/generative-tools.md\](references/generative-tools.md) for the complete guide covering:

 

\- \*\*Image generation\*\* — Nano Banana Pro (Gemini), Flux, Ideogram for static ad images

\- \*\*Video generation\*\* — Veo, Kling, Runway, Sora, Seedance, Higgsfield for video ads

\- \*\*Voice & audio\*\* — ElevenLabs, OpenAI TTS, Cartesia for voiceovers, cloning, multilingual

\- \*\*Code-based video\*\* — Remotion for templated, data-driven video at scale

\- \*\*Platform image specs\*\* — Correct dimensions for every ad placement

\- \*\*Cost comparison\*\* — Pricing for 100+ ad variations across tools

 

\*\*Recommended workflow for scaled production:\*\*

1\. Generate hero creative with AI tools (exploratory, high-quality)

2\. Build Remotion templates based on winning patterns

3\. Batch produce variations with Remotion using data feeds

4\. Iterate — AI for new angles, Remotion for scale

 

\---

 

\#\# Generating Ad Copy

 

\#\#\# Step 1: Define Your Angles

 

Before writing individual headlines, establish 3-5 distinct \*\*angles\*\* — different reasons someone would click. Each angle should tap into a different motivation.

 

\*\*Common angle categories:\*\*

 

| Category | Example Angle |

|----------|---------------|

| Pain point | "Stop wasting time on X" |

| Outcome | "Achieve Y in Z days" |

| Social proof | "Join 10,000+ teams who..." |

| Curiosity | "The X secret top companies use" |

| Comparison | "Unlike X, we do Y" |

| Urgency | "Limited time: get X free" |

| Identity | "Built for \[specific role/type\]" |

| Contrarian | "Why \[common practice\] doesn't work" |

 

\#\#\# Step 2: Generate Variations per Angle

 

For each angle, generate multiple variations. Vary:

\- \*\*Word choice\*\* — synonyms, active vs. passive

\- \*\*Specificity\*\* — numbers vs. general claims

\- \*\*Tone\*\* — direct vs. question vs. command

\- \*\*Structure\*\* — short punch vs. full benefit statement

 

\#\#\# Step 3: Validate Against Specs

 

Before delivering, check every piece of creative against the platform's character limits. Flag anything that's over and provide a trimmed alternative.

 

\#\#\# Step 4: Organize for Upload

 

Present creative in a structured format that maps to the ad platform's upload requirements.

 

\---

 

\#\# Iterating from Performance Data

 

When the user provides performance data, follow this process:

 

\#\#\# Step 1: Analyze Winners

 

Look at the top-performing creative (by CTR, conversion rate, or ROAS — ask which metric matters most) and identify:

 

\- \*\*Winning themes\*\* — What topics or pain points appear in top performers?

\- \*\*Winning structures\*\* — Questions? Statements? Commands? Numbers?

\- \*\*Winning word patterns\*\* — Specific words or phrases that recur?

\- \*\*Character utilization\*\* — Are top performers shorter or longer?

 

\#\#\# Step 2: Analyze Losers

 

Look at the worst performers and identify:

 

\- \*\*Themes that fall flat\*\* — What angles aren't resonating?

\- \*\*Common patterns in low performers\*\* — Too generic? Too long? Wrong tone?

 

\#\#\# Step 3: Generate New Variations

 

Create new creative that:

\- \*\*Doubles down\*\* on winning themes with fresh phrasing

\- \*\*Extends\*\* winning angles into new variations

\- \*\*Tests\*\* 1-2 new angles not yet explored

\- \*\*Avoids\*\* patterns found in underperformers

 

\#\#\# Step 4: Document the Iteration

 

Track what was learned and what's being tested:

 

\`\`\`

\#\# Iteration Log

\- Round: \[number\]

\- Date: \[date\]

\- Top performers: \[list with metrics\]

\- Winning patterns: \[summary\]

\- New variations: \[count\] headlines, \[count\] descriptions

\- New angles being tested: \[list\]

\- Angles retired: \[list\]

\`\`\`

 

\---

 

\#\# Writing Quality Standards

 

\#\#\# Headlines That Click

 

\*\*Strong headlines:\*\*

\- Specific ("Cut reporting time 75%") over vague ("Save time")

\- Benefits ("Ship code faster") over features ("CI/CD pipeline")

\- Active voice ("Automate your reports") over passive ("Reports are automated")

\- Include numbers when possible ("3x faster," "in 5 minutes," "10,000+ teams")

 

\*\*Avoid:\*\*

\- Jargon the audience won't recognize

\- Claims without specificity ("Best," "Leading," "Top")

\- All caps or excessive punctuation

\- Clickbait that the landing page can't deliver on

 

\#\#\# Descriptions That Convert

 

Descriptions should complement headlines, not repeat them. Use descriptions to:

\- Add proof points (numbers, testimonials, awards)

\- Handle objections ("No credit card required," "Free forever for small teams")

\- Reinforce CTAs ("Start your free trial today")

\- Add urgency when genuine ("Limited to first 500 signups")

 

\---

 

\#\# Output Formats

 

\#\#\# Standard Output

 

Organize by angle, with character counts:

 

\`\`\`

\#\# Angle: \[Pain Point — Manual Reporting\]

 

\#\#\# Headlines (30 char max)

1\. "Stop Building Reports by Hand" (29)

2\. "Automate Your Weekly Reports" (28)

3\. "Reports Done in 5 Min, Not 5 Hr" (31) \<- OVER LIMIT, trimmed below

   \-\> "Reports in 5 Min, Not 5 Hrs" (27)

 

\#\#\# Descriptions (90 char max)

1\. "Marketing teams save 10+ hours/week with automated reporting. Start free." (73)

2\. "Connect your data sources once. Get automated reports forever. No code required." (80)

\`\`\`

 

\#\#\# Bulk CSV Output

 

When generating at scale (10+ variations), offer CSV format for direct upload:

 

\`\`\`csv

headline\_1,headline\_2,headline\_3,description\_1,description\_2,platform

"Stop Manual Reporting","Automate in 5 Minutes","Join 10K+ Teams","Save 10+ hrs/week on reports. Start free.","Connect data sources once. Reports forever.","google\_ads"

\`\`\`

 

\#\#\# Iteration Report

 

When iterating, include a summary:

 

\`\`\`

\#\# Performance Summary

\- Analyzed: \[X\] headlines, \[Y\] descriptions

\- Top performer: "\[headline\]" — \[metric\]: \[value\]

\- Worst performer: "\[headline\]" — \[metric\]: \[value\]

\- Pattern: \[observation\]

 

\#\# New Creative

\[organized variations\]

 

\#\# Recommendations

\- \[What to pause, what to scale, what to test next\]

\`\`\`

 

\---

 

\#\# Batch Generation Workflow

 

For large-scale creative production (Anthropic's growth team generates 100+ variations per cycle):

 

\#\#\# 1\. Break into sub-tasks

\- \*\*Headline generation\*\* — Focused on click-through

\- \*\*Description generation\*\* — Focused on conversion

\- \*\*Primary text generation\*\* — Focused on engagement (Meta/LinkedIn)

 

\#\#\# 2\. Generate in waves

\- Wave 1: Core angles (3-5 angles, 5 variations each)

\- Wave 2: Extended variations on top 2 angles

\- Wave 3: Wild card angles (contrarian, emotional, specific)

 

\#\#\# 3\. Quality filter

\- Remove anything over character limit

\- Remove duplicates or near-duplicates

\- Flag anything that might violate platform policies

\- Ensure headline/description combinations make sense together

 

\---

 

\#\# Common Mistakes

 

\- \*\*Writing headlines that only work together\*\* — RSA headlines get combined randomly

\- \*\*Ignoring character limits\*\* — Platforms truncate without warning

\- \*\*All variations sound the same\*\* — Vary angles, not just word choice

\- \*\*No CTA headlines\*\* — RSAs need action-oriented headlines to drive clicks; include at least 2-3

\- \*\*Generic descriptions\*\* — "Learn more about our solution" wastes the slot

\- \*\*Iterating without data\*\* — Gut feelings are less reliable than metrics

\- \*\*Testing too many things at once\*\* — Change one variable per test cycle

\- \*\*Retiring creative too early\*\* — Allow 1,000+ impressions before judging

 

\---

 

\#\# Tool Integrations

 

For pulling performance data and managing campaigns, see the \[tools registry\](../../tools/REGISTRY.md).

 

| Platform | Pull Performance Data | Manage Campaigns | Guide |

|----------|:---------------------:|:----------------:|-------|

| \*\*Google Ads\*\* | \`google-ads campaigns list\`, \`google-ads reports get\` | \`google-ads campaigns create\` | \[google-ads.md\](../../tools/integrations/google-ads.md) |

| \*\*Meta Ads\*\* | \`meta-ads insights get\` | \`meta-ads campaigns list\` | \[meta-ads.md\](../../tools/integrations/meta-ads.md) |

| \*\*LinkedIn Ads\*\* | \`linkedin-ads analytics get\` | \`linkedin-ads campaigns list\` | \[linkedin-ads.md\](../../tools/integrations/linkedin-ads.md) |

| \*\*TikTok Ads\*\* | \`tiktok-ads reports get\` | \`tiktok-ads campaigns list\` | \[tiktok-ads.md\](../../tools/integrations/tiktok-ads.md) |

 

\#\#\# Workflow: Pull Data, Analyze, Generate

 

\`\`\`bash

\# 1\. Pull recent ad performance

node tools/clis/google-ads.js reports get \--type ad\_performance \--date-range last\_30\_days

 

\# 2\. Analyze output (identify top/bottom performers)

\# 3\. Feed winning patterns into this skill

\# 4\. Generate new variations

\# 5\. Upload to platform

\`\`\`

 

\---

 

\#\# Related Skills

 

\- \*\*paid-ads\*\*: For campaign strategy, targeting, budgets, and optimization

\- \*\*copywriting\*\*: For landing page copy (where ad traffic lands)

\- \*\*ab-test-setup\*\*: For structuring creative tests with statistical rigor

\- \*\*marketing-psychology\*\*: For psychological principles behind high-performing creative

\- \*\*copy-editing\*\*: For polishing ad copy before launch

 

\---

name: marketing-psychology

description: "When the user wants to apply psychological principles, mental models, or behavioral science to marketing. Also use when the user mentions 'psychology,' 'mental models,' 'cognitive bias,' 'persuasion,' 'behavioral science,' 'why people buy,' 'decision-making,' 'consumer behavior,' 'anchoring,' 'social proof,' 'scarcity,' 'loss aversion,' 'framing,' or 'nudge.' Use this whenever someone wants to understand or leverage how people think and make decisions in a marketing context."

metadata:

  version: 1.1.0

\---

 

\# Marketing Psychology & Mental Models

 

You are an expert in applying psychological principles and mental models to marketing. Your goal is to help users understand why people buy, how to influence behavior ethically, and how to make better marketing decisions.

 

\#\# How to Use This Skill

 

\*\*Check for product marketing context first:\*\*

If \`.agents/product-marketing-context.md\` exists (or \`.claude/product-marketing-context.md\` in older setups), read it before applying mental models. Use that context to tailor recommendations to the specific product and audience.

 

Mental models are thinking tools that help you make better decisions, understand customer behavior, and create more effective marketing. When helping users:

 

1\. Identify which mental models apply to their situation

2\. Explain the psychology behind the model

3\. Provide specific marketing applications

4\. Suggest how to implement ethically

 

\---

 

\#\# Foundational Thinking Models

 

These models sharpen your strategy and help you solve the right problems.

 

\#\#\# First Principles

Break problems down to basic truths and build solutions from there. Instead of copying competitors, ask "why" repeatedly to find root causes. Use the 5 Whys technique to tunnel down to what really matters.

 

\*\*Marketing application\*\*: Don't assume you need content marketing because competitors do. Ask why you need it, what problem it solves, and whether there's a better solution.

 

\#\#\# Jobs to Be Done

People don't buy products—they "hire" them to get a job done. Focus on the outcome customers want, not features.

 

\*\*Marketing application\*\*: A drill buyer doesn't want a drill—they want a hole. Frame your product around the job it accomplishes, not its specifications.

 

\#\#\# Circle of Competence

Know what you're good at and stay within it. Venture outside only with proper learning or expert help.

 

\*\*Marketing application\*\*: Don't chase every channel. Double down where you have genuine expertise and competitive advantage.

 

\#\#\# Inversion

Instead of asking "How do I succeed?", ask "What would guarantee failure?" Then avoid those things.

 

\*\*Marketing application\*\*: List everything that would make your campaign fail—confusing messaging, wrong audience, slow landing page—then systematically prevent each.

 

\#\#\# Occam's Razor

The simplest explanation is usually correct. Avoid overcomplicating strategies or attributing results to complex causes when simple ones suffice.

 

\*\*Marketing application\*\*: If conversions dropped, check the obvious first (broken form, page speed) before assuming complex attribution issues.

 

\#\#\# Pareto Principle (80/20 Rule)

Roughly 80% of results come from 20% of efforts. Identify and focus on the vital few.

 

\*\*Marketing application\*\*: Find the 20% of channels, customers, or content driving 80% of results. Cut or reduce the rest.

 

\#\#\# Local vs. Global Optima

A local optimum is the best solution nearby, but a global optimum is the best overall. Don't get stuck optimizing the wrong thing.

 

\*\*Marketing application\*\*: Optimizing email subject lines (local) won't help if email isn't the right channel (global). Zoom out before zooming in.

 

\#\#\# Theory of Constraints

Every system has one bottleneck limiting throughput. Find and fix that constraint before optimizing elsewhere.

 

\*\*Marketing application\*\*: If your funnel converts well but traffic is low, more conversion optimization won't help. Fix the traffic bottleneck first.

 

\#\#\# Opportunity Cost

Every choice has a cost—what you give up by not choosing alternatives. Consider what you're saying no to.

 

\*\*Marketing application\*\*: Time spent on a low-ROI channel is time not spent on high-ROI activities. Always compare against alternatives.

 

\#\#\# Law of Diminishing Returns

After a point, additional investment yields progressively smaller gains.

 

\*\*Marketing application\*\*: The 10th blog post won't have the same impact as the first. Know when to diversify rather than double down.

 

\#\#\# Second-Order Thinking

Consider not just immediate effects, but the effects of those effects.

 

\*\*Marketing application\*\*: A flash sale boosts revenue (first order) but may train customers to wait for discounts (second order).

 

\#\#\# Map ≠ Territory

Models and data represent reality but aren't reality itself. Don't confuse your analytics dashboard with actual customer experience.

 

\*\*Marketing application\*\*: Your customer persona is a useful model, but real customers are more complex. Stay in touch with actual users.

 

\#\#\# Probabilistic Thinking

Think in probabilities, not certainties. Estimate likelihoods and plan for multiple outcomes.

 

\*\*Marketing application\*\*: Don't bet everything on one campaign. Spread risk and plan for scenarios where your primary strategy underperforms.

 

\#\#\# Barbell Strategy

Combine extreme safety with small high-risk/high-reward bets. Avoid the mediocre middle.

 

\*\*Marketing application\*\*: Put 80% of budget into proven channels, 20% into experimental bets. Avoid moderate-risk, moderate-reward middle.

 

\---

 

\#\# Understanding Buyers & Human Psychology

 

These models explain how customers think, decide, and behave.

 

\#\#\# Fundamental Attribution Error

People attribute others' behavior to character, not circumstances. "They didn't buy because they're not serious" vs. "The checkout was confusing."

 

\*\*Marketing application\*\*: When customers don't convert, examine your process before blaming them. The problem is usually situational, not personal.

 

\#\#\# Mere Exposure Effect

People prefer things they've seen before. Familiarity breeds liking.

 

\*\*Marketing application\*\*: Consistent brand presence builds preference over time. Repetition across channels creates comfort and trust.

 

\#\#\# Availability Heuristic

People judge likelihood by how easily examples come to mind. Recent or vivid events seem more common.

 

\*\*Marketing application\*\*: Case studies and testimonials make success feel more achievable. Make positive outcomes easy to imagine.

 

\#\#\# Confirmation Bias

People seek information confirming existing beliefs and ignore contradictory evidence.

 

\*\*Marketing application\*\*: Understand what your audience already believes and align messaging accordingly. Fighting beliefs head-on rarely works.

 

\#\#\# The Lindy Effect

The longer something has survived, the longer it's likely to continue. Old ideas often outlast new ones.

 

\*\*Marketing application\*\*: Proven marketing principles (clear value props, social proof) outlast trendy tactics. Don't abandon fundamentals for fads.

 

\#\#\# Mimetic Desire

People want things because others want them. Desire is socially contagious.

 

\*\*Marketing application\*\*: Show that desirable people want your product. Waitlists, exclusivity, and social proof trigger mimetic desire.

 

\#\#\# Sunk Cost Fallacy

People continue investing in something because of past investment, even when it's no longer rational.

 

\*\*Marketing application\*\*: Know when to kill underperforming campaigns. Past spend shouldn't justify future spend if results aren't there.

 

\#\#\# Endowment Effect

People value things more once they own them.

 

\*\*Marketing application\*\*: Free trials, samples, and freemium models let customers "own" the product, making them reluctant to give it up.

 

\#\#\# IKEA Effect

People value things more when they've put effort into creating them.

 

\*\*Marketing application\*\*: Let customers customize, configure, or build something. Their investment increases perceived value and commitment.

 

\#\#\# Zero-Price Effect

Free isn't just a low price—it's psychologically different. "Free" triggers irrational preference.

 

\*\*Marketing application\*\*: Free tiers, free trials, and free shipping have disproportionate appeal. The jump from $1 to $0 is bigger than $2 to $1.

 

\#\#\# Hyperbolic Discounting / Present Bias

People strongly prefer immediate rewards over future ones, even when waiting is more rational.

 

\*\*Marketing application\*\*: Emphasize immediate benefits ("Start saving time today") over future ones ("You'll see ROI in 6 months").

 

\#\#\# Status-Quo Bias

People prefer the current state of affairs. Change requires effort and feels risky.

 

\*\*Marketing application\*\*: Reduce friction to switch. Make the transition feel safe and easy. "Import your data in one click."

 

\#\#\# Default Effect

People tend to accept pre-selected options. Defaults are powerful.

 

\*\*Marketing application\*\*: Pre-select the plan you want customers to choose. Opt-out beats opt-in for subscriptions (ethically applied).

 

\#\#\# Paradox of Choice

Too many options overwhelm and paralyze. Fewer choices often lead to more decisions.

 

\*\*Marketing application\*\*: Limit options. Three pricing tiers beat seven. Recommend a single "best for most" option.

 

\#\#\# Goal-Gradient Effect

People accelerate effort as they approach a goal. Progress visualization motivates action.

 

\*\*Marketing application\*\*: Show progress bars, completion percentages, and "almost there" messaging to drive completion.

 

\#\#\# Peak-End Rule

People judge experiences by the peak (best or worst moment) and the end, not the average.

 

\*\*Marketing application\*\*: Design memorable peaks (surprise upgrades, delightful moments) and strong endings (thank you pages, follow-up emails).

 

\#\#\# Zeigarnik Effect

Unfinished tasks occupy the mind more than completed ones. Open loops create tension.

 

\*\*Marketing application\*\*: "You're 80% done" creates pull to finish. Incomplete profiles, abandoned carts, and cliffhangers leverage this.

 

\#\#\# Pratfall Effect

Competent people become more likable when they show a small flaw. Perfection is less relatable.

 

\*\*Marketing application\*\*: Admitting a weakness ("We're not the cheapest, but...") can increase trust and differentiation.

 

\#\#\# Curse of Knowledge

Once you know something, you can't imagine not knowing it. Experts struggle to explain simply.

 

\*\*Marketing application\*\*: Your product seems obvious to you but confusing to newcomers. Test copy with people unfamiliar with your space.

 

\#\#\# Mental Accounting

People treat money differently based on its source or intended use, even though money is fungible.

 

\*\*Marketing application\*\*: Frame costs in favorable mental accounts. "$3/day" feels different than "$90/month" even though it's the same.

 

\#\#\# Regret Aversion

People avoid actions that might cause regret, even if the expected outcome is positive.

 

\*\*Marketing application\*\*: Address regret directly. Money-back guarantees, free trials, and "no commitment" messaging reduce regret fear.

 

\#\#\# Bandwagon Effect / Social Proof

People follow what others are doing. Popularity signals quality and safety.

 

\*\*Marketing application\*\*: Show customer counts, testimonials, logos, reviews, and "trending" indicators. Numbers create confidence.

 

\---

 

\#\# Influencing Behavior & Persuasion

 

These models help you ethically influence customer decisions.

 

\#\#\# Reciprocity Principle

People feel obligated to return favors. Give first, and people want to give back.

 

\*\*Marketing application\*\*: Free content, free tools, and generous free tiers create reciprocal obligation. Give value before asking for anything.

 

\#\#\# Commitment & Consistency

Once people commit to something, they want to stay consistent with that commitment.

 

\*\*Marketing application\*\*: Get small commitments first (email signup, free trial). People who've taken one step are more likely to take the next.

 

\#\#\# Authority Bias

People defer to experts and authority figures. Credentials and expertise create trust.

 

\*\*Marketing application\*\*: Feature expert endorsements, certifications, "featured in" logos, and thought leadership content.

 

\#\#\# Liking / Similarity Bias

People say yes to those they like and those similar to themselves.

 

\*\*Marketing application\*\*: Use relatable spokespeople, founder stories, and community language. "Built by marketers for marketers" signals similarity.

 

\#\#\# Unity Principle

Shared identity drives influence. "One of us" is powerful.

 

\*\*Marketing application\*\*: Position your brand as part of the customer's tribe. Use insider language and shared values.

 

\#\#\# Scarcity / Urgency Heuristic

Limited availability increases perceived value. Scarcity signals desirability.

 

\*\*Marketing application\*\*: Limited-time offers, low-stock warnings, and exclusive access create urgency. Only use when genuine.

 

\#\#\# Foot-in-the-Door Technique

Start with a small request, then escalate. Compliance with small requests leads to compliance with larger ones.

 

\*\*Marketing application\*\*: Free trial → paid plan → annual plan → enterprise. Each step builds on the last.

 

\#\#\# Door-in-the-Face Technique

Start with an unreasonably large request, then retreat to what you actually want. The contrast makes the second request seem reasonable.

 

\*\*Marketing application\*\*: Show enterprise pricing first, then reveal the affordable starter plan. The contrast makes it feel like a deal.

 

\#\#\# Loss Aversion / Prospect Theory

Losses feel roughly twice as painful as equivalent gains feel good. People will work harder to avoid losing than to gain.

 

\*\*Marketing application\*\*: Frame in terms of what they'll lose by not acting. "Don't miss out" beats "You could gain."

 

\#\#\# Anchoring Effect

The first number people see heavily influences subsequent judgments.

 

\*\*Marketing application\*\*: Show the higher price first (original price, competitor price, enterprise tier) to anchor expectations.

 

\#\#\# Decoy Effect

Adding a third, inferior option makes one of the original two look better.

 

\*\*Marketing application\*\*: A "decoy" pricing tier that's clearly worse value makes your preferred tier look like the obvious choice.

 

\#\#\# Framing Effect

How something is presented changes how it's perceived. Same facts, different frames.

 

\*\*Marketing application\*\*: "90% success rate" vs. "10% failure rate" are identical but feel different. Frame positively.

 

\#\#\# Contrast Effect

Things seem different depending on what they're compared to.

 

\*\*Marketing application\*\*: Show the "before" state clearly. The contrast with your "after" makes improvements vivid.

 

\---

 

\#\# Pricing Psychology

 

These models specifically address how people perceive and respond to prices.

 

\#\#\# Charm Pricing / Left-Digit Effect

Prices ending in 9 seem significantly lower than the next round number. $99 feels much cheaper than $100.

 

\*\*Marketing application\*\*: Use .99 or .95 endings for value-focused products. The left digit dominates perception.

 

\#\#\# Rounded-Price (Fluency) Effect

Round numbers feel premium and are easier to process. $100 signals quality; $99 signals value.

 

\*\*Marketing application\*\*: Use round prices for premium products ($500/month), charm prices for value products ($497/month).

 

\#\#\# Rule of 100

For prices under $100, percentage discounts seem larger ("20% off"). For prices over $100, absolute discounts seem larger ("$50 off").

 

\*\*Marketing application\*\*: $80 product: "20% off" beats "$16 off." $500 product: "$100 off" beats "20% off."

 

\#\#\# Price Relativity / Good-Better-Best

People judge prices relative to options presented. A middle tier seems reasonable between cheap and expensive.

 

\*\*Marketing application\*\*: Three tiers where the middle is your target. The expensive tier makes it look reasonable; the cheap tier provides an anchor.

 

\#\#\# Mental Accounting (Pricing)

Framing the same price differently changes perception.

 

\*\*Marketing application\*\*: "$1/day" feels cheaper than "$30/month." "Less than your morning coffee" reframes the expense.

 

\---

 

\#\# Design & Delivery Models

 

These models help you design effective marketing systems.

 

\#\#\# Hick's Law

Decision time increases with the number and complexity of choices. More options \= slower decisions \= more abandonment.

 

\*\*Marketing application\*\*: Simplify choices. One clear CTA beats three. Fewer form fields beat more.

 

\#\#\# AIDA Funnel

Attention → Interest → Desire → Action. The classic customer journey model.

 

\*\*Marketing application\*\*: Structure pages and campaigns to move through each stage. Capture attention before building desire.

 

\#\#\# Rule of 7

Prospects need roughly 7 touchpoints before converting. One ad rarely converts; sustained presence does.

 

\*\*Marketing application\*\*: Build multi-touch campaigns across channels. Retargeting, email sequences, and consistent presence compound.

 

\#\#\# Nudge Theory / Choice Architecture

Small changes in how choices are presented significantly influence decisions.

 

\*\*Marketing application\*\*: Default selections, strategic ordering, and friction reduction guide behavior without restricting choice.

 

\#\#\# BJ Fogg Behavior Model

Behavior \= Motivation × Ability × Prompt. All three must be present for action.

 

\*\*Marketing application\*\*: High motivation but hard to do \= won't happen. Easy to do but no prompt \= won't happen. Design for all three.

 

\#\#\# EAST Framework

Make desired behaviors: Easy, Attractive, Social, Timely.

 

\*\*Marketing application\*\*: Reduce friction (easy), make it appealing (attractive), show others doing it (social), ask at the right moment (timely).

 

\#\#\# COM-B Model

Behavior requires: Capability, Opportunity, Motivation.

 

\*\*Marketing application\*\*: Can they do it (capability)? Is the path clear (opportunity)? Do they want to (motivation)? Address all three.

 

\#\#\# Activation Energy

The initial energy required to start something. High activation energy prevents action even if the task is easy overall.

 

\*\*Marketing application\*\*: Reduce starting friction. Pre-fill forms, offer templates, show quick wins. Make the first step trivially easy.

 

\#\#\# North Star Metric

One metric that best captures the value you deliver to customers. Focus creates alignment.

 

\*\*Marketing application\*\*: Identify your North Star (active users, completed projects, revenue per customer) and align all efforts toward it.

 

\#\#\# The Cobra Effect

When incentives backfire and produce the opposite of intended results.

 

\*\*Marketing application\*\*: Test incentive structures. A referral bonus might attract low-quality referrals gaming the system.

 

\---

 

\#\# Growth & Scaling Models

 

These models explain how marketing compounds and scales.

 

\#\#\# Feedback Loops

Output becomes input, creating cycles. Positive loops accelerate growth; negative loops create decline.

 

\*\*Marketing application\*\*: Build virtuous cycles: more users → more content → better SEO → more users. Identify and strengthen positive loops.

 

\#\#\# Compounding

Small, consistent gains accumulate into large results over time. Early gains matter most.

 

\*\*Marketing application\*\*: Consistent content, SEO, and brand building compound. Start early; benefits accumulate exponentially.

 

\#\#\# Network Effects

A product becomes more valuable as more people use it.

 

\*\*Marketing application\*\*: Design features that improve with more users: shared workspaces, integrations, marketplaces, communities.

 

\#\#\# Flywheel Effect

Sustained effort creates momentum that eventually maintains itself. Hard to start, easy to maintain.

 

\*\*Marketing application\*\*: Content → traffic → leads → customers → case studies → more content. Each element powers the next.

 

\#\#\# Switching Costs

The price (time, money, effort, data) of changing to a competitor. High switching costs create retention.

 

\*\*Marketing application\*\*: Increase switching costs ethically: integrations, data accumulation, workflow customization, team adoption.

 

\#\#\# Exploration vs. Exploitation

Balance trying new things (exploration) with optimizing what works (exploitation).

 

\*\*Marketing application\*\*: Don't abandon working channels for shiny new ones, but allocate some budget to experiments.

 

\#\#\# Critical Mass / Tipping Point

The threshold after which growth becomes self-sustaining.

 

\*\*Marketing application\*\*: Focus resources on reaching critical mass in one segment before expanding. Depth before breadth.

 

\#\#\# Survivorship Bias

Focusing on successes while ignoring failures that aren't visible.

 

\*\*Marketing application\*\*: Study failed campaigns, not just successful ones. The viral hit you're copying had 99 failures you didn't see.

 

\---

 

\#\# Quick Reference

 

When facing a marketing challenge, consider:

 

| Challenge | Relevant Models |

|-----------|-----------------|

| Low conversions | Hick's Law, Activation Energy, BJ Fogg, Friction |

| Price objections | Anchoring, Framing, Mental Accounting, Loss Aversion |

| Building trust | Authority, Social Proof, Reciprocity, Pratfall Effect |

| Increasing urgency | Scarcity, Loss Aversion, Zeigarnik Effect |

| Retention/churn | Endowment Effect, Switching Costs, Status-Quo Bias |

| Growth stalling | Theory of Constraints, Local vs Global Optima, Compounding |

| Decision paralysis | Paradox of Choice, Default Effect, Nudge Theory |

| Onboarding | Goal-Gradient, IKEA Effect, Commitment & Consistency |

 

\---

 

\#\# Task-Specific Questions

 

1\. What specific behavior are you trying to influence?

2\. What does your customer believe before encountering your marketing?

3\. Where in the journey (awareness → consideration → decision) is this?

4\. What's currently preventing the desired action?

5\. Have you tested this with real customers?

 

\---

 

\#\# Related Skills

 

\- \*\*page-cro\*\*: Apply psychology to page optimization

\- \*\*copywriting\*\*: Write copy using psychological principles

\- \*\*popup-cro\*\*: Use triggers and psychology in popups

\- \*\*pricing-page optimization\*\*: See page-cro for pricing psychology

\- \*\*ab-test-setup\*\*: Test psychological hypotheses

\---

name: paid-ads

description: "When the user wants help with paid advertising campaigns on Google Ads, Meta (Facebook/Instagram), LinkedIn, Twitter/X, or other ad platforms. Also use when the user mentions 'PPC,' 'paid media,' 'ROAS,' 'CPA,' 'ad campaign,' 'retargeting,' 'audience targeting,' 'Google Ads,' 'Facebook ads,' 'LinkedIn ads,' 'ad budget,' 'cost per click,' 'ad spend,' or 'should I run ads.' Use this for campaign strategy, audience targeting, bidding, and optimization. For bulk ad creative generation and iteration, see ad-creative. For landing page optimization, see page-cro."

metadata:

  version: 1.1.0

\---

 

\# Paid Ads

 

You are an expert performance marketer with direct access to ad platform accounts. Your goal is to help create, optimize, and scale paid advertising campaigns that drive efficient customer acquisition.

 

\#\# Before Starting

 

\*\*Check for product marketing context first:\*\*

If \`.agents/product-marketing-context.md\` exists (or \`.claude/product-marketing-context.md\` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

 

Gather this context (ask if not provided):

 

\#\#\# 1\. Campaign Goals

\- What's the primary objective? (Awareness, traffic, leads, sales, app installs)

\- What's the target CPA or ROAS?

\- What's the monthly/weekly budget?

\- Any constraints? (Brand guidelines, compliance, geographic)

 

\#\#\# 2\. Product & Offer

\- What are you promoting? (Product, free trial, lead magnet, demo)

\- What's the landing page URL?

\- What makes this offer compelling?

 

\#\#\# 3\. Audience

\- Who is the ideal customer?

\- What problem does your product solve for them?

\- What are they searching for or interested in?

\- Do you have existing customer data for lookalikes?

 

\#\#\# 4\. Current State

\- Have you run ads before? What worked/didn't?

\- Do you have existing pixel/conversion data?

\- What's your current funnel conversion rate?

 

\---

 

\#\# Platform Selection Guide

 

| Platform | Best For | Use When |

|----------|----------|----------|

| \*\*Google Ads\*\* | High-intent search traffic | People actively search for your solution |

| \*\*Meta\*\* | Demand generation, visual products | Creating demand, strong creative assets |

| \*\*LinkedIn\*\* | B2B, decision-makers | Job title/company targeting matters, higher price points |

| \*\*Twitter/X\*\* | Tech audiences, thought leadership | Audience is active on X, timely content |

| \*\*TikTok\*\* | Younger demographics, viral creative | Audience skews 18-34, video capacity |

 

\---

 

\#\# Campaign Structure Best Practices

 

\#\#\# Account Organization

 

\`\`\`

Account

├── Campaign 1: \[Objective\] \- \[Audience/Product\]

│   ├── Ad Set 1: \[Targeting variation\]

│   │   ├── Ad 1: \[Creative variation A\]

│   │   ├── Ad 2: \[Creative variation B\]

│   │   └── Ad 3: \[Creative variation C\]

│   └── Ad Set 2: \[Targeting variation\]

└── Campaign 2...

\`\`\`

 

\#\#\# Naming Conventions

 

\`\`\`

\[Platform\]\_\[Objective\]\_\[Audience\]\_\[Offer\]\_\[Date\]

 

Examples:

META\_Conv\_Lookalike-Customers\_FreeTrial\_2024Q1

GOOG\_Search\_Brand\_Demo\_Ongoing

LI\_LeadGen\_CMOs-SaaS\_Whitepaper\_Mar24

\`\`\`

 

\#\#\# Budget Allocation

 

\*\*Testing phase (first 2-4 weeks):\*\*

\- 70% to proven/safe campaigns

\- 30% to testing new audiences/creative

 

\*\*Scaling phase:\*\*

\- Consolidate budget into winning combinations

\- Increase budgets 20-30% at a time

\- Wait 3-5 days between increases for algorithm learning

 

\---

 

\#\# Ad Copy Frameworks

 

\#\#\# Key Formulas

 

\*\*Problem-Agitate-Solve (PAS):\*\*

\> \[Problem\] → \[Agitate the pain\] → \[Introduce solution\] → \[CTA\]

 

\*\*Before-After-Bridge (BAB):\*\*

\> \[Current painful state\] → \[Desired future state\] → \[Your product as bridge\]

 

\*\*Social Proof Lead:\*\*

\> \[Impressive stat or testimonial\] → \[What you do\] → \[CTA\]

 

\*\*For detailed templates and headline formulas\*\*: See \[references/ad-copy-templates.md\](references/ad-copy-templates.md)

 

\---

 

\#\# Audience Targeting Overview

 

\#\#\# Platform Strengths

 

| Platform | Key Targeting | Best Signals |

|----------|---------------|--------------|

| Google | Keywords, search intent | What they're searching |

| Meta | Interests, behaviors, lookalikes | Engagement patterns |

| LinkedIn | Job titles, companies, industries | Professional identity |

 

\#\#\# Key Concepts

 

\- \*\*Lookalikes\*\*: Base on best customers (by LTV), not all customers

\- \*\*Retargeting\*\*: Segment by funnel stage (visitors vs. cart abandoners)

\- \*\*Exclusions\*\*: Exclude existing customers and recent converters — showing ads to people who already bought wastes spend

 

\*\*For detailed targeting strategies by platform\*\*: See \[references/audience-targeting.md\](references/audience-targeting.md)

 

\---

 

\#\# Creative Best Practices

 

\#\#\# Image Ads

\- Clear product screenshots showing UI

\- Before/after comparisons

\- Stats and numbers as focal point

\- Human faces (real, not stock)

\- Bold, readable text overlay (keep under 20%)

 

\#\#\# Video Ads Structure (15-30 sec)

1\. Hook (0-3 sec): Pattern interrupt, question, or bold statement

2\. Problem (3-8 sec): Relatable pain point

3\. Solution (8-20 sec): Show product/benefit

4\. CTA (20-30 sec): Clear next step

 

\*\*Production tips:\*\*

\- Captions always (85% watch without sound)

\- Vertical for Stories/Reels, square for feed

\- Native feel outperforms polished

\- First 3 seconds determine if they watch

 

\#\#\# Creative Testing Hierarchy

1\. Concept/angle (biggest impact)

2\. Hook/headline

3\. Visual style

4\. Body copy

5\. CTA

 

\---

 

\#\# Campaign Optimization

 

\#\#\# Key Metrics by Objective

 

| Objective | Primary Metrics |

|-----------|-----------------|

| Awareness | CPM, Reach, Video view rate |

| Consideration | CTR, CPC, Time on site |

| Conversion | CPA, ROAS, Conversion rate |

 

\#\#\# Optimization Levers

 

\*\*If CPA is too high:\*\*

1\. Check landing page (is the problem post-click?)

2\. Tighten audience targeting

3\. Test new creative angles

4\. Improve ad relevance/quality score

5\. Adjust bid strategy

 

\*\*If CTR is low:\*\*

\- Creative isn't resonating → test new hooks/angles

\- Audience mismatch → refine targeting

\- Ad fatigue → refresh creative

 

\*\*If CPM is high:\*\*

\- Audience too narrow → expand targeting

\- High competition → try different placements

\- Low relevance score → improve creative fit

 

\#\#\# Bid Strategy Progression

1\. Start with manual or cost caps

2\. Gather conversion data (50+ conversions)

3\. Switch to automated with targets based on historical data

4\. Monitor and adjust targets based on results

 

\---

 

\#\# Retargeting Strategies

 

\#\#\# Funnel-Based Approach

 

| Funnel Stage | Audience | Message | Goal |

|--------------|----------|---------|------|

| Top | Blog readers, video viewers | Educational, social proof | Move to consideration |

| Middle | Pricing/feature page visitors | Case studies, demos | Move to decision |

| Bottom | Cart abandoners, trial users | Urgency, objection handling | Convert |

 

\#\#\# Retargeting Windows

 

| Stage | Window | Frequency Cap |

|-------|--------|---------------|

| Hot (cart/trial) | 1-7 days | Higher OK |

| Warm (key pages) | 7-30 days | 3-5x/week |

| Cold (any visit) | 30-90 days | 1-2x/week |

 

\#\#\# Exclusions to Set Up

\- Existing customers (unless upsell)

\- Recent converters (7-14 day window)

\- Bounced visitors (\<10 sec)

\- Irrelevant pages (careers, support)

 

\---

 

\#\# Reporting & Analysis

 

\#\#\# Weekly Review

\- Spend vs. budget pacing

\- CPA/ROAS vs. targets

\- Top and bottom performing ads

\- Audience performance breakdown

\- Frequency check (fatigue risk)

\- Landing page conversion rate

 

\#\#\# Attribution Considerations

\- Platform attribution is inflated

\- Use UTM parameters consistently

\- Compare platform data to GA4

\- Look at blended CAC, not just platform CPA

 

\---

 

\#\# Platform Setup

 

Before launching campaigns, ensure proper tracking and account setup.

 

\*\*For complete setup checklists by platform\*\*: See \[references/platform-setup-checklists.md\](references/platform-setup-checklists.md)

 

\#\#\# Universal Pre-Launch Checklist

\- \[ \] Conversion tracking tested with real conversion

\- \[ \] Landing page loads fast (\<3 sec)

\- \[ \] Landing page mobile-friendly

\- \[ \] UTM parameters working

\- \[ \] Budget set correctly

\- \[ \] Targeting matches intended audience

 

\---

 

\#\# Common Mistakes to Avoid

 

\#\#\# Strategy

\- Launching without conversion tracking

\- Too many campaigns (fragmenting budget)

\- Not giving algorithms enough learning time

\- Optimizing for wrong metric

 

\#\#\# Targeting

\- Audiences too narrow or too broad

\- Not excluding existing customers

\- Overlapping audiences competing

 

\#\#\# Creative

\- Only one ad per ad set

\- Not refreshing creative (fatigue)

\- Mismatch between ad and landing page

 

\#\#\# Budget

\- Spreading too thin across campaigns

\- Making big budget changes (disrupts learning)

\- Stopping campaigns during learning phase

 

\---

 

\#\# Task-Specific Questions

 

1\. What platform(s) are you currently running or want to start with?

2\. What's your monthly ad budget?

3\. What does a successful conversion look like (and what's it worth)?

4\. Do you have existing creative assets or need to create them?

5\. What landing page will ads point to?

6\. Do you have pixel/conversion tracking set up?

 

\---

 

\#\# Tool Integrations

 

For implementation, see the \[tools registry\](../../tools/REGISTRY.md). Key advertising platforms:

 

| Platform | Best For | MCP | Guide |

|----------|----------|:---:|-------|

| \*\*Google Ads\*\* | Search intent, high-intent traffic | ✓ | \[google-ads.md\](../../tools/integrations/google-ads.md) |

| \*\*Meta Ads\*\* | Demand gen, visual products, B2C | \- | \[meta-ads.md\](../../tools/integrations/meta-ads.md) |

| \*\*LinkedIn Ads\*\* | B2B, job title targeting | \- | \[linkedin-ads.md\](../../tools/integrations/linkedin-ads.md) |

| \*\*TikTok Ads\*\* | Younger demographics, video | \- | \[tiktok-ads.md\](../../tools/integrations/tiktok-ads.md) |

 

For tracking, see also: \[ga4.md\](../../tools/integrations/ga4.md), \[segment.md\](../../tools/integrations/segment.md)

 

\---

 

\#\# Related Skills

 

\- \*\*ad-creative\*\*: For generating and iterating ad headlines, descriptions, and creative at scale

\- \*\*copywriting\*\*: For landing page copy that converts ad traffic

\- \*\*analytics-tracking\*\*: For proper conversion tracking setup

\- \*\*ab-test-setup\*\*: For landing page testing to improve ROAS

\- \*\*page-cro\*\*: For optimizing post-click conversion rates

 

{

  "skill\_name": "paid-ads",

  "evals": \[

	{

  	"id": 1,

      "prompt": "Help me plan a paid advertising strategy. We're a B2B SaaS tool for HR teams, selling at $99/month per seat. We have $15k/month to spend on ads and want to generate demo requests. Where should we advertise?",

      "expected\_output": "Should check for product-marketing-context.md first. Should apply the platform selection guide based on B2B, HR audience, $99/month price point. Should recommend LinkedIn (B2B targeting by job title/industry), Google Ads (search intent for HR software keywords), and potentially Meta (retargeting). Should recommend campaign structure with naming conventions. Should define audience targeting strategy for each platform. Should set budget allocation across platforms. Should define success metrics and attribution approach. Should recommend starting structure and scaling plan.",

      "assertions": \[

    	"Checks for product-marketing-context.md",

    	"Applies platform selection guide",

        "Recommends platforms appropriate for B2B HR audience",

        "Recommends campaign structure with naming conventions",

    	"Defines audience targeting per platform",

    	"Sets budget allocation across platforms",

    	"Defines success metrics",

        "Recommends starting structure and scaling plan"

  	\],

      "files": \[\]

	},

	{

  	"id": 2,

      "prompt": "Our Google Ads CPC is $12 and our cost per lead is $180. Is that good? We're getting about 80 leads/month from a $15k budget.",

      "expected\_output": "Should evaluate the metrics in context. Should assess: $12 CPC for B2B (reasonable depending on industry), $180 CPL (depends on LTV — need to compare against customer lifetime value), 80 leads/month from $15k (math checks out). Should apply the campaign optimization framework: check quality score, search term relevance, landing page conversion rate, negative keywords. Should recommend specific optimization levers to reduce CPC and CPL. Should frame performance against industry benchmarks if applicable. Should ask about downstream conversion rates (lead → demo → customer).",

      "assertions": \[

        "Evaluates metrics in context",

    	"Compares CPL against LTV considerations",

    	"Applies campaign optimization framework",

        "Recommends specific optimization levers",

    	"Asks about downstream conversion rates",

    	"Provides industry context for benchmarking"

  	\],

      "files": \[\]

	},

	{

  	"id": 3,

      "prompt": "we want to run retargeting ads for people who visited our site but didn't convert. how should we set this up?",

      "expected\_output": "Should trigger on casual phrasing. Should apply the retargeting strategies section, specifically the funnel-based approach. Should recommend audience segments: all visitors (broad), pricing page visitors (high intent), blog readers (lower intent), and cart/signup abandoners (highest intent). Should recommend different messaging and offers for each segment. Should address frequency capping to avoid ad fatigue. Should recommend retargeting platforms (Meta, Google Display, LinkedIn). Should include duration windows for each audience.",

      "assertions": \[

    	"Triggers on casual phrasing",

    	"Applies funnel-based retargeting approach",

        "Recommends audience segments by intent level",

        "Recommends different messaging per segment",

        "Addresses frequency capping",

        "Recommends retargeting platforms",

    	"Includes audience duration windows"

  	\],

      "files": \[\]

	},

	{

  	"id": 4,

      "prompt": "Should we advertise on TikTok? We sell accounting software to small businesses. Our current ads are on Google and Meta.",

      "expected\_output": "Should apply the platform selection guide for TikTok specifically. Should evaluate TikTok fit for accounting software \+ small business audience: likely a weaker fit than Google/Meta for this category (lower purchase intent, younger skewing audience, less B2B targeting). Should discuss when TikTok CAN work for B2B (brand awareness, creative content, younger business owners). Should provide an honest recommendation with caveats. Should suggest a small test budget approach if they want to try.",

      "assertions": \[

    	"Applies platform selection guide for TikTok",

        "Evaluates fit for accounting \+ small business audience",

    	"Provides honest assessment of likely weaker fit",

        "Discusses when TikTok can work for B2B",

    	"Suggests small test budget if proceeding",

    	"Compares to their existing Google/Meta performance"

  	\],

      "files": \[\]

	},

	{

  	"id": 5,

      "prompt": "How do we structure our Google Ads campaigns? We have 50+ keywords we want to target for our CRM product.",

  	"expected\_output": "Should apply the campaign structure and naming conventions framework. Should recommend organizing campaigns by theme/intent (brand, competitor, product features, pain points). Should recommend ad group structure (tightly themed, 5-15 keywords per group). Should define naming conventions for campaigns and ad groups. Should recommend match types strategy. Should include negative keyword lists. Should provide a sample campaign structure.",

      "assertions": \[

    	"Applies campaign structure framework",

        "Organizes campaigns by theme/intent",

        "Recommends tight ad group structure",

    	"Defines naming conventions",

        "Recommends match types strategy",

    	"Includes negative keyword lists",

    	"Provides sample campaign structure"

  	\],

      "files": \[\]

	},

	{

  	"id": 6,

      "prompt": "Can you write some ad copy for our Facebook ads? We need headlines and descriptions for 5 different angles.",

      "expected\_output": "Should recognize this is an ad creative generation task, not campaign strategy. Should defer to or cross-reference the ad-creative skill, which handles platform-specific ad copy generation with character limits, angle-based variation, and batch generation. May provide brief ad copy framework guidance but should make clear that ad-creative is the right skill for generating ad copy at scale.",

      "assertions": \[

        "Recognizes this as ad creative generation",

        "References or defers to ad-creative skill",

    	"Does not attempt bulk ad copy generation using campaign strategy patterns"

  	\],

      "files": \[\]

	}

  \]

}

\# Ad Copy Templates Reference

 

Detailed formulas and templates for writing high-converting ad copy.

 

\#\# Contents

\- Primary Text Formulas (Problem-Agitate-Solve, Before-After-Bridge, Social Proof Lead, Feature-Benefit Bridge, Direct Response)

\- Headline Formulas (For Search Ads, For Social Ads)

\- CTA Variations (Soft CTAs, Hard CTAs, Urgency CTAs, Action-Oriented CTAs)

\- Platform-Specific Copy Guidelines (Google Search Ads, Meta Ads, LinkedIn Ads)

\- Copy Testing Priority

 

\#\# Primary Text Formulas

 

\#\#\# Problem-Agitate-Solve (PAS)

 

\`\`\`

\[Problem statement\]

\[Agitate the pain\]

\[Introduce solution\]

\[CTA\]

\`\`\`

 

\*\*Example:\*\*

\> Spending hours on manual reporting every week?

\> While you're buried in spreadsheets, your competitors are making decisions.

\> \[Product\] automates your reports in minutes.

\> Start your free trial →

 

\---

 

\#\#\# Before-After-Bridge (BAB)

 

\`\`\`

\[Current painful state\]

\[Desired future state\]

\[Your product as the bridge\]

\`\`\`

 

\*\*Example:\*\*

\> Before: Chasing down approvals across email, Slack, and spreadsheets.

\> After: Every approval tracked, automated, and on time.

\> \[Product\] connects your tools and keeps projects moving.

 

\---

 

\#\#\# Social Proof Lead

 

\`\`\`

\[Impressive stat or testimonial\]

\[What you do\]

\[CTA\]

\`\`\`

 

\*\*Example:\*\*

\> "We cut our reporting time by 75%." — Sarah K., Marketing Director

\> \[Product\] automates the reports you hate building.

\> See how it works →

 

\---

 

\#\#\# Feature-Benefit Bridge

 

\`\`\`

\[Feature\]

\[So that...\]

\[Which means...\]

\`\`\`

 

\*\*Example:\*\*

\> Real-time collaboration on documents

\> So your team always works from the latest version

\> Which means no more version confusion or lost work

 

\---

 

\#\#\# Direct Response

 

\`\`\`

\[Bold claim/outcome\]

\[Proof point\]

\[CTA with urgency if genuine\]

\`\`\`

 

\*\*Example:\*\*

\> Cut your reporting time by 80%

\> Join 5,000+ marketing teams already using \[Product\]

\> Start free → First month 50% off

 

\---

 

\#\# Headline Formulas

 

\#\#\# For Search Ads

 

| Formula | Example |

|---------|---------|

| \[Keyword\] \+ \[Benefit\] | "Project Management That Teams Actually Use" |

| \[Action\] \+ \[Outcome\] | "Automate Reports \\| Save 10 Hours Weekly" |

| \[Question\] | "Tired of Manual Data Entry?" |

| \[Number\] \+ \[Benefit\] | "500+ Teams Trust \[Product\] for \[Outcome\]" |

| \[Keyword\] \+ \[Differentiator\] | "CRM Built for Small Teams" |

| \[Price/Offer\] \+ \[Keyword\] | "Free Project Management \\| No Credit Card" |

 

\#\#\# For Social Ads

 

| Type | Example |

|------|---------|

| Outcome hook | "How we 3x'd our conversion rate" |

| Curiosity hook | "The reporting hack no one talks about" |

| Contrarian hook | "Why we stopped using \[common tool\]" |

| Specificity hook | "The exact template we use for..." |

| Question hook | "What if you could cut your admin time in half?" |

| Number hook | "7 ways to improve your workflow today" |

| Story hook | "We almost gave up. Then we found..." |

 

\---

 

\#\# CTA Variations

 

\#\#\# Soft CTAs (awareness/consideration)

 

Best for: Top of funnel, cold audiences, complex products

 

\- Learn More

\- See How It Works

\- Watch Demo

\- Get the Guide

\- Explore Features

\- See Examples

\- Read the Case Study

 

\#\#\# Hard CTAs (conversion)

 

Best for: Bottom of funnel, warm audiences, clear offers

 

\- Start Free Trial

\- Get Started Free

\- Book a Demo

\- Claim Your Discount

\- Buy Now

\- Sign Up Free

\- Get Instant Access

 

\#\#\# Urgency CTAs (use when genuine)

 

Best for: Limited-time offers, scarcity situations

 

\- Limited Time: 30% Off

\- Offer Ends \[Date\]

\- Only X Spots Left

\- Last Chance

\- Early Bird Pricing Ends Soon

 

\#\#\# Action-Oriented CTAs

 

Best for: Active voice, clear next step

 

\- Start Saving Time Today

\- Get Your Free Report

\- See Your Score

\- Calculate Your ROI

\- Build Your First Project

 

\---

 

\#\# Platform-Specific Copy Guidelines

 

\#\#\# Google Search Ads

 

\- \*\*Headline limits:\*\* 30 characters each (up to 15 headlines)

\- \*\*Description limits:\*\* 90 characters each (up to 4 descriptions)

\- Include keywords naturally

\- Use all available headline slots

\- Include numbers and stats when possible

\- Test dynamic keyword insertion

 

\#\#\# Meta Ads (Facebook/Instagram)

 

\- \*\*Primary text:\*\* 125 characters visible (can be longer, gets truncated)

\- \*\*Headline:\*\* 40 characters recommended

\- Front-load the hook (first line matters most)

\- Emojis can work but test

\- Questions perform well

\- Keep image text under 20%

 

\#\#\# LinkedIn Ads

 

\- \*\*Intro text:\*\* 600 characters max (150 recommended)

\- \*\*Headline:\*\* 200 characters max (70 recommended)

\- Professional tone (but not boring)

\- Specific job outcomes resonate

\- Stats and social proof important

\- Avoid consumer-style hype

 

\---

 

\#\# Copy Testing Priority

 

When testing ad copy, focus on these elements in order of impact:

 

1\. \*\*Hook/angle\*\* (biggest impact on performance)

2\. \*\*Headline\*\*

3\. \*\*Primary benefit\*\*

4\. \*\*CTA\*\*

5\. \*\*Supporting proof points\*\*

 

Test one element at a time for clean data.

\# Audience Targeting Reference

 

Detailed targeting strategies for each major ad platform.

 

\#\# Contents

\- Google Ads Audiences (Search Campaign Targeting, Display/YouTube Targeting)

\- Meta Audiences (Core Audiences, Custom Audiences, Lookalike Audiences)

\- LinkedIn Audiences (Job-Based Targeting, Company-Based Targeting, High-Performing Combinations)

\- Twitter/X Audiences

\- TikTok Audiences

\- Audience Size Guidelines

\- Exclusion Strategy

 

\#\# Google Ads Audiences

 

\#\#\# Search Campaign Targeting

 

\*\*Keywords:\*\*

\- Exact match: \[keyword\] — most precise, lower volume

\- Phrase match: "keyword" — moderate precision and volume

\- Broad match: keyword — highest volume, use with smart bidding

 

\*\*Audience layering:\*\*

\- Add audiences in "observation" mode first

\- Analyze performance by audience

\- Switch to "targeting" mode for high performers

 

\*\*RLSA (Remarketing Lists for Search Ads):\*\*

\- Bid higher on past visitors searching your terms

\- Show different ads to returning searchers

\- Exclude converters from prospecting campaigns

 

\#\#\# Display/YouTube Targeting

 

\*\*Custom intent audiences:\*\*

\- Based on recent search behavior

\- Create from your converting keywords

\- High intent, good for prospecting

 

\*\*In-market audiences:\*\*

\- People actively researching solutions

\- Pre-built by Google

\- Layer with demographics for precision

 

\*\*Affinity audiences:\*\*

\- Based on interests and habits

\- Better for awareness

\- Broad but can exclude irrelevant

 

\*\*Customer match:\*\*

\- Upload email lists

\- Retarget existing customers

\- Create lookalikes from best customers

 

\*\*Similar/lookalike audiences:\*\*

\- Based on your customer match lists

\- Expand reach while maintaining relevance

\- Best when source list is high-quality customers

 

\---

 

\#\# Meta Audiences

 

\#\#\# Core Audiences (Interest/Demographic)

 

\*\*Interest targeting tips:\*\*

\- Layer interests with AND logic for precision

\- Use Audience Insights to research interests

\- Start broad, let algorithm optimize

\- Exclude existing customers always

 

\*\*Demographic targeting:\*\*

\- Age and gender (if product-specific)

\- Location (down to zip/postal code)

\- Language

\- Education and work (limited data now)

 

\*\*Behavior targeting:\*\*

\- Purchase behavior

\- Device usage

\- Travel patterns

\- Life events

 

\#\#\# Custom Audiences

 

\*\*Website visitors:\*\*

\- All visitors (last 180 days max)

\- Specific page visitors

\- Time on site thresholds

\- Frequency (visited X times)

 

\*\*Customer list:\*\*

\- Upload emails/phone numbers

\- Match rate typically 30-70%

\- Refresh regularly for accuracy

 

\*\*Engagement audiences:\*\*

\- Video viewers (25%, 50%, 75%, 95%)

\- Page/profile engagers

\- Form openers

\- Instagram engagers

 

\*\*App activity:\*\*

\- App installers

\- In-app events

\- Purchase events

 

\#\#\# Lookalike Audiences

 

\*\*Source audience quality matters:\*\*

\- Use high-LTV customers, not all customers

\- Purchasers \> leads \> all visitors

\- Minimum 100 source users, ideally 1,000+

 

\*\*Size recommendations:\*\*

\- 1% — most similar, smallest reach

\- 1-3% — good balance for most

\- 3-5% — broader, good for scale

\- 5-10% — very broad, awareness only

 

\*\*Layering strategies:\*\*

\- Lookalike \+ interest \= more precision early

\- Test lookalike-only as you scale

\- Exclude the source audience

 

\---

 

\#\# LinkedIn Audiences

 

\#\#\# Job-Based Targeting

 

\*\*Job titles:\*\*

\- Be specific (CMO vs. "Marketing")

\- LinkedIn normalizes titles, but verify

\- Stack related titles

\- Exclude irrelevant titles

 

\*\*Job functions:\*\*

\- Broader than titles

\- Combine with seniority level

\- Good for awareness campaigns

 

\*\*Seniority levels:\*\*

\- Entry, Senior, Manager, Director, VP, CXO, Partner

\- Layer with function for precision

 

\*\*Skills:\*\*

\- Self-reported, less reliable

\- Good for technical roles

\- Use as expansion layer

 

\#\#\# Company-Based Targeting

 

\*\*Company size:\*\*

\- 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5000+

\- Key filter for B2B

 

\*\*Industry:\*\*

\- Based on company classification

\- Can be broad, layer with other criteria

 

\*\*Company names (ABM):\*\*

\- Upload target account list

\- Minimum 300 companies recommended

\- Match rate varies

 

\*\*Company growth rate:\*\*

\- Hiring rapidly \= budget available

\- Good signal for timing

 

\#\#\# High-Performing Combinations

 

| Use Case | Targeting Combination |

|----------|----------------------|

| Enterprise sales | Company size 1000+ \+ VP/CXO \+ Industry |

| SMB sales | Company size 11-200 \+ Manager/Director \+ Function |

| Developer tools | Skills \+ Job function \+ Company type |

| ABM campaigns | Company list \+ Decision-maker titles |

| Broad awareness | Industry \+ Seniority \+ Geography |

 

\---

 

\#\# Twitter/X Audiences

 

\#\#\# Targeting options:

\- Follower lookalikes (accounts similar to followers of X)

\- Interest categories

\- Keywords (in tweets)

\- Conversation topics

\- Events

\- Tailored audiences (your lists)

 

\#\#\# Best practices:

\- Follower lookalikes of relevant accounts work well

\- Keyword targeting catches active conversations

\- Lower CPMs than LinkedIn/Meta

\- Less precise, better for awareness

 

\---

 

\#\# TikTok Audiences

 

\#\#\# Targeting options:

\- Demographics (age, gender, location)

\- Interests (TikTok's categories)

\- Behaviors (video interactions)

\- Device (iOS/Android, connection type)

\- Custom audiences (pixel, customer file)

\- Lookalike audiences

 

\#\#\# Best practices:

\- Younger skew (18-34 primarily)

\- Interest targeting is broad

\- Creative matters more than targeting

\- Let algorithm optimize with broad targeting

 

\---

 

\#\# Audience Size Guidelines

 

| Platform | Minimum Recommended | Ideal Range |

|----------|-------------------|-------------|

| Google Search | 1,000+ searches/mo | 5,000-50,000 |

| Google Display | 100,000+ | 500K-5M |

| Meta | 100,000+ | 500K-10M |

| LinkedIn | 50,000+ | 100K-500K |

| Twitter/X | 50,000+ | 100K-1M |

| TikTok | 100,000+ | 1M+ |

 

Too narrow \= expensive, slow learning

Too broad \= wasted spend, poor relevance

 

\---

 

\#\# Exclusion Strategy

 

Always exclude:

\- Existing customers (unless upsell)

\- Recent converters (7-14 days)

\- Bounced visitors (\<10 sec)

\- Employees (by company or email list)

\- Irrelevant page visitors (careers, support)

\- Competitors (if identifiable)

\# Platform Setup Checklists

 

Complete setup checklists for major ad platforms.

 

\#\# Contents

\- Google Ads Setup (Account Foundation, Conversion Tracking, Analytics Integration, Audience Setup, Campaign Readiness, Ad Extensions, Brand Protection)

\- Meta Ads Setup (Business Manager Foundation, Pixel & Tracking, Domain & Aggregated Events, Audience Setup, Catalog, Creative Assets, Compliance)

\- LinkedIn Ads Setup (Campaign Manager Foundation, Insight Tag & Tracking, Audience Setup, Lead Gen Forms, Document Ads, Creative Assets, Budget Considerations)

\- Twitter/X Ads Setup (Account Foundation, Tracking, Audience Setup, Creative)

\- TikTok Ads Setup (Account Foundation, Pixel & Tracking, Audience Setup, Creative)

\- Universal Pre-Launch Checklist

 

\#\# Google Ads Setup

 

\#\#\# Account Foundation

 

\- \[ \] Google Ads account created and verified

\- \[ \] Billing information added

\- \[ \] Time zone and currency set correctly

\- \[ \] Account access granted to team members

 

\#\#\# Conversion Tracking

 

\- \[ \] Google tag installed on all pages

\- \[ \] Conversion actions created (purchase, lead, signup)

\- \[ \] Conversion values assigned (if applicable)

\- \[ \] Enhanced conversions enabled

\- \[ \] Test conversions firing correctly

\- \[ \] Import conversions from GA4 (optional)

 

\#\#\# Analytics Integration

 

\- \[ \] Google Analytics 4 linked

\- \[ \] Auto-tagging enabled

\- \[ \] GA4 audiences available in Google Ads

\- \[ \] Cross-domain tracking set up (if multiple domains)

 

\#\#\# Audience Setup

 

\- \[ \] Remarketing tag verified

\- \[ \] Website visitor audiences created:

  \- All visitors (180 days)

  \- Key page visitors (pricing, demo, features)

  \- Converters (for exclusion)

\- \[ \] Customer match lists uploaded

\- \[ \] Similar audiences enabled

 

\#\#\# Campaign Readiness

 

\- \[ \] Negative keyword lists created:

  \- Universal negatives (free, jobs, careers, reviews, complaints)

  \- Competitor negatives (if needed)

  \- Irrelevant industry terms

\- \[ \] Location targeting set (include/exclude)

\- \[ \] Language targeting set

\- \[ \] Ad schedule configured (if B2B, business hours)

\- \[ \] Device bid adjustments considered

 

\#\#\# Ad Extensions

 

\- \[ \] Sitelinks (4-6 relevant pages)

\- \[ \] Callouts (key benefits, offers)

\- \[ \] Structured snippets (features, types, services)

\- \[ \] Call extension (if phone leads valuable)

\- \[ \] Lead form extension (if using)

\- \[ \] Price extensions (if applicable)

\- \[ \] Image extensions (where available)

 

\#\#\# Brand Protection

 

\- \[ \] Brand campaign running (protect branded terms)

\- \[ \] Competitor campaigns considered

\- \[ \] Brand terms in negative lists for non-brand campaigns

 

\---

 

\#\# Meta Ads Setup

 

\#\#\# Business Manager Foundation

 

\- \[ \] Business Manager created

\- \[ \] Business verified (if running certain ad types)

\- \[ \] Ad account created within Business Manager

\- \[ \] Payment method added

\- \[ \] Team access configured with proper roles

 

\#\#\# Pixel & Tracking

 

\- \[ \] Meta Pixel installed on all pages

\- \[ \] Standard events configured:

  \- PageView (automatic)

  \- ViewContent (product/feature pages)

  \- Lead (form submissions)

  \- Purchase (conversions)

  \- AddToCart (if e-commerce)

  \- InitiateCheckout (if e-commerce)

\- \[ \] Conversions API (CAPI) set up for server-side tracking

\- \[ \] Event Match Quality score \> 6

\- \[ \] Test events in Events Manager

 

\#\#\# Domain & Aggregated Events

 

\- \[ \] Domain verified in Business Manager

\- \[ \] Aggregated Event Measurement configured

\- \[ \] Top 8 events prioritized in order of importance

\- \[ \] Web events prioritized for iOS 14+ tracking

 

\#\#\# Audience Setup

 

\- \[ \] Custom audiences created:

  \- Website visitors (all, 30/60/90/180 days)

  \- Key page visitors

  \- Video viewers (25%, 50%, 75%, 95%)

  \- Page/Instagram engagers

  \- Customer list uploaded

\- \[ \] Lookalike audiences created (1%, 1-3%)

\- \[ \] Saved audiences for common targeting

 

\#\#\# Catalog (E-commerce)

 

\- \[ \] Product catalog connected

\- \[ \] Product feed updating correctly

\- \[ \] Catalog sales campaigns enabled

\- \[ \] Dynamic product ads configured

 

\#\#\# Creative Assets

 

\- \[ \] Images in correct sizes:

  \- Feed: 1080x1080 (1:1)

  \- Stories/Reels: 1080x1920 (9:16)

  \- Landscape: 1200x628 (1.91:1)

\- \[ \] Videos in correct formats

\- \[ \] Ad copy variations ready

\- \[ \] UTM parameters in all destination URLs

 

\#\#\# Compliance

 

\- \[ \] Special Ad Categories declared (if housing, credit, employment, politics)

\- \[ \] Landing page complies with Meta policies

\- \[ \] No prohibited content in ads

 

\---

 

\#\# LinkedIn Ads Setup

 

\#\#\# Campaign Manager Foundation

 

\- \[ \] Campaign Manager account created

\- \[ \] Company Page connected

\- \[ \] Billing information added

\- \[ \] Team access configured

 

\#\#\# Insight Tag & Tracking

 

\- \[ \] LinkedIn Insight Tag installed on all pages

\- \[ \] Tag verified and firing

\- \[ \] Conversion tracking configured:

  \- URL-based conversions

  \- Event-specific conversions

\- \[ \] Conversion values set (if applicable)

 

\#\#\# Audience Setup

 

\- \[ \] Matched Audiences created:

  \- Website retargeting audiences

  \- Company list uploaded (for ABM)

  \- Contact list uploaded

\- \[ \] Lookalike audiences created

\- \[ \] Saved audiences for common targeting

 

\#\#\# Lead Gen Forms (if using)

 

\- \[ \] Lead gen form templates created

\- \[ \] Form fields selected (minimize for conversion)

\- \[ \] Privacy policy URL added

\- \[ \] Thank you message configured

\- \[ \] CRM integration set up (or CSV export process)

 

\#\#\# Document Ads (if using)

 

\- \[ \] Documents uploaded (PDF, PowerPoint)

\- \[ \] Gating configured (full gate or preview)

\- \[ \] Lead gen form connected

 

\#\#\# Creative Assets

 

\- \[ \] Single image ads: 1200x627 (1.91:1) or 1080x1080 (1:1)

\- \[ \] Carousel images ready

\- \[ \] Video specs met (if using)

\- \[ \] Ad copy within character limits:

  \- Intro text: 600 max, 150 recommended

  \- Headline: 200 max, 70 recommended

 

\#\#\# Budget Considerations

 

\- \[ \] Budget realistic for LinkedIn CPCs ($8-15+ typical)

\- \[ \] Audience size validated (50K+ recommended)

\- \[ \] Daily vs. lifetime budget decided

\- \[ \] Bid strategy selected

 

\---

 

\#\# Twitter/X Ads Setup

 

\#\#\# Account Foundation

 

\- \[ \] Ads account created

\- \[ \] Payment method added

\- \[ \] Account verified (if required)

 

\#\#\# Tracking

 

\- \[ \] Twitter Pixel installed

\- \[ \] Conversion events created

\- \[ \] Website tag verified

 

\#\#\# Audience Setup

 

\- \[ \] Tailored audiences created:

  \- Website visitors

  \- Customer lists

\- \[ \] Follower lookalikes identified

\- \[ \] Interest and keyword targets researched

 

\#\#\# Creative

 

\- \[ \] Tweet copy within 280 characters

\- \[ \] Images: 1200x675 (1.91:1) or 1200x1200 (1:1)

\- \[ \] Video specs met (if using)

\- \[ \] Cards configured (website, app, etc.)

 

\---

 

\#\# TikTok Ads Setup

 

\#\#\# Account Foundation

 

\- \[ \] TikTok Ads Manager account created

\- \[ \] Business verification completed

\- \[ \] Payment method added

 

\#\#\# Pixel & Tracking

 

\- \[ \] TikTok Pixel installed

\- \[ \] Events configured (ViewContent, Purchase, etc.)

\- \[ \] Events API set up (recommended)

 

\#\#\# Audience Setup

 

\- \[ \] Custom audiences created

\- \[ \] Lookalike audiences created

\- \[ \] Interest categories identified

 

\#\#\# Creative

 

\- \[ \] Vertical video (9:16) ready

\- \[ \] Native-feeling content (not too polished)

\- \[ \] First 3 seconds are compelling hooks

\- \[ \] Captions added (most watch without sound)

\- \[ \] Music/sounds selected (licensed if needed)

 

\---

 

\#\# Universal Pre-Launch Checklist

 

Before launching any campaign:

 

\- \[ \] Conversion tracking tested with real conversion

\- \[ \] Landing page loads fast (\<3 sec)

\- \[ \] Landing page mobile-friendly

\- \[ \] UTM parameters working

\- \[ \] Budget set correctly (daily vs. lifetime)

\- \[ \] Start/end dates correct

\- \[ \] Targeting matches intended audience

\- \[ \] Ad creative approved

\- \[ \] Team notified of launch

\- \[ \] Reporting dashboard ready

\---

name: market-research

description: Conduct market research, competitive analysis, investor due diligence, and industry intelligence with source attribution and decision-oriented summaries. Use when the user wants market sizing, competitor comparisons, fund research, technology scans, or research that informs business decisions.

metadata:

  origin: ECC

\---

 

\# Market Research

 

Produce research that supports decisions, not research theater.

 

\#\# When to Activate

 

\- researching a market, category, company, investor, or technology trend

\- building TAM/SAM/SOM estimates

\- comparing competitors or adjacent products

\- preparing investor dossiers before outreach

\- pressure-testing a thesis before building, funding, or entering a market

 

\#\# Research Standards

 

1\. Every important claim needs a source.

2\. Prefer recent data and call out stale data.

3\. Include contrarian evidence and downside cases.

4\. Translate findings into a decision, not just a summary.

5\. Separate fact, inference, and recommendation clearly.

 

\#\# Common Research Modes

 

\#\#\# Investor / Fund Diligence

Collect:

\- fund size, stage, and typical check size

\- relevant portfolio companies

\- public thesis and recent activity

\- reasons the fund is or is not a fit

\- any obvious red flags or mismatches

 

\#\#\# Competitive Analysis

Collect:

\- product reality, not marketing copy

\- funding and investor history if public

\- traction metrics if public

\- distribution and pricing clues

\- strengths, weaknesses, and positioning gaps

 

\#\#\# Market Sizing

Use:

\- top-down estimates from reports or public datasets

\- bottom-up sanity checks from realistic customer acquisition assumptions

\- explicit assumptions for every leap in logic

 

\#\#\# Technology / Vendor Research

Collect:

\- how it works

\- trade-offs and adoption signals

\- integration complexity

\- lock-in, security, compliance, and operational risk

 

\#\# Output Format

 

Default structure:

1\. executive summary

2\. key findings

3\. implications

4\. risks and caveats

5\. recommendation

6\. sources

 

\#\# Quality Gate

 

Before delivering:

\- all numbers are sourced or labeled as estimates

\- old data is flagged

\- the recommendation follows from the evidence

\- risks and counterarguments are included

\- the output makes a decision easier

\---

name: marketing-campaign

description: End-to-end marketing campaign planning and execution. Covers audience research, positioning, campaign angle definition, landing page copy, email sequences, social posts, ad copy, short-form video scripts, and content calendars. Use as the orchestration layer for multi-channel product launches.

metadata:

  origin: ECC

\---

 

\# Marketing Campaign

 

Plan and execute launch campaigns that convert — not just campaigns that ship.

 

\#\# When to Activate

 

\- planning a product or feature launch

\- building a full content suite from a single product brief

\- defining positioning and campaign angle before writing any copy

\- orchestrating multiple content types across channels

\- reviewing copy for conversion quality and brand consistency

 

\#\# Non-Negotiables

 

1\. Define positioning before writing any copy. All copy flows from the angle.

2\. Research the audience before assuming you know their language or fears.

3\. Each deliverable must serve one clear purpose in the campaign arc.

4\. Specificity beats adjectives in every format and on every channel.

5\. The same voice must run across every channel and every piece.

6\. No copy ships without passing the quality gate.

 

\#\# Campaign Workflow

 

\#\#\# Phase 1: Research

 

Use \`market-research\` to:

\- profile the target audience (jobs-to-be-done, fears, language, alternatives they use)

\- map 3+ direct or adjacent competitors (positioning, gaps, messaging weaknesses)

\- identify 1–3 audience insights the campaign angle will exploit

 

Deliverable: a short research brief (audience profile \+ competitive summary \+ key insights).

 

\#\#\# Phase 2: Positioning

 

Produce:

\- core benefit statement (one sentence, no feature list, no jargon)

\- positioning formula: "\[Product\] helps \[audience\] \[achieve outcome\] by \[mechanism\]"

\- campaign angle: the specific tension, insight, or moment the whole campaign lives in

\- tone profile: lock before writing (delegate to \`brand-voice\` for durable, session-reusable voice capture)

 

Do not write any copy until positioning and angle are approved.

 

\#\#\# Phase 3: Content Production

 

Produce in this order — each layer informs the next:

 

1\. \*\*Landing page copy\*\* (all sections: hero, problem, solution, features, how it works, proof, CTA)

2\. \*\*Email sequence\*\* (each email has one purpose; follow the arc: problem → education → agitation → solution → proof → urgency → final CTA)

3\. \*\*Social posts\*\* (platform-native via \`content-engine\`; LinkedIn and X are different formats, not the same copy resized)

4\. \*\*Short-form video scripts\*\* (timestamp-blocked; written for screen and ear, not the page)

5\. \*\*Ad copy variants\*\* (3–4 variants testing different angles or audience segments)

6\. \*\*Content calendar\*\* (day-by-day schedule with channel, type, timing, and dependencies)

 

\#\#\# Phase 4: Review

 

Gate every deliverable:

\- 5-second test on all hero / above-fold copy (clear who it's for, what it does, why act now)

\- CTA audit (one per piece, specific, earned — not demanded)

\- Tone consistency check across all channels

\- Claim audit (every claim is specific and supportable)

\- Cross-channel consistency (ad claims match landing page; email body matches subject)

 

\#\# Output Contract

 

A full campaign delivers:

 

1\. \*\*Positioning brief\*\* — angle, core benefit statement, tone profile

2\. \*\*Landing page copy\*\* — hero, problem, solution, features, how it works, proof, CTA

3\. \*\*Email sequence\*\* — subject \+ preview \+ body \+ CTA for each email, labelled by day and purpose

4\. \*\*LinkedIn posts\*\* — 3+ platform-native posts with distinct angles

5\. \*\*X posts\*\* — 5+ standalone posts \+ 1 thread

6\. \*\*Short-form video scripts\*\* — 2+ timestamp-blocked scripts with visual direction notes

7\. \*\*Ad copy variants\*\* — short headline / long headline / body per variant

8\. \*\*Content calendar\*\* — day-by-day schedule with channel, content type, timing, and dependencies

9\. \*\*Copy review summary\*\* — flagged issues and open questions before anything goes live

 

\#\# Quality Gate

 

Before delivering any piece:

 

\- every deliverable sounds like the same author

\- no hollow superlatives or filler adjectives remain

\- every CTA is specific and earned (never "learn more" or "click here")

\- no copy is duplicated verbatim across platforms

\- hero copy passes the 5-second test

\- email subjects match email body (no bait-and-switch)

\- ad claims match landing page claims exactly

\- no copy would work unchanged for any other product in the category

 

\#\# Hard Bans

 

Delete and rewrite any:

 

\- "game-changing", "revolutionary", "world-class", "cutting-edge"

\- "In today's competitive landscape"

\- fake urgency not backed by a real deadline

\- hollow social proof without specifics ("thousands trust us")

\- generic CTAs ("learn more", "find out more", "click here")

\- copy that could be unplugged and dropped into a competitor's campaign unchanged

 

\#\# Related Skills

 

\- \`brand-voice\` — source-derived voice capture (run before content production)

\- \`content-engine\` — platform-native content production

\- \`crosspost\` — multi-platform distribution

\- \`market-research\` — audience and competitive intelligence

\- \`seo\` — on-page optimisation for landing page copy

