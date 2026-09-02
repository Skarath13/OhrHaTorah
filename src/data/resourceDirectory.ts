export interface ResourceDirectoryLink {
  label: string;
  url: string;
}

export interface ResourceDirectoryEntry {
  name: string;
  icon: string;
  summary: string;
  note?: string;
  links: ResourceDirectoryLink[];
}

export interface ResourceDirectorySection {
  id: string;
  title: string;
  intro: string;
  entries: ResourceDirectoryEntry[];
}

export interface CandidateBook {
  title: string;
  author: string;
  summary: string;
  sourceUrl: string;
  amazonUrl: string;
}

const amazonSearch = (query: string): string =>
  `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;

export const resourceDirectorySections: ResourceDirectorySection[] = [
  {
    id: 'identity',
    title: 'Movement, identity, and communal standards',
    intro: 'Begin with primary statements from Messianic Jewish institutions rather than third-party summaries.',
    entries: [
      {
        name: 'Union of Messianic Jewish Congregations (UMJC)',
        icon: 'fas fa-synagogue',
        summary: 'Kehilat Ohr HaTorah is a UMJC member. The UMJC publishes its own vision, beliefs, and definition of Messianic Judaism.',
        links: [
          { label: 'Vision and beliefs', url: 'https://www.umjc.org/vision' },
          { label: 'Definition of Messianic Judaism', url: 'https://www.umjc.org/defining-messianic-judaism' },
        ],
      },
      {
        name: 'Messianic Jewish Rabbinical Council (MJRC)',
        icon: 'fas fa-scroll',
        summary: 'The MJRC has published a detailed vision statement describing the Messianic Jewish future it seeks to serve.',
        links: [
          { label: 'Read the MJRC vision', url: 'https://www.ourrabbis.org/main/resources/the-mjrc-vision-of-messianic-judaism' },
        ],
      },
    ],
  },
  {
    id: 'education',
    title: 'Courses and degree programs',
    intro: 'These links lead directly to each school so visitors can compare current programs, requirements, and costs for themselves.',
    entries: [
      {
        name: 'Messianic Jewish Theological Institute (MJTI)',
        icon: 'fas fa-graduation-cap',
        summary: 'MJTI lists online graduate degrees, certificate tracks, professional development, and four-week Panim el Panim short courses.',
        links: [
          { label: 'Explore MJTI programs', url: 'https://www.mjti.org/programs/' },
        ],
      },
      {
        name: "The King's University: Messianic Jewish Studies",
        icon: 'fas fa-university',
        summary: 'The program lists undergraduate and graduate Messianic Jewish Studies degrees and describes itself as a UMJC-approved school for training rabbis and teachers.',
        links: [
          { label: 'Explore the MJS program', url: 'https://www.tku.edu/academics/messianic-jewish-studies/' },
        ],
      },
    ],
  },
  {
    id: 'libraries',
    title: 'Study libraries and publishers',
    intro: 'Use these focused entry points for study materials while remembering that each publisher and institution speaks for itself.',
    entries: [
      {
        name: 'First Fruits of Zion (FFOZ)',
        icon: 'fas fa-seedling',
        summary: 'FFOZ offers Torah Club, books, articles, and study resources from its Messianic Jewish perspective.',
        links: [
          { label: 'Explore FFOZ', url: 'https://ffoz.org/' },
        ],
      },
      {
        name: 'Menorah Ministries and Dr. John Fischer',
        icon: 'fas fa-menorah',
        summary: 'Menorah Ministries publishes books, articles, and Messianic Jewish worship resources, including work by Rabbi Dr. John Fischer.',
        links: [
          { label: 'Browse Menorah Ministries', url: 'https://www.menorahministries.com/' },
          { label: 'Read about Dr. John Fischer', url: 'https://www.menorahministries.com/john-fischer' },
        ],
      },
      {
        name: 'ArtScroll',
        icon: 'fas fa-book',
        summary: 'A broad Jewish publishing catalog with useful entry points for Tanakh, siddurim, holidays, Jewish history, and traditional commentary.',
        note: 'Use individual titles with discernment; ArtScroll is not a Messianic Jewish publisher.',
        links: [
          { label: 'Browse the basic Jewish library', url: 'https://www.artscroll.com/Items.aspx?hierId=BJL' },
        ],
      },
      {
        name: 'Chabad.org highlighted study sections',
        icon: 'fas fa-book-open',
        summary: 'Focused links to the weekly parashah, daily study, and a large collection of Jewish texts and writings.',
        note: 'Chabad.org represents Chabad-Lubavitch teaching, not Kehilat Ohr HaTorah or Messianic Jewish theology.',
        links: [
          { label: 'Weekly Torah portion', url: 'https://www.chabad.org/parshah/default_cdo/jewish/Torah-Portion.htm' },
          { label: 'Daily study', url: 'https://www.chabad.org/dailystudy/default_cdo/jewish/Daily-Study.htm' },
          { label: 'Torah texts', url: 'https://www.chabad.org/torah-texts/' },
        ],
      },
    ],
  },
];

export const candidateReadingList: CandidateBook[] = [
  {
    title: 'Introduction to Messianic Judaism',
    author: 'David J. Rudolph and Joel Willitts, editors',
    summary: 'A broad introduction to the movement, its communal setting, and its biblical and theological questions.',
    sourceUrl: 'https://zondervanacademic.com/products/introduction-to-messianic-judaism',
    amazonUrl: amazonSearch('9780310330639'),
  },
  {
    title: 'Postmissionary Messianic Judaism',
    author: 'Mark S. Kinzer',
    summary: 'An advanced theological proposal concerning Jewish covenantal life and the relationship between Jews and Christians.',
    sourceUrl: 'https://www.markkinzer.com/pmj',
    amazonUrl: amazonSearch('1587431521'),
  },
  {
    title: 'To Pray as a Jew',
    author: 'Hayim H. Donin',
    summary: 'A guide to the Jewish prayer book, Jewish liturgy, and the synagogue service.',
    sourceUrl: 'https://www.hachettebookgroup.com/titles/hayim-h-donin/to-pray-as-a-jew/9781541674035/',
    amazonUrl: amazonSearch('9781541674035'),
  },
  {
    title: 'The Sabbath',
    author: 'Abraham Joshua Heschel',
    summary: 'A classic meditation on Shabbat and the holiness of time.',
    sourceUrl: 'https://us.macmillan.com/books/9780374622398/thesabbath/',
    amazonUrl: amazonSearch('9780374622398'),
  },
  {
    title: 'Siddur for Messianic Jews: English-Hebrew Edition',
    author: 'John Fischer',
    summary: 'A Messianic Jewish prayer-book resource to evaluate for congregational and personal use.',
    sourceUrl: 'https://www.menorahministries.com/product-page/siddur-for-messianic-jews-english-hebrew-edition',
    amazonUrl: amazonSearch('Siddur for Messianic Jews John Fischer'),
  },
  {
    title: 'The Stone Edition Tanach',
    author: 'Nosson Scherman, editor',
    summary: 'A Hebrew-English Tanakh with traditional rabbinic introductions, notes, and commentary.',
    sourceUrl: 'https://www.artscroll.com/Categories/ac8.html',
    amazonUrl: amazonSearch('The Stone Edition Tanach Nosson Scherman'),
  },
];
