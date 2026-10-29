import type { ResumeContent } from "./types";

/**
 * A polished, ATS-friendly starting point. New anonymous workspaces receive
 * this content so first-time visitors can immediately feel the product.
 * Everything is editable, and "Start fresh" clears it in one click.
 */
export function createSampleResume(): ResumeContent {
  return {
    title: "Senior Product Designer — Resume",
    template: "modern",
    accent: "#1F513E",
    fullName: "Avery Sinclair",
    headline: "Senior Product Designer",
    email: "avery.sinclair@example.com",
    phone: "(415) 555-0182",
    location: "San Francisco, CA",
    website: "averysinclair.design",
    linkedin: "linkedin.com/in/averysinclair",
    summary:
      "Product designer with 8+ years shaping thoughtful digital experiences for fintech and consumer platforms. I pair systems thinking with a high bar for craft to ship products that are clear, useful, and built to scale.",
    experience: [
      {
        id: crypto.randomUUID(),
        role: "Senior Product Designer",
        company: "Northwind",
        location: "San Francisco, CA",
        startDate: "2022-03",
        endDate: "",
        current: true,
        highlights: [
          "Led the end-to-end redesign of Northwind's mobile banking experience, lifting activation by 34% and reducing support contacts by 22%.",
          "Built the company's first design system, now used by 6 product teams and 40+ engineers across web and mobile.",
          "Partnered with research to launch a savings product that grew deposits to $48M within its first year.",
        ],
      },
      {
        id: crypto.randomUUID(),
        role: "Product Designer",
        company: "Lumen Labs",
        location: "Remote",
        startDate: "2019-01",
        endDate: "2022-02",
        current: false,
        highlights: [
          "Shipped a subscription onboarding flow that increased trial-to-paid conversion by 18%.",
          "Introduced quarterly usability testing, turning findings into a prioritized roadmap adopted across product.",
          "Mentored two junior designers and established a weekly critique ritual still in use today.",
        ],
      },
      {
        id: crypto.randomUUID(),
        role: "UX Designer",
        company: "Fieldnote Studio",
        location: "New York, NY",
        startDate: "2016-06",
        endDate: "2018-12",
        current: false,
        highlights: [
          "Designed editorial tools for independent publishers used by more than 12,000 creators.",
          "Cut time-to-publish by 40% through a streamlined content editor and clearer information architecture.",
        ],
      },
    ],
    education: [
      {
        id: crypto.randomUUID(),
        school: "Rhode Island School of Design",
        degree: "BFA",
        field: "Graphic Design",
        location: "Providence, RI",
        startDate: "2012-09",
        endDate: "2016-05",
        current: false,
        details: "Concentration in interaction design · Graduated with honors",
      },
    ],
    skills: [
      "Product Strategy",
      "Interaction Design",
      "Design Systems",
      "Visual Design",
      "Prototyping",
      "User Research",
      "Figma",
      "Accessibility",
      "Data-informed Design",
    ],
    projects: [
      {
        id: crypto.randomUUID(),
        name: "Morrow — Calm finance for freelancers",
        link: "morrow.design",
        description:
          "Side project exploring cash-flow-first banking for independent workers. Grew to 4,800 beta users in six months.",
      },
      {
        id: crypto.randomUUID(),
        name: "Field Notes No. 4",
        link: "fieldnotes.studio",
        description:
          "An independent annual on the craft of digital design; edited and art-directed 32 contributors.",
      },
    ],
  };
}
