import { defineCollection, z } from 'astro:content';

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

const homepage = defineCollection({
  type: 'data',
  schema: z.object({
    meta: z.object({
      title: z.string(),
      description: z.string(),
    }),
    brand: z.object({
      name: z.string(),
      descriptor: z.string(),
      location: z.string(),
    }),
    hero: z.object({
      heading: z.string(),
      subheading: z.string(),
      primaryCta: linkSchema,
      secondaryCta: linkSchema,
      image: z.string(),
    }),
    serviceTimes: z.object({
      heading: z.string(),
      fridayLabel: z.string(),
      fridayTime: z.string(),
      shabbatLabel: z.string(),
      shabbatTime: z.string(),
      torahStudy: z.string(),
      location: z.string(),
      welcomeNote: z.string(),
    }),
    gatherings: z.array(z.object({
      month: z.string(),
      day: z.string(),
      title: z.string(),
      time: z.string(),
      tone: z.enum(['navy', 'olive', 'rose']),
    })),
    welcome: z.object({
      title: z.string(),
      body: z.string(),
      cta: linkSchema,
    }),
    values: z.array(z.object({
      icon: z.enum(['olive', 'menorah', 'torah', 'family']),
      title: z.string(),
      body: z.string(),
    })),
    quote: z.object({
      text: z.string(),
      reference: z.string(),
    }),
    visit: z.object({
      title: z.string(),
      body: z.string(),
      cta: linkSchema,
      address: z.string(),
    }),
    newsletter: z.object({
      title: z.string(),
      body: z.string(),
      placeholder: z.string(),
      button: z.string(),
    }),
    footer: z.object({
      tagline: z.string(),
      unity: z.string(),
    }),
  }),
});

const navigation = defineCollection({
  type: 'data',
  schema: z.object({
    primary: z.array(linkSchema),
    bottom: z.array(z.object({
      label: z.string(),
      href: z.string(),
      icon: z.enum(['home', 'about', 'visit', 'connect', 'give']),
      featured: z.boolean().default(false),
    })),
  }),
});

export const collections = {
  homepage,
  navigation,
};
