import { config, fields, singleton } from '@keystatic/core';

const link = {
  label: fields.text({ label: 'Label', validation: { isRequired: true } }),
  href: fields.text({ label: 'Link', validation: { isRequired: true } }),
};

export default config({
  storage: {
    kind: 'local',
  },
  ui: {
    brand: {
      name: 'Ohr HaTorah Content',
    },
    navigation: {
      Content: ['homepage', 'navigation'],
    },
  },
  singletons: {
    homepage: singleton({
      label: 'Homepage',
      path: 'src/content/homepage/home',
      format: { data: 'json' },
      schema: {
        meta: fields.object({
          title: fields.text({ label: 'SEO title', validation: { isRequired: true } }),
          description: fields.text({ label: 'SEO description', multiline: true, validation: { isRequired: true } }),
        }, { label: 'Meta' }),
        brand: fields.object({
          name: fields.text({ label: 'Name', validation: { isRequired: true } }),
          descriptor: fields.text({ label: 'Descriptor', validation: { isRequired: true } }),
          location: fields.text({ label: 'Location', validation: { isRequired: true } }),
        }, { label: 'Brand' }),
        hero: fields.object({
          heading: fields.text({ label: 'Heading', multiline: true, validation: { isRequired: true } }),
          subheading: fields.text({ label: 'Subheading', multiline: true, validation: { isRequired: true } }),
          primaryCta: fields.object(link, { label: 'Primary CTA' }),
          secondaryCta: fields.object(link, { label: 'Secondary CTA' }),
          image: fields.text({ label: 'Hero image path', validation: { isRequired: true } }),
        }, { label: 'Hero' }),
        serviceTimes: fields.object({
          heading: fields.text({ label: 'Heading', validation: { isRequired: true } }),
          fridayLabel: fields.text({ label: 'Friday label', validation: { isRequired: true } }),
          fridayTime: fields.text({ label: 'Friday time', validation: { isRequired: true } }),
          shabbatLabel: fields.text({ label: 'Shabbat label', validation: { isRequired: true } }),
          shabbatTime: fields.text({ label: 'Shabbat time', validation: { isRequired: true } }),
          torahStudy: fields.text({ label: 'Torah study line', validation: { isRequired: true } }),
          location: fields.text({ label: 'Location', validation: { isRequired: true } }),
          welcomeNote: fields.text({ label: 'Welcome note', validation: { isRequired: true } }),
        }, { label: 'Service Times' }),
        gatherings: fields.array(
          fields.object({
            month: fields.text({ label: 'Month', validation: { isRequired: true } }),
            day: fields.text({ label: 'Day', validation: { isRequired: true } }),
            title: fields.text({ label: 'Title', validation: { isRequired: true } }),
            time: fields.text({ label: 'Time', validation: { isRequired: true } }),
            tone: fields.select({
              label: 'Tone',
              defaultValue: 'navy',
              options: [
                { label: 'Navy', value: 'navy' },
                { label: 'Olive', value: 'olive' },
                { label: 'Rose', value: 'rose' },
              ],
            }),
          }),
          { label: 'Upcoming Gatherings', itemLabel: props => props.fields.title.value || 'Gathering' }
        ),
        welcome: fields.object({
          title: fields.text({ label: 'Title', validation: { isRequired: true } }),
          body: fields.text({ label: 'Body', multiline: true, validation: { isRequired: true } }),
          cta: fields.object(link, { label: 'CTA' }),
        }, { label: 'Welcome' }),
        values: fields.array(
          fields.object({
            icon: fields.select({
              label: 'Icon',
              defaultValue: 'olive',
              options: [
                { label: 'Olive branch', value: 'olive' },
                { label: 'Menorah', value: 'menorah' },
                { label: 'Torah scroll', value: 'torah' },
                { label: 'Family', value: 'family' },
              ],
            }),
            title: fields.text({ label: 'Title', validation: { isRequired: true } }),
            body: fields.text({ label: 'Body', multiline: true, validation: { isRequired: true } }),
          }),
          { label: 'Values', itemLabel: props => props.fields.title.value || 'Value' }
        ),
        quote: fields.object({
          text: fields.text({ label: 'Quote', multiline: true, validation: { isRequired: true } }),
          reference: fields.text({ label: 'Reference', validation: { isRequired: true } }),
        }, { label: 'Quote' }),
        visit: fields.object({
          title: fields.text({ label: 'Title', validation: { isRequired: true } }),
          body: fields.text({ label: 'Body', multiline: true, validation: { isRequired: true } }),
          cta: fields.object(link, { label: 'CTA' }),
          address: fields.text({ label: 'Address', validation: { isRequired: true } }),
        }, { label: 'Visit' }),
        newsletter: fields.object({
          title: fields.text({ label: 'Title', validation: { isRequired: true } }),
          body: fields.text({ label: 'Body', multiline: true, validation: { isRequired: true } }),
          placeholder: fields.text({ label: 'Placeholder', validation: { isRequired: true } }),
          button: fields.text({ label: 'Button', validation: { isRequired: true } }),
        }, { label: 'Newsletter' }),
        footer: fields.object({
          tagline: fields.text({ label: 'Tagline', validation: { isRequired: true } }),
          unity: fields.text({ label: 'Unity line', validation: { isRequired: true } }),
        }, { label: 'Footer' }),
      },
    }),
    navigation: singleton({
      label: 'Navigation',
      path: 'src/content/navigation/main',
      format: { data: 'json' },
      schema: {
        primary: fields.array(fields.object(link), {
          label: 'Primary navigation',
          itemLabel: props => props.fields.label.value || 'Link',
        }),
        bottom: fields.array(
          fields.object({
            label: fields.text({ label: 'Label', validation: { isRequired: true } }),
            href: fields.text({ label: 'Link', validation: { isRequired: true } }),
            icon: fields.select({
              label: 'Icon',
              defaultValue: 'home',
              options: [
                { label: 'Home', value: 'home' },
                { label: 'About', value: 'about' },
                { label: 'Visit', value: 'visit' },
                { label: 'Connect', value: 'connect' },
                { label: 'Give', value: 'give' },
              ],
            }),
            featured: fields.checkbox({ label: 'Featured center action' }),
          }),
          { label: 'Mobile bottom navigation', itemLabel: props => props.fields.label.value || 'Item' }
        ),
      },
    }),
  },
});
